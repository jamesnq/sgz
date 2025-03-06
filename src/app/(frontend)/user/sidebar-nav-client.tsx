'use client'

import { cn } from '@/utilities/ui'
import { ShoppingCartIcon, CreditCardIcon } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const sidebarItems = [
  {
    title: 'Đơn hàng',
    href: '/user/orders',
    icon: ShoppingCartIcon,
  },
  {
    title: 'Giao dịch',
    href: '/user/transactions',
    icon: CreditCardIcon,
  },
]

export default function SidebarNavClient({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname()

  return (
    <nav className={cn('flex flex-col space-y-1', className)} {...props}>
      {sidebarItems.map((item) => (
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
          <span>{item.title}</span>
        </Link>
      ))}
    </nav>
  )
}
