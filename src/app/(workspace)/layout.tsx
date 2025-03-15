import React from 'react'

import { Providers } from '@/providers'
import { InitTheme } from '@/providers/Theme/InitTheme'

import '../(frontend)/globals.css'
import { Header } from '@/collections/Globals/Header/Component'
import { AdminBar } from '@/components/AdminBar'

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <InitTheme />
        <link href="/favicon.ico" rel="icon" sizes="32x32" />
        <link href="/favicon.svg" rel="icon" type="image/svg+xml" />
      </head>
      <body className="antialiased">
        <Providers>
          <AdminBar />
          <Header />
          {children}
        </Providers>
      </body>
    </html>
  )
}
