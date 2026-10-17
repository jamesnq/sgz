import React from 'react'

import { SocialSupport } from '@/components/social-support'
import { WebPushPrompt } from '@/components/WebPush/WebPushPrompt'
import { NuqsAdapter } from 'nuqs/adapters/next/app'

import { AuthProvider } from './Auth'
import { ClientProviders } from './client-providers'
import { HeaderThemeProvider } from './HeaderTheme'
import { PostHogProvider } from './PostHog/PostHogProvider'
import { ReactQueryProvider } from './react-query-provider'
import { ThemeProvider } from './Theme'

export const Providers: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  return (
    <ReactQueryProvider>
      <AuthProvider>
        <PostHogProvider>
          <NuqsAdapter>
            <ThemeProvider>
              <HeaderThemeProvider>
                <ClientProviders>{children}</ClientProviders>
                <SocialSupport />
                <WebPushPrompt />
              </HeaderThemeProvider>
            </ThemeProvider>
          </NuqsAdapter>
        </PostHogProvider>
      </AuthProvider>
    </ReactQueryProvider>
  )
}
