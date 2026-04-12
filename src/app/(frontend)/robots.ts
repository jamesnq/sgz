import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://subgamezone.com'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/admin/*',
          '/auth',
          '/auth/*',
          '/api',
          '/api/*',
          '/dev/test',
          '/dev/test/*',
          '/cart',
          '/checkout',
          '/account/orders',
          '/account/settings',
          '/user/*',
          '/workspace',
          '/next/*',
        ],
      },
      {
        userAgent: 'Googlebot-Image',
        allow: '/',
      },
    ],
    sitemap: [
      `${siteUrl}/server-sitemap.xml`,
    ],
    host: siteUrl,
  }
}
