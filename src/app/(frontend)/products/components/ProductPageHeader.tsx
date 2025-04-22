import AnimatedWordCycle from '@/components/ui/animated-text-cycle'
import { env } from '@/config'

export const ProductPageHeader = () => {
  return (
    <div className="grid container items-center pb-4 max-w-6xl gap-0">
      <div className="flex max-w-[61.25rem] flex-col md:py-6 md:pb-4 lg:py-12 lg:pb-10 mx-auto items-center gap-2 text-center">
        <div className="font-bold tracking-tighter lg:leading-[1.1] text-3xl md:text-5xl animate-fade-up wave-text">
          {env.NEXT_PUBLIC_SITE_NAME}
        </div>
        <h1 className="font-bold tracking-tighter lg:leading-[1.1] text-2xl md:text-4xl animate-fade-up">
          Dịch vụ{' '}
          <AnimatedWordCycle
            className="text-highlight"
            words={[
              ['nạp', 'nạp', '', ''],
              ['ứng dụng', 'game', 'tài khoản', 'phần mềm'],
            ]}
            interval={3000}
          />{' '}
          giá rẻ
        </h1>
      </div>
    </div>
  )
}

export default ProductPageHeader
