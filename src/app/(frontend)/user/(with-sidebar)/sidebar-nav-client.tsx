'use client'

import { Routes } from '@/utilities/routes'
import { cn } from '@/utilities/ui'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  isAffiliate?: boolean
}

export default function SidebarNavClient({ className, isAffiliate, ...props }: SidebarNavProps) {
  const pathname = usePathname()

  const navItems = Routes.USER_NAV.filter((item) => {
    if (item.href === Routes.AFFILIATE && !isAffiliate) {
      return false
    }
    return true
  })

  return (
    <nav className={cn('flex flex-col space-y-1', className)} {...props}>
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            'flex items-center px-3 py-2 text-sm font-medium rounded-md',
            pathname === item.href
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted',
          )}
        >
          <item.icon className="mr-2 h-4 w-4" />
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  )
}
