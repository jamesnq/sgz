import { config } from '@/config'
import { imageFallback, SITE_DESCRIPTION } from '@/utilities/constants'
import type { Metadata } from 'next'
import { getServerSideURL } from './getURL'

const defaultOpenGraph: Metadata['openGraph'] = {
  type: 'website',
  description: `${config.NEXT_PUBLIC_SITE_NAME} - ${SITE_DESCRIPTION}`,
  images: [
    {
      url: imageFallback.startsWith('http') ? imageFallback : `${getServerSideURL()}${imageFallback}`,
    },
  ],
  siteName: config.NEXT_PUBLIC_SITE_NAME,
  title: config.NEXT_PUBLIC_SITE_NAME,
}

export const mergeOpenGraph = (og?: Metadata['openGraph']): Metadata => {
  return {
    openGraph: {
      ...defaultOpenGraph,
      ...og,
      images: og?.images ? og.images : defaultOpenGraph.images,
    },
    twitter: {
      card: 'summary_large_image',
      title: og?.title || defaultOpenGraph.title,
      description: og?.description || defaultOpenGraph.description || '',
      images: og?.images ? og.images : defaultOpenGraph.images,
    },
  }
}
