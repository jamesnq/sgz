import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { headers } from 'next/headers'
import PageClient from './page.client'
import { notFound } from 'next/navigation'

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

  const { docs } = await payload.find({
    collection: 'orders',
    depth: 1,
    limit: 1,
    user,
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
      orderedBy: true,
      productVariant: true,
      formSubmission: true,
      deliveryContent: true,
    },
  })

  if (!docs.length || !user || !docs[0]) notFound()
  const order = docs[0]
  const product = await payload.findByID({
    collection: 'products',
    id: (order.productVariant as any).product,
    select: {
      id: true,
      name: true,
      slug: true,
      image: true,
    },
  })
  ;(order.productVariant as any).product = product
  if (order.formSubmission && (order.formSubmission as any).form) {
    const form = await payload.findByID({
      collection: 'forms',
      id: (order.formSubmission as any).form,
      select: {
        fields: true,
      },
    })
    ;(order.formSubmission as any).form = form
  }
  return <PageClient order={order} />
}
