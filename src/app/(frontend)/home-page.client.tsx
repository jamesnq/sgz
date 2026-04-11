'use client'

import { useHeaderTheme } from '@/providers/HeaderTheme'
import { useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Post, Product } from '@/payload-types'
import type { HomepageSection } from './page'

const FeaturedSection = dynamic(
  () => import('@/components/home/FeaturedSection').then((mod) => mod.FeaturedSection),
  { ssr: true },
)
const PostsSection = dynamic(
  () => import('@/components/home/PostsSection').then((mod) => mod.PostsSection),
  { ssr: true },
)
const ProductGridSection = dynamic(
  () => import('@/components/home/ProductGridSection').then((mod) => mod.ProductGridSection),
  { ssr: true },
)
const SocialSupport = dynamic(
  () => import('@/components/social-support').then((mod) => mod.SocialSupport),
  { ssr: false },
)

import { HeroSection } from '@/components/home/HeroSection'

// ─── Helpers ───

function buildViewAllLink(section: HomepageSection): string {
  const categoryTitles = (section.group.categories || [])
    .map((c: any) => (typeof c === 'object' ? c.title : ''))
    .filter(Boolean)

  if (categoryTitles.length === 0) return '/products'

  const params = categoryTitles
    .map((title: string, i: number) => `products[refinementList][categories][${i}]=${encodeURIComponent(title)}`)
    .join('&')

  return `/products?${params}`
}

// ─── Types ───

interface HomePageClientProps {
  posts: Post[]
  stats: {
    orders: number
    users: number
    products: number
  }
  sections: HomepageSection[]
  featuredProducts?: Product[]
}

// ─── Component ───

const HomePageClient = ({
  posts,
  stats,
  sections,
  featuredProducts,
}: HomePageClientProps) => {
  const { setHeaderTheme } = useHeaderTheme()

  useEffect(() => {
    setHeaderTheme('dark')
  }, [setHeaderTheme])

  return (
    <>
      <div className="mb-16">
        <HeroSection stats={stats} />
        <div className="w-full px-6 lg:px-12 max-w-[1440px] mx-auto py-8 space-y-16">
          {featuredProducts && featuredProducts.length > 0 && (
            <FeaturedSection products={featuredProducts} />
          )}

          {sections.map((section) => (
            <ProductGridSection
              key={section.group.id}
              products={section.products}
              title={section.group.title}
              subtitle={section.group.homepageSubtitle || undefined}
              viewAllLink={buildViewAllLink(section)}
            />
          ))}

          <PostsSection posts={posts} />
          <SocialSupport />
        </div>
      </div>
    </>
  )
}

export default HomePageClient
