import { Product } from '@/payload-types'
import { config } from '@/config'
import React from 'react'
import { textOnly } from '../RichText/textOnly'

interface ProductStructuredDataProps {
  product: Product
  currency?: string
}

function safeTextOnly(data: unknown): string {
  if (!data || typeof data !== 'object') return ''
  try {
    return textOnly(data as any) || ''
  } catch {
    return ''
  }
}

export const ProductStructuredData: React.FC<ProductStructuredDataProps> = ({
  product,
  currency = 'VND',
}) => {
  if (!product) return null

  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://subgamezone.com'
  const siteName = config.NEXT_PUBLIC_SITE_NAME

  // Get the first variant price or use minPrice as fallback
  const price = product.minPrice || 0
  let imageUrl =
    product.image && typeof product.image === 'object' && 'url' in product.image && product.image.url
      ? product.image.url
      : ''

  if (imageUrl && !imageUrl.startsWith('http')) {
    imageUrl = `${serverUrl}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`
  }

  const validVariants = product.variants?.filter((v: any) => v.status === 'AVAILABLE' || v.status === 'ORDER') || []
  const hasInStockVariants = validVariants.length > 0
  
  let offersStr = {}
  if (product.variants && product.variants.length > 0) {
    const prices = product.variants.filter((v: any) => v.status !== 'PRIVATE').map((v: any) => v.price).filter((p: any) => typeof p === 'number')
    const minCalculated = prices.length > 0 ? Math.min(...prices) : product.minPrice || 0
    const maxCalculated = prices.length > 0 ? Math.max(...prices) : product.maxPrice || 0
    
    offersStr = {
      '@type': 'AggregateOffer',
      url: `${serverUrl}/products/${product.slug}`,
      priceCurrency: currency,
      lowPrice: minCalculated,
      highPrice: maxCalculated,
      offerCount: product.variants.length,
      availability: (product.status === 'PUBLIC' && hasInStockVariants)
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: siteName,
      },
    }
  } else {
    offersStr = {
      '@type': 'Offer',
      url: `${serverUrl}/products/${product.slug}`,
      priceCurrency: currency,
      price: price,
      priceValidUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
        .toISOString()
        .split('T')[0],
      availability:
        product.status === 'PUBLIC'
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      condition: 'https://schema.org/NewCondition',
      seller: {
        '@type': 'Organization',
        name: siteName,
      },
    }
  }

  const description = safeTextOnly(product.description)

  const structuredData = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: product.name,
    description: description || `${product.name} - Mua giá rẻ, uy tín tại ${siteName}`,
    image: imageUrl || undefined,
    sku: String(product.id),
    mpn: String(product.id),
    brand: {
      '@type': 'Brand',
      name: siteName,
    },
    offers: offersStr,
    // aggregateRating removed
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }}
    />
  )
}
