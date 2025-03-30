import type { Metadata } from 'next'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { cache } from 'react'

import { ProductVariant } from '@/payload-types'
import { generateMeta } from '@/utilities/generateMeta'
import Notification from '../../notification'
import PageClient from './page.client'

export const revalidate = 3600

export async function generateStaticParams() {
  try {
    const payload = await getPayload({ config: configPromise })
    const products = await payload.find({
      collection: 'products',
      depth: 0,
      draft: false,
      limit: 5,
      overrideAccess: true,
      pagination: false,
      select: {
        slug: true,
      },
      where: {
        status: {
          not_equals: 'PRIVATE',
        },
      },
      sort: '-sold',
    })

    const params = products.docs.map(({ slug }) => {
      return { slug }
    })

    return params
  } catch {}

  return []
}

type Args = {
  params: Promise<{
    slug?: string
  }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function Page({ params: paramsPromise }: Args) {
  const { slug = '' } = await paramsPromise

  const product = await queryProductBySlug({ slug })

  if (!product) return <Notification message="Sản phẩm này đã tạm dừng hoặc chưa được mở bán" />
  delete product.meta
  return <PageClient product={product} />
}

export async function generateMetadata({
  params: paramsPromise,
  searchParams,
}: Args): Promise<Metadata> {
  const { slug = '' } = await paramsPromise
  const { variant } = await searchParams
  const product = await queryProductBySlug({ slug })
  const meta = await generateMeta({ doc: product, variant: Number(variant) })
  return meta
}

const queryProductBySlug = cache(async ({ slug }: { slug: string }) => {
  try {
    // TODO optimize query using drizzle
    const payload = await getPayload({ config: configPromise })
    const result = await payload.find({
      collection: 'products',
      limit: 1,
      depth: 1,
      overrideAccess: true,
      pagination: false,
      where: {
        slug: {
          equals: slug,
        },
        status: {
          not_equals: 'PRIVATE',
        },
      },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        variants: true,
        image: true,
        categories: true,
        relatedProducts: true,
        status: true,
        sold: true,
        meta: true,
      },
    })
    const product = result.docs?.[0] || null
    if (!product || !product.variants?.length) {
      return null
    }
    product.variants = product.variants
      .filter((variant) => {
        return (variant as ProductVariant).status !== 'PRIVATE'
      })
      // @ts-expect-error ignore
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .map(({ note, metadata, fixedStock, ...rest }: ProductVariant) => {
        return rest
      })
    const imageIds = Array.from(
      new Set(
        product.variants?.map((variant) => (variant as ProductVariant).image).filter(Boolean) || [],
      ),
    )
    if (imageIds.length) {
      const { docs: images } = await payload.find({
        collection: 'media',
        overrideAccess: true,
        pagination: false,
        where: {
          id: {
            in: imageIds,
          },
        },
        depth: 0,
      })
      product.variants.forEach((variant) => {
        ;(variant as ProductVariant).image = images.find(
          (image) => image.id === (variant as ProductVariant).image,
        )
      })
    }
    const formIds = Array.from(
      new Set(
        product.variants?.map((variant) => (variant as ProductVariant).form).filter(Boolean) || [],
      ),
    )
    if (formIds.length) {
      const { docs: forms } = await payload.find({
        collection: 'forms',
        overrideAccess: true,
        where: {
          id: {
            in: formIds,
          },
        },
        depth: 1,
      })
      product.variants.forEach((variant) => {
        ;(variant as ProductVariant).form = forms.find(
          (form) => form.id === (variant as ProductVariant).form,
        )
      })
    }
    return product
  } catch {}
  return null
})
