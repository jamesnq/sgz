'use server'
import { Form, Order } from '@/payload-types'
import {
  QuickCopyItem,
  sendOrderUserUpdatedStaffNotification,
} from '@/services/novu.service'
import { authActionClient, ServerNotification } from '@/utilities/safe-action'
import payloadConfig from '@payload-config'
import { getPayload } from 'payload'
import { UpdateFormSubmissionSchema } from './schema'

const orderCanUpdate = (order: Order) => {
  const canUpdateStatus: Order['status'][] = ['IN_QUEUE', 'IN_PROCESS', 'USER_UPDATE']
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
        user,
        depth: 0,
        overrideAccess: true,
        limit: 1,
      })
    }
    if (shippingFields) {
      const updatedItems: QuickCopyItem[] = []
      if (order.formSubmission) {
        try {
          const formSubmissionId =
            typeof order.formSubmission === 'object'
              ? order.formSubmission.id
              : order.formSubmission
          const currentSubmission = await payload.findByID({
            collection: 'form-submissions',
            id: formSubmissionId,
            depth: 1,
            overrideAccess: true,
          })
          if (currentSubmission) {
            const form = currentSubmission.form as Form
            const oldData = (currentSubmission.submissionData as Record<string, unknown>) || {}
            if (form?.fields) {
              for (const field of form.fields) {
                if (!('name' in field) || !field.name) continue
                const val = shippingFields[field.name]
                const oldVal = oldData[field.name]

                // Nếu khách điền giá trị mới và khác với giá trị cũ (hoặc trước đó đang đợi nhập {})
                if (
                  val !== undefined &&
                  val !== null &&
                  typeof val !== 'object' &&
                  String(val).trim() !== '' &&
                  (typeof oldVal === 'object' || String(val) !== String(oldVal))
                ) {
                  let displayVal = String(val).trim()
                  if (
                    field.blockType === 'select' &&
                    'options' in field &&
                    Array.isArray(field.options)
                  ) {
                    const opt = field.options.find((o: any) => o.value === val)
                    if (opt?.label) displayVal = opt.label
                  }
                  updatedItems.push({
                    label: field.label || field.name,
                    value: displayVal,
                  })
                }
              }
            }
          }
        } catch (e) {
          console.error('[updateOrderAction] Error calculating updated fields for Discord:', e)
        }
      }

      const res = await payload.update({
        collection: 'form-submissions',
        where: { id: { equals: order.formSubmission } },
        data: { submissionData: shippingFields },
        depth: 0,
        limit: 1,
        overrideAccess: true,
      })
      if (res.errors.length > 0) {
        throw new ServerNotification('Cập nhật thông tin thất bại')
      }

      await sendOrderUserUpdatedStaffNotification(order.id, updatedItems)
    }

    return { message: 'Cập nhật thông tin thành công' }
  })
