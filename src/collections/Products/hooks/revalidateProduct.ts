import { CollectionBeforeDeleteHook, Payload, type CollectionAfterChangeHook } from 'payload'

import { revalidatePath, revalidateTag } from 'next/cache'

import { products } from '@/payload-generated-schema'
import { Routes } from '@/utilities/routes'

import { productsToSearch as updateSearchProducts } from '@/app/(frontend)/next/sync-search/route'
import { eq } from '@payloadcms/db-postgres/drizzle'
import type { Product } from '../../../payload-types'
export const revalidateProductsPage = () => {
  revalidatePath(Routes.PRODUCTS)
}

export const updateProductPriceRange = async (
  payload: Payload,
  productId: number,
  prices: number[],
) => {
  if (!productId || !prices || !prices.length) return

  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  if (prices.length > 0) {
    // use drizzle to avoid update loop
    const db = payload.db.drizzle
    await db
      .update(products)
      .set({
        minPrice: minPrice.toString(),
        maxPrice: maxPrice.toString(),
      })
      .where(eq(products.id, productId))
  }
}

export const revalidateProductPath = async (payload: Payload, productId: number) => {
  const product = await payload.findByID({
    collection: 'products',
    id: productId,
    overrideAccess: true,
    depth: 1,
  })

  if (!product || !product.slug) {
    payload.logger.error(`Product not found or missing slug for id: ${productId}`)
    return
  }

  await updateSearchProducts([product])
  const path = Routes.product(product.slug)
  payload.logger.info(`Revalidating product at path: ${path}`)
  revalidatePath(path)
}

export const revalidateProduct: CollectionAfterChangeHook<Product> = async ({
  doc,
  previousDoc,
  req: { payload },
}) => {
  if (!previousDoc.slug) return doc
  await updateSearchProducts([doc])
  const oldPath = Routes.product(previousDoc.slug)

  payload.logger.info(`Revalidating old product at path: ${oldPath}`)
  revalidatePath(oldPath)
  revalidateProductsPage()
  revalidateTag('products-sitemap', 'default')

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
    revalidateTag('products-sitemap', 'default')
  }
  return doc
}
