'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import type { Header as HeaderType } from '@/payload-types'
import { Routes } from '@/utilities/routes'

export function useScrollSpy(ids: string[], offset: number = 100) {
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    const handleScroll = () => {
      if (ids.length === 0) return

      // If exactly at top, set to the first element
      if (window.scrollY <= 0 && ids.length > 0) {
        const firstId = ids[0]
        if (firstId) {
          setActiveId(firstId)
        }
        return
      }

      // For very bottom of page, highlight the last item (footer)
      // Only do this if the page is actually scrollable to avoid false positive on mount
      if (
        ids.includes('footer') &&
        document.documentElement.scrollHeight > window.innerHeight + 100 &&
        (window.innerHeight + window.scrollY) >= document.body.offsetHeight - 50
      ) {
        if (document.getElementById('footer')) {
          setActiveId('footer')
          return
        }
      }

      let currentId = null
      for (const id of ids) {
        const element = document.getElementById(id)
        if (element) {
          const top = element.getBoundingClientRect().top + window.scrollY - offset
          if (window.scrollY >= top) {
            currentId = id
          }
        }
      }
      
      if (currentId) {
        setActiveId(currentId)
      } else if (ids.length > 0) {
        const firstId = ids[0]
        if (firstId) {
          const firstEl = document.getElementById(firstId)
          if (firstEl && window.scrollY < firstEl.offsetTop + offset) {
            setActiveId(firstId)
          }
        }
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // initial call
    
    // Re-evaluate after a short delay to account for hydration/image loading layout shifts
    const timeoutId = setTimeout(handleScroll, 500)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      clearTimeout(timeoutId)
    }
  }, [ids.join(',')])

  return activeId
}

export const HeaderNav: React.FC<{ data: HeaderType }> = ({}) => {
  const pathname = usePathname()
  
  const navItems = [
    { label: 'Trang chủ', href: Routes.HOME, sectionId: 'hero-section' },
    { label: 'Sản phẩm', href: Routes.PRODUCTS, sectionId: 'products-section' },
    { label: 'Bài viết', href: Routes.POSTS, sectionId: 'posts-section' },
    { label: 'Liên hệ', href: '#footer', sectionId: 'footer' },
  ]

  const activeSection = useScrollSpy(pathname === '/' ? navItems.map(item => item.sectionId) : [])

  return (
    <nav className="flex gap-8 items-center font-sans">
      {navItems.map((item, i) => {
        let isActive = false

        if (pathname === '/') {
          isActive = activeSection === item.sectionId
        } else {
          if (item.href !== '/' && !item.href.includes('#footer') && pathname.startsWith(item.href)) {
            isActive = true
          }
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

