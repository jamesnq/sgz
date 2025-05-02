import { getInstancePayloadAuth } from '@/utilities/getInstancePayload'
import { Routes } from '@/utilities/routes'
import { redirect } from 'next/navigation'
import React from 'react'
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { user } = await getInstancePayloadAuth()
  if (!user) return redirect(Routes.HOME)
  return children
}
