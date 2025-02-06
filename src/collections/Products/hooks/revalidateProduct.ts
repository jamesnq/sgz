import { CollectionBeforeDeleteHook, type CollectionAfterChangeHook } from 'payload'

import { revalidatePath, revalidateTag } from 'next/cache'

import type { Product } from '../../../payload-types'

export const revalidateProduct: CollectionAfterChangeHook<Product> = ({
  doc,
  previousDoc,
  req: { payload, context },
}) => {
  const oldPath = `/products/${previousDoc.slug}`

  payload.logger.info(`Revalidating old product at path: ${oldPath}`)

  revalidatePath(oldPath)
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
  })

  if (!context.disableRevalidate) {
    const path = `/products/${doc?.slug}`

    revalidatePath(path)
    revalidateTag('products-sitemap')
  }
  return doc
}
