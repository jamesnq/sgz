'use client'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect, useState } from 'react'

import type { Header } from '@/payload-types'

import { Logo } from '@/components/Logo/Logo'

import { LucideLogOut, Package } from 'lucide-react'
import AuthDialog from './AuthDialog'
import { HeaderNav } from './Nav'

import { DisplayBalance } from '@/components/display-balance'
import NovuInbox from '@/components/novu-inbox'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button, type ButtonProps } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/providers/Auth'
import { ThemeToggle } from '@/providers/Theme/theme-toggle'
import { cn } from '@/utilities/ui'
import { Routes } from '@/utilities/routes'

interface AuthDropdownProps
  extends React.ComponentPropsWithRef<typeof DropdownMenuTrigger>,
    ButtonProps {}

export function AuthDropdown({ className, ...props }: AuthDropdownProps) {
  const { user, logout } = useAuth()

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
        <Button variant="secondary" className={cn('size-8 rounded-full', className)} {...props}>
          <Avatar className="size-8">
            <AvatarImage src="#" alt={email ?? ''} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        {/* <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.email}</p>
            <p className="text-xs leading-none text-muted-foreground">{email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator /> */}
        <React.Suspense
          fallback={
            <div className="flex flex-col space-y-1.5 p-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-full rounded-sm" />
              ))}
            </div>
          }
        >
          <DropdownMenuGroup>
            {Routes.USER_NAV.map((item) => (
              <DropdownMenuItem key={item.label} asChild>
                <Link href={item.href}>
                  <item.icon className="mr-2 size-4" aria-hidden="true" />
                  {item.label}
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        </React.Suspense>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <div onClick={logout}>
            <LucideLogOut className="mr-2 size-4" aria-hidden="true" />
            Đăng xuất
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

interface HeaderClientProps {
  data: Header
}

export const HeaderClient: React.FC<HeaderClientProps> = ({ data }) => {
  /* Storing the value in a useState to avoid hydration errors */
  const [theme, setTheme] = useState<string | null>(null)
  const { headerTheme, setHeaderTheme } = useHeaderTheme()
  const pathname = usePathname()

  useEffect(() => {
    setHeaderTheme(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  useEffect(() => {
    if (headerTheme && headerTheme !== theme) setTheme(headerTheme)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headerTheme])

  return (
    <header className="container relative z-20 " {...(theme ? { 'data-theme': theme } : {})}>
      <div className="py-8 flex justify-between">
        <div className="flex items-center gap-1">
          <Link href="/" className="flex items-center">
            <Logo loading="eager" priority="high" className="invert dark:invert-0" />
          </Link>
          <ThemeToggle />
        </div>
        <div className="flex items-center">
          <HeaderNav data={data} />
          <div className="flex items-center gap-1">
            <DisplayBalance />
            <NovuInbox />
            <AuthDropdown />
          </div>
        </div>
      </div>
    </header>
  )
}
