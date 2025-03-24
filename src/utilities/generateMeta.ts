import type { Metadata } from 'next'
import type { Config, Media, Product, ProductVariant } from '../payload-types'

import { env } from '@/config'
import { imageFallback } from './constants'
import { getServerSideURL } from './getURL'
import { mergeOpenGraph } from './mergeOpenGraph'
import { formatPrice } from './formatPrice'
import calculateDiscountPercentage from './calculateDiscountPercentage'

/**
 * Extracts a valid image URL from a Media object or returns a fallback URL
 * @param image - The image object or ID to process
 * @returns A complete URL string for the image
 */
const getImageURL = (image?: Media | Config['db']['defaultIDType'] | null): string => {
  const serverUrl = getServerSideURL()
  const fallbackUrl = serverUrl + '/logo.svg'

  if (!image) {
    return fallbackUrl
  }

  if (typeof image === 'object' && 'url' in image) {
    // Prefer the optimized OG image if available
    const ogUrl = image.sizes?.og?.url || image.url
    return ogUrl ? serverUrl + ogUrl : serverUrl + image.url
  }

  return fallbackUrl
}

/**
 * Generates default metadata for pages without specific metadata
 * @returns Standard Metadata object with default values
 */
export const defaultMetadata = (): Metadata => {
  const serverUrl = getServerSideURL()
  const defaultImage = serverUrl + imageFallback
  const title = env.NEXT_PUBLIC_SITE_NAME
  const description = 'Cung cấp dịch vụ nạp game và ứng dụng giá rẻ'

  return {
    title,
    description,
    openGraph: mergeOpenGraph({
      title,
      description,
      images: [{ url: defaultImage }],
      url: serverUrl + '/',
    }),
  }
}

/**
 * Generates a description for a product variant including price and discount information
 * @param productVariant - The product variant to describe
 * @param baseDescription - Optional base description to append to
 * @returns Formatted description string with price and discount details
 */
const generateVariantDescription = (
  productVariant: ProductVariant,
  baseDescription: string = '',
): string => {
  const discountPercentage = calculateDiscountPercentage(
    productVariant.originalPrice,
    productVariant.price,
  )

  const priceInfo = `Giá: ${formatPrice(productVariant.price)}`

  const discountInfo =
    discountPercentage > 0
      ? ` (Giá gốc: ${formatPrice(productVariant.originalPrice)}, Giảm ${Math.round(discountPercentage)}%)`
      : ''

  return `${priceInfo}${discountInfo}${baseDescription ? '. ' + baseDescription : ''}`
}

/**
 * Interface for generateMeta function arguments
 */
interface GenerateMetaArgs {
  doc: Partial<Product> | null
  variant: number
}

/**
 * Generates metadata for a product or product variant page
 * @param args - Object containing the product document and variant ID
 * @returns Metadata object with title, description and OpenGraph data
 */
export const generateMeta = async ({ doc, variant }: GenerateMetaArgs): Promise<Metadata> => {
  if (!doc) {
    return defaultMetadata()
  }

  // Find the selected product variant if variant ID is provided
  const productVariant =
    variant > 0 ? (doc.variants?.find((v: any) => v.id == variant) as ProductVariant) : undefined

  // Determine the appropriate image to use
  const ogImage = getImageURL(productVariant?.image || doc.meta?.image || doc.image)

  // Determine the title
  const title =
    productVariant?.name || doc.meta?.title || `${doc.name || ''} | ${env.NEXT_PUBLIC_SITE_NAME}`

  // Generate description based on whether we have a variant or not
  const description = productVariant
    ? generateVariantDescription(productVariant, doc.meta?.description || '')
    : doc.meta?.description || ''

  // Generate the URL path
  const url = Array.isArray(doc.slug) ? doc.slug.join('/') : '/'

  return {
    title,
    description,
    openGraph: mergeOpenGraph({
      title,
      description,
      images: ogImage ? [{ url: ogImage }] : undefined,
      url,
    }),
  }
}
