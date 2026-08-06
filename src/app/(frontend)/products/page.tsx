import type { Metadata } from 'next'
import { config } from '@/config'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import PageClient from './page.client'

export const dynamic = 'force-static'

export const metadata: Metadata = {
  title: `Khám phá Sản phẩm | ${config.NEXT_PUBLIC_SITE_NAME}`,
  description: 'Khám phá tất cả sản phẩm, game, dịch vụ và gói nạp game tại Sub Game Zone.',
  ...mergeOpenGraph({
    title: `Khám phá Sản phẩm | ${config.NEXT_PUBLIC_SITE_NAME}`,
    description: 'Khám phá tất cả sản phẩm, game, dịch vụ và gói nạp game tại Sub Game Zone.',
  }),
}

export default async function Page() {
  return (
    <div className="min-h-[1465px] md:min-h-[1100px]">
      <div className="mx-auto w-full max-w-[1440px] px-6 pt-12 lg:px-12">
        <div className="space-y-2">
          <h1 className="font-headline text-4xl font-bold tracking-tight text-white">
            Khám phá Sản phẩm
          </h1>
          <p className="text-[#acaab0]">
            Hàng ngàn tựa game, dịch vụ và gói nạp game đang chờ bạn.
          </p>
        </div>
      </div>
      <PageClient />
    </div>
  )
}
