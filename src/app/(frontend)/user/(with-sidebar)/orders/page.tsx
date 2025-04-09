import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { OrderCardSkeleton, PageHeaderSkeleton, PageSkeleton } from '@/components/skeletons'
import { CardContent } from '@/components/ui/card'
import { ProductVariant } from '@/payload-types'
import { headers } from 'next/headers'
import { Suspense } from 'react'
import { z } from 'zod'
import PageClient from './page.client'

const SearchParamsSchema = z.object({
  q: z.string().optional(),
  status: z.string().optional(),
  page: z.coerce.number().default(1),
})

type Args = {
  searchParams: Promise<any>
}

function OrdersPageSkeleton() {
  return (
    <PageSkeleton>
      <PageHeaderSkeleton filters={true} />
      <CardContent className="max-md:p-1">
        <div className="flex flex-col text-sm gap-2">
          {Array(5)
            .fill(0)
            .map((_, i) => (
              <OrderCardSkeleton key={i} />
            ))}
        </div>
      </CardContent>
      {/* <PaginationSkeleton /> */}
    </PageSkeleton>
  )
}

async function OrdersPage({ searchParams }: { searchParams: Promise<any> }) {
  // TODO optimize using drizzle
  const { q: query, status, page } = SearchParamsSchema.parse(await searchParams)
  const payload = await getPayload({ config: configPromise })
  const headersData = await headers()
  const { user } = await payload.auth({
    headers: headersData,
  })
  if (!user) {
    return null
  }
  const queryWhere: any = { orderedBy: { equals: user.id } }
  if (query || status) {
    queryWhere.and = []
    if (query) {
      queryWhere.and.push({
        or: [
          {
            id: {
              like: query,
            },
          },
          {
            'productVariant.name': {
              like: query,
            },
          },
        ],
      })
    }
    if (status) {
      queryWhere.and.push({
        status: {
          equals: status,
        },
      })
    }
  }
  const res = await payload.find({
    collection: 'orders',
    depth: 1,
    limit: 5,
    user,
    overrideAccess: false,
    where: queryWhere,
    page,
    select: {
      id: true,
      status: true,
      productVariant: true,
      createdAt: true,
      updatedAt: true,
      quantity: true,
      totalPrice: true,
    },
  })

  const productIds = Array.from(new Set(res.docs.map((order: any) => order.productVariant.product)))
  if (productIds.length) {
    const { docs: products } = await payload.find({
      collection: 'products',
      depth: 1,
      where: {
        id: {
          in: productIds,
        },
      },
      overrideAccess: false,
      select: {
        id: true,
        name: true,
        slug: true,
        image: true,
      },
      pagination: false,
    })

    res.docs = res.docs.map((order: any) => {
      const product = products.find(
        (product) => product.id === (order.productVariant as ProductVariant).product,
      )
      return {
        ...order,
        productVariant: {
          ...(order.productVariant as ProductVariant),
          product,
        },
      }
    })
  }
  const imageIds = Array.from(new Set(res.docs.map((order: any) => order.productVariant.image)))
  if (imageIds.length) {
    const { docs: images } = await payload.find({
      collection: 'media',
      depth: 0,
      where: {
        id: {
          in: imageIds,
        },
      },
      overrideAccess: false,
      pagination: false,
    })
    res.docs = res.docs.map((order: any) => {
      const image = images.find((image) => image.id === order.productVariant.image)
      order.productVariant.image = image
      return order
    })
  }
  res.docs = res.docs.map((order: any) => {
    const { name, image, product, ..._rest } = order.productVariant as ProductVariant
    order.productVariant = { name, image, product }
    return order
  })
  return <PageClient data={res} />
}

export default function Page({ searchParams: searchParamsPromise }: Args) {
  return (
    <Suspense fallback={<OrdersPageSkeleton />}>
      <OrdersPage searchParams={searchParamsPromise} />
    </Suspense>
  )
}
