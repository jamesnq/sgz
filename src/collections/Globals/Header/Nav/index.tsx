'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import type { Header as HeaderType } from '@/payload-types'
import { Routes } from '@/utilities/routes'
import { LogOut, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { HeaderSearch } from '../HeaderSearch.client'
import { Logo } from '@/components/Logo/Logo'
import { UserBalanceWidget } from '@/components/display-balance'
import NovuInbox from '@/components/novu-inbox'
import AuthDialog from '../AuthDialog'
import { useAuth } from '@/providers/Auth'

export const navItems = [
  { label: 'Trang chủ', href: Routes.HOME, sectionId: 'hero-section' },
  { label: 'Sản phẩm', href: Routes.PRODUCTS, sectionId: 'products-section' },
  { label: 'Bài viết', href: Routes.POSTS, sectionId: 'posts-section' },
  { label: 'Liên hệ', href: '#footer', sectionId: 'footer' },
]

export const HeaderNav: React.FC<{ data: HeaderType }> = ({}) => {
  const pathname = usePathname()

  const navItemsRef = navItems

  return (
    <nav className="flex gap-8 items-center font-sans">
      {navItemsRef.map((item, i) => {
        let isActive = false

        if (item.href === '/') {
          isActive = pathname === '/'
        } else if (!item.href.includes('#')) {
          isActive = pathname.startsWith(item.href)
        }

        return (
          <Link
            key={i}
            href={item.href}
            className={
              isActive
                ? 'text-sgz-primary font-bold border-b-2 border-sgz-primary pb-1 transition-all duration-300 ease-out'
                : 'text-sgz-textMuted font-medium hover:text-sgz-primary transition-all duration-300 ease-out'
            }
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

export const MobileNav: React.FC<{ data: HeaderType }> = ({}) => {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
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

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open])

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden shrink-0 text-white hover:bg-sgz-surface hover:text-sgz-primary"
        aria-label="Mở menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <Menu className="h-6 w-6" />
      </Button>

      {open && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/30"
            aria-label="Đóng menu"
            onClick={() => setOpen(false)}
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="fixed inset-y-0 right-0 z-[61] w-[300px] sm:w-[350px] bg-sgz-dark border-l border-sgz-border overflow-y-auto flex flex-col p-6 shadow-lg"
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4 rounded-sm text-white opacity-70 hover:bg-sgz-surface hover:text-sgz-primary hover:opacity-100"
              aria-label="Đóng menu"
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>

            <div className="pb-6 border-b border-sgz-border text-left">
              <Link href={Routes.HOME} onClick={() => setOpen(false)} className="inline-block">
                <Logo loading="lazy" className="h-[32px] w-auto" />
              </Link>
            </div>
            <div className="py-6 flex flex-col gap-6 flex-1">
              <HeaderSearch className="w-full flex" onNavigate={() => setOpen(false)} />
              <nav className="flex flex-col gap-4">
                {navItems.map((item, i) => {
                  let isActive = false
                  if (item.href === '/') {
                    isActive = pathname === '/'
                  } else if (!item.href.includes('#')) {
                    isActive = pathname.startsWith(item.href)
                  }

                  return (
                    <Link
                      key={i}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={
                        isActive
                          ? 'text-sgz-primary font-bold text-lg'
                          : 'text-sgz-textMuted font-medium hover:text-white text-lg transition-colors'
                      }
                    >
                      {item.label}
                    </Link>
                  )
                })}
              </nav>
            </div>

            <div className="pt-6 border-t border-sgz-border mt-auto pb-2">
              {user ? (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <UserBalanceWidget />
                    <NovuInbox />
                  </div>
                  <div className="bg-sgz-surface rounded-xl p-3 flex items-center justify-between border border-sgz-border">
                    <div className="flex flex-col overflow-hidden mr-3">
                      <span className="text-white font-semibold text-sm">Tài khoản</span>
                      <span className="text-sgz-textMuted text-xs truncate w-full">{user.email}</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => { logout(); setOpen(false) }} className="text-red-400 hover:text-red-300 hover:bg-red-400/10 shrink-0">
                      <LogOut className="h-5 w-5" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {Routes.USER_NAV.filter((item) => {
                      if (item.href === Routes.AFFILIATE && !isAffiliate) {
                        return false
                      }
                      return true
                    }).map((item) => (
                      <Link
                        key={item.label}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg bg-white/5 hover:bg-sgz-primary/20 hover:text-sgz-primary transition-colors text-xs text-gray-300 font-medium text-center"
                      >
                        <item.icon className="h-5 w-5" />
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <AuthDialog>
                    <Button className="w-full font-bold bg-sgz-primary hover:bg-sgz-primary/80 text-sgz-dark">
                      Đăng nhập
                    </Button>
                  </AuthDialog>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </>
  )
}
