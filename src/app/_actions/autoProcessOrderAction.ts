'use server'

import { userHasRole } from '@/access/hasRoles'
import { autoProcessOrder } from '@/services/orderProcessing'
import { authActionClient, ServerNotification } from '@/utilities/safe-action'
import { autoProcessOrderSchema } from './schema'

/**
 * Server action to auto-process an order
 */
export const autoProcessOrderAction = authActionClient
  .schema(autoProcessOrderSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { orderId } = parsedInput
    const { user } = ctx

    // Check if user has admin role
    if (!userHasRole(user, ['admin', 'staff'])) {
      throw new ServerNotification('Không có quyền xử lý đơn hàng')
    }

    try {
      await autoProcessOrder(orderId)

      return {
        success: true,
        message: 'Đơn hàng đã được xử lý tự động',
      }
    } catch (error) {
      console.error(`Error in autoProcessOrderAction for order ${orderId}:`, error)

      throw new ServerNotification(
        error instanceof Error ? error.message : 'Lỗi không xác định khi xử lý đơn hàng',
      )
    }
  })
