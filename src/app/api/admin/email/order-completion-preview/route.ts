import configPromise from '@payload-config'
import { userHasRole } from '@/access/hasRoles'
import { buildOrderCompleteEmailMessage } from '@/services/email/orderEmailService'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import { getServerSideURL } from '@/utilities/getURL'

export async function POST(req: Request) {
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: await headers() })

  if (!user || !userHasRole(user, ['admin'])) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { orderId } = await req.json()

  if (!orderId) {
    return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
  }

  const order = await payload.findByID({
    collection: 'orders',
    id: orderId,
    depth: 1,
    overrideAccess: true,
  })

  const message = buildOrderCompleteEmailMessage({
    order,
    orderUrl: `${getServerSideURL()}/user/orders/${order.id}`,
  })

  if (!message) {
    return NextResponse.json({ error: 'Order has no user email' }, { status: 400 })
  }

  return NextResponse.json({
    to: message.to,
    subject: message.subject,
    html: message.html,
    text: message.text,
  })
}
