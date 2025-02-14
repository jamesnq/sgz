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
  return doc?.name ? `${doc.name} | Sub Game Zone` : 'Sub Game Zone'
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
  // redirectsPlugin({
  //   collections: ['products'],
  //   overrides: {
  //     // @ts-expect-error - This is a valid override, mapped fields don't resolve to the same type
  //     fields: ({ defaultFields }) => {
  //       return defaultFields.map((field) => {
  //         if ('name' in field && field.name === 'from') {
  //           return {
  //             ...field,
  //             admin: {
  //               description: 'You will need to rebuild the website when changing this field.',
  //             },
  //           }
  //         }
  //         return field
  //       })
  //     },
  //     hooks: {
  //       afterChange: [revalidateRedirects],
  //     },
  //   },
  // }),
  // nestedDocsPlugin({
  //   collections: ['categories'],
  //   generateURL: (docs) => docs.reduce((url, doc) => `${url}/${doc.slug}`, ''),
  // }),
  seoPlugin({
    generateTitle,
    generateURL,
  }),
  // formBuilderPlugin({
  //   fields: {
  //     payment: false,
  //     text: {
  //       //@ts-expect-error - ts mismatch
  //       fields: [...fields['text']?.fields, { name: 'secret', type: 'checkbox', label: 'Secret' }],
  //     },
  //   },
  //   formSubmissionOverrides: {},
  //   formOverrides: {
  //     fields: ({ defaultFields }) => {
  //       return defaultFields.map((field) => {
  //         if ('name' in field && field.name === 'confirmationMessage') {
  //           return {
  //             ...field,
  //             editor: lexicalEditor({
  //               features: ({ rootFeatures }) => {
  //                 return [
  //                   ...rootFeatures,
  //                   FixedToolbarFeature(),
  //                   HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
  //                 ]
  //               },
  //             }),
  //           }
  //         }
  //         return field
  //       })
  //     },
  //   },
  // }),
  // searchPlugin({
  //   collections: ['posts', 'products'],
  //   beforeSync: beforeSyncWithSearch,
  //   searchOverrides: {
  //     fields: ({ defaultFields }) => {
  //       return [...defaultFields, ...searchFields]
  //     },
  //   },
  // }),
  payloadCloudPlugin(),
]
