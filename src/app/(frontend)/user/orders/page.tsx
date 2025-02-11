import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { headers } from 'next/headers'
import PageClient from './page.client'
import { ProductVariant } from '@/payload-types'

type Args = {
  searchParams: Promise<{
    q: string
    status: string
  }>
}
export default async function Page({ searchParams: searchParamsPromise }: Args) {
  const { q: query, status } = await searchParamsPromise
  const payload = await getPayload({ config: configPromise })
  const headersData = await headers()
  const { user } = await payload.auth({
    headers: headersData,
  })
  const queryWhere: any = {}
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
  console.log('🚀 ~ Page ~ queryWhere:', queryWhere)

  const res = await payload.find({
    collection: 'orders',
    depth: 1,
    limit: 5,
    user,
    overrideAccess: false,
    where: queryWhere,
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
  console.log('🚀 ~ Page ~ productIds:', productIds)
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
  console.log('🚀 ~ res.docs=res.docs.map ~ res:', res)

  return <PageClient data={res} />
}
