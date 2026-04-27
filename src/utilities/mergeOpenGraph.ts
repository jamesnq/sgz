import { config } from '@/config'
import { ogDefaultImage, SITE_DESCRIPTION } from '@/utilities/constants'
import type { Metadata } from 'next'
import { getServerSideURL } from './getURL'

const getAbsoluteURL = (url: string) =>
  url.startsWith('http') ? url : `${getServerSideURL()}${url}`

const defaultImage = {
  url: getAbsoluteURL(ogDefaultImage),
  secureUrl: getAbsoluteURL(ogDefaultImage),
  width: 1200,
  height: 630,
  alt: config.NEXT_PUBLIC_SITE_NAME,
  type: 'image/png',
}

const defaultOpenGraph: Metadata['openGraph'] = {
  type: 'website',
  description: `${config.NEXT_PUBLIC_SITE_NAME} - ${SITE_DESCRIPTION}`,
  images: [defaultImage],
  locale: 'vi_VN',
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
