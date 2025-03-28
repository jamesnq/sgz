// app/providers.jsx
'use client'

import { env } from '@/config'
import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'
import { useEffect } from 'react'
import SuspendedPostHogPageView from './PostHogPageView'
import { useAuth } from '../Auth'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  useEffect(() => {
    if (!user || !user.email) return
    console.log('🚀 ~ PostHogProvider ~ user:', user)
    posthog.identify(user.id.toString(), { email: user.email })
  }, [user, user?.email])
  useEffect(() => {
    posthog.init(env.NEXT_PUBLIC_POSTHOG_KEY, {
      api_host: env.NEXT_PUBLIC_POSTHOG_HOST,
      capture_pageview: false, // Disable automatic pageview capture, as we capture manually
      capture_pageleave: true,
    })
  }, [])

  return (
    <PHProvider client={posthog}>
      <SuspendedPostHogPageView />
      {children}
    </PHProvider>
  )
}
