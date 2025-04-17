import configPromise from '@payload-config'
import { getPayload } from 'payload'
export const revalidate = 3600
export async function GET(): Promise<Response> {
  const payload = await getPayload({ config: configPromise })

  // Fetch all published products
  const productsResponse = await payload.find({
    collection: 'products',
    where: {
      status: {
        not_equals: 'PRIVATE',
      },
    },
    limit: 1000,
    select: {
      slug: true,
      updatedAt: true,
    },
  })

  const products = productsResponse.docs || []

  // Create sitemap entries for products
  const productEntries = products.map((product) => ({
    url: `${process.env.NEXT_PUBLIC_SERVER_URL}/products/${product.slug}`,
    lastModified: new Date(product.updatedAt).toISOString(),
    changeFrequency: 'daily',
    priority: 0.8,
  }))

  // You can add more dynamic collections here (categories, blog posts, etc.)

  // Combine all entries
  const entries = [
    {
      url: `${process.env.NEXT_PUBLIC_SERVER_URL}`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    ...productEntries,
  ]

  // Generate the XML
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
  ${entries
    .map((entry) => {
      return `<url>
    <loc>${entry.url}</loc>
    <lastmod>${entry.lastModified}</lastmod>
    <changefreq>${entry.changeFrequency}</changefreq>
    <priority>${entry.priority}</priority>
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
