'use client'

import { Media } from '@/components/Media'
import { Shell } from '@/components/shell'
import { cn } from '@/lib/utils'
import { Category, Post, PostTag, Product } from '@/payload-types'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import { formatPrice } from '@/utilities/formatPrice'
import { instantSearchClient } from '@/utilities/meiliSearchClient'
import { Routes } from '@/utilities/routes'
import { productIndex } from '@/utilities/searchIndexes'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Configure, InstantSearch, useHits } from 'react-instantsearch'

/* ─────────────────────── Hero Slider ─────────────────────── */

const HeroSlider = ({ products }: { products: Product[] }) => {
  const [current, setCurrent] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const total = products.length

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % total)
    }, 5000)
  }, [total])

  useEffect(() => {
    resetTimer()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [resetTimer])

  const goTo = (index: number) => {
    setCurrent(index)
    resetTimer()
  }
  const prev = () => goTo((current - 1 + total) % total)
  const next = () => goTo((current + 1) % total)

  if (total === 0) return null
  const product = products[current]
  if (!product) return null
  const discount = product.maxDiscount
  const salePrice = product.minPrice
  const originalPrice = discount > 0 ? Math.round(salePrice / (1 - discount / 100)) : salePrice

  return (
    <div className="relative w-full lg:w-[70%] aspect-[16/9] rounded-lg overflow-hidden group">
      {/* Background image */}
      <div className="absolute inset-0">
        <Media
          resource={product.image}
          className="w-full h-full"
          imgClassName="w-full h-full object-cover"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
      </div>

      {/* Content overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 lg:p-8 z-10">
        <Link href={product.slug ? Routes.product(product.slug) : '#'} className="block">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-white mb-2 line-clamp-2 hover:text-primary transition-colors">
            {product.name}
          </h2>
        </Link>

        {product.description && (
          <div className="text-sm text-gray-300 mb-3 space-y-1">
            <p className="font-medium">Thông tin gói mua :</p>
            <p className="line-clamp-2 text-gray-400">{product.description as unknown as string}</p>
          </div>
        )}

        {/* Pricing */}
        <div className="flex items-center gap-3 mb-4">
          {discount > 0 && (
            <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
              -{discount.toFixed(0)}%
            </span>
          )}
          {discount > 0 && (
            <span className="text-gray-400 line-through text-sm">{formatPrice(originalPrice)}</span>
          )}
          <span className="text-white font-bold text-lg md:text-xl">{formatPrice(salePrice)}</span>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <Link
            href={product.slug ? Routes.product(product.slug) : '#'}
            className="px-6 py-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-md hover:bg-white/20 transition-all text-sm font-medium"
          >
            Mua Ngay
          </Link>
          <button className="px-6 py-2 bg-white/5 backdrop-blur-sm border border-white/10 text-white/70 rounded-md hover:bg-white/15 hover:text-white transition-all text-sm font-medium">
            Yêu Thích
          </button>
        </div>
      </div>

      {/* Navigation arrows */}
      <button
        onClick={prev}
        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60 z-20"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <button
        onClick={next}
        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60 z-20"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Dot indicators */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
        {products.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={cn(
              'w-2 h-2 rounded-full transition-all',
              i === current ? 'bg-white w-4' : 'bg-white/40 hover:bg-white/60',
            )}
          />
        ))}
      </div>
    </div>
  )
}

/* ─────────────────────── Hero Sidebar ─────────────────────── */

const HeroSidebar = ({ products }: { products: Product[] }) => {
  return (
    <div className="hidden lg:flex w-[30%] flex-col gap-1.5 pl-4">
      {products.map((product) => (
        <Link
          key={product.id}
          href={product.slug ? Routes.product(product.slug) : '#'}
          className="flex items-center gap-3 p-2 rounded-lg bg-card/50 border border-border/50 hover:border-primary/50 hover:bg-card transition-all group/item"
        >
          <div className="w-[60px] h-[60px] rounded-md overflow-hidden flex-shrink-0 relative">
            <Media
              resource={product.image}
              className="w-full h-full"
              imgClassName="w-full h-full object-cover"
            />
          </div>
          <p className="text-sm font-medium line-clamp-2 text-foreground/80 group-hover/item:text-primary transition-colors leading-tight">
            {product.name}
          </p>
        </Link>
      ))}
    </div>
  )
}

/* ─────────────────────── Horizontal Product Card ─────────────────────── */

const ProductCard = ({ product }: { product: Product }) => {
  const discount = product.maxDiscount
  const salePrice = product.minPrice
  const originalPrice = discount > 0 ? Math.round(salePrice / (1 - discount / 100)) : salePrice

  return (
    <Link
      href={product.slug ? Routes.product(product.slug) : '#'}
      className="group block rounded-lg overflow-hidden bg-card border border-border/40 hover:border-primary/50 transition-all"
    >
      {/* Product Image — landscape */}
      <div className="relative aspect-[16/9] overflow-hidden bg-muted">
        <Media
          resource={product.image}
          className="w-full h-full"
          imgClassName="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      {/* Info */}
      <div className="p-3">
        {/* Product name */}
        <h3 className="text-sm font-medium line-clamp-1 mb-2 text-foreground group-hover:text-primary transition-colors">
          {product.name}
        </h3>

        {/* Pricing row */}
        <div className="flex items-center gap-2 flex-wrap">
          {discount > 0 && (
            <span className="bg-emerald-600 text-white text-[11px] font-bold px-1.5 py-0.5 rounded">
              -{discount.toFixed(0)}%
            </span>
          )}
          {discount > 0 && (
            <span className="text-muted-foreground line-through text-xs">
              {formatPrice(originalPrice)}
            </span>
          )}
          <span className="text-emerald-500 font-bold text-sm">{formatPrice(salePrice)}</span>
        </div>
      </div>
    </Link>
  )
}

/* ─────────────────────── Section: "Game Bom Tấn AAA" ─────────────────────── */

const ProductGridSection = ({ products, title }: { products: Product[]; title: string }) => {
  return (
    <div className="mt-8 mb-8">
      <h2 className="text-xl md:text-2xl font-bold mb-4 text-foreground">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  )
}

/* ─────────────────────── Hero + Sidebar Section ─────────────────────── */

const HeroSection = ({ title }: { title: string }) => {
  const { hits } = useHits()
  const products = hits as unknown as Product[]

  // First 5 products go to the slider, next 6 go to the sidebar
  const sliderProducts = products.slice(0, 5)
  const sidebarProducts = products.slice(5, 11)

  return (
    <div>
      {/* Section title */}
      <div className="flex items-center justify-center gap-2 mb-6">
        <h1 className="text-xl md:text-2xl font-bold tracking-tight uppercase text-foreground">
          {title}
        </h1>
        <span className="text-primary">◆</span>
      </div>

      {/* Hero layout */}
      <div className="flex">
        <HeroSlider products={sliderProducts} />
        <HeroSidebar products={sidebarProducts} />
      </div>
    </div>
  )
}

/* ─────────────────────── Products Grid with Hits ─────────────────────── */

const ProductGridWithHits = () => {
  const { hits } = useHits()
  const products = (hits as unknown as Product[]).slice(0, 9)

  return <ProductGridSection products={products} title="Game Bom Tấn AAA" />
}

/* ─────────────────────── Post Card ─────────────────────── */

const PostCard = ({ post }: { post: Post }) => {
  const tags = post.tags as PostTag[] | undefined

  return (
    <Link
      href={post.slug ? Routes.post(post.slug) : '#'}
      className="group block rounded-lg overflow-hidden bg-card border border-border/40 hover:border-primary/50 transition-all"
    >
      {/* Post Image — landscape */}
      <div className="relative aspect-[16/9] overflow-hidden bg-muted">
        <Media
          resource={post.image}
          className="w-full h-full"
          imgClassName="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      {/* Info */}
      <div className="p-3">
        {/* Post title */}
        <h3 className="text-sm font-medium line-clamp-1 mb-2 text-foreground group-hover:text-primary transition-colors">
          {post.title}
        </h3>

        {/* Tags + date */}
        <div className="flex items-center justify-between gap-2">
          {tags && tags.length > 0 && (
            <div className="flex gap-1">
              {tags.slice(0, 2).map((tag) => (
                <span
                  key={tag.id}
                  className="text-[11px] text-muted-foreground border border-border/60 rounded px-1.5 py-0.5"
                >
                  {tag.title}
                </span>
              ))}
            </div>
          )}
          {post.publishedAt && (
            <span className="text-[11px] text-muted-foreground">
              {format(new Date(post.publishedAt), 'dd/MM/yyyy', { locale: vi })}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

/* ─────────────────────── Posts Section ─────────────────────── */

const PostsSection = ({ posts }: { posts: Post[] }) => {
  if (!posts || posts.length === 0) return null

  return (
    <div className="mt-8 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl md:text-2xl font-bold text-foreground">Bài viết</h2>
        <Link
          href={Routes.POSTS}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          Xem tất cả
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {posts.slice(0, 6).map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  )
}

/* ─────────────────────── Main Home Page ─────────────────────── */

interface HomePageClientProps {
  posts: Post[]
}

const HomePageClient = ({ posts }: HomePageClientProps) => {
  const { setHeaderTheme } = useHeaderTheme()

  useEffect(() => {
    setHeaderTheme('dark')
  }, [setHeaderTheme])

  return (
    <InstantSearch
      indexName={productIndex}
      searchClient={instantSearchClient.searchClient as any}
      future={{ preserveSharedStateOnUnmount: true }}
      initialUiState={{
        [productIndex]: {
          sortBy: `${productIndex}:sold:desc`,
        },
      }}
    >
      <Configure analytics={false} hitsPerPage={20} />
      <Shell>
        <div className="mt-2">
          <HeroSection title="Khám phá game mới" />
          <ProductGridWithHits />
          <PostsSection posts={posts} />
        </div>
      </Shell>
    </InstantSearch>
  )
}

export default HomePageClient
