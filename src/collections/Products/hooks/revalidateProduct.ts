import { CollectionBeforeDeleteHook, Payload, type CollectionAfterChangeHook } from 'payload'

import { revalidatePath, revalidateTag } from 'next/cache'

import { Routes } from '@/utilities/routes'
import type { Product } from '../../../payload-types'
export const revalidateProductsPage = () => {
  revalidatePath(Routes.PRODUCTS)
}
export const revalidateProductPath = async (payload: Payload, productId: number) => {
  const product = await payload.findByID({
    collection: 'products',
    id: productId,
    overrideAccess: true,
    select: { slug: true },
  })

  if (!product || !product.slug) {
    payload.logger.error(`Product not found or missing slug for id: ${productId}`)
    return
  }

  const path = Routes.product(product.slug)
  payload.logger.info(`Revalidating product at path: ${path}`)
  revalidatePath(path)
}

export const revalidateProduct: CollectionAfterChangeHook<Product> = ({
  doc,
  previousDoc,
  req: { payload },
}) => {
  if (!previousDoc.slug) return doc
  const oldPath = Routes.product(previousDoc.slug)

  payload.logger.info(`Revalidating old product at path: ${oldPath}`)

  revalidatePath(oldPath)
  revalidateProductsPage()
  revalidateTag('products-sitemap')
  return doc
}

export const revalidateDelete: CollectionBeforeDeleteHook = async ({
  id,
  req: { context, payload },
}) => {
  const doc = await payload.findByID({
    collection: 'products',
    id,
    overrideAccess: true,
    select: { slug: true },
  })

  if (!doc || !doc.slug) return doc
  if (!context.disableRevalidate) {
    const path = Routes.product(doc?.slug)

    revalidatePath(path)
    revalidateProductsPage()
    revalidateTag('products-sitemap')
  }
  return doc
}
