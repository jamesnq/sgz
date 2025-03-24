import type { Metadata } from 'next'

import type { Media, Product, Config } from '../payload-types'

import { mergeOpenGraph } from './mergeOpenGraph'
import { getServerSideURL } from './getURL'
import { env } from '@/config'
import { imageFallback } from './constants'

const getImageURL = (image?: Media | Config['db']['defaultIDType'] | null) => {
  const serverUrl = getServerSideURL()

  let url = serverUrl + '/logo.svg'

  if (image && typeof image === 'object' && 'url' in image) {
    const ogUrl = image.sizes?.og?.url || image.url

    url = ogUrl ? serverUrl + ogUrl : serverUrl + image.url
  }

  return url
}

export const defaultMetadata = (): Metadata => {
  const serverUrl = getServerSideURL()
  const defaultImage = serverUrl + imageFallback
  const title = env.NEXT_PUBLIC_SITE_NAME

  return {
    description: 'Cung cấp dịch vụ nạp game và ứng dụng giá rẻ',
    openGraph: mergeOpenGraph({
      description: 'Cung cấp dịch vụ nạp game và ứng dụng giá rẻ',
      images: [
        {
          url: defaultImage,
        },
      ],
      title,
      url: serverUrl + '/',
    }),
    title,
  }
}

export const generateMeta = async (args: { doc: Partial<Product> | null }): Promise<Metadata> => {
  const { doc } = args
  const ogImage = getImageURL(doc?.meta?.image || doc?.image)

  const title = doc?.meta?.title ? doc?.meta?.title : doc?.name + ' | ' + env.NEXT_PUBLIC_SITE_NAME
  const desc = doc?.meta?.description || ''
  return {
    description: desc,
    openGraph: mergeOpenGraph({
      description: desc,
      images: ogImage
        ? [
            {
              url: ogImage,
            },
          ]
        : undefined,
      title,
      url: Array.isArray(doc?.slug) ? doc?.slug.join('/') : '/',
    }),
    title,
  }
}
