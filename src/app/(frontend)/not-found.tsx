import Link from 'next/link'
import React from 'react'

import { Button } from '@/components/ui/button'
import { Shell } from '@/components/shell'

export default function NotFound() {
  return (
    <Shell>
      <div className="prose max-w-none">
        <h1 style={{ marginBottom: 0 }}>404</h1>
        <p className="mb-4">Đường đẫn không tồn tại</p>
      </div>
      <Button asChild variant="default">
        <Link href="/">Trang chủ</Link>
      </Button>
    </Shell>
  )
}
