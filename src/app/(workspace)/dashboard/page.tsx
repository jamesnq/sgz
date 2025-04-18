import { userHasRole } from '@/access/hasRoles'
import { Recharge } from '@/payload-types'
import { getInstancePayloadAuth } from '@/utilities/getInstancePayload'
import PageClient from './page.client'

export default async function Page() {
  const { payload, user } = await getInstancePayloadAuth()

  if (!userHasRole(user, ['admin'])) return null
  const orders = await payload.find({
    collection: 'orders',
    depth: 0,
    user,
  })

  const recharges = await payload.find({
    collection: 'recharges',
    depth: 0,
    user,
    where: {
      status: { equals: 'SUCCESS' as Recharge['status'] },
    },
  })
  return <PageClient orders={orders} recharges={recharges} />
}
