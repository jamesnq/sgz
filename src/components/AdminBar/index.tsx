'use client'

import { useAuth } from '@/providers/Auth'
import Link from 'next/link'

export const AdminBar = () => {
  const { user } = useAuth()
  if (!user || !(user.roles?.length > 1)) return <></>

  return (
    <div className="container bg-secondary">
      <div className="flex justify-end gap-2">
        <Link href="/workspace" className="text-sm font-medium hover:underline">
          Workspace
        </Link>
        <Link href="/admin" className="text-sm font-medium hover:underline">
          Dashboard
        </Link>
      </div>
    </div>
  )
}
