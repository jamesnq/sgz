'use client'

import { Routes } from '@/utilities/routes'
import { cn } from '@/utilities/ui'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function SidebarNavClient({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname()

  return (
    <nav className={cn('flex flex-col space-y-1', className)} {...props}>
      {Routes.USER_NAV.map((item) => (
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
