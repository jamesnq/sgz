import React from 'react'

import { ChatwootLoader } from '@/components/chatwoot'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { AuthProvider } from './Auth'
import { ClientProviders } from './client-providers'
import { HeaderThemeProvider } from './HeaderTheme'
import { ThemeProvider } from './Theme'

export const Providers: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <NuqsAdapter>
          <HeaderThemeProvider>
            <ClientProviders>{children}</ClientProviders>
            <ChatwootLoader />
          </HeaderThemeProvider>
        </NuqsAdapter>
      </ThemeProvider>
    </AuthProvider>
  )
}
