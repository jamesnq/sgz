'use client'

import { infoLinks } from '@/components/footer'
import { Shell } from '@/components/shell'
import { cn } from '@/lib/utils'
import { ChevronRight, Menu, X } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function InfoLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Handle responsive state
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkIfMobile()
    window.addEventListener('resize', checkIfMobile)

    return () => {
      window.removeEventListener('resize', checkIfMobile)
    }
  }, [])

  // Close mobile menu when path changes
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  return (
    <Shell>
      {/* Fixed position container with sidebar and content */}
      <div className="flex flex-col md:flex-row">
        {/* Mobile Menu Toggle - Only visible on mobile */}
        <div className="flex items-center justify-end md:hidden border-b pb-4 mb-4 w-full">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Sidebar - Fixed position on desktop, toggleable on mobile */}
        <aside
          className={cn(
            'md:w-64 shrink-0 md:sticky md:top-24 md:self-start md:h-[calc(100vh-200px)] overflow-auto',
            isMobile ? (isMobileMenuOpen ? 'block w-full mb-6' : 'hidden') : 'block',
          )}
        >
          <div className="border rounded-lg p-4 shadow-sm">
            <nav className="flex flex-col space-y-1">
              {infoLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'flex items-center px-3 py-2 rounded-md text-sm transition-colors',
                    pathname === link.href
                      ? 'bg-primary text-primary-foreground font-medium'
                      : 'hover:bg-muted',
                  )}
                >
                  {link.Icon && <link.Icon className="mr-2 h-4 w-4" />}
                  <span className="flex-1">{link.name}</span>
                  {pathname === link.href && <ChevronRight className="h-4 w-4" />}
                </Link>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content - Fixed width to prevent layout shifts */}
        <main className="flex-1 md:ml-8 min-w-0 md:w-[calc(100%-280px)]">
          <div className="prose dark:prose-invert max-w-none">{children}</div>
        </main>
      </div>
    </Shell>
  )
}
