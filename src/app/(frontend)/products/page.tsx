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
  return <PageClient />
}
