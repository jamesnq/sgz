import React from 'react'

import { AuthProvider } from './Auth'
import { HeaderThemeProvider } from './HeaderTheme'
import { ThemeProvider } from './Theme'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
export const Providers: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <NuqsAdapter>
          <HeaderThemeProvider>{children}</HeaderThemeProvider>
        </NuqsAdapter>
      </ThemeProvider>
    </AuthProvider>
  )
}
