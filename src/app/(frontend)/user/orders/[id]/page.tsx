import { Product, ProductVariant } from '@/payload-types'
import { getInstancePayload } from '@/utilities/getInstancePayload'
import { getServerSession } from '@/hooks/getServerSession'
import { pick } from '@/utilities/pick'
import { notFound } from 'next/navigation'
import PageClient from './page.client'

type Args = {
  params: Promise<{
    id?: string
  }>
}

export default async function Page({ params: paramsPromise }: Args) {
  const { id } = await paramsPromise
  const idNum = Number(id)
  if (isNaN(idNum)) {
    return notFound()
  }
  const payload = await getInstancePayload()
  const { user } = await getServerSession()

  // TODO optimize using drizzle
  const { docs } = await payload.find({
    collection: 'orders',
    depth: 3,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      id: {
        equals: idNum,
      },
      orderedBy: {
        equals: Number(user?.id),
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
