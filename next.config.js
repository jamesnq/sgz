import { withPayload } from '@payloadcms/next/withPayload'

import redirects from './redirects.js'

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  reactStrictMode: true,
  redirects,
  output: 'standalone',
  logging: {
    fetches: {
      fullUrl: true,
      hmrRefreshes: true,
    },
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
