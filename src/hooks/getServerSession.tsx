import payloadConfig from '@payload-config'
import { getPayload } from 'payload'

export async function getServerSession() {
  const { headers: nextHeaders } = await import('next/headers')
  const headers = await nextHeaders()
  const payload = await getPayload({ config: payloadConfig })
  let { user } = await payload.auth({ headers })

  if (!user) {
    try {
      // Fallback for payload-auth-plugin (OAuth sessions)
      const port = process.env.PORT || 3000
      const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || `http://127.0.0.1:${port}`
      const response = await fetch(`${baseUrl}/api/app/session?fields[0]=id&fields[1]=email&fields[2]=roles`, {
        headers: {
          cookie: headers.get('cookie') || '',
        },
        cache: 'no-store'
      })
      if (response.ok) {
        const data = await response.json()
        if (data?.data?.isAuthenticated && data?.data?.id) {
          try {
            user = await payload.findByID({
              collection: 'users',
              id: data.data.id,
            })
          } catch (e) {
            console.error('[getServerSession] Error fetching user by ID:', e)
            user = data.data
          }
        }
      }
    } catch (e) {
      console.error('[getServerSession] Error fetching OAuth session:', e)
    }
  }

  return { user }
}
