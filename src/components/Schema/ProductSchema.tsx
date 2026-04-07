import { Product } from '@/payload-types'
import { config } from '@/config'
import { getServerSideURL } from '@/utilities/getURL'
import { textOnly } from '@/components/RichText/textOnly'
import React from 'react'

export const ProductSchema = ({ product }: { product: Product }) => {
  const url = `${getServerSideURL()}/products/${product.slug}`
  const image =
    typeof product.image === 'object' && product.image?.url
      ? `${getServerSideURL()}${product.image.url}`
      : undefined

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: textOnly(product.description),
    image: image,
    url: url,
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'VND',
      lowPrice: product.minPrice || 0,
      highPrice: product.maxPrice || product.minPrice || 0,
      offerCount: product.variants?.length || 1,
      availability: 'https://schema.org/InStock',
    },
    brand: {
      '@type': 'Brand',
      name: config.NEXT_PUBLIC_SITE_NAME,
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
