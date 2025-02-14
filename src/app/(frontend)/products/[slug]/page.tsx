import type { Metadata } from 'next'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { cache } from 'react'

import { ProductVariant } from '@/payload-types'
import { generateMeta } from '@/utilities/generateMeta'
import Notification from '../../notification'
import PageClient from './page.client'
// TODO here
// export async function generateStaticParams() {
//   const payload = await getPayload({ config: configPromise })
//   const products = await payload.find({
//     collection: 'products',
//     draft: false,
//     limit: 1000,
//     overrideAccess: false,
//     pagination: false,
//     select: {
//       slug: true,
//     },
//   })

//   const params = products.docs.map(({ slug }) => {
//     return { slug }
//   })

//   return params
// }

type Args = {
  params: Promise<{
    slug?: string
  }>
}

export default async function Page({ params: paramsPromise }: Args) {
  const { slug = '' } = await paramsPromise

  const product = await queryProductBySlug({ slug })

  if (!product) return <Notification message="Sản phẩm này đã tạm dừng hoặc chưa được mở bán" />

  return <PageClient product={product} />
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = '' } = await paramsPromise
  const product = await queryProductBySlug({ slug })

  return generateMeta({ doc: product })
}

const queryProductBySlug = cache(async ({ slug }: { slug: string }) => {
  // TODO optimize query using drizzle
  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'products',
    limit: 1,
    pagination: false,
    where: {
      slug: {
        equals: slug,
      },
    },
  })
  const product = result.docs?.[0] || null
  if (!product || !product.variants?.docs?.length) {
    return null
  }
  if (product && product.variants?.docs) {
    product.variants.docs = product.variants.docs.sort(
      (a: any, b: any) => a.originalPrice - b.originalPrice,
    )
  }

  const formIds = Array.from(
    new Set(
      product.variants?.docs?.map((variant) => (variant as ProductVariant).form).filter(Boolean) ||
        [],
    ),
  )

  const { docs: forms } = await payload.find({
    collection: 'forms',
    where: {
      id: {
        in: formIds,
      },
    },
  })
  product.variants.docs.forEach((variant) => {
    ;(variant as ProductVariant).form = forms.find(
      (form) => form.id === (variant as ProductVariant).form,
    )
  })
  return product
})
