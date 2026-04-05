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
    icon: [
      { url: '/favicon.ico?v=2' },
      { url: '/favicon-96x96.png?v=2', sizes: '96x96', type: 'image/png' },
      { url: '/favicon.svg?v=2', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.ico?v=2',
    apple: '/apple-touch-icon.png?v=2',
  },
  manifest: '/site.webmanifest',
  appleWebApp: {
    title: config.NEXT_PUBLIC_SITE_NAME,
  },
  // openGraph: mergeOpenGraph(),
}
