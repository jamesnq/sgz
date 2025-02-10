import { z } from 'zod'

// Define the environment variables schema
const EnvSchema = z.object({
  PAYLOAD_SECRET: z.string(),
  DATABASE_URI: z.string(),
  NEXT_PUBLIC_SERVER_URL: z.string(),
  S3_ACCESS_KEY_ID: z.string(),
  S3_SECRET_ACCESS_KEY: z.string(),
  S3_BUCKET: z.string(),
  S3_REGION: z.string(),
  RESEND_API_KEY: z.string(),
  // NEXT_PUBLIC_VERCEL_URL: z.string(),
  PAYOS_CLIENT_KEY: z.string(),
  PAYOS_API_KEY: z.string(),
  PAYOS_CHECKSUM_KEY: z.string(),
  PAYOS_WEBHOOK_URL: z.string().url(),
  PAYOS_CANCEL_URL: z.string().url(),
  PAYOS_RETURN_URL: z.string().url(),
})

// Validate environment variables against the schema
const parsedEnv = EnvSchema.safeParse(process.env)

if (!parsedEnv.success) {
  console.error('Invalid environment variables:', parsedEnv.error.format())
  process.exit(1) // Exit if validation fails
}

// Export validated environment variables with correct types
export const {
  PAYLOAD_SECRET,
  DATABASE_URI,
  NEXT_PUBLIC_SERVER_URL,
  S3_ACCESS_KEY_ID,
  S3_SECRET_ACCESS_KEY,
  S3_BUCKET,
  S3_REGION,
  RESEND_API_KEY,
  // NEXT_PUBLIC_VERCEL_URL,
  PAYOS_CLIENT_KEY,
  PAYOS_API_KEY,
  PAYOS_CHECKSUM_KEY,
  PAYOS_WEBHOOK_URL,
  PAYOS_CANCEL_URL,
  PAYOS_RETURN_URL,
} = parsedEnv.data
