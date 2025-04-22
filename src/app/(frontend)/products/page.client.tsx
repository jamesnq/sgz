'use client'

import { Media } from '@/components/Media'
import { Shell } from '@/components/shell'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { getProductCardStyles } from '@/lib/product-card-styles'
import { cn } from '@/lib/utils'
import { Product } from '@/payload-types'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import { formatPrice } from '@/utilities/formatPrice'
import { formatSold } from '@/utilities/formatSold'
import { instantSearchClient } from '@/utilities/meiliSearchClient'
import { Routes } from '@/utilities/routes'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Configure, InstantSearch, SearchBox, useInfiniteHits } from 'react-instantsearch'
import { useInView } from 'react-intersection-observer'
import { ProductPageHeader } from './components/ProductPageHeader'

const ProductCard = ({ product }: { product: Product }) => {
  const styles = getProductCardStyles()
  return (
    <div className={styles.wrapper}>
      <Link
        className={cn('block h-full w-full cursor-pointer', styles.link)}
        href={product.slug ? Routes.product(product.slug) : '#'}
      >
        <Card className={cn('w-full h-[131px] !p-0', styles.card)}>
          <div className="w-full">
            <div className="text-[14px] flex items-start p-0">
              <div
                className={cn(
                  'h-[131px] w-[98px] flex items-center justify-center',
                  styles.mediaContainer,
                )}
              >
                <Media
                  resource={product.image}
                  className={cn('w-full h-full', styles.media)}
                  imgClassName="absolute inset-0 h-[131px] w-[98px] object-center object-contain"
                />
              </div>
              <div className="flex w-full h-[131px] flex-1 flex-col items-start justify-between gap-[8px] p-2">
                <div>
                  <div className="flex items-center gap-1 justify-between">
                    <p
                      className={cn(
                        'line-clamp-1 h-auto text-[14px] font-bold leading-[17px]',
                        styles.name,
                      )}
                    >
                      {product.name}
                    </p>
                    {product.maxDiscount > 0 && (
                      <Badge className={styles.badge}>-{product.maxDiscount.toFixed(0)}%</Badge>
                    )}
                  </div>
                  {product.description && (
                    <p className="text-[12px] text-muted-foreground mt-2 line-clamp-2 overflow-hidden">
                      {product.description as unknown as string}
                    </p>
                  )}
                </div>
                <div className="flex w-full items-center justify-between">
                  <div className="flex">
                    <span className={cn('text-xs text-muted-foreground', styles.price)}>
                      {product.minPrice === product.maxPrice
                        ? formatPrice(product.minPrice)
                        : `${formatPrice(product.minPrice)} ~ ${formatPrice(product.maxPrice)}`}
                    </span>
                  </div>
                  {product.sold > 0 && (
                    <span className="text-[12px] leading-none text-muted-foreground">
                      Đã bán {formatSold(product.sold)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </Link>
    </div>
  )
}

const ProductHits = () => {
  const { hits, showMore, isLastPage, results } = useInfiniteHits()
  const [loadingMore, setLoadingMore] = useState(false)
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '0px 0px 500px 0px', // Increased margin to trigger loading earlier
    triggerOnce: false,
  })

  // Reset loading state when results change
  useEffect(() => {
    if (results && results.nbHits > 0) {
      setLoadingMore(false)
    }
  }, [results])

  // Handle loading more when scrolling
  useEffect(() => {
    if (inView && !isLastPage && !loadingMore) {
      setLoadingMore(true)
      showMore()
    }
  }, [inView, showMore, isLastPage, loadingMore])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-8">
      {hits.map((hit) => (
        <ProductCard key={hit.id} product={hit as unknown as Product} />
      ))}
      {!isLastPage && (
        <div ref={ref} className="col-span-full flex justify-center py-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
        </div>
      )}
    </div>
  )
}

const PageClient = () => {
  /* Force the header to be dark mode while we have an image behind it */
  const { setHeaderTheme } = useHeaderTheme()

  useEffect(() => {
    setHeaderTheme('dark')
  }, [setHeaderTheme])

  return (
    <InstantSearch indexName="products" searchClient={instantSearchClient.searchClient as any}>
      <Configure analytics={false} hitsPerPage={8} />
      <Shell>
        <ProductPageHeader />
        <SearchBox />
        <ProductHits />
      </Shell>
    </InstantSearch>
  )
}

export default PageClient
