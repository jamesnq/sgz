import type { Order } from '@/payload-types'
import { getServerSideURL } from '@/utilities/getURL'
import type { EmailMessage } from './types'
import { createOrderCompleteDeliveryEmail } from './templates'

export function buildOrderCompleteEmailMessage(args: { order: Order; orderUrl?: string }) {
  const user = args.order.orderedBy
  const productVariant = args.order.productVariant

  if (!user || typeof user !== 'object' || !user.email) {
    return null
  }

  const productName = typeof productVariant === 'object' ? productVariant.name : `Đơn hàng #${args.order.id}`

  return createOrderCompleteDeliveryEmail({
    customerName: user.name,
    email: user.email,
    orderId: args.order.id,
    productName,
    quantity: args.order.quantity || 1,
    deliveryLines: [],
    orderUrl: args.orderUrl,
  })
}

export function buildCompletionAuditUpdate(order: Order, actorId?: number | null) {
  const formSubmission = order.formSubmission
  const formSubmissionId =
    formSubmission && typeof formSubmission === 'object' ? formSubmission.id : formSubmission
  if (!formSubmissionId) {
    return null
  }

  return {
    formSubmissionId,
    data: {
      completedOrder: order.id,
      completedAt: new Date().toISOString(),
      completedBy: actorId ?? undefined,
      orderStatusAtCompletion: 'COMPLETED' as const,
    },
  }
}

export async function sendOrderCompletedUserEmail(args: {
  order: Order
  send: (message: EmailMessage) => Promise<unknown>
}) {
  const message = buildOrderCompleteEmailMessage({
    order: args.order,
    orderUrl: `${getServerSideURL()}/user/orders/${args.order.id}`,
  })

  if (!message) {
    return { skipped: true as const }
  }

  await args.send(message)
  return { skipped: false as const }
}
