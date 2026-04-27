import type { Metadata } from 'next'

import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'

import { BreadcrumbStructuredData } from '@/components/SEO/BreadcrumbStructuredData'
import { ProductStructuredData } from '@/components/SEO/ProductStructuredData'
import { Spinner } from '@/components/ui/spinner'
import { Media, Product, ProductVariant } from '@/payload-types'
import { generateMeta } from '@/utilities/generateMeta'
import { pick } from '@/utilities/pick'
import { getProductWhereClause } from '@/utilities/productFilters'
import { Suspense } from 'react'
import Notification from '../../notification'
import PageClient from './page.client'

// Keep HTML dynamic so Open Graph metadata can vary by ?variant.
// Product data is still cached below with unstable_cache revalidate: 3600.
export const dynamic = 'force-dynamic'

const getMediaID = (media?: number | Media | null): number | null =>
  typeof media === 'number' ? media : null

const resolveMedia = (media: number | Media | null | undefined, images: Media[]) => {
  if (typeof media !== 'number') return media
  return images.find((image) => image.id === media) || media
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
      <BreadcrumbStructuredData
        items={[
          { name: 'Trang chủ', item: '/' },
          { name: 'Sản phẩm', item: '/products' },
          { name: product.name, item: `/products/${product.slug}` },
        ]}
      />
      <Suspense
        fallback={
          <div className="flex items-center justify-center mt-16 mb-16">
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
  searchParams: searchParamsPromise,
}: Args): Promise<Metadata> {
  const { slug = '' } = await paramsPromise
  const searchParams = await searchParamsPromise
  const variantParam = Array.isArray(searchParams.variant)
    ? searchParams.variant[0]
    : searchParams.variant

  const product = await queryProductBySlug({ slug })
  const meta = await generateMeta({ doc: product, variant: variantParam })
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
          where: getProductWhereClause({
            slug: {
              equals: slug,
            },
          }),
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
            headers: new Headers(),
          },
        })

        const product = result.docs?.[0] || null
        if (!product || !product.variants?.length) {
          return null
        }

        const categoryIds = (product.categories || []).map((cat: any) =>
          typeof cat === 'object' ? cat.id : cat,
        )
        if (categoryIds.length > 0) {
          const relatedResult = await payload.find({
            collection: 'products',
            limit: 16,
            depth: 0,
            overrideAccess: true,
            pagination: false,
            where: getProductWhereClause({
              and: [{ id: { not_equals: product.id } }, { categories: { in: categoryIds } }],
            }),
            sort: '-sold',
            select: {
              id: true,
              slug: true,
              name: true,
              image: true,
              minPrice: true,
              maxPrice: true,
              maxDiscount: true,
              sold: true,
            },
            req: {
              // Prevent accessing headers() in unstable_cache
              headers: new Headers(),
            },
          })
          product.relatedProducts = relatedResult.docs
        } else {
          product.relatedProducts = []
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
              'meta',
            ])
          })

        // Collect all image IDs from variants
        const imageIds = Array.from(
          new Set(
            [
              getMediaID(product.image),
              getMediaID(product.meta?.image),
              ...(product.variants
                ?.flatMap((variant) => [
                  getMediaID((variant as ProductVariant).image),
                  getMediaID((variant as ProductVariant).meta?.image),
                ])
                .filter(Boolean) || []),
              ...(product.relatedProducts
                ?.map((relatedProduct) => getMediaID((relatedProduct as Product).image))
                .filter(Boolean) || []),
            ].filter((id): id is number => typeof id === 'number'),
          ),
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
            req: {
              headers: new Headers(),
            },
          })

          product.image = resolveMedia(product.image, images) as Product['image']
          if (product.meta) {
            product.meta.image = resolveMedia(product.meta.image, images) as NonNullable<
              Product['meta']
            >['image']
          }

          product.variants.forEach((variant) => {
            ;(variant as ProductVariant).image = resolveMedia(
              (variant as ProductVariant).image,
              images,
            ) as ProductVariant['image']

            if ((variant as ProductVariant).meta) {
              ;(variant as ProductVariant).meta!.image = resolveMedia(
                (variant as ProductVariant).meta?.image,
                images,
              ) as NonNullable<ProductVariant['meta']>['image']
            }
          })
          if (product.relatedProducts) {
            product.relatedProducts.forEach((relatedProduct) => {
              // @ts-expect-error ignore
              relatedProduct.image = resolveMedia((relatedProduct as Product).image, images)
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
            req: {
              headers: new Headers(),
            },
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
    [`product-detail-${slug}-current`], // Cache key based on slug
    {
      tags: [`products-${slug}`, 'product-detail'],
      revalidate: 3600, // Cache for 1 hour (matching page revalidate)
    },
  )

  return getCachedProductData()
}
