import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { headers } from 'next/headers'
import PageClient from './page.client'
import { notFound } from 'next/navigation'
import { Product, ProductVariant } from '@/payload-types'

type Args = {
  params: Promise<{
    id?: string
  }>
}

export default async function Page({ params: paramsPromise }: Args) {
  const { id } = await paramsPromise
  if (!id) notFound()
  const payload = await getPayload({ config: configPromise })
  const headersData = await headers()
  const { user } = await payload.auth({
    headers: headersData,
  })
  // TODO optimize using drizzle
  const { docs } = await payload.find({
    collection: 'orders',
    depth: 3,
    limit: 1,
    user,
    overrideAccess: false,
    pagination: false,
    where: {
      id: {
        equals: Number(id),
      },
    },
    select: {
      id: true,
      status: true,
      createdAt: true,
      quantity: true,
      subTotal: true,
      totalDiscount: true,
      totalPrice: true,
      message: true,
      updatedAt: true,
      productVariant: true,
      formSubmission: true,
      deliveryContent: true,
    },
  })

  if (!docs.length || !user || !docs[0]) notFound()
  const order = docs[0]
  // Filter fields
  let product = (order.productVariant as ProductVariant).product as Product
  if (typeof product == 'object') {
    const { slug, image } = product
    product = { slug, image } as Product
  }

  const { name, image, fixedStock } = order.productVariant as ProductVariant
  order.productVariant = { product, name, image, fixedStock } as ProductVariant
  return <PageClient order={order} />
}
