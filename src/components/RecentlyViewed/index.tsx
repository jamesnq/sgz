'use client'

import { getProductsByIdsAction } from '@/app/_actions/getProductsByIdsAction'
import { ProductCard } from '@/components/ProductCard'
import type { Product } from '@/payload-types'
import { getRecentlyViewedIds } from '@/utilities/recentlyViewed'
import { cn } from '@/utilities/ui'
import { History } from 'lucide-react'
import React, { useEffect, useState } from 'react'

export const RecentlyViewed = ({
  excludeId,
  limit = 5,
  className,
}: {
  /** Product currently on screen — not worth listing again */
  excludeId?: number
  limit?: number
  className?: string
}) => {
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    const ids = getRecentlyViewedIds()
      .filter((id) => id !== excludeId)
      .slice(0, limit)
    if (ids.length === 0) {
      setProducts([])
      return
    }

    let cancelled = false
    getProductsByIdsAction({ ids })
      .then((res) => {
        if (!cancelled) setProducts(res?.data?.products ?? [])
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [excludeId, limit])

  if (products.length === 0) return null

  return (
    <section className={cn('pt-4', className)} aria-labelledby="recently-viewed-title">
      <h2
        id="recently-viewed-title"
        className="text-xl font-bold tracking-tight text-white flex items-center gap-2 mb-6"
      >
        <History className="w-5 h-5 text-sgz-primary" aria-hidden="true" />
        Đã xem gần đây
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  )
}
