import type { Metadata } from 'next'

import React from 'react'

import { Header } from '@/collections/Globals/Header/Component'
import { AdminBar } from '@/components/AdminBar'
import Footer from '@/components/footer'
import { config } from '@/config'
import { Providers } from '@/providers'
import { InitTheme } from '@/providers/Theme/InitTheme'
import { SITE_DESCRIPTION } from '@/utilities/constants'
import './globals.css'

import { Be_Vietnam_Pro } from 'next/font/google'

const beVietnamPro = Be_Vietnam_Pro({
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  subsets: ['latin', 'vietnamese'],
  variable: '--font-be-vietnam-pro',
})

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className="scroll-smooth">
      <head>
        <InitTheme />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body className={`${beVietnamPro.variable} ${beVietnamPro.className} antialiased`}>
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


export const metadata: Metadata = {
  // metadataBase: new URL(getServerSideURL()),
  title: {
    absolute: config.NEXT_PUBLIC_SITE_NAME,
  },
  description: `${config.NEXT_PUBLIC_SITE_NAME} - ${SITE_DESCRIPTION}`,
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-32x32.png',
    apple: '/apple-touch-icon.png',
  },
  // openGraph: mergeOpenGraph(),
}
