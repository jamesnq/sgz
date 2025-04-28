import { Accounts } from '@/collections/Accounts'
import { config } from '@/config'
import { fieldsSelect } from '@payload-enchants/fields-select'
import { payloadCloudPlugin } from '@payloadcms/payload-cloud'
import { s3Storage } from '@payloadcms/storage-s3'
import { Plugin } from 'payload'
import { adminAuthPlugin } from 'payload-auth-plugin'
import { GoogleAuthProvider } from 'payload-auth-plugin/providers'
import { env } from 'process'

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
  payloadCloudPlugin(),
  adminAuthPlugin({
    enabled: true,
    providers: [
      GoogleAuthProvider({
        client_id: config.GOOGLE_PROVIDER_CLIENT_ID as string,
        client_secret: config.GOOGLE_PROVIDER_CLIENT_SECRET as string,
      }),
    ],
    allowSignUp: true,
    accountsCollectionSlug: Accounts.slug,
  }),
]
