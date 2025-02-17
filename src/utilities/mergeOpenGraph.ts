import type { Metadata } from 'next'
import { getServerSideURL } from './getURL'
import { env } from '@/config'

const defaultOpenGraph: Metadata['openGraph'] = {
  type: 'website',
  description: `${env.NEXT_PUBLIC_SITE_NAME} - Cung cấp dịch vụ nạp game và ứng dụng giá rẻ`,
  images: [
    {
      url: `${getServerSideURL()}/logo.svg`,
    },
  ],
  siteName: env.NEXT_PUBLIC_SITE_NAME,
  title: env.NEXT_PUBLIC_SITE_NAME,
}

export const mergeOpenGraph = (og?: Metadata['openGraph']): Metadata['openGraph'] => {
  return {
    ...defaultOpenGraph,
    ...og,
    images: og?.images ? og.images : defaultOpenGraph.images,
  }
}
