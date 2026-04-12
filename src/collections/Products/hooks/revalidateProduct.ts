import { CollectionBeforeDeleteHook, Payload, type CollectionAfterChangeHook } from 'payload'

import { revalidatePath, revalidateTag } from 'next/cache'

import { products } from '@/payload-generated-schema'
import { Routes } from '@/utilities/routes'

import { productsToSearch as updateSearchProducts } from '@/app/(frontend)/next/sync-search/route'
import { eq } from '@payloadcms/db-postgres/drizzle'
import type { Product } from '../../../payload-types'
import calculateDiscountPercentage from '@/utilities/calculateDiscountPercentage'

export const revalidateProductsPage = () => {
  try {
    revalidatePath(Routes.PRODUCTS)
  } catch (e) {
    console.error(`Failed to revalidate products page:`, e)
  }
}

/**
 * Helper to invalidate all product-related caches in one place (DRY).
 * Optionally invalidates slug-specific caches if a slug is provided.
 */
function invalidateProductCaches(slug?: string) {
  try {
    if (slug) {
      revalidatePath(Routes.product(slug))
      revalidateTag(`products-${slug}`, 'max')
      revalidateTag('product-detail', 'max')
    }
    revalidateProductsPage()
    revalidatePath('/')
    revalidateTag('products-list', 'max')
    revalidateTag('homepage-sections', 'max')
    revalidateTag('products-sitemap', 'max')
  } catch (e) {
    console.error(`Failed to invalidate product caches:`, e)
  }
}

export const updateProductPriceRange = async (
  payload: Payload,
  productId: number,
  variants: { price: number; originalPrice: number; status: string }[],
  req?: any,
) => {
  if (!productId || !variants) return

  const prices = variants.map((v) => v.price)
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0

  const discounts = variants
    .filter((v) => v.status !== 'STOPPED')
    .map((v) => calculateDiscountPercentage(v.originalPrice, v.price))

  const maxDiscount = discounts.length > 0 ? Math.max(...discounts) : 0

  // use drizzle directly to avoid update loop, but bind to the active payload transaction!
  const db = req?.transaction || payload.db.drizzle
  await db
    .update(products)
    .set({
      minPrice: minPrice,
      maxPrice: maxPrice,
      maxDiscount: maxDiscount,
    })
    .where(eq(products.id, productId))
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

  try {
    await updateSearchProducts([product])
  } catch (e) {
    payload.logger.error({
      err: e,
      message: `Failed to update search products for id: ${productId}`,
    })
  }

  invalidateProductCaches(product.slug)
}

export const revalidateProduct: CollectionAfterChangeHook<Product> = async ({
  doc,
  previousDoc,
  req: { payload },
}) => {
  try {
    await updateSearchProducts([doc])
  } catch (e) {
    payload.logger.error({ err: e, message: `Failed to update search products for id: ${doc.id}` })
  }

  try {
    if (previousDoc && previousDoc.slug && previousDoc.slug !== doc.slug) {
      const oldPath = Routes.product(previousDoc.slug)
      payload.logger.info(`Revalidating old product at path: ${oldPath}`)
      revalidatePath(oldPath)
    }

    invalidateProductCaches(doc?.slug ?? undefined)
  } catch (e) {
    payload.logger.error({ err: e, message: `Failed to revalidate paths for product: ${doc.id}` })
  }

  return doc
}

import { meiliSearchServer } from '@/utilities/meiliSearchServer'

export const revalidateDelete: CollectionBeforeDeleteHook = async ({
  id,
  req: { context, payload },
}) => {
  try {
    await meiliSearchServer.index('products').deleteDocument(String(id))
  } catch (err) {
    payload.logger.error({ err, message: `Failed to remove product ${id} from MeiliSearch upon deletion` })
  }

  const doc = await payload.findByID({
    collection: 'products',
    id,
    overrideAccess: true,
    select: { slug: true },
  })

  if (!doc || !doc.slug) return doc
  if (!context.disableRevalidate) {
    invalidateProductCaches(doc.slug)
  }
  return doc
}

