import type { Product } from '@/payload-types'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { unstable_cache } from 'next/cache'

export const dynamic = 'force-dynamic'

interface SitemapEntry {
  url: string
  lastModified: string
  changeFrequency: string
  priority: number
  images: Array<{ url: string; title: string; caption: string }>
}

const getSitemapEntries = unstable_cache(
  async (siteUrl: string) => {
    const payload = await getPayload({ config: configPromise })

    // Fetch all published products with their media
    const productsResponse = await payload.find({
      collection: 'products',
      where: {
        status: {
          not_equals: 'PRIVATE',
        },
      },
      depth: 1,
      limit: 1000,
      overrideAccess: true,
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

    const hasProductImage =
      product.image &&
      typeof product.image === 'object' &&
      'url' in product.image &&
      product.image.url

    if (hasProductImage) {
      let imageUrl = (product.image as any).url as string || ''

      if (imageUrl && !imageUrl.startsWith('http')) {
        imageUrl = `${siteUrl}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`
      }

      const title = product.name || 'Product Image'
      const caption = ''

      entry.images.push({
        url: imageUrl,
        title,
        caption,
      })
    }

    return entry
  })

  // Fetch posts
  const postsResponse = await payload.find({
    collection: 'posts',
    where: { _status: { equals: 'published' } },
    depth: 1,
    limit: 500,
    overrideAccess: true,
  })

  const postEntries = (postsResponse.docs || []).map((post: any) => {
    const entry: SitemapEntry = {
      url: `${siteUrl}/posts/${post.slug}`,
      lastModified: new Date(post.updatedAt || post.createdAt).toISOString(),
      changeFrequency: 'weekly',
      priority: 0.7,
      images: [],
    }

    if (post.image && typeof post.image === 'object' && post.image.url) {
      let imageUrl = post.image.url
      if (imageUrl && !imageUrl.startsWith('http')) {
        imageUrl = `${siteUrl}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`
      }
      entry.images.push({
        url: imageUrl,
        title: post.title || 'Post Image',
        caption: '',
      })
    }
    return entry
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
      url: `${siteUrl}/info/about`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'monthly',
      priority: 0.6,
      images: [],
    },
    {
      url: `${siteUrl}/info/contact`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'monthly',
      priority: 0.5,
      images: [],
    },
    {
      url: `${siteUrl}/info/terms`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'yearly',
      priority: 0.4,
      images: [],
    },
    {
      url: `${siteUrl}/info/privacy`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'yearly',
      priority: 0.4,
      images: [],
    },
  ]

  // Combine all entries
  const entries = [...staticPages, ...productEntries, ...postEntries]

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

    return xml
  },
  ['server-sitemap-xml'],
  { revalidate: 3600, tags: ['products', 'posts-list'] },
)

export async function GET(): Promise<Response> {
  const siteUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
  const xml = await getSitemapEntries(siteUrl)

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
