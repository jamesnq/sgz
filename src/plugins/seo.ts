import { seoPlugin } from '@payloadcms/plugin-seo'
import type {
  GenerateTitle,
  GenerateDescription,
  GenerateURL,
  GenerateImage,
} from '@payloadcms/plugin-seo/types'
import { config } from '@/config'
import { textOnly } from '@/components/RichText/textOnly'

const generateTitle: GenerateTitle = ({ doc, collectionSlug }) => {
  const baseTitle = doc?.name || doc?.title
  if (baseTitle) {
    let suffix = ''
    if (collectionSlug === 'products') {
      suffix = ' - Tài khoản Offline / Key Steam'
    }
    return `${baseTitle}${suffix} | ${config.NEXT_PUBLIC_SITE_NAME}`
  }
  return config.NEXT_PUBLIC_SITE_NAME
}

/**
 * Safely extract plain text from a Lexical RichText field.
 * Returns '' if data is null, undefined, or malformed.
 */
function safeTextOnly(data: unknown): string {
  if (!data || typeof data !== 'object') return ''
  try {
    return textOnly(data as any) || ''
  } catch {
    return ''
  }
}

const generateDescription: GenerateDescription = ({ doc, collectionSlug }) => {
  const siteName = config.NEXT_PUBLIC_SITE_NAME

  // --- Products: use richText `description` field + promo prefix ---
  if (collectionSlug === 'products') {
    const rawText = safeTextOnly(doc?.description)
    const prefix = `Mua ${doc?.name || ''} giá rẻ, uy tín, giao dịch tự động tại ${siteName}. `
    const combined = rawText ? `${prefix}${rawText}` : prefix.trim()
    return combined.length > 155 ? `${combined.substring(0, 152)}...` : combined
  }

  // --- Posts: use plain text `excerpt` first, fallback to richText `content` ---
  if (collectionSlug === 'posts') {
    const excerpt = typeof doc?.excerpt === 'string' ? doc.excerpt.trim() : ''
    if (excerpt) {
      return excerpt.length > 155 ? `${excerpt.substring(0, 152)}...` : excerpt
    }
    // Fallback: extract from richText content
    const rawContent = safeTextOnly(doc?.content)
    if (rawContent) {
      return rawContent.length > 155 ? `${rawContent.substring(0, 152)}...` : rawContent
    }
  }

  // --- Categories / CategoryGroups: use description text if available ---
  if (doc?.description) {
    const rawText = safeTextOnly(doc.description)
    if (rawText) {
      return rawText.length > 155 ? `${rawText.substring(0, 152)}...` : rawText
    }
  }

  return ''
}

const generateURL: GenerateURL = ({ doc, collectionSlug }) => {
  const base = process.env.NEXT_PUBLIC_SERVER_URL || 'https://subgamezone.com'
  if (collectionSlug === 'products') return `${base}/products/${doc?.slug || ''}`
  if (collectionSlug === 'categories') return `${base}/categories/${doc?.slug || ''}`
  if (collectionSlug === 'posts') return `${base}/posts/${doc?.slug || ''}`
  return base
}

/**
 * Auto-populate Meta Image from the document's main image field.
 * Products use `image`, Posts use `image`, Categories use `image`.
 * Returns the media ID (number) so Payload can resolve the relationship.
 */
const generateImage: GenerateImage = ({ doc }) => {
  const img = doc?.image
  if (!img) return undefined as any

  // If `image` is already a resolved object with an id, return the id
  if (typeof img === 'object' && img !== null && 'id' in img) {
    return img.id
  }

  // If `image` is already a number (relationship ID), return it directly
  if (typeof img === 'number') {
    return img
  }

  return undefined as any
}

export const seo = seoPlugin({
  collections: ['products', 'categories', 'category-groups', 'posts', 'product-variants'],
  uploadsCollection: 'media',
  generateTitle,
  generateDescription,
  generateURL,
  generateImage,
})
