import type { Metadata } from 'next'
import AffiliatePageClient from './page.client'

export const metadata: Metadata = {
  title: 'Thu nhập Affiliate',
  description: 'Xem thống kê hoa hồng và sao kê đơn hàng từ mã voucher affiliate của bạn',
}

export default function AffiliatePage() {
  return <AffiliatePageClient />
}
