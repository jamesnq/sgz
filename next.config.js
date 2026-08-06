import { withPayload } from '@payloadcms/next/withPayload'
import bundleAnalyzer from '@next/bundle-analyzer'

import redirects from './redirects.js'

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

const isDevelopment = process.env.NODE_ENV === 'development'
const imageRemotePatterns = [
  'https://subgamezone.com',
  'https://dev.subgamezone.com',
  process.env.NEXT_PUBLIC_SERVER_URL,
  process.env.S3_ENDPOINT,
]
  .filter(Boolean)
  .flatMap((value) => {
    try {
      const url = new URL(value)
      return [
        {
          protocol: url.protocol.replace(':', ''),
          hostname: url.hostname,
          port: url.port,
          pathname: '/**',
        },
      ]
    } catch {
      return []
    }
  })
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ''} https:`,
  "style-src 'self' 'unsafe-inline' https:",
  `img-src 'self' blob: data: https:${isDevelopment ? ' http:' : ''}`,
  "font-src 'self' data: https:",
  "media-src 'self' blob: https:",
  "connect-src 'self' https: wss:",
  "frame-src 'self' https:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "worker-src 'self' blob:",
  'upgrade-insecure-requests',
].join('; ')

const securityHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@sgz/ui'],
  webpack: (config, { webpack }) => {
    // https://github.com/vercel/next.js/discussions/50177
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^pg-native$|^cloudflare:sockets$/,
      }),
    )

    return config
  },
  images: {
    qualities: [25, 50, 75, 100],
    remotePatterns: imageRemotePatterns,
  },
  reactStrictMode: true,
  redirects,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
      {
        source: '/api/:path*',
        headers: [{ key: 'Cache-Control', value: 'private, no-store, max-age=0' }],
      },
    ]
  },
  output: 'standalone',
  logging: {
    fetches: {
      fullUrl: true,
      hmrRefreshes: true,
    },
  },
}

export default withPayload(withBundleAnalyzer(nextConfig), { devBundleServerPackages: false })
