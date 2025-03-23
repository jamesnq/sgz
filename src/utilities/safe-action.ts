import { getServerSession } from '@/hooks/getServerSession'
import { createSafeActionClient, DEFAULT_SERVER_ERROR_MESSAGE } from 'next-safe-action'

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
  const { user } = await getServerSession()
  if (!user) {
    throw new Error('Session is not valid!')
  }
  if (!user._verified) {
    throw new Error('User is not verified!')
  }
  return next({ ctx: { user } })
})
