import type { Metadata } from 'next'

import React from 'react'
import { getServerSideURL } from '@/utilities/getURL'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'

import { Header } from '@/collections/Globals/Header/Component'
import { AdminBar } from '@/components/AdminBar'
import Footer from '@/components/footer'
import { config } from '@/config'
import { Providers } from '@/providers'
import { SITE_DESCRIPTION } from '@/utilities/constants'
import './globals.css'

import { Be_Vietnam_Pro } from 'next/font/google'

const beVietnamPro = Be_Vietnam_Pro({
  weight: ['400', '600', '800'],
  subsets: ['latin', 'vietnamese'],
  variable: '--font-be-vietnam-pro',
  display: 'swap',
  adjustFontFallback: true,
})

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" data-theme="dark" suppressHydrationWarning className="scroll-smooth">
      <body className={`${beVietnamPro.variable} ${beVietnamPro.className} antialiased`}>
        <a
          href="#main-content"
          className="sr-only z-[100] rounded bg-white px-4 py-2 text-black focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Bỏ qua điều hướng
        </a>
        <Providers>
          <AdminBar />
          <Header />
          <main id="main-content" tabIndex={-1}>
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}

export const metadata: Metadata = {
  metadataBase: new URL(getServerSideURL()),
  title: {
    template: `%s | ${config.NEXT_PUBLIC_SITE_NAME}`,
    default: `${config.NEXT_PUBLIC_SITE_NAME} - Key Steam, tài khoản Steam Offline, nạp game`,
  },
  description: SITE_DESCRIPTION,
  icons: {
    icon: [
      { url: '/favicon-32x32.png' },
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  appleWebApp: {
    title: config.NEXT_PUBLIC_SITE_NAME,
  },
  ...mergeOpenGraph(),
}
