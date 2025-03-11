import { redirect } from 'next/navigation'
import React from 'react'

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV !== 'development') {
    return redirect('/')
  }
  return children
}
