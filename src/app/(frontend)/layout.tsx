import React from 'react'

import { Header } from '@/collections/Globals/Header/Component'
import { AdminBar } from '@/components/AdminBar'
import Footer from '@/components/footer'
import { Providers } from '@/providers'
import { InitTheme } from '@/providers/Theme/InitTheme'
import { defaultMetadata } from '@/utilities/generateMeta'
import './globals.css'

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <InitTheme />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body className="antialiased">
        <Providers>
          <AdminBar />
          <Header />
          {children}
          <Footer />
        </Providers>
      </body>
    </html>
  )
}

export const metadata = defaultMetadata()
