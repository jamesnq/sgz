import React from 'react'

import { AuthProvider } from './Auth'
import { HeaderThemeProvider } from './HeaderTheme'
import { ThemeProvider } from './Theme'
export const PayloadProviders: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <HeaderThemeProvider>{children}</HeaderThemeProvider>
      </ThemeProvider>
    </AuthProvider>
  )
}
