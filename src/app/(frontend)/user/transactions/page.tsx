import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { Card, CardContent } from '@/components/ui/card'
import { headers } from 'next/headers'
import { Suspense } from 'react'
import { z } from 'zod'
import PageClient from './page.client'
import {
  PageHeaderSkeleton,
  PageSkeleton,
  PaginationSkeleton,
  TransactionRowSkeleton,
  TransactionTableHeaderSkeleton,
} from '@/components/skeletons'

const SearchParamsSchema = z.object({
  q: z.string().optional(),
  page: z.coerce.number().default(1),
})

type Args = {
  searchParams: Promise<any>
}

function TransactionsTableSkeleton() {
  return (
    <PageSkeleton>
      <PageHeaderSkeleton filters={false} />
      <CardContent className="max-md:p-1">
        <div className="rounded-md border">
          <div className="p-4">
            <TransactionTableHeaderSkeleton />
            {Array(10)
              .fill(0)
              .map((_, i) => (
                <TransactionRowSkeleton key={i} />
              ))}
          </div>
        </div>
      </CardContent>
      <PaginationSkeleton />
    </PageSkeleton>
  )
}

async function TransactionsPage({ searchParams }: { searchParams: Promise<any> }) {
  const { q: query, page } = SearchParamsSchema.parse(await searchParams)
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

export default function Page({ searchParams: searchParamsPromise }: Args) {
  return (
    <Suspense fallback={<TransactionsTableSkeleton />}>
      <TransactionsPage searchParams={searchParamsPromise} />
    </Suspense>
  )
}
