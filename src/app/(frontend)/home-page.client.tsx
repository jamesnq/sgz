'use client'

import AnimatedWordCycle from '@/components/ui/animated-text-cycle'
import { config } from '@/config'
import { Media } from '@/components/Media'
import { Shell } from '@/components/shell'
import { cn } from '@/lib/utils'
import { Category, Post, PostTag, Product } from '@/payload-types'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import { formatPrice } from '@/utilities/formatPrice'
import { formatSold } from '@/utilities/formatSold'
import { instantSearchClient } from '@/utilities/meiliSearchClient'
import { Routes } from '@/utilities/routes'
import { productIndex } from '@/utilities/searchIndexes'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import {
  ChevronRight,
  ShoppingCart,
  Clock,
  ShoppingBag,
  Gamepad2,
  Users,
  ChevronDown,
  Mouse,
  Star,
} from 'lucide-react'
import Link from 'next/link'
import { useEffect } from 'react'
import { Configure, InstantSearch, useHits } from 'react-instantsearch'
import { motion } from 'framer-motion'

/* ─────────────────────── Hero Section ─────────────────────── */

const HeroSection = ({ stats }: { stats: { orders: number; users: number; products: number } }) => {
  return (
    <section
      id="hero-section"
      className="relative min-h-[calc(100dvh-80px)] pt-6 md:pt-8 pb-32 md:pb-16 flex items-center overflow-hidden"
    >
      <div className="absolute inset-0 z-0 bg-sgz-dark">
        <video
          autoPlay
          loop
          muted
          playsInline
          poster="/herovideo_optimized.webp"
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/herovideo_compressed.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/50 z-10"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent z-10 opacity-80"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10"></div>
      </div>
      <div className="relative z-20 w-full px-6 lg:px-12 max-w-[1440px] mx-auto mb-8 md:mb-0">
        <div className="max-w-3xl space-y-5 md:space-y-8">
          <div className="font-extrabold tracking-tighter lg:leading-[1.1] text-4xl sm:text-5xl md:text-7xl lg:text-8xl animate-fade-up wave-text text-white uppercase">
            {config.NEXT_PUBLIC_SITE_NAME}
          </div>
          <h1 className="font-bold tracking-tighter lg:leading-[1.1] text-2xl sm:text-3xl md:text-5xl animate-fade-up text-white">
            Cung cấp{' '}
            <AnimatedWordCycle
              className="text-sgz-primary drop-shadow-[0_0_15px_rgba(186,158,255,0.4)]"
              words={[
                ['nạp', '', 'game'],
                ['game', 'dịch vụ', 'bản quyền'],
              ]}
              interval={3000}
            />{' '}
            giá rẻ
          </h1>
          <p className="text-sgz-textMuted text-sm sm:text-lg md:text-xl max-w-xl font-medium leading-relaxed">
            Khám phá hàng ngàn tựa game được chọn lọc với giá ưu đãi. Từ bom tấn AAA đến siêu phẩm
            indie, cuộc phiêu lưu tiếp theo của bạn bắt đầu tại đây.
          </p>
          <div className="flex flex-wrap gap-8 pt-4 md:pt-8">
            <div className="inline-flex flex-col md:flex-row items-start md:items-center gap-5 md:gap-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl px-6 md:px-8 py-5 shadow-2xl">
              <div className="flex items-center justify-start gap-4 group cursor-default">
                <div className="w-12 h-12 shrink-0 rounded-full bg-sgz-primary/20 flex items-center justify-center text-sgz-primary group-hover:scale-110 group-hover:bg-sgz-primary/30 transition-all">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl md:text-3xl font-black bg-clip-text text-transparent bg-gradient-to-br from-white to-gray-400">
                    {stats.orders.toLocaleString()}
                  </span>
                  <span className="text-sgz-textMuted text-xs font-semibold uppercase tracking-widest mt-1">
                    Đơn đặt hàng
                  </span>
                </div>
              </div>

              <div className="w-full md:w-px h-px md:h-8 bg-white/10"></div>

              <div className="flex items-center justify-start gap-4 group cursor-default">
                <div className="w-12 h-12 shrink-0 rounded-full bg-sgz-primary/20 flex items-center justify-center text-sgz-primary group-hover:scale-110 group-hover:bg-sgz-primary/30 transition-all">
                  <Users className="w-6 h-6" />
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl md:text-3xl font-black bg-clip-text text-transparent bg-gradient-to-br from-white to-gray-400">
                    {stats.users.toLocaleString()}
                  </span>
                  <span className="text-sgz-textMuted text-xs font-semibold uppercase tracking-widest mt-1">
                    Khách hàng
                  </span>
                </div>
              </div>

              <div className="w-full md:w-px h-px md:h-8 bg-white/10"></div>

              <div className="flex items-center justify-start gap-4 group cursor-default">
                <div className="w-12 h-12 shrink-0 rounded-full bg-sgz-primary/20 flex items-center justify-center text-sgz-primary group-hover:scale-110 group-hover:bg-sgz-primary/30 transition-all">
                  <Gamepad2 className="w-6 h-6" />
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl md:text-3xl font-black bg-clip-text text-transparent bg-gradient-to-br from-white to-gray-400">
                    {stats.products.toLocaleString()}
                  </span>
                  <span className="text-sgz-textMuted text-xs font-semibold uppercase tracking-widest mt-1">
                    Sản phẩm
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Down Indicator */}
      <div
        className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-fade-up"
        style={{ animationDelay: '800ms', animationFillMode: 'both' }}
      >
        <div className="flex flex-col items-center justify-center opacity-80 animate-bounce">
          <Mouse className="w-5 h-5 text-white mb-2" />
          <span className="text-[10px] uppercase tracking-[0.2em] text-sgz-primary font-bold">
            Xem thêm
          </span>
          <ChevronDown className="w-4 h-4 text-sgz-primary -mt-1" />
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────── Horizontal Product Card ─────────────────────── */

const ProductCard = ({ product }: { product: Product }) => {
  const discount = product.maxDiscount || 0
  const salePrice = product.minPrice || 0
  const originalPrice = discount > 0 ? Math.round(salePrice / (1 - discount / 100)) : salePrice

  return (
    <div className="group cursor-pointer flex flex-col h-full">
      <div className="relative aspect-video rounded-xl overflow-hidden mb-4 bg-sgz-surface shrink-0">
        <Media
          resource={product.image}
          className="w-full h-full"
          imgClassName="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          size="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
        />
        {discount > 0 && (
          <div className="absolute top-3 left-3 bg-[#ff97b5] text-[#380018] font-bold px-2 py-1 rounded text-xs">
            -{discount.toFixed(0)}%
          </div>
        )}
        <div className="absolute bottom-3 right-3 translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
          <Link
            href={product.slug ? Routes.product(product.slug) : '#'}
            className="bg-sgz-primary text-sgz-textDark p-3 rounded-xl shadow-xl flex hover:bg-white transition-colors"
          >
            <ShoppingCart className="w-5 h-5 leading-none" />
          </Link>
        </div>
      </div>
      <Link href={product.slug ? Routes.product(product.slug) : '#'} className="mb-1">
        <h3 className="font-bold text-white line-clamp-1 group-hover:text-sgz-primary transition-colors">
          {product.name}
        </h3>
      </Link>
      
      <div className="text-[11px] text-[#acaab0] mb-2 mt-0.5 flex items-center gap-1.5 font-medium">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-flame text-orange-500/80 fill-orange-500/20"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
        Đã bán {formatSold(product.sold || 0)}
      </div>

      <div className="flex items-center gap-2 mt-auto pt-1">
        {discount > 0 && (
          <span className="text-sgz-textMuted line-through text-sm">
            {formatPrice(originalPrice)}
          </span>
        )}
        <span className="text-sgz-primary font-bold">{formatPrice(salePrice)}</span>
      </div>
    </div>
  )
}

/* ─────────────────────── Section: "Sản Phẩm Nổi Bật" ─────────────────────── */

const ProductGridSection = ({
  products,
  title,
  subtitle,
  viewAllLink,
}: {
  products: Product[]
  title: string
  subtitle?: string
  viewAllLink?: string
}) => {
  if (!products || products.length === 0) return null

  return (
    <motion.section
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, margin: '-100px' }}
      transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
      className="mb-16"
    >
      <div className="flex flex-col sm:flex-row justify-between sm:items-end mb-8 gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-4">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white">{title}</h2>
            <div className="h-px flex-1 bg-sgz-border/30 hidden sm:block"></div>
          </div>
          {subtitle && <p className="text-sgz-textMuted">{subtitle}</p>}
        </div>
        <Link
          href={viewAllLink || Routes.PRODUCTS || '#'}
          className="text-sgz-primary font-bold flex items-center gap-1 hover:underline shrink-0 sm:ml-6"
        >
          Xem tất cả
          <ChevronRight className="w-5 h-5" />
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </motion.section>
  )
}

const ProductGridWithHits = () => {
  const { hits } = useHits()
  const products = (hits as unknown as Product[]).slice(0, 10)

  return (
    <ProductGridSection
      products={products}
      title="Game Bán Chạy"
      subtitle="Những siêu phẩm không thể bỏ lỡ từ đội ngũ của chúng tôi."
      viewAllLink="/products?products[refinementList][categories][0]=Key Steam&products[refinementList][categories][1]=Tài khoản steam offline"
    />
  )
}

/* ─────────────────────── Section: "Game Nổi Bật" ─────────────────────── */

const FeaturedSection = ({ products }: { products: Product[] }) => {
  if (!products || products.length === 0) return null

  return (
    <motion.section
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, margin: '-100px' }}
      transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
      className="mb-16"
    >
      <div className="flex flex-col sm:flex-row justify-between sm:items-end mb-8 gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Star className="w-5 h-5 text-white fill-white" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
                Game Nổi Bật
              </h2>
            </div>
            <div className="h-px flex-1 bg-gradient-to-r from-amber-500/30 to-transparent hidden sm:block"></div>
          </div>
          <p className="text-sgz-textMuted">
            Những tựa game được đội ngũ chúng tôi đặc biệt khuyến nghị.
          </p>
        </div>
        <Link
          href="/products"
          className="text-amber-400 font-bold flex items-center gap-1 hover:underline shrink-0 sm:ml-6"
        >
          Xem tất cả
          <ChevronRight className="w-5 h-5" />
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {products.map((product) => (
          <div key={product.id} className="relative">
            <div className="absolute -top-2 -right-2 z-10 w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <Star className="w-3.5 h-3.5 text-white fill-white" />
            </div>
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </motion.section>
  )
}

/* ─────────────────────── Post Card ─────────────────────── */

const PostCard = ({ post }: { post: Post }) => {
  const tags = post.tags as PostTag[] | undefined
  const category = tags && tags.length > 0 && typeof tags[0] === 'object' ? tags[0]?.title : null

  return (
    <article
      className="rounded-2xl overflow-hidden group hover:bg-[#1f1f24] transition-colors flex flex-col h-full"
      style={{
        background: 'rgba(25, 25, 30, 0.7)',
        backdropFilter: 'blur(12px)',
        borderTop: '1px solid rgba(72, 71, 76, 0.2)',
      }}
    >
      <div className="h-48 overflow-hidden relative shrink-0">
        <Media
          resource={post.image}
          className="w-full h-full"
          imgClassName="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          size="(max-width: 768px) 100vw, 33vw"
        />
      </div>
      <div className="p-6 space-y-4 flex flex-col flex-1">
        <div>
          {category && (
            <span className="bg-sgz-primary/10 text-sgz-primary text-[10px] font-bold px-2 py-0.5 rounded tracking-widest uppercase">
              {category}
            </span>
          )}
        </div>
        <Link href={post.slug ? Routes.post(post.slug) : '#'} className="flex-1">
          <h3 className="font-bold text-white text-xl leading-snug line-clamp-2 group-hover:text-sgz-primary transition-colors">
            {post.title}
          </h3>
        </Link>
        <div className="pt-2 flex items-center gap-2 text-xs text-sgz-textMuted mt-auto">
          <Clock className="w-4 h-4" />
          {post.publishedAt
            ? format(new Date(post.publishedAt), 'dd/MM/yyyy', { locale: vi })
            : 'Mới đây'}
        </div>
      </div>
    </article>
  )
}

/* ─────────────────────── Posts Section ─────────────────────── */

const PostsSection = ({ posts }: { posts: Post[] }) => {
  if (!posts || posts.length === 0) return null

  return (
    <motion.section
      id="posts-section"
      className="mb-16"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, margin: '-100px' }}
      transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
    >
      <div className="flex flex-col sm:flex-row justify-between sm:items-end mb-8 gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-4">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white">Bài Viết</h2>
            <div className="h-px flex-1 bg-sgz-border/30 hidden sm:block"></div>
          </div>
          <p className="text-sgz-textMuted">Cập nhật tin tức và thủ thuật mới nhất.</p>
        </div>
        <Link
          href={Routes.POSTS || '#'}
          className="text-sgz-primary font-bold flex items-center gap-1 hover:underline shrink-0 sm:ml-6"
        >
          Xem tất cả
          <ChevronRight className="w-5 h-5" />
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {posts.slice(0, 3).map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </motion.section>
  )
}

/* ─────────────────────── Main Home Page ─────────────────────── */

interface HomePageClientProps {
  posts: Post[]
  stats: {
    orders: number
    users: number
    products: number
  }
  latestProducts: Product[]
  topUpProducts?: Product[]
  serviceProducts?: Product[]
  featuredProducts?: Product[]
}

const HomePageClient = ({
  posts,
  stats,
  latestProducts,
  topUpProducts,
  serviceProducts,
  featuredProducts,
}: HomePageClientProps) => {
  const { setHeaderTheme } = useHeaderTheme()

  useEffect(() => {
    setHeaderTheme('dark')

    let isSnapping = false
    let lastScrollY = window.scrollY

    const handleScroll = () => {
      const currentY = window.scrollY
      const delta = currentY - lastScrollY
      lastScrollY = currentY

      if (isSnapping) return

      const heroEl = document.getElementById('hero-section')
      if (!heroEl) return

      // Tính chính xác tọa độ của vùng nội dung ngay dưới Hero
      const contentTop = heroEl.getBoundingClientRect().bottom + window.scrollY
      const targetY = contentTop - 80 // Trừ 80px chiều cao của Header

      // Kéo xuống khi đang ở nửa trên Hero
      if (delta > 0 && currentY > 20 && currentY < targetY - 50) {
        isSnapping = true
        window.scrollTo({ top: targetY, behavior: 'smooth' })
        setTimeout(() => {
          isSnapping = false
        }, 800)
      }
      // Kéo lên khi đang lấp lửng ở Hero
      else if (delta < 0 && currentY > 20 && currentY < targetY - 50) {
        isSnapping = true
        window.scrollTo({ top: 0, behavior: 'smooth' })
        setTimeout(() => {
          isSnapping = false
        }, 800)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [setHeaderTheme])

  return (
    <InstantSearch
      indexName={`${productIndex}:sold:desc`}
      searchClient={instantSearchClient.searchClient as any}
      future={{ preserveSharedStateOnUnmount: true }}
    >
      <Configure
        analytics={false}
        hitsPerPage={10}
        filters="(categories='Key Steam' OR categories='Tài khoản steam offline') AND status = 'PUBLIC'"
      />
      <div className="mb-16">
        <HeroSection stats={stats} />
        <div className="w-full px-6 lg:px-12 max-w-[1440px] mx-auto py-8 space-y-16">
          {featuredProducts && featuredProducts.length > 0 && (
            <FeaturedSection products={featuredProducts} />
          )}
          {latestProducts && latestProducts.length > 0 && (
            <ProductGridSection
              products={latestProducts}
              title="Game Mới Nhất"
              subtitle="Những tựa game vừa cập bến cửa hàng, hãy là người đầu tiên trải nghiệm."
              viewAllLink="/products?products[refinementList][categories][0]=Key Steam&products[refinementList][categories][1]=Tài khoản steam offline"
            />
          )}
          <ProductGridWithHits />
          {topUpProducts && topUpProducts.length > 0 && (
            <ProductGridSection
              products={topUpProducts}
              title="Gói Nạp In-Game Nổi Bật"
              subtitle="Nạp game nhanh chóng, an toàn và đa dạng lựa chọn."
              viewAllLink="/products?products[refinementList][categories][0]=Nạp game"
            />
          )}
          {serviceProducts && serviceProducts.length > 0 && (
            <ProductGridSection
              products={serviceProducts}
              title="Dịch Vụ"
              subtitle="Các dịch vụ hỗ trợ game thủ chuyên nghiệp."
              viewAllLink="/products?products[refinementList][categories][0]=Dịch vụ"
            />
          )}
          <PostsSection posts={posts} />
        </div>
      </div>
    </InstantSearch>
  )
}

export default HomePageClient
