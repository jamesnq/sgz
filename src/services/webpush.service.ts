import { config } from '@/config'
import payloadConfig from '@payload-config'
import { after } from 'next/server'
import { getPayload } from 'payload'
import webpush from 'web-push'

export interface PushNotificationPayload {
  title: string
  body: string
  url?: string
  icon?: string
  badge?: string
  image?: string
  tag?: string
  data?: Record<string, unknown>
}

// Configure VAPID if keys are available
if (config.NEXT_PUBLIC_VAPID_PUBLIC_KEY && config.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    config.VAPID_SUBJECT || 'mailto:admin@subgamezone.com',
    config.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    config.VAPID_PRIVATE_KEY,
  )
}

/**
 * Sends a web push notification to a specific user across all their registered browser devices
 * @param userId - Target user ID
 * @param payload - Notification content (title, body, url, etc.)
 */
export async function sendWebPushToUser(
  userId: number | string,
  payload: PushNotificationPayload,
): Promise<void> {
  if (!config.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !config.VAPID_PRIVATE_KEY) {
    console.warn('[WebPush] VAPID keys not configured, skipping push notification')
    return
  }

  const numericUserId = Number(userId)
  if (!numericUserId || isNaN(numericUserId)) return

  try {
    const payloadInstance = await getPayload({ config: payloadConfig })
    const { docs: subscriptions } = await payloadInstance.find({
      collection: 'push-subscriptions' as any,
      where: {
        user: { equals: numericUserId },
      },
      depth: 0,
      pagination: false,
      overrideAccess: true,
    })

    if (!subscriptions || subscriptions.length === 0) {
      return
    }

    const pushPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/favicon-96x96.png',
      badge: payload.badge || '/favicon-32x32.png',
      image: payload.image,
      tag: payload.tag,
      url: payload.url || '/',
      data: payload.data,
    })

    const expiredSubIds: (number | string)[] = []

    await Promise.allSettled(
      subscriptions.map(async (sub: any) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            },
            pushPayload,
          )
        } catch (error: any) {
          // If subscription has expired or is unsubscribed, mark for deletion
          if (error?.statusCode === 410 || error?.statusCode === 404) {
            expiredSubIds.push(sub.id)
          } else {
            console.error(`[WebPush] Failed to send push to subscription ${sub.id}:`, error?.message || error)
          }
        }
      }),
    )

    // Clean up expired subscriptions
    if (expiredSubIds.length > 0) {
      await Promise.allSettled(
        expiredSubIds.map((id) =>
          payloadInstance.delete({
            collection: 'push-subscriptions' as any,
            id,
            overrideAccess: true,
          }),
        ),
      )
    }
  } catch (error) {
    console.error('[WebPush] Error sending push notification to user:', error)
  }
}

/**
 * Schedule web push notification asynchronously using Next.js after()
 */
export function scheduleWebPushToUser(
  userId: number | string,
  payload: PushNotificationPayload,
): void {
  try {
    after(async () => {
      await sendWebPushToUser(userId, payload)
    })
  } catch {
    // If called outside request lifecycle, execute directly
    sendWebPushToUser(userId, payload).catch((err) =>
      console.error('[WebPush] Asynchronous push send failed:', err),
    )
  }
}
