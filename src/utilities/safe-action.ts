import payloadConfig from '@payload-config'
import { createSafeActionClient } from 'next-safe-action'
import { getPayload } from 'payload'

export const actionClient = createSafeActionClient()

export const authActionClient = actionClient.use(async ({ next }) => {
  const { headers: nextHeaders } = await import('next/headers')
  const headers = await nextHeaders()
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })
  if (!user) {
    throw new Error('Session is not valid!')
  }
  if (!user._verified) {
    throw new Error('User is not verified!')
  }

  return next({ ctx: { user } })
})
