'use client'

import React from 'react'
import Link from 'next/link'

import type { Header as HeaderType } from '@/payload-types'
import { Routes } from '@/utilities/routes'
import { cn } from '@/utilities/ui'

export const HeaderNav: React.FC<{ data: HeaderType }> = ({}) => {
  const navItems = [
    { label: 'Sản phẩm', href: Routes.PRODUCTS },
    { label: 'Bài viết', href: Routes.POSTS },
  ]

  return (
    <nav className="flex gap-6 items-center mr-8">
      {navItems.map((item, i) => (
        <Link
          key={i}
          href={item.href}
          className={cn(
            'text-sm font-medium transition-colors hover:text-primary',
            'text-foreground/60 hover:text-foreground',
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  )
}
