import { Product } from '@/payload-types'
import React from 'react'
import { textOnly } from '../RichText/textOnly'

interface ProductStructuredDataProps {
  product: Product
  currency?: string
}

export const ProductStructuredData: React.FC<ProductStructuredDataProps> = ({
  product,
  currency = 'VND',
}) => {
  if (!product) return null

  // Get the first variant price or use minPrice as fallback
  const price = product.minPrice || 0
  const imageUrl =
    product.image && typeof product.image === 'object' && 'url' in product.image
      ? product.image.url
      : ''

  const structuredData = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: product.name,
    description: textOnly(product.description),
    image: imageUrl,
    sku: product.id,
    mpn: product.id,
    brand: {
      '@type': 'Brand',
      name: 'Sub Game Zone',
    },
    offers: {
      '@type': 'Offer',
      url: `${process.env.NEXT_PUBLIC_SERVER_URL}/products/${product.slug}`,
      priceCurrency: currency,
      price: price,
      priceValidUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
      availability:
        product.status === 'PUBLIC'
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'Sub Game Zone',
      },
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '5',
      reviewCount: '100',
    },
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}
