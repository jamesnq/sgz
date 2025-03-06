import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { headers } from 'next/headers'
import PageClient from './page.client'
import { z } from 'zod'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

const SearchParamsSchema = z.object({
  q: z.string().optional(),
  page: z.coerce.number().default(1),
})

type Args = {
  searchParams: Promise<any>
}

function TransactionsTableSkeleton() {
  return (
    <Card className="max-md:border-0">
      <CardHeader className="max-md:p-1">
        <Skeleton className="h-6 w-48 mb-2" />
        <Skeleton className="h-4 w-64 mb-4" />
        <div className="flex justify-end">
          <Skeleton className="h-10 w-72" />
        </div>
      </CardHeader>
      <CardContent className="max-md:p-1">
        <div className="rounded-md border">
          <div className="p-4">
            <Skeleton className="h-10 w-full mb-4" />
            {Array(5).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full mb-2" />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
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
