declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PAYLOAD_SECRET: string
      DATABASE_URI: string
      NEXT_PUBLIC_SERVER_URL: string
      VERCEL_PROJECT_PRODUCTION_URL: string
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
      CHATWOOT_HMAC_TOKEN: string
      SKIP_ENV_VALIDATION: string | undefined
      NOVU_SECRET_KEY: string
      NEXT_PUBLIC_NOVU_APPLICATION_IDENTIFIER: string
      NEXT_PUBLIC_SITE_NAME: string
    }
  }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export {}
