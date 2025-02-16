import { Product } from '@/payload-types'
import { getServerSideURL } from '@/utilities/getURL'
import { fieldsSelect } from '@payload-enchants/fields-select'
import { payloadCloudPlugin } from '@payloadcms/payload-cloud'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { GenerateTitle, GenerateURL } from '@payloadcms/plugin-seo/types'
import { s3Storage } from '@payloadcms/storage-s3'
import { Plugin } from 'payload'
import { env } from 'process'
const generateTitle: GenerateTitle<Product> = ({ doc }) => {
  return doc?.name ? `${doc.name} | ${env.NEXT_PUBLIC_SITE_NAME}` : env.NEXT_PUBLIC_SITE_NAME
}

const generateURL: GenerateURL<Product> = ({ doc }) => {
  const url = getServerSideURL()

  return doc?.slug ? `${url}/${doc.slug}` : url
}

export const plugins: Plugin[] = [
  fieldsSelect(),
  s3Storage({
    collections: {
      media: { prefix: 'media' },
    },
    bucket: env.S3_BUCKET,
    config: {
      endpoint: env.S3_ENDPOINT,
      forcePathStyle: true,
      credentials: {
        accessKeyId: env.S3_ACCESS_KEY_ID,
        secretAccessKey: env.S3_SECRET_ACCESS_KEY,
      },
      region: env.S3_REGION,
    },
  }),
  seoPlugin({
    generateTitle,
    generateURL,
  }),
  payloadCloudPlugin(),
]
