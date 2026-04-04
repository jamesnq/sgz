import { Accounts } from '@/collections/Accounts'
import { Users } from '@/collections/Users'
import { config } from '@/config'
import { fieldsSelect } from '@payload-enchants/fields-select'
import { payloadCloudPlugin } from '@payloadcms/payload-cloud'
import { s3Storage } from '@payloadcms/storage-s3'
import { Plugin } from 'payload'
import { authPlugin } from 'payload-auth-plugin'
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
  authPlugin({
    name: 'sgz-admin-auth',
    enabled: true,
    useAdmin: true,
    usersCollectionSlug: Users.slug,
    accountsCollectionSlug: Accounts.slug,
    allowOAuthAutoSignUp: true,
    successRedirectPath: '/admin',
    errorRedirectPath: '/admin/login',
    providers: [
      GoogleAuthProvider({
        client_id: config.GOOGLE_PROVIDER_CLIENT_ID as string,
        client_secret: config.GOOGLE_PROVIDER_CLIENT_SECRET as string,
      }),
      // DiscordAuthProvider({
      //   client_id: config.DISCORD_PROVIDER_CLIENT_ID as string,
      //   client_secret: config.DISCORD_PROVIDER_CLIENT_SECRET as string,
      // }),
      // FacebookAuthProvider({
      //   client_id: config.FACEBOOK_PROVIDER_CLIENT_ID as string,
      //   client_secret: config.FACEBOOK_PROVIDER_CLIENT_SECRET as string,
      // }),
    ],
  }),
]
