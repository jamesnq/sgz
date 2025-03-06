import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { headers } from 'next/headers'
import PageClient from './page.client'
import { z } from 'zod'

const SearchParamsSchema = z.object({
  q: z.string().optional(),
  page: z.coerce.number().default(1),
})

type Args = {
  searchParams: Promise<any>
}

export default async function Page({ searchParams: searchParamsPromise }: Args) {
  const { q: query, page } = SearchParamsSchema.parse(await searchParamsPromise)
  const payload = await getPayload({ config: configPromise })
  const headersData = await headers()
  const { user } = await payload.auth({
    headers: headersData,
  })

  const queryWhere: any = {}
  if (query) {
    queryWhere.or = [
      {
        description: {
          like: query,
        },
      },
    ]
  }

  const res = await payload.find({
    collection: 'transactions',
    depth: 0,
    limit: 10,
    user,
    overrideAccess: false,
    where: queryWhere,
    page,
    sort: '-createdAt', // Sort by newest first
  })

  return <PageClient data={res} />
}
