'use client'

import { subscribePushAction, unsubscribePushAction } from '@/app/_actions/pushSubscriptionAction'
import { config } from '@/config'
import { useAuth } from '@/providers/Auth'
import { useCallback, useEffect, useState } from 'react'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function useWebPush() {
  const { user } = useAuth()
  const [isSupported, setIsSupported] = useState<boolean>(false)
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isLoading, setIsLoading] = useState<boolean>(false)

  // Initialize service worker and check current subscription status
  useEffect(() => {
    const supported =
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window

    setIsSupported(supported)

    if (!supported) return

    setPermission(Notification.permission)

    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        return registration.pushManager.getSubscription()
      })
      .then((subscription) => {
        setIsSubscribed(!!subscription)
      })
      .catch((error) => {
        console.error('[useWebPush] Service worker registration error:', error)
      })
  }, [user?.id])

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      console.warn('[useWebPush] Web Push is not supported on this browser.')
      return false
    }

    const vapidPublicKey = config.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    if (!vapidPublicKey) {
      console.warn('[useWebPush] NEXT_PUBLIC_VAPID_PUBLIC_KEY is not configured.')
      return false
    }

    setIsLoading(true)

    try {
      const currentPermission = await Notification.requestPermission()
      setPermission(currentPermission)

      if (currentPermission !== 'granted') {
        setIsLoading(false)
        return false
      }

      const registration = await navigator.serviceWorker.ready
      let subscription = await registration.pushManager.getSubscription()

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        })
      }

      const subJson = subscription.toJSON()
      const p256dh = subJson.keys?.p256dh
      const auth = subJson.keys?.auth

      if (!p256dh || !auth) {
        throw new Error('Push subscription keys missing.')
      }

      // Save to server
      const res = await subscribePushAction({
        endpoint: subscription.endpoint,
        keys: { p256dh, auth },
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      })

      if (res?.data?.success) {
        setIsSubscribed(true)
        setIsLoading(false)
        return true
      }

      setIsLoading(false)
      return false
    } catch (error) {
      console.error('[useWebPush] Subscribe failed:', error)
      setIsLoading(false)
      return false
    }
  }, [isSupported])

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false

    setIsLoading(true)

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        const endpoint = subscription.endpoint
        await subscription.unsubscribe()
        await unsubscribePushAction({ endpoint })
      }

      setIsSubscribed(false)
      setIsLoading(false)
      return true
    } catch (error) {
      console.error('[useWebPush] Unsubscribe failed:', error)
      setIsLoading(false)
      return false
    }
  }, [isSupported])

  return {
    isSupported,
    isSubscribed,
    permission,
    isLoading,
    subscribe,
    unsubscribe,
  }
}
