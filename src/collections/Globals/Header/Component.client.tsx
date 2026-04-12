'use client'
import Link from 'next/link'
import React, { FormEvent, useEffect, useState } from 'react'

import type { Header } from '@/payload-types'

import { Logo } from '@/components/Logo/Logo'

import { LucideLogOut, Search } from 'lucide-react'
import AuthDialog from './AuthDialog'
import { HeaderNav, MobileNav } from './Nav'
import { HeaderSearch } from './HeaderSearch.client'

import { UserBalanceWidget } from '@/components/display-balance'
import NovuInbox from '@/components/novu-inbox'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button, type ButtonProps } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/providers/Auth'
import { Routes } from '@/utilities/routes'
import { cn } from '@/utilities/ui'
import { useRouter } from 'next/navigation'

interface AuthDropdownProps
  extends React.ComponentPropsWithRef<typeof DropdownMenuTrigger>, ButtonProps {}

export function AuthDropdown({ className, ...props }: AuthDropdownProps) {
  const { user, logout } = useAuth()
  const [isAffiliate, setIsAffiliate] = useState(false)

  useEffect(() => {
    if (!user) {
      setIsAffiliate(false)
      return
    }
    fetch('/api/affiliate/status')
      .then((res) => res.json())
      .then((data) => setIsAffiliate(!!data?.isAffiliate))
      .catch(() => setIsAffiliate(false))
  }, [user])

  if (!user) {
    return <AuthDialog></AuthDialog>
  }

  const initials = user.email
    .split(' ')
    .slice(0, 2)
    .map((x: any) => x.at(0)?.toUpperCase())
    .join('')
  const email = user.email

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="secondary"
          className={cn(
            'size-10 rounded-full bg-sgz-surface border border-sgz-border hover:bg-sgz-surfaceHover transition-colors',
            className,
          )}
          {...props}
        >
          <Avatar className="size-9">
            <AvatarImage src="#" alt={email ?? ''} />
            <AvatarFallback className="bg-transparent text-white font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-60 bg-sgz-surface border-sgz-border rounded-xl shadow-xl overflow-hidden"
        align="end"
        forceMount
      >
        <DropdownMenuLabel className="font-normal p-4">
          <div className="flex flex-col space-y-1 text-white">
            <p className="text-sm font-semibold leading-none">Tài khoản</p>
            <p className="text-xs text-sgz-textMuted mt-1.5 w-full truncate">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-sgz-border" />
        <React.Suspense
          fallback={
            <div className="flex flex-col space-y-1.5 p-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full rounded-md bg-sgz-border/50" />
              ))}
            </div>
          }
        >
          <DropdownMenuGroup className="p-2">
            {Routes.USER_NAV.filter((item) => {
              if (item.href === Routes.AFFILIATE && !isAffiliate) {
                return false
              }
              return true
            }).map((item) => (
              <DropdownMenuItem
                key={item.label}
                asChild
                className="focus:bg-sgz-primary focus:text-white text-gray-300 rounded-lg cursor-pointer"
              >
                <Link href={item.href}>
                  <item.icon className="mr-3 size-4" aria-hidden="true" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        </React.Suspense>
        <DropdownMenuSeparator className="bg-sgz-border" />
        <div className="p-2">
          <DropdownMenuItem
            asChild
            className="focus:bg-red-500/20 focus:text-red-400 text-red-400/80 rounded-lg cursor-pointer transition-colors"
          >
            <div onClick={logout} className="flex items-center">
              <LucideLogOut className="mr-3 size-4" aria-hidden="true" />
              <span className="font-medium">Đăng xuất</span>
            </div>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

interface HeaderClientProps {
  data: Header
}

export const HeaderClient: React.FC<HeaderClientProps> = ({ data }) => {
  return (
    <header className="bg-sgz-dark/90 backdrop-blur-xl font-sans antialiased shadow-[0_10px_40px_-15px_rgba(139,92,246,0.15)] sticky top-0 z-50 transition-all duration-300 border-b border-sgz-border min-h-[80px]">
      <div className="flex justify-between items-center w-full px-6 lg:px-12 h-20 max-w-[1440px] mx-auto gap-4">
        <div className="flex items-center gap-4 lg:gap-12 shrink-0">
          <Link href={Routes.HOME} className="flex items-center shrink-0">
            <Logo loading="eager" priority="high" className="aspect-square object-contain" />
          </Link>
          <div className="hidden lg:flex shrink-0">
            <HeaderNav data={data} />
          </div>
        </div>

        <div className="flex items-center gap-3 md:gap-5 shrink-0 ml-auto">
          <div className="hidden lg:flex items-center gap-3 md:gap-5">
            <HeaderSearch />
            <UserBalanceWidget />
            <NovuInbox />
            <AuthDropdown />
          </div>
          <MobileNav data={data} />
        </div>
      </div>
    </header>
  )
}
