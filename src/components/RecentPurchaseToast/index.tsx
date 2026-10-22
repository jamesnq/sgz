'use client'

import { Media } from '@/components/Media'
import type { RecentPurchase } from '@/services/recentPurchases'
import { formatTimeAgo } from '@/utilities/formatTimeAgo'
import { Routes } from '@/utilities/routes'
import { cn } from '@/utilities/ui'
import { ShoppingBag, X } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect, useState } from 'react'

const DISMISS_KEY = 'sgz:recent-purchase-dismissed'
const FIRST_DELAY_MS = 8_000
const VISIBLE_MS = 6_000
const GAP_MS = 18_000

// Pages where a purchase popup would distract from paying or reading an order
const HIDDEN_PATH_PREFIXES = ['/user', '/auth', '/checkout']

const isDismissed = () => {
  try {
    return window.sessionStorage.getItem(DISMISS_KEY) === '1'
  } catch {
    return false
  }
}

export const RecentPurchaseToast = () => {
  const pathname = usePathname()
  const [items, setItems] = useState<RecentPurchase[]>([])
  const [index, setIndex] = useState(-1)
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(true)

  const hiddenOnPage = HIDDEN_PATH_PREFIXES.some((prefix) => pathname?.startsWith(prefix))

  useEffect(() => {
    if (isDismissed()) return
    setDismissed(false)

    let cancelled = false
    fetch('/api/recent-purchases')
      .then((res) => (res.ok ? res.json() : { items: [] }))
      .then((data: { items?: RecentPurchase[] }) => {
        if (cancelled) return
        // An unparseable date would make formatTimeAgo throw and break the page
        setItems((data.items ?? []).filter((i) => !Number.isNaN(new Date(i.createdAt).getTime())))
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  // Cycle: wait, show one purchase, hide, move on. One pass through the list only.
  useEffect(() => {
    if (dismissed || items.length === 0) return
    const next = index + 1
    if (next >= items.length) return

    const showTimer = window.setTimeout(
      () => {
        setIndex(next)
        setVisible(true)
      },
      index === -1 ? FIRST_DELAY_MS : GAP_MS,
    )
    return () => window.clearTimeout(showTimer)
  }, [dismissed, items.length, index])

  useEffect(() => {
    if (!visible) return
    const hideTimer = window.setTimeout(() => setVisible(false), VISIBLE_MS)
    return () => window.clearTimeout(hideTimer)
  }, [visible, index])

  const dismiss = () => {
    setVisible(false)
    setDismissed(true)
    try {
      window.sessionStorage.setItem(DISMISS_KEY, '1')
    } catch {
      // ignore
    }
  }

  const item = index >= 0 ? items[index] : undefined
  if (!item || dismissed || hiddenOnPage) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        // Phones: sit above the floating "Hỗ Trợ" button (bottom-right) instead of under it
        'fixed bottom-24 left-4 z-40 w-[calc(100vw-2rem)] max-w-[340px] sm:bottom-4',
        'transition-all duration-300 motion-reduce:transition-none',
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0',
      )}
    >
      <div className="relative flex items-center gap-3 rounded-xl border border-white/10 bg-[#16161e]/95 p-2.5 pr-8 shadow-2xl backdrop-blur">
        <Link
          href={Routes.product(item.slug)}
          className="flex min-w-0 flex-1 items-center gap-3"
          onClick={() => setVisible(false)}
        >
          <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-white/5">
            {item.image ? (
              <Media
                resource={item.image}
                className="h-full w-full"
                imgClassName="h-full w-full object-cover"
                size="48px"
              />
            ) : (
              <ShoppingBag className="absolute inset-0 m-auto size-5 text-sgz-primary" />
            )}
          </div>
          <div className="min-w-0 text-xs leading-snug">
            <p className="text-gray-400">
              <span className="font-semibold text-white">{item.buyer}</span> vừa mua
            </p>
            <p className="line-clamp-1 font-semibold text-white">{item.productName}</p>
            <p className="text-[11px] text-gray-500">{formatTimeAgo(new Date(item.createdAt))}</p>
          </div>
        </Link>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Ẩn thông báo mua hàng"
          className="absolute right-1.5 top-1.5 rounded p-1 text-gray-500 hover:bg-white/10 hover:text-white"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  )
}
