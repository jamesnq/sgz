import type { Metadata } from 'next'
import { Suspense } from 'react'
import PageClient from './page.client'

export const metadata: Metadata = {
  title: 'Kết quả thanh toán',
  robots: { index: false, follow: false },
}

const Page = () => {
  return (
    <Suspense>
      <PageClient />
    </Suspense>
  )
}

export default Page
