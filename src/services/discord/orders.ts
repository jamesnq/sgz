import { config } from '@/config'
import type { OrderInteraction } from '@/app/api/discord/interactions/route'
import type { Form, Order } from '@/payload-types'
import payloadConfig from '@payload-config'
import { getPayload } from 'payload'

export async function handleOrderInteraction(
  interaction: OrderInteraction,
  action: string,
  orderId: number,
): Promise<Record<string, unknown>> {
  const mapping: Record<string, unknown> = JSON.parse(config.DISCORD_STAFF_USER_MAP || '{}')
  const userId = mapping[interaction.member!.user.id]
  if (!Number.isSafeInteger(userId) || Number(userId) <= 0)
    return { content: 'Tài khoản Discord chưa được liên kết với nhân viên.' }
  const payload = await getPayload({ config: payloadConfig })
  const user = await payload.findByID({ collection: 'users', id: Number(userId), depth: 0 })
  if (!user.roles?.some((role) => role === 'admin' || role === 'staff'))
    return { content: 'Tài khoản website không có quyền nhân viên.' }
  const order = await payload.findByID({
    collection: 'orders',
    id: orderId,
    depth: 0,
    user,
    overrideAccess: false,
  })
  if (order.status === 'REFUND' || order.status === 'COMPLETED')
    return { content: `Đơn #${orderId} đã hoàn thành hoặc hoàn tiền; không thể thay đổi.` }

  if (action === 'complete')
    return {
      content: `Xác nhận hoàn thành đơn #${orderId}?`,
      components: [
        {
          type: 1,
          components: [
            {
              type: 2,
              style: 3,
              label: 'Xác nhận hoàn thành',
              custom_id: `order:confirm:${orderId}`,
            },
          ],
        },
      ],
    }
  if (action === 'confirm' || action === 'send') {
    const data: Partial<Order> = action === 'confirm' ? { status: 'COMPLETED' } : {}
    if (action === 'send') {
      const message = interaction.data?.components
        ?.flatMap((row) => row.components)
        .find((field) => field.custom_id === 'message')
        ?.value.trim()
      if (!message || message.length > 2000)
        return { content: 'Lời nhắn phải có từ 1 đến 2000 ký tự.' }
      data.message = {
        root: {
          type: 'root',
          version: 1,
          direction: null,
          format: '',
          indent: 0,
          children: message.split('\n').map((text) => ({
            type: 'paragraph',
            version: 1,
            direction: null,
            format: '',
            indent: 0,
            children: [
              { type: 'text', version: 1, text, format: 0, detail: 0, mode: 'normal', style: '' },
            ],
          })),
        },
      }
    }
    const result = await payload.update({
      collection: 'orders',
      where: {
        and: [
          { id: { equals: orderId } },
          { status: { in: ['IN_QUEUE', 'IN_PROCESS', 'USER_UPDATE'] } },
        ],
      },
      data,
      user,
      overrideAccess: false,
      depth: 0,
    })
    if (result.errors.length || result.docs.length !== 1)
      throw new Error('Order update failed or order is no longer active')
    return {
      content:
        action === 'confirm'
          ? `Đã hoàn thành đơn #${orderId}.`
          : `Đã lưu lời nhắn cho khách ở đơn #${orderId}.`,
      components: [],
    }
  }
  if (!order.formSubmission) return { content: 'Đơn hàng không có form thông tin.' }
  const submission = await payload.findByID({
    collection: 'form-submissions',
    id: typeof order.formSubmission === 'object' ? order.formSubmission.id : order.formSubmission,
    depth: 1,
    user,
    overrideAccess: false,
  })
  const form = submission.form as Form
  const fields = (form.fields || []).filter((field) => 'name' in field && field.name)
  if (action === 'request') {
    if (!fields.length) return { content: 'Form không có trường để yêu cầu.' }
    if (fields.length > 25 || fields.some((field) => String(field.name).length > 100))
      return { content: 'Form có quá nhiều trường. Vui lòng dùng workspace.' }
    return {
      content: `Chọn trường cần khách cập nhật cho đơn #${orderId}:`,
      components: Array.from({ length: Math.ceil(fields.length / 25) }, (_, index) => ({
        type: 1,
        components: [
          {
            type: 3,
            custom_id: `order:field:${orderId}`,
            placeholder: 'Chọn trường cần cập nhật',
            options: fields.slice(index * 25, index * 25 + 25).map((field) => ({
              label: String(field.label || field.name).slice(0, 100),
              value: String(field.name),
            })),
          },
        ],
      })),
    }
  }
  const fieldName = interaction.data?.values?.[0]
  if (
    action !== 'field' ||
    interaction.data?.values?.length !== 1 ||
    !fields.some((field) => field.name === fieldName)
  )
    return { content: 'Trường yêu cầu không hợp lệ.' }
  const transactionID = await payload.db.beginTransaction()
  if (!transactionID) throw new Error('Transaction unavailable')
  const req = { transactionID, user }
  try {
    await payload.update({
      collection: 'form-submissions',
      id: submission.id,
      data: {
        submissionData: {
          ...(submission.submissionData as Record<string, unknown>),
          [fieldName!]: {},
        },
      },
      user,
      req,
      overrideAccess: false,
    })
    const result = await payload.update({
      collection: 'orders',
      where: {
        and: [
          { id: { equals: orderId } },
          { status: { in: ['IN_QUEUE', 'IN_PROCESS', 'USER_UPDATE'] } },
        ],
      },
      data: { status: 'USER_UPDATE' },
      user,
      req,
      overrideAccess: false,
    })
    if (result.errors.length || result.docs.length !== 1)
      throw new Error('Order is no longer active')
    await payload.db.commitTransaction(transactionID)
  } catch (error) {
    await payload.db.rollbackTransaction(transactionID)
    throw error
  }
  return { content: `Đã yêu cầu khách cập nhật thông tin đơn #${orderId}.`, components: [] }
}
