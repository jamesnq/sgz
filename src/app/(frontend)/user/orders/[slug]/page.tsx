import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { headers } from 'next/headers'
import PageClient from './page.client'

type Args = {
  params: Promise<{
    slug?: string
  }>
}

export default async function Page({ params: paramsPromise }: Args) {
  const payload = await getPayload({ config: configPromise })
  const headersData = await headers()
  const { user } = await payload.auth({
    headers: headersData,
  })
  const res = await payload.find({
    collection: 'orders',
    depth: 1,
    limit: 5,
    user,
  })

  return <PageClient data={res} />
}
