declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PAYLOAD_SECRET: string
      DATABASE_URI: string
      NEXT_PUBLIC_SERVER_URL: string
      VERCEL_PROJECT_PRODUCTION_URL: string
      AUTO_PROCESS_USER_ID: number
      S3_ACCESS_KEY_ID: string
      S3_SECRET_ACCESS_KEY: string
      S3_BUCKET: string
      S3_REGION: string
      RESEND_API_KEY: string
      NEXT_PUBLIC_VERCEL_URL: string
      NEXT_PUBLIC_VERCEL_URL: string
      RESEND_API_KEY: string
      PAYOS_CLIENT_KEY: string
      PAYOS_API_KEY: string
      PAYOS_CHECKSUM_KEY: string
      PAYOS_WEBHOOK_URL: string
      PAYOS_CANCEL_URL: string
      PAYOS_RETURN_URL: string
      DOITHE_PARTNER_ID: string
      DOITHE_PARTNER_KEY: string
      NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN: string
      NEXT_PUBLIC_CHATWOOT_BASE_URL: string
      NEXT_PUBLIC_POSTHOG_KEY: string
      NEXT_PUBLIC_POSTHOG_HOST: string
      CHATWOOT_HMAC_TOKEN: string
      DISCORD_ADMIN_WEBHOOK_URL: string
      DISCORD_STAFF_WEBHOOK_URL: string
      DISCORD_ACTIVITIES_WEBHOOK_URL: string
      DISCORD_ADMIN_ROLE_ID: string
      DISCORD_STAFF_ROLE_ID: string
      SKIP_ENV_VALIDATION: string | undefined
      NOVU_SECRET_KEY: string
      NEXT_PUBLIC_NOVU_APPLICATION_IDENTIFIER: string
      NEXT_PUBLIC_SITE_NAME: string
      NEXT_PUBLIC_EMAIL_CONTACT: string
      NEXT_PUBLIC_MEILI_HOST: string
      MEILI_MASTER_KEY: string
      NEXT_PUBLIC_MEILI_SEARCH_KEY: string
      GOOGLE_PROVIDER_CLIENT_ID: string
      GOOGLE_PROVIDER_CLIENT_SECRET: string
    }
  }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export {}
