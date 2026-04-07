'use client'

import { infoLinks } from '@/components/footer'
import { Shell } from '@/components/shell'
import { cn } from '@/lib/utils'
import { ChevronRight, Menu, X } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

import { Card } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'

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
        <div className="flex items-center justify-end md:hidden pb-4 mb-4 w-full">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }))}
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
          <Card className="p-3">
            <nav className="flex flex-col space-y-1">
              {infoLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    buttonVariants({ variant: pathname === link.href ? 'secondary' : 'ghost', size: 'sm' }),
                    'justify-start font-medium h-10 px-3'
                  )}
                >
                  {link.Icon && <link.Icon className="mr-3 h-4 w-4 shrink-0" />}
                  <span className="flex-1 truncate">{link.name}</span>
                  {pathname === link.href && <ChevronRight className="h-4 w-4 opacity-50 shrink-0" />}
                </Link>
              ))}
            </nav>
          </Card>
        </aside>

        {/* Main Content - Fixed width to prevent layout shifts */}
        <main className="flex-1 md:ml-8 min-w-0 md:w-[calc(100%-280px)]">
          <Card className="p-6 lg:p-10 overflow-hidden">
            <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none 
              prose-headings:text-foreground prose-headings:font-bold prose-h1:text-3xl lg:prose-h1:text-4xl prose-h2:text-2xl 
              prose-p:text-muted-foreground prose-p:leading-relaxed 
              prose-a:text-primary prose-a:no-underline hover:prose-a:underline 
              prose-strong:text-foreground 
              prose-ul:text-muted-foreground prose-ol:text-muted-foreground 
              marker:text-primary">
              {children}
            </div>
          </Card>
        </main>
      </div>
    </Shell>
  )
}
