import type { Metadata } from 'next'
import AffiliatePageClient from './page.client'
import { getServerSession } from '@/hooks/getServerSession'
import { checkIsAffiliate } from '@/utilities/user'
import { redirect } from 'next/navigation'
import { Routes } from '@/utilities/routes'

export const metadata: Metadata = {
  title: 'Thu nhập Affiliate',
  description: 'Xem thống kê hoa hồng và sao kê đơn hàng từ mã voucher affiliate của bạn',
}

export default async function AffiliatePage() {
  const { user } = await getServerSession()
  const isAffiliate = await checkIsAffiliate(user?.id)

  if (!isAffiliate) {
    redirect(Routes.ORDERS)
  }

  return <AffiliatePageClient />
}
