'use server'
import { Product } from '@/payload-types'
import { authActionClient, ServerNotification } from '@/utilities/safe-action'
import {
  validateVoucher,
  calculateVoucherDiscount,
  validateVoucherScope,
} from '@/utilities/voucher'
import payloadConfig from '@payload-config'
import { getPayload } from 'payload'
import { z } from 'zod'

const ValidateVoucherSchema = z.object({
  voucherCode: z.string().min(1),
  totalPrice: z.coerce.number().min(0),
  productVariantId: z.coerce.number(),
})

export const validateVoucherAction = authActionClient
  .schema(ValidateVoucherSchema)
  .action(async ({ parsedInput: { voucherCode, totalPrice, productVariantId }, ctx }) => {
    const { user } = ctx
    const payload = await getPayload({ config: payloadConfig })

    const { docs: vouchers } = await payload.find({
      collection: 'vouchers',
      where: { code: { equals: voucherCode.toUpperCase().trim() } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    const voucher = vouchers[0]
    if (!voucher) {
      throw new ServerNotification('Mã voucher không hợp lệ')
    }

    try {
      validateVoucher(voucher, totalPrice)

      // Prevent self-referral for affiliate vouchers
      if (voucher.affiliateUser) {
        const affiliateId =
          typeof voucher.affiliateUser === 'object'
            ? voucher.affiliateUser.id
            : voucher.affiliateUser
        if (affiliateId === user.id) {
          throw new Error('Bạn không thể sử dụng mã voucher affiliate của chính mình')
        }
      }
    } catch (e) {
      throw new ServerNotification((e as Error).message)
    }

    // Fetch product variant to get parent product ID for scope check
    const pv = await payload.findByID({
      collection: 'product-variants',
      id: productVariantId,
      depth: 1,
      select: { product: true },
    })
    if (!pv) {
      throw new ServerNotification('Không tìm thấy sản phẩm')
    }

    try {
      validateVoucherScope(voucher, typeof pv.product === 'object' ? pv.product.id : pv.product, productVariantId)
    } catch (e) {
      throw new ServerNotification((e as Error).message)
    }

    const discountAmount = calculateVoucherDiscount(voucher, totalPrice)

    return {
      discountAmount,
      discountType: voucher.discountType,
      discountValue: voucher.discountValue,
      code: voucher.code,
    }
  })
