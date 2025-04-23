import { config } from '@/config'
import { defaultLogo, SITE_DESCRIPTION } from '@/utilities/constants'
import type { Metadata } from 'next'
import { getServerSideURL } from './getURL'

const defaultOpenGraph: Metadata['openGraph'] = {
  type: 'website',
  description: `${config.NEXT_PUBLIC_SITE_NAME} - ${SITE_DESCRIPTION}`,
  images: [
    {
      url: `${getServerSideURL()}${defaultLogo}`,
      secureUrl: `${getServerSideURL()}${defaultLogo}`,
    },
  ],
  siteName: config.NEXT_PUBLIC_SITE_NAME,
  title: config.NEXT_PUBLIC_SITE_NAME,
}

export const mergeOpenGraph = (og?: Metadata['openGraph']): Metadata['openGraph'] => {
  return {
    ...defaultOpenGraph,
    ...og,
    images: og?.images ? og.images : defaultOpenGraph.images,
  }
}
