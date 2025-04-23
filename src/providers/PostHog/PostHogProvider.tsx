// app/providers.jsx
'use client'

import { config } from '@/config'
import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'
import { useEffect } from 'react'
import SuspendedPostHogPageView from './PostHogPageView'
import { useAuth } from '../Auth'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  useEffect(() => {
    if (!user || !user.email) {
      posthog.set_config({
        disable_session_recording: true,
      })
      return
    }
    posthog.identify(user.email, { email: user.email })
    posthog.set_config({
      disable_session_recording: false,
    })
  }, [user, user?.email])
  useEffect(() => {
    posthog.init(config.NEXT_PUBLIC_POSTHOG_KEY, {
      api_host: config.NEXT_PUBLIC_POSTHOG_HOST,
      capture_pageview: false, // Disable automatic pageview capture, as we capture manually
      capture_pageleave: true,
      disable_session_recording: true,
    })
  }, [])

  return (
    <PHProvider client={posthog}>
      <SuspendedPostHogPageView />
      {children}
    </PHProvider>
  )
}
