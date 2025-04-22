import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
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
    MEILI_HOST: z.string(),
    MEILI_MASTER_KEY: z.string(),
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
    NEXT_PUBLIC_MEILI_SEARCH_KEY: z.string(),
  },
  /*
   * Due to how Next.js bundles environment variables on Edge and Client,
   * we need to manually destructure them to make sure all are included in bundle.
   *
   * 💡 You'll get type errors if not all variables from `server` & `client` are included here.
   */
  runtimeEnv: {
    ...process.env,
    NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN: process.env.NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN,
    NEXT_PUBLIC_CHATWOOT_BASE_URL: process.env.NEXT_PUBLIC_CHATWOOT_BASE_URL,
    NEXT_PUBLIC_SERVER_URL: process.env.NEXT_PUBLIC_SERVER_URL,
    NEXT_PUBLIC_SITE_NAME: process.env.NEXT_PUBLIC_SITE_NAME,
    NEXT_PUBLIC_NOVU_APPLICATION_IDENTIFIER: process.env.NEXT_PUBLIC_NOVU_APPLICATION_IDENTIFIER,
    NEXT_PUBLIC_EMAIL_CONTACT: process.env.NEXT_PUBLIC_EMAIL_CONTACT,
    AUTO_PROCESS_USER_ID: Number(process.env.AUTO_PROCESS_USER_ID),
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    NEXT_PUBLIC_MEILI_SEARCH_KEY: process.env.NEXT_PUBLIC_MEILI_SEARCH_KEY,
  } /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
})
