import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const config = createEnv({
  /*
   * Serverside Environment variables, not available on the client.
   * Will throw if you access these variables on the client.
   */
  server: {
    PAYLOAD_SECRET: z.string(),
    DATABASE_URI: z.string(),
    AUTO_PROCESS_USER_ID: z.number().positive(),
    S3_ACCESS_KEY_ID: z.string(),
    S3_SECRET_ACCESS_KEY: z.string(),
    S3_BUCKET: z.string(),
    S3_REGION: z.string(),
    RESEND_API_KEY: z.string(),
    PAYOS_CLIENT_KEY: z.string(),
    PAYOS_API_KEY: z.string(),
    PAYOS_CHECKSUM_KEY: z.string(),
    PAYOS_WEBHOOK_URL: z.string().url(),
    PAYOS_CANCEL_URL: z.string().url(),
    PAYOS_RETURN_URL: z.string().url(),
    DOITHE_PARTNER_ID: z.string(),
    DOITHE_PARTNER_KEY: z.string(),
    NOVU_SECRET_KEY: z.string(),
    CHATWOOT_HMAC_TOKEN: z.string(),
    DISCORD_ADMIN_WEBHOOK_URL: z.string().url(),
    DISCORD_STAFF_WEBHOOK_URL: z.string().url(),
    DISCORD_ACTIVITIES_WEBHOOK_URL: z.string().url(),
    DISCORD_ADMIN_ROLE_ID: z.string(),
    DISCORD_STAFF_ROLE_ID: z.string(),
    MEILI_MASTER_KEY: z.string(),
    GOOGLE_PROVIDER_CLIENT_ID: z.string(),
    GOOGLE_PROVIDER_CLIENT_SECRET: z.string(),
    // DISCORD_PROVIDER_CLIENT_ID: z.string(),
    // DISCORD_PROVIDER_CLIENT_SECRET: z.string(),
    // FACEBOOK_PROVIDER_CLIENT_ID: z.string(),
    // FACEBOOK_PROVIDER_CLIENT_SECRET: z.string(),
    RYUU_AUTH_CODE: z.string(),
  },
  /*
   * Environment variables available on the client (and server).
   *
   * 💡 You'll get type errors if these are not prefixed with NEXT_PUBLIC_.
   */
  client: {
    NEXT_PUBLIC_SERVER_URL: z.string(),
    NEXT_PUBLIC_SITE_NAME: z.string(),
    NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN: z.string(),
    NEXT_PUBLIC_CHATWOOT_BASE_URL: z.string(),
    NEXT_PUBLIC_NOVU_APPLICATION_IDENTIFIER: z.string(),
    NEXT_PUBLIC_EMAIL_CONTACT: z.string(),
    NEXT_PUBLIC_POSTHOG_KEY: z.string(),
    NEXT_PUBLIC_POSTHOG_HOST: z.string(),
    NEXT_PUBLIC_MEILI_HOST: z.string(),
    NEXT_PUBLIC_MEILI_SEARCH_KEY: z.string(),
  },
  /*
   * Due to how Next.js bundles environment variables on Edge and Client,
   * we need to manually destructure them to make sure all are included in bundle.
   *
   * 💡 You'll get type errors if not all variables from `server` & `client` are included here.
   */
  runtimeEnv: {
    PAYLOAD_SECRET: process.env.PAYLOAD_SECRET,
    DATABASE_URI: process.env.DATABASE_URI,
    AUTO_PROCESS_USER_ID: Number(process.env.AUTO_PROCESS_USER_ID),
    S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID,
    S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY,
    S3_BUCKET: process.env.S3_BUCKET,
    S3_REGION: process.env.S3_REGION,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    PAYOS_CLIENT_KEY: process.env.PAYOS_CLIENT_KEY,
    PAYOS_API_KEY: process.env.PAYOS_API_KEY,
    PAYOS_CHECKSUM_KEY: process.env.PAYOS_CHECKSUM_KEY,
    PAYOS_WEBHOOK_URL: process.env.PAYOS_WEBHOOK_URL,
    PAYOS_CANCEL_URL: process.env.PAYOS_CANCEL_URL,
    PAYOS_RETURN_URL: process.env.PAYOS_RETURN_URL,
    DOITHE_PARTNER_ID: process.env.DOITHE_PARTNER_ID,
    DOITHE_PARTNER_KEY: process.env.DOITHE_PARTNER_KEY,
    NOVU_SECRET_KEY: process.env.NOVU_SECRET_KEY,
    CHATWOOT_HMAC_TOKEN: process.env.CHATWOOT_HMAC_TOKEN,
    DISCORD_ADMIN_WEBHOOK_URL: process.env.DISCORD_ADMIN_WEBHOOK_URL,
    DISCORD_STAFF_WEBHOOK_URL: process.env.DISCORD_STAFF_WEBHOOK_URL,
    DISCORD_ACTIVITIES_WEBHOOK_URL: process.env.DISCORD_ACTIVITIES_WEBHOOK_URL,
    DISCORD_ADMIN_ROLE_ID: process.env.DISCORD_ADMIN_ROLE_ID,
    DISCORD_STAFF_ROLE_ID: process.env.DISCORD_STAFF_ROLE_ID,
    MEILI_MASTER_KEY: process.env.MEILI_MASTER_KEY,
    GOOGLE_PROVIDER_CLIENT_ID: process.env.GOOGLE_PROVIDER_CLIENT_ID,
    GOOGLE_PROVIDER_CLIENT_SECRET: process.env.GOOGLE_PROVIDER_CLIENT_SECRET,
    RYUU_AUTH_CODE: process.env.RYUU_AUTH_CODE,
    
    NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN: process.env.NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN,
    NEXT_PUBLIC_CHATWOOT_BASE_URL: process.env.NEXT_PUBLIC_CHATWOOT_BASE_URL,
    NEXT_PUBLIC_SERVER_URL: process.env.NEXT_PUBLIC_SERVER_URL,
    NEXT_PUBLIC_SITE_NAME: process.env.NEXT_PUBLIC_SITE_NAME,
    NEXT_PUBLIC_NOVU_APPLICATION_IDENTIFIER: process.env.NEXT_PUBLIC_NOVU_APPLICATION_IDENTIFIER,
    NEXT_PUBLIC_EMAIL_CONTACT: process.env.NEXT_PUBLIC_EMAIL_CONTACT,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    NEXT_PUBLIC_MEILI_HOST: process.env.NEXT_PUBLIC_MEILI_HOST,
    NEXT_PUBLIC_MEILI_SEARCH_KEY: process.env.NEXT_PUBLIC_MEILI_SEARCH_KEY,
  } /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
})
