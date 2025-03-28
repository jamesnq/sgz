import React from 'react'

import { ChatwootLoader } from '@/components/chatwoot'
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
                <ChatwootLoader />
              </HeaderThemeProvider>
            </ThemeProvider>
          </NuqsAdapter>
        </PostHogProvider>
      </AuthProvider>
    </ReactQueryProvider>
  )
}
