'use server'

import { userHasRole } from '@/access/hasRoles'
import { authActionClient, ServerNotification } from '@/utilities/safe-action'
import { importStocksSchema } from './schema'
import { getPayload } from 'payload'
import payloadConfig from '@payload-config'
import { stocks } from '@/payload-generated-schema'

/**
 * Server action to import stocks
 */
export const importStocksAction = authActionClient
  .schema(importStocksSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { productVariantId, input } = parsedInput
    if (!Array.isArray(input) || !input.every((item) => typeof item === 'object')) {
      throw new ServerNotification('Dữ liệu đầu vào không hợp lệ. Yêu cầu mảng các đối tượng.')
    }

    const { user } = ctx

    // Check if user has admin role
    if (!userHasRole(user, ['admin'])) {
      throw new ServerNotification('Không có quyền cho hành động này')
    }
    const payload = await getPayload({ config: payloadConfig })
    const productVariant = await payload.findByID({
      collection: 'product-variants',
      id: productVariantId,
      depth: 0,
      select: { autoProcess: true },
    })
    if (!productVariant || !productVariant.autoProcess) {
      throw new ServerNotification('Product variant không có autoProcess')
    }

    const db = payload.db.drizzle
    const transactionID = await payload.db.beginTransaction()
    if (!transactionID) {
      throw new ServerNotification('Lỗi hệ thống: không thể bắt đầu transaction')
    }

    let committed = false
    try {
      await db.insert(stocks).values(
        input.map((item) => ({
          productVariant: productVariantId,
          data: item,
        })),
      )
      const count = await payload.count({
        collection: 'stocks',
        where: {
          productVariant: {
            equals: productVariantId,
          },
          order: {
            equals: null,
          },
        },
        req: { transactionID },
      })
      await payload.update({
        collection: 'product-variants',
        id: productVariantId,
        data: {
          max: count.totalDocs,
          status: 'AVAILABLE',
        },
        req: { transactionID },
      })

      await payload.db.commitTransaction(transactionID)
      committed = true

      return {
        success: true,
        message: 'Đã nhập hàng',
      }
    } catch (error) {
      console.error(`Error in importStocksAction for product variant ${productVariantId}:`, error)
      throw new ServerNotification(
        error instanceof Error ? error.message : 'Lỗi không xác định khi nhập hàng',
      )
    } finally {
      if (!committed) {
        try {
          await payload.db.rollbackTransaction(transactionID)
        } catch (e) {
          console.error('[importStocksAction] Failed to rollback transaction:', e)
        }
      }
    }
  })
