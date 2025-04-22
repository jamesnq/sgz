'use client'

import { Media } from '@/components/Media'
import { RefinementList } from '@/components/search/refinement-list'
import { SearchBox } from '@/components/search/searchbox'
import { SortByHorizontal } from '@/components/search/sort-by'
import { Shell } from '@/components/shell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { getProductCardStyles } from '@/lib/product-card-styles'
import { cn } from '@/lib/utils'
import { Product } from '@/payload-types'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import { formatPrice } from '@/utilities/formatPrice'
import { formatSold } from '@/utilities/formatSold'
import { instantSearchClient } from '@/utilities/meiliSearchClient'
import { Routes } from '@/utilities/routes'
import { productIndex } from '@/utilities/searchIndexes'
import { FilterIcon } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Configure, InstantSearch, useInfiniteHits } from 'react-instantsearch'
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
                  imgClassName="absolute inset-0 h-[131px] w-[98px] object-cover"
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
  const { items, showMore, isLastPage, results } = useInfiniteHits()
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
      {items.map((hit) => (
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

function Sidebar() {
  return (
    <div className="w-full lg:w-[280px] lg:min-w-[280px] lg:pr-2 mb-8 lg:mb-0 hidden lg:block">
      <div className="sticky top-24">
        <h2 className="text-lg font-medium mb-4">Danh mục</h2>
        <RefinementList attribute="categories" />
      </div>
    </div>
  )
}

// Mobile filter component
function MobileFilters() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="lg:hidden flex items-center gap-2">
          <FilterIcon className="h-4 w-4" />
          <span>Bộ lọc</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[85vw] sm:w-[350px] pt-10">
        <SheetHeader>
          <SheetTitle>Bộ lọc sản phẩm</SheetTitle>
        </SheetHeader>
        <div className="mt-6 h-[calc(100vh-120px)] overflow-y-auto pb-20">
          <RefinementList attribute="categories" />
        </div>
      </SheetContent>
    </Sheet>
  )
}

// Mobile search component that's always fixed at the bottom on mobile screens
function MobileSearchBar() {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 p-2 z-10 bg-background shadow-md border-t border-border">
      <div className="flex items-center gap-2">
        <MobileFilters />
        <div className="flex-1">
          <SearchBox />
        </div>
      </div>
      <div className="mt-2">
        <SortByHorizontal
          items={[
            {
              value: `${productIndex}`,
              label: 'Liên quan',
            },
            {
              value: `${productIndex}:sold:desc`,
              label: 'Bán chạy',
            },
            {
              value: `${productIndex}:maxDiscount:desc`,
              label: 'Giảm giá sốc',
            },
          ]}
        />
      </div>
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
    <InstantSearch indexName={productIndex} searchClient={instantSearchClient.searchClient as any}>
      <Configure analytics={false} hitsPerPage={8} />
      <Shell>
        <ProductPageHeader />

        {/* Mobile search and filter bar */}
        <MobileSearchBar />

        <div className="flex flex-col lg:flex-row lg:gap-6 mt-4 mb-[120px] lg:mb-0">
          <Sidebar />
          <div className="flex-1 flex flex-col gap-2">
            {/* Desktop search and sort */}
            <div className="hidden lg:block">
              <SearchBox />
            </div>
            <div className="hidden lg:block">
              <SortByHorizontal
                items={[
                  {
                    value: `${productIndex}:sold:desc`,
                    label: 'Bán chạy',
                  },
                  {
                    value: `${productIndex}:maxDiscount:desc`,
                    label: 'Giảm giá sốc',
                  },
                ]}
              />
            </div>
            <ProductHits />
          </div>
        </div>
      </Shell>
    </InstantSearch>
  )
}

export default PageClient
