import configPromise from '@payload-config'
import { getPayload } from 'payload'
import type { Product } from '@/payload-types'

interface SitemapEntry {
  url: string
  lastModified: string
  changeFrequency: string
  priority: number
  images: Array<{ url: string; title: string; caption: string }>
}

export async function GET(): Promise<Response> {
  const payload = await getPayload({ config: configPromise })
  const siteUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

  // Fetch all published products with their media
  const productsResponse = await payload.find({
    collection: 'products',
    where: {
      status: {
        not_equals: 'PRIVATE',
      },
    },
    depth: 1, // To get media relations
    limit: 1000,
  })

  const products = productsResponse.docs || []

  // Create sitemap entries for products with image data
  const productEntries = products.map((product: Product) => {
    const entry: SitemapEntry = {
      url: `${siteUrl}/products/${product.slug}`,
      lastModified: new Date(product.updatedAt || product.createdAt).toISOString(),
      changeFrequency: 'daily',
      priority: 0.8,
      images: [],
    }

    // Add image - prioritize meta image over product image
    const hasMetaImage =
      product.meta?.image &&
      typeof product.meta.image === 'object' &&
      'url' in product.meta.image &&
      product.meta.image.url

    const hasProductImage =
      product.image &&
      typeof product.image === 'object' &&
      'url' in product.image &&
      product.image.url

    if (hasMetaImage || hasProductImage) {
      let imageUrl = ''

      if (
        hasMetaImage &&
        product.meta?.image &&
        typeof product.meta.image === 'object' &&
        'url' in product.meta.image
      ) {
        imageUrl = product.meta.image.url as string
      } else if (
        hasProductImage &&
        product.image &&
        typeof product.image === 'object' &&
        'url' in product.image
      ) {
        imageUrl = product.image.url as string
      }

      const title = product.meta?.title || product.name || 'Product Image'
      const caption = product.meta?.description || ''

      entry.images.push({
        url: imageUrl,
        title,
        caption,
      })
    }

    return entry
  })

  // Fetch categories
  const categoriesResponse = await payload.find({
    collection: 'categories',
    depth: 0,
    limit: 500,
  })

  const categories = categoriesResponse.docs || []

  // Create sitemap entries for categories
  const categoryEntries = categories.map((category: any) => {
    return {
      url: `${siteUrl}/categories/${category.slug || ''}`,
      lastModified: new Date(category.updatedAt || category.createdAt).toISOString(),
      changeFrequency: 'weekly',
      priority: 0.7,
      images: [],
    } as SitemapEntry
  })

  // Add static pages with appropriate priorities
  const staticPages: SitemapEntry[] = [
    {
      url: `${siteUrl}`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'daily',
      priority: 1.0,
      images: [],
    },
    {
      url: `${siteUrl}/about`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'monthly',
      priority: 0.6,
      images: [],
    },
    {
      url: `${siteUrl}/contact`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'monthly',
      priority: 0.5,
      images: [],
    },
    {
      url: `${siteUrl}/terms`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'yearly',
      priority: 0.4,
      images: [],
    },
    {
      url: `${siteUrl}/privacy`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'yearly',
      priority: 0.4,
      images: [],
    },
  ]

  // Combine all entries
  const entries = [...staticPages, ...productEntries, ...categoryEntries]

  // Generate the XML with image support
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
  ${entries
    .map((entry) => {
      return `<url>
    <loc>${entry.url}</loc>
    <lastmod>${entry.lastModified}</lastmod>
    <changefreq>${entry.changeFrequency}</changefreq>
    <priority>${entry.priority}</priority>
    ${entry.images
      .map(
        (image) => `<image:image>
      <image:loc>${image.url}</image:loc>
      ${image.title ? `<image:title><![CDATA[${image.title}]]></image:title>` : ''}
      ${image.caption ? `<image:caption><![CDATA[${image.caption}]]></image:caption>` : ''}
    </image:image>`,
      )
      .join('')}
  </url>`
    })
    .join('')}
</urlset>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
