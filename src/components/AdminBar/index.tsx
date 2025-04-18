'use client'

import { useAuth } from '@/providers/Auth'
import Link from 'next/link'
import { LayoutDashboard, Database, Briefcase, Settings, ChevronRight } from 'lucide-react'

export const AdminBar = () => {
  const { user } = useAuth()
  if (!user || !(user.roles?.length > 1)) return <></>

  return (
    <div className="bg-gradient-to-r from-secondary to-secondary/80 shadow-md py-1">
      <div className="container">
        <div className="flex items-center justify-end gap-3">
          <Link
            href="/stocks"
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-primary-foreground hover:bg-secondary-foreground/10 rounded-md transition-colors"
          >
            <Database size={14} />
            <span>Stocks</span>
            <ChevronRight size={12} className="opacity-70" />
          </Link>

          <Link
            href="/workspace"
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-primary-foreground hover:bg-secondary-foreground/10 rounded-md transition-colors"
          >
            <Briefcase size={14} />
            <span>Workspace</span>
            <ChevronRight size={12} className="opacity-70" />
          </Link>

          <Link
            href="/dashboard"
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-primary-foreground hover:bg-secondary-foreground/10 rounded-md transition-colors"
          >
            <LayoutDashboard size={14} />
            <span>Dashboard</span>
            <ChevronRight size={12} className="opacity-70" />
          </Link>

          <Link
            href="/admin"
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-primary-foreground hover:bg-secondary-foreground/10 rounded-md transition-colors"
          >
            <Settings size={14} />
            <span>Admin</span>
            <ChevronRight size={12} className="opacity-70" />
          </Link>
        </div>
      </div>
    </div>
  )
}
