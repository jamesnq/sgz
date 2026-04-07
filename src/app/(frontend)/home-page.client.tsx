'use client'

import AnimatedWordCycle from '@/components/ui/animated-text-cycle'
import { config } from '@/config'
import { Media } from '@/components/Media'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import { instantSearchClient } from '@/utilities/meiliSearchClient'
import { productIndex } from '@/utilities/searchIndexes'
import {
  ChevronDown,
  Gamepad2,
  Mouse,
  ShoppingBag,
  Users,
} from 'lucide-react'
import Image from 'next/image'
import { useEffect } from 'react'
import { Configure, InstantSearch } from 'react-instantsearch'
import dynamic from 'next/dynamic'
import { Post, Product } from '@/payload-types'

// Lazy load below-the-fold components
const FeaturedSection = dynamic(() => import('@/components/home/FeaturedSection').then(mod => mod.FeaturedSection), { ssr: true })
const PostsSection = dynamic(() => import('@/components/home/PostsSection').then(mod => mod.PostsSection), { ssr: true })
const ProductGridSection = dynamic(() => import('@/components/home/ProductGridSection').then(mod => mod.ProductGridSection), { ssr: true })
const SocialSupport = dynamic(() => import('@/components/social-support').then(mod => mod.SocialSupport), { ssr: false })

/* ─────────────────────── Hero Section ─────────────────────── */

const HeroSection = ({ stats }: { stats: { orders: number; users: number; products: number } }) => {
  return (
    <section
      id="hero-section"
      className="relative min-h-[calc(100dvh-80px)] pt-6 md:pt-8 pb-32 md:pb-16 flex items-center overflow-hidden"
    >
      <div className="absolute inset-0 z-0 bg-sgz-dark">
        {/* Render video only on desktop for performance */}
        <div className="hidden md:block absolute inset-0">
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
        </div>
        {/* Mobile static poster fallback */}
        <div className="md:hidden absolute inset-0">
          <Image
            src="/herovideo_optimized.webp"
            alt="Sub Game Zone Hero"
            fill
            className="object-cover"
            priority
          />
        </div>
        <div className="absolute inset-0 bg-black/50 z-10"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent z-10 opacity-80"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10"></div>
      </div>
      <div className="relative z-20 w-full px-6 lg:px-12 max-w-[1440px] mx-auto mb-8 md:mb-0">
        <div className="max-w-3xl space-y-5 md:space-y-8">
          <div className="font-extrabold tracking-tighter lg:leading-[1.1] text-4xl sm:text-5xl md:text-7xl lg:text-8xl animate-fade-up wave-text text-white uppercase">
            {config.NEXT_PUBLIC_SITE_NAME}
          </div>
          <h1 className="font-bold tracking-tighter lg:leading-[1.2] text-2xl sm:text-3xl md:text-5xl animate-fade-up text-white">
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

const ProductGridWithHits = ({ products }: { products: Product[] }) => {
  return (
    <ProductGridSection
      products={products}
      title="Game Bán Chạy"
      subtitle="Những siêu phẩm không thể bỏ lỡ từ đội ngũ của chúng tôi."
      viewAllLink="/products?products[refinementList][categories][0]=Key Steam&products[refinementList][categories][1]=Tài khoản steam offline"
    />
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
  bestSellingProducts: Product[]
}

const HomePageClient = ({
  posts,
  stats,
  latestProducts,
  topUpProducts,
  serviceProducts,
  featuredProducts,
  bestSellingProducts,
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
          <ProductGridWithHits products={bestSellingProducts} />
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
          <SocialSupport />
        </div>
      </div>
    </InstantSearch>
  )
}

export default HomePageClient
