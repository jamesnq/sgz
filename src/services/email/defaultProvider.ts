import { config } from '@/config'
import { ResendEmailProvider } from './providers'

type ResendClient = ConstructorParameters<typeof ResendEmailProvider>[0]

export function createDefaultResendEmailProvider() {
  const client: ResendClient = {
    emails: {
      async send(message) {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${config.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(message),
        })

        const data = await response.json().catch(() => null)
        if (!response.ok) {
          return { error: { message: data?.message || `Resend request failed with ${response.status}` } }
        }

        return { data: { id: data?.id } }
      },
    },
  }

  return new ResendEmailProvider(client, {
    email: config.EMAIL_FROM_ADDRESS,
    name: config.EMAIL_FROM_NAME,
  })
}
