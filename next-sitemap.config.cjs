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
  exclude: ['/admin*', '/auth*', '/api*', '/server-sitemap.xml', '/404', '/500', '/dev/test*'],
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
        ],
      },
    ],
    additionalSitemaps: [`${SITE_URL}/server-sitemap.xml`],
  },
  transform: async (config, path) => {
    // Custom transform function to exclude dynamic paths or customize priority
    // Exclude any paths that should not be in the sitemap
    if (path.includes('/_') || path.includes('/api/') || path.startsWith('/dev/test')) {
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

    // Default transformation
    return {
      loc: path,
      changefreq: config.changefreq,
      priority: config.priority,
      lastmod: new Date().toISOString(),
    }
  },
}
