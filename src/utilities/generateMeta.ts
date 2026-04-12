import type { Metadata } from 'next'
import type { Config, Media, Product, ProductVariant } from '../payload-types'

import { config } from '@/config'
import calculateDiscountPercentage from './calculateDiscountPercentage'
import { imageFallback, SITE_DESCRIPTION } from './constants'
import { formatPrice } from './formatPrice'
import { getServerSideURL } from './getURL'
import { mergeOpenGraph } from './mergeOpenGraph'
import { textOnly } from '@/components/RichText/textOnly'

/**
 * Extracts a valid image URL from a Media object or returns a fallback URL
 * @param image - The image object or ID to process
 * @returns A complete URL string for the image
 */
const getImageURL = (image?: Media | Config['db']['defaultIDType'] | null): string => {
  const serverUrl = getServerSideURL()
  const fallbackUrl = imageFallback.startsWith('http') ? imageFallback : serverUrl + imageFallback

  if (!image) {
    return fallbackUrl
  }

  if (typeof image === 'object' && 'url' in image) {
    // Prefer the optimized OG image if available
    const ogUrl = image.sizes?.og?.url || image.url
    if (!ogUrl) return fallbackUrl
    return ogUrl.startsWith('http') ? ogUrl : serverUrl + ogUrl
  }

  return fallbackUrl
}

/**
 * Generates default metadata for pages without specific metadata
 * @returns Standard Metadata object with default values
 */
export const defaultMetadata = (): Metadata => {
  const serverUrl = getServerSideURL()
  const defaultImage = imageFallback.startsWith('http') ? imageFallback : serverUrl + imageFallback
  const title = config.NEXT_PUBLIC_SITE_NAME
  const description = SITE_DESCRIPTION

  return {
    title,
    description,
    ...mergeOpenGraph({
      title,
      description,
      images: [{ url: defaultImage }],
      url: serverUrl,
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
  const serverUrl = getServerSideURL()
  if (!doc) {
    return defaultMetadata()
  }

  // Find the selected product variant if variant ID is provided
  const productVariant =
    variant > 0 ? (doc.variants?.find((v: any) => v.id == variant) as ProductVariant) : undefined

  // Determine the appropriate image to use
  // Payload CMS SEO plugin allows a custom image override in `meta.image`
  const ogImage = getImageURL(productVariant?.meta?.image || doc.meta?.image || productVariant?.image || doc.image)

  // Determine the title
  let title = `${productVariant?.name || doc.name || ''} | ${config.NEXT_PUBLIC_SITE_NAME}`
  if (productVariant?.meta?.title) {
    title = productVariant.meta.title
  } else if (doc.meta?.title) {
    title = productVariant && !doc.meta.title.toLowerCase().includes(productVariant.name.toLowerCase())
      ? `${productVariant.name} - ${doc.meta.title}` 
      : doc.meta.title
  }

  // Generate description based on whether we have a variant or not
  let description = productVariant
    ? generateVariantDescription(productVariant, textOnly(doc.description))
    : textOnly(doc.description)
    
  if (productVariant?.meta?.description) {
    description = productVariant.meta.description
  } else if (doc.meta?.description && !productVariant) {
    description = doc.meta.description
  } else if (doc.meta?.description && productVariant) {
    description = generateVariantDescription(productVariant, doc.meta.description)
  }

  if (description && description.length > 160) {
    description = description.substring(0, 157) + '...'
  }

  // Generate the URL path
  const urlPath = Array.isArray(doc.slug) ? doc.slug.join('/') : doc.slug || ''
  const canonicalUrl = `${serverUrl}/products/${urlPath}`
  const pageUrl = `${canonicalUrl}${variant > 0 ? `?variant=${variant}` : ''}`

  return {
    title,
    description,
    alternates: {
      canonical: pageUrl,
    },
    ...mergeOpenGraph({
      title,
      description,
      images: ogImage ? [{ url: ogImage }] : undefined,
      url: pageUrl,
    }),
  }
}

