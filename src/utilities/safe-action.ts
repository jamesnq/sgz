import payloadConfig from '@payload-config'
import { createSafeActionClient, DEFAULT_SERVER_ERROR_MESSAGE } from 'next-safe-action'
import { getPayload } from 'payload'

type ServerNotificationOptions = { type: 'toast' | 'dialog'; options?: Record<string, unknown> }

export class ServerNotification extends Error {
  notify: ServerNotificationOptions
  readonly __isServerNotification = true
  constructor(message: string, notify: ServerNotificationOptions = { type: 'toast' }) {
    super(message)
    this.notify = notify
    Object.setPrototypeOf(this, ServerNotification.prototype)
  }
}

export const actionClient = createSafeActionClient({
  handleServerError(error: any) {
    if (error.__isServerNotification) {
      return { notify: error.notify, message: error.message }
    }

    return DEFAULT_SERVER_ERROR_MESSAGE
  },
})

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
