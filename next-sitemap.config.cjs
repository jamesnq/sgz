const SITE_URL =
  process.env.NEXT_PUBLIC_SERVER_URL ||
  process.env.VERCEL_PROJECT_PRODUCTION_URL ||
  'http://localhost:3000'

/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: SITE_URL,
  generateRobotsTxt: true,
  changefreq: 'daily',
  priority: 0.7,
  sitemapSize: 5000,
  autoLastmod: true,
  generateIndexSitemap: true,
  exclude: [
    '/admin*', 
    '/auth*', 
    '/api*', 
    '/server-sitemap.xml', 
    '/404', 
    '/500', 
    '/dev/test*',
    '/cart*',
    '/checkout*',
    '/success*',
    '/cancel*',
    '/account/orders*',
    '/account/settings*',
  ],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
      },
      {
        userAgent: '*',
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
          '/*?*', // Prevent duplicate content with query parameters
        ],
      },
      {
        userAgent: 'Googlebot-Image',
        allow: '/',
      },
    ],
    additionalSitemaps: [`${SITE_URL}/server-sitemap.xml`],
  },
  transform: async (config, path) => {
    // Custom transform function to exclude dynamic paths or customize priority
    // Exclude any paths that should not be in the sitemap
    if (
      path.includes('/_') || 
      path.includes('/api/') || 
      path.startsWith('/dev/test') ||
      path.includes('/cart') ||
      path.includes('/checkout') ||
      path.includes('/success') ||
      path.includes('/cancel') ||
      path.includes('/account/orders') ||
      path.includes('/account/settings')
    ) {
      return null
    }

    // Set higher priority for important pages
    if (path === '/') {
      return {
        loc: path,
        changefreq: 'daily',
        priority: 1.0,
        lastmod: new Date().toISOString(),
      }
    }

    // Set higher priority for product pages
    if (path.startsWith('/products/')) {
      return {
        loc: path,
        changefreq: 'daily',
        priority: 0.8,
        lastmod: new Date().toISOString(),
      }
    }

    // Set priority for category pages
    if (path.startsWith('/categories/')) {
      return {
        loc: path,
        changefreq: 'weekly',
        priority: 0.7,
        lastmod: new Date().toISOString(),
      }
    }

    // Default transformation
    return {
      loc: path,
      changefreq: config.changefreq,
      priority: config.priority,
      lastmod: new Date().toISOString(),
    }
  },
}
