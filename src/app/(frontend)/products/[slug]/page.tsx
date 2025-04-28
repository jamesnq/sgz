import type { Metadata } from 'next'

import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'

import { ProductStructuredData } from '@/components/SEO/ProductStructuredData'
import { Spinner } from '@/components/ui/spinner'
import { Product, ProductVariant } from '@/payload-types'
import { generateMeta } from '@/utilities/generateMeta'
import { pick } from '@/utilities/pick'
import { Suspense } from 'react'
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

  return (
    <>
      <ProductStructuredData product={product} />
      <Suspense
        fallback={
          <div className="flex items-center justify-center mt-16 mb-mt-16">
            <Spinner className="text-highlight" size={100} variant="ring" />
          </div>
        }
      >
        <PageClient product={product} />
      </Suspense>
    </>
  )
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

const queryProductBySlug = async ({ slug }: { slug: string }) => {
  const getCachedProductData = unstable_cache(
    async () => {
      try {
        // TODO optimize query using drizzle
        const payload = await getPayload({ config: configPromise })

        // Fetch product data
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
          req: {
            transactionID: undefined,
          },
        })

        const product = result.docs?.[0] || null
        if (!product || !product.variants?.length) {
          return null
        }

        ;(product.variants as any) = product.variants
          .filter((variant) => {
            return (variant as ProductVariant).status !== 'PRIVATE'
          })
          // @ts-expect-error ignore
          .map((pv: ProductVariant) => {
            return pick(pv, [
              'id',
              'name',
              'price',
              'originalPrice',
              'image',
              'status',
              'min',
              'max',
              'important',
              'description',
              'form',
              'product',
            ])
          })

        // Collect all image IDs from variants
        const imageIds = Array.from(
          new Set([
            ...(product.variants
              ?.map((variant) => (variant as ProductVariant).image)
              .filter(Boolean) || []),
            ...(product.relatedProducts
              ?.map((relatedProduct) => (relatedProduct as Product).image)
              .filter(Boolean) || []),
          ]),
        )

        // Fetch images if needed
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
          if (product.relatedProducts) {
            product.relatedProducts.forEach((relatedProduct) => {
              // @ts-expect-error ignore
              relatedProduct.image = images.find(
                (image) => image.id === (relatedProduct as Product).image,
              )
            })
          }
        }

        // Collect all form IDs from variants
        const formIds = Array.from(
          new Set(
            product.variants?.map((variant) => (variant as ProductVariant).form).filter(Boolean) ||
              [],
          ),
        )

        // Fetch forms if needed
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
      } catch {
        return null
      }
    },
    [`product-detail-${slug}`], // Cache key based on slug
    {
      tags: [`products-${slug}`, 'product-detail'],
      revalidate: 3600, // Cache for 1 hour (matching page revalidate)
    },
  )

  return getCachedProductData()
}
