'use server'
import { Order } from '@/payload-types'
import { authActionClient, ServerNotification } from '@/utilities/safe-action'
import payloadConfig from '@payload-config'
import { getPayload } from 'payload'
import { UpdateFormSubmissionSchema } from './schema'

const orderCanUpdate = (order: Order) => {
  const canUpdateStatus: Order['status'][] = ['PENDING', 'IN_QUEUE', 'IN_PROCESS', 'USER_UPDATE']
  return canUpdateStatus.includes(order.status)
}

export const updateOrderAction = authActionClient
  .schema(UpdateFormSubmissionSchema)
  .action(async ({ parsedInput: { id, shippingFields }, ctx }) => {
    const { user } = ctx

    const payload = await getPayload({ config: payloadConfig })

    const order = await payload.findByID({
      collection: 'orders',
      id,
      user,
      depth: 0,
      overrideAccess: false,
    })
    if (!order) {
      throw new ServerNotification('Không tìm thấy đơn hàng')
    }
    if (!orderCanUpdate(order)) {
      throw new ServerNotification('Không thể cập nhật trạng thái đơn hàng này')
    }
    if (order.status === 'USER_UPDATE') {
      await payload.update({
        collection: 'orders',
        where: { id: { equals: order.id } },
        data: { status: 'IN_PROCESS' },
        overrideAccess: true,
        limit: 1,
      })
    }
    if (shippingFields) {
      const res = await payload.update({
        collection: 'form-submissions',
        where: { id: { equals: order.formSubmission } },
        data: { submissionData: shippingFields },
        limit: 1,
        overrideAccess: true,
      })
      if (res.errors.length > 0) {
        return { message: 'Cập nhật thông tin thất bại' }
      }
    }

    return { message: 'Cập nhật thông tin thành công' }
  })
