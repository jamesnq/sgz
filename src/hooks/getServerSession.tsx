import payloadConfig from '@payload-config'
import { getPayload } from 'payload'

export async function getServerSession() {
  const { headers: nextHeaders } = await import('next/headers')
  const headers = await nextHeaders()
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })
  return { user }
}
