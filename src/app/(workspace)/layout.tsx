import React from 'react'

import { Providers } from '@/providers'
import { InitTheme } from '@/providers/Theme/InitTheme'

import { userHasRole } from '@/access/hasRoles'
import { Header } from '@/collections/Globals/Header/Component'
import { AdminBar } from '@/components/AdminBar'
import { getServerSession } from '@/hooks/getServerSession'
import { Routes } from '@/utilities/routes'
import { redirect } from 'next/navigation'
import '../(frontend)/globals.css'

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { user } = await getServerSession()
  if (!userHasRole(user, ['admin', 'staff'])) {
    return redirect(Routes.HOME)
  }
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
