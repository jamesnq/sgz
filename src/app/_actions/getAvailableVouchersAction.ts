'use server'

import { actionClient } from '@/utilities/safe-action'
import payloadConfig from '@payload-config'
import { getPayload } from 'payload'
import { z } from 'zod'

const GetAvailableVouchersSchema = z.object({
  productId: z.coerce.number(),
  productVariantId: z.coerce.number().optional(),
})

export type AvailableVoucher = {
  code: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
  remainingUses: number | null // null = unlimited
  expirationDate: string | null // null = no expiry
}

export const getAvailableVouchersAction = actionClient
  .schema(GetAvailableVouchersSchema)
  .action(async ({ parsedInput: { productId, productVariantId } }) => {
    const payload = await getPayload({ config: payloadConfig })
    const now = new Date().toISOString()

    const { docs: vouchers } = await payload.find({
      collection: 'vouchers',
      overrideAccess: true,
      pagination: false,
      depth: 0,
      where: {
        and: [
          { active: { equals: true } },
          { affiliateUser: { exists: false } },
          {
            or: [
              { startDate: { exists: false } },
              { startDate: { less_than_equal: now } },
            ],
          },
          {
            or: [
              { expirationDate: { exists: false } },
              { expirationDate: { greater_than_equal: now } },
            ],
          },
        ],
      },
      select: {
        code: true,
        discountType: true,
        discountValue: true,
        maxUses: true,
        usedCount: true,
        expirationDate: true,
        applicableProducts: true,
        applicableProductVariants: true,
      },
    })

    // Post-query filtering
    const filtered = vouchers.filter((v) => {
      // Filter out vouchers that have exhausted their uses
      if (v.maxUses && (v.usedCount ?? 0) >= v.maxUses) return false

      // Filter by product/variant scope
      const applicableProducts = v.applicableProducts ?? []
      const applicableVariants = v.applicableProductVariants ?? []
      const hasProducts = applicableProducts.length > 0
      const hasVariants = applicableVariants.length > 0

      // No scope = applies to all
      if (!hasProducts && !hasVariants) return true

      // Check variant-level scope first
      if (hasVariants && productVariantId) {
        const variantIds = applicableVariants.map((av) =>
          typeof av === 'object' ? av.id : av,
        )
        if (variantIds.includes(productVariantId)) return true
      }

      // Check product-level scope
      if (hasProducts) {
        const productIds = applicableProducts.map((ap) =>
          typeof ap === 'object' ? ap.id : ap,
        )
        if (productIds.includes(productId)) return true
      }

      // Has scope but doesn't match
      if (hasProducts || hasVariants) return false

      return true
    })

    // Map to safe return type
    const result: AvailableVoucher[] = filtered.map((v) => ({
      code: v.code,
      discountType: v.discountType,
      discountValue: v.discountValue,
      remainingUses: v.maxUses ? v.maxUses - (v.usedCount ?? 0) : null,
      expirationDate: v.expirationDate ?? null,
    }))

    return result
  })
