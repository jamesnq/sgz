import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { Product, ProductVariant } from '@/payload-types'
import { pick } from '@/utilities/pick'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import PageClient from './page.client'

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
    req: {
      transactionID: undefined,
    },
  })

  if (!docs.length || !user || !docs[0]) notFound()
  const order = docs[0]
  // Filter fields
  let product = (order.productVariant as ProductVariant).product as Product
  if (typeof product == 'object') {
    product = pick(product, ['slug', 'image']) as Product
  }

  order.productVariant = pick(order.productVariant as ProductVariant, [
    'id',
    'product',
    'name',
    'image',
    'fixedStock',
  ]) as ProductVariant
  return <PageClient order={order} />
}
