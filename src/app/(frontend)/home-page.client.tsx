'use client'

import { Media } from '@/components/Media'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import { productIndex } from '@/utilities/searchIndexes'
import { useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Post, Product } from '@/payload-types'

// Lazy load below-the-fold components
const FeaturedSection = dynamic(() => import('@/components/home/FeaturedSection').then(mod => mod.FeaturedSection), { ssr: true })
const PostsSection = dynamic(() => import('@/components/home/PostsSection').then(mod => mod.PostsSection), { ssr: true })
const ProductGridSection = dynamic(() => import('@/components/home/ProductGridSection').then(mod => mod.ProductGridSection), { ssr: true })
const SocialSupport = dynamic(() => import('@/components/social-support').then(mod => mod.SocialSupport), { ssr: false })

import { HeroSection } from '@/components/home/HeroSection'

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
    <>
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
          <ProductGridSection
            products={bestSellingProducts}
            title="Game Bán Chạy"
            subtitle="Những siêu phẩm không thể bỏ lỡ từ đội ngũ của chúng tôi."
            viewAllLink="/products?products[refinementList][categories][0]=Key Steam&products[refinementList][categories][1]=Tài khoản steam offline"
          />
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
    </>
  )
}

export default HomePageClient
