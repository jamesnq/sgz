import type { Metadata } from 'next'
import type { Config, Media, Product, ProductVariant } from '../payload-types'

import { config } from '@/config'
import calculateDiscountPercentage from './calculateDiscountPercentage'
import { ogDefaultImage, SITE_DESCRIPTION } from './constants'
import { formatPrice } from './formatPrice'
import { getServerSideURL } from './getURL'
import { mergeOpenGraph } from './mergeOpenGraph'
import { textOnly } from '@/components/RichText/textOnly'

type MetadataImage = {
  url: string
  secureUrl?: string
  alt?: string
  type?: string
  width?: number
  height?: number
}

/**
 * Extracts a valid image URL from a Media object or returns a fallback URL
 * @param image - The image object or ID to process
 * @returns A complete URL string for the image
 */
const getImage = (image?: Media | Config['db']['defaultIDType'] | null): MetadataImage => {
  const serverUrl = getServerSideURL()
  const fallbackUrl = ogDefaultImage.startsWith('http')
    ? ogDefaultImage
    : serverUrl + ogDefaultImage
  const fallbackImage = {
    url: fallbackUrl,
    secureUrl: fallbackUrl,
    width: 1200,
    height: 630,
    alt: config.NEXT_PUBLIC_SITE_NAME,
    type: 'image/png',
  }

  if (!image) {
    return fallbackImage
  }

  if (typeof image === 'object' && 'url' in image) {
    // Prefer the optimized OG image if available
    const ogUrl = image.sizes?.og?.url || image.url
    if (!ogUrl) return fallbackImage

    const imageUrl = ogUrl.startsWith('http') ? ogUrl : serverUrl + ogUrl
    const isOptimizedOG = Boolean(image.sizes?.og?.url)

    return {
      url: imageUrl,
      secureUrl: imageUrl,
      width: isOptimizedOG ? image.sizes?.og?.width || 1200 : image.width || 1200,
      height: isOptimizedOG ? image.sizes?.og?.height || 630 : image.height || 630,
      alt: image.alt || config.NEXT_PUBLIC_SITE_NAME,
      type: image.sizes?.og?.mimeType || image.mimeType || undefined,
    }
  }

  return fallbackImage
}

const getVariantID = (variant?: string | number | null): string | null => {
  if (typeof variant === 'number') {
    return Number.isFinite(variant) && variant > 0 ? String(variant) : null
  }

  const value = variant?.trim()
  return value || null
}

/**
 * Generates default metadata for pages without specific metadata
 * @returns Standard Metadata object with default values
 */
export const defaultMetadata = (): Metadata => {
  const serverUrl = getServerSideURL()
  const defaultImage = getImage()
  const title = config.NEXT_PUBLIC_SITE_NAME
  const description = SITE_DESCRIPTION

  return {
    title,
    description,
    alternates: {
      canonical: serverUrl,
    },
    ...mergeOpenGraph({
      title,
      description,
      images: [defaultImage],
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
  variant?: string | number | null
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

  const variantID = getVariantID(variant)

  // Find the selected product variant if variant ID is provided
  const productVariant =
    variantID && doc.variants
      ? (doc.variants.find(
          (v): v is ProductVariant => typeof v === 'object' && String(v.id) === variantID,
        ) as ProductVariant | undefined)
      : undefined

  // Determine the appropriate image to use
  // Payload CMS SEO plugin allows a custom image override in `meta.image`
  const ogImage = getImage(
    productVariant?.meta?.image || productVariant?.image || doc.meta?.image || doc.image,
  )

  // Determine the title
  let title = `${productVariant?.name || doc.name || ''} | ${config.NEXT_PUBLIC_SITE_NAME}`
  if (productVariant?.meta?.title) {
    title = productVariant.meta.title
  } else if (doc.meta?.title) {
    title =
      productVariant && !doc.meta.title.toLowerCase().includes(productVariant.name.toLowerCase())
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
  const pageUrl = `${canonicalUrl}${productVariant ? `?variant=${encodeURIComponent(String(productVariant.id))}` : ''}`

  return {
    title,
    description,
    alternates: {
      canonical: pageUrl,
    },
    ...mergeOpenGraph({
      title,
      description,
      images: [ogImage],
      url: pageUrl,
    }),
  }
}
