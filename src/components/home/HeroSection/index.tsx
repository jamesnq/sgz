import AnimatedWordCycle from '@/components/ui/animated-text-cycle'
import { config } from '@/config'
import { ChevronDown, Gamepad2, Mouse, ShoppingBag, Users } from 'lucide-react'
import Image from 'next/image'
import { StatItem } from './StatItem'

interface HeroSectionProps {
  stats: {
    orders: number
    users: number
    products: number
  }
}

export const HeroSection = ({ stats }: HeroSectionProps) => {
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
            alt={`${config.NEXT_PUBLIC_SITE_NAME} Hero`}
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
              <StatItem 
                icon={<ShoppingBag className="w-6 h-6" />}
                value={stats.orders}
                label="Đơn đặt hàng"
              />

              <div className="w-full md:w-px h-px md:h-8 bg-white/10"></div>

              <StatItem 
                icon={<Users className="w-6 h-6" />}
                value={stats.users}
                label="Khách hàng"
              />

              <div className="w-full md:w-px h-px md:h-8 bg-white/10"></div>

              <StatItem 
                icon={<Gamepad2 className="w-6 h-6" />}
                value={stats.products}
                label="Sản phẩm"
              />
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
