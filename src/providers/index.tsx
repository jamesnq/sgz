import React from 'react'

import { ChatwootLoader } from '@/components/chatwoot'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { AuthProvider } from './Auth'
import { ClientProviders } from './client-providers'
import { HeaderThemeProvider } from './HeaderTheme'
import { ReactQueryProvider } from './react-query-provider'
import { ThemeProvider } from './Theme'
import PlausibleProvider from 'next-plausible'

export const Providers: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  return (
    <PlausibleProvider
      selfHosted
      customDomain="https://plausible.subgamezone.com"
      domain={process.env.NEXT_PUBLIC_SERVER_URL}
      enabled
      trackFileDownloads
      trackOutboundLinks
      taggedEvents
    >
      <ReactQueryProvider>
        <AuthProvider>
          <NuqsAdapter>
            <ThemeProvider>
              <HeaderThemeProvider>
                <ClientProviders>{children}</ClientProviders>
                <ChatwootLoader />
              </HeaderThemeProvider>
            </ThemeProvider>
          </NuqsAdapter>
        </AuthProvider>
      </ReactQueryProvider>
    </PlausibleProvider>
  )
}
