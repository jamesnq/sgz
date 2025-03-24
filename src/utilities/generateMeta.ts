import type { Metadata } from 'next'

import type { Config, Media, Product, ProductVariant } from '../payload-types'

import { env } from '@/config'
import { imageFallback } from './constants'
import { getServerSideURL } from './getURL'
import { mergeOpenGraph } from './mergeOpenGraph'
import { formatPrice } from './formatPrice'
import calculateDiscountPercentage from './calculateDiscountPercentage'

const getImageURL = (image?: Media | Config['db']['defaultIDType'] | null) => {
  const serverUrl = getServerSideURL()

  let url = serverUrl + '/logo.svg'

  if (image && typeof image === 'object' && 'url' in image) {
    const ogUrl = image.sizes?.og?.url || image.url

    url = ogUrl ? serverUrl + ogUrl : serverUrl + image.url
  }

  return url
}

export const defaultMetadata = (): Metadata => {
  const serverUrl = getServerSideURL()
  const defaultImage = serverUrl + imageFallback
  const title = env.NEXT_PUBLIC_SITE_NAME

  return {
    description: 'Cung cấp dịch vụ nạp game và ứng dụng giá rẻ',
    openGraph: mergeOpenGraph({
      description: 'Cung cấp dịch vụ nạp game và ứng dụng giá rẻ',
      images: [
        {
          url: defaultImage,
        },
      ],
      title,
      url: serverUrl + '/',
    }),
    title,
  }
}

export const generateMeta = async (args: {
  doc: Partial<Product> | null
  variant: number
}): Promise<Metadata> => {
  const { doc, variant } = args
  const productVariant =
    variant > 0
      ? (doc?.variants?.find((v: any) => {
          return v.id == variant
        }) as ProductVariant)
      : undefined
  const ogImage = getImageURL(productVariant?.image || doc?.meta?.image || doc?.image)

  const title =
    productVariant?.name || doc?.meta?.title || doc?.name + ' | ' + env.NEXT_PUBLIC_SITE_NAME

  const desc = productVariant
    ? (() => {
        const discountPercentage = calculateDiscountPercentage(
          productVariant.originalPrice,
          productVariant.price,
        )
        const priceInfo = `Giá: ${formatPrice(productVariant.price)}`
        const discountInfo =
          discountPercentage > 0
            ? ` (Giá gốc: ${formatPrice(productVariant.originalPrice)}, Giảm ${Math.round(discountPercentage)}%)`
            : ''
        const description = doc?.meta?.description || ''
        return `${priceInfo}${discountInfo}. ${description}`
      })()
    : doc?.meta?.description || ''
  return {
    description: desc,
    openGraph: mergeOpenGraph({
      description: desc,
      images: ogImage
        ? [
            {
              url: ogImage,
            },
          ]
        : undefined,
      title,
      url: Array.isArray(doc?.slug) ? doc?.slug.join('/') : '/',
    }),
    title,
  }
}
