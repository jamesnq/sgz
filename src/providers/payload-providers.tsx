import React from 'react'

import { AuthProvider } from './Auth'
import { HeaderThemeProvider } from './HeaderTheme'
import { ReactQueryProvider } from './react-query-provider'
import { ThemeProvider } from './Theme'

export const PayloadProviders: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  return (
    <ReactQueryProvider>
      <AuthProvider>
        <ThemeProvider>
          <HeaderThemeProvider>{children}</HeaderThemeProvider>
        </ThemeProvider>
      </AuthProvider>
    </ReactQueryProvider>
  )
}
