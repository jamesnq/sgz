'use client'

import { Media } from '@/components/Media'
import { PriceRangeFilter } from '@/components/search/price-range-filter'
import { RefinementList } from '@/components/search/refinement-list'
import { SearchBox } from '@/components/search/searchbox'
import { SortBy } from '@/components/search/sort-by'
import { Product } from '@/payload-types'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import { formatPrice } from '@/utilities/formatPrice'
import { formatSold } from '@/utilities/formatSold'
import { instantSearchClient } from '@/utilities/meiliSearchClient'
import { Routes } from '@/utilities/routes'
import { productIndex } from '@/utilities/searchIndexes'
import { ShoppingCart } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Configure, InstantSearch, useInfiniteHits } from 'react-instantsearch'
import { useInView } from 'react-intersection-observer'

const ProductCard = ({ product }: { product: Product }) => {
  const discount = product.maxDiscount || 0
  const salePrice = product.minPrice || 0
  const originalPrice = discount > 0 ? Math.round(salePrice / (1 - discount / 100)) : salePrice

  return (
    <div className="group cursor-pointer block">
      <div className="relative aspect-video rounded-xl overflow-hidden mb-4 bg-sgz-surface">
        <Media
          resource={product.image}
          className="w-full h-full"
          imgClassName="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        {discount > 0 && (
          <div className="absolute top-3 left-3 bg-[#ff97b5] text-[#380018] font-bold px-2 py-1 rounded text-xs z-10">
            -{discount.toFixed(0)}%
          </div>
        )}
        <div className="absolute bottom-3 right-3 translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all z-20">
          <Link
            href={product.slug ? Routes.product(product.slug) : '#'}
            className="bg-sgz-primary text-sgz-textDark p-3 rounded-xl shadow-xl flex hover:bg-white transition-colors"
          >
            <ShoppingCart className="w-5 h-5 leading-none" />
          </Link>
        </div>
      </div>
      <Link href={product.slug ? Routes.product(product.slug) : '#'}>
        <h3 className="font-bold text-white line-clamp-1 mb-1 group-hover:text-sgz-primary transition-colors">
          {product.name}
        </h3>
      </Link>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {discount > 0 && (
            <span className="text-sgz-textMuted line-through text-sm">
              {formatPrice(originalPrice)}
            </span>
          )}
          <span className="text-sgz-primary font-bold">{formatPrice(salePrice)}</span>
        </div>
        {product.sold > 0 && (
          <div className="text-[11px] text-[#acaab0]">Đã bán {formatSold(product.sold)}</div>
        )}
      </div>
    </div>
  )
}

const ProductHits = () => {
  const { items, showMore, isLastPage, results } = useInfiniteHits()
  const [loadingMore, setLoadingMore] = useState(false)

  // Intersection observer for infinite loading
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0,
    rootMargin: '0px 0px 500px 0px',
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
    <div className="mb-8">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
        {items.map((item, index) => (
          <div key={item.objectID || index} className="w-full">
            <ProductCard product={item as unknown as Product} />
          </div>
        ))}
      </div>

      {!isLastPage && (
        <div ref={loadMoreRef} className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#ba9eff] border-t-transparent"></div>
        </div>
      )}
    </div>
  )
}

function Sidebar() {
  return (
    <div className="hidden lg:block w-64 shrink-0">
      <div className="sticky top-24 pt-2 space-y-6">
        <RefinementList attribute="categories" className="text-[#acaab0]" />
        <PriceRangeFilter attribute="minPrice" title="Khoảng giá" />
      </div>
    </div>
  )
}

const PageClient = () => {
  const { setHeaderTheme } = useHeaderTheme()

  useEffect(() => {
    setHeaderTheme('dark')
  }, [setHeaderTheme])

  return (
    <InstantSearch
      indexName={productIndex}
      searchClient={instantSearchClient.searchClient as any}
      routing={{
        stateMapping: {
          stateToRoute(uiState: any) {
            return uiState
          },
          routeToState(routeState: any) {
            const indexState = routeState[productIndex] || {}
            return {
              ...routeState,
              [productIndex]: {
                ...indexState,
                query: routeState.q || indexState.query,
                sortBy: indexState.sortBy || `${productIndex}:sold:desc`,
              },
            }
          },
        },
      }}
      future={{ preserveSharedStateOnUnmount: true }}
      initialUiState={{
        [productIndex]: {
          sortBy: `${productIndex}:sold:desc`,
        },
      }}
    >
      <Configure analytics={false} hitsPerPage={12} />

      <div className="mb-16">
        <div className="w-full px-6 lg:px-12 max-w-[1920px] mx-auto py-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
            <div className="space-y-2">
              <h1 className="font-headline text-4xl font-bold tracking-tight text-white">
                Khám phá Trò chơi
              </h1>
              <p className="text-[#acaab0]">Hàng ngàn tựa game tuyệt đỉnh đang chờ bạn.</p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
              <div className="w-full sm:w-64">
                <SearchBox />
              </div>
              <SortBy
                title="Sắp xếp"
                items={[
                  {
                    value: `${productIndex}:sold:desc`,
                    label: 'Bán chạy nhất',
                  },
                  {
                    value: `${productIndex}:minPrice:asc`,
                    label: 'Giá từ Thấp đến Cao',
                  },
                  {
                    value: `${productIndex}:minPrice:desc`,
                    label: 'Giá từ Cao xuống Thấp',
                  },
                  {
                    value: `${productIndex}:maxDiscount:desc`,
                    label: '% Giảm giá nhiều nhất',
                  },
                  {
                    value: `${productIndex}:createdAt:desc`,
                    label: 'Mới nhất',
                  },
                  {
                    value: `${productIndex}:createdAt:asc`,
                    label: 'Cũ nhất',
                  },
                  {
                    value: `${productIndex}:title:asc`,
                    label: 'Tên A-Z',
                  },
                  {
                    value: `${productIndex}:title:desc`,
                    label: 'Tên Z-A',
                  },
                ]}
              />
            </div>
          </div>
          
          <div className="flex flex-col lg:flex-row lg:gap-12 mt-4 mb-[120px] lg:mb-0">
            <Sidebar />
            <div className="flex-1 flex flex-col gap-2">
              <ProductHits />
            </div>
          </div>
        </div>
      </div>
    </InstantSearch>
  )
}
export default PageClient

