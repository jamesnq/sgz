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

import { ProductCard } from '@/components/ProductCard'

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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
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
      <div className="sticky top-24 space-y-6">
        <SearchBox />
        <RefinementList attribute="categories" className="text-sgz-textMuted" />
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
            const indexState = uiState[productIndex] || {}
            // Remove 'page' from the URL so infinite scrolling doesn't change the URL
            // and F5 refresh will always start from page 1.
            const { page, ...restIndexState } = indexState

            return {
              ...uiState,
              [productIndex]: restIndexState,
            }
          },
          routeToState(routeState: any) {
            const indexState = routeState[productIndex] || {}
            return {
              ...routeState,
              [productIndex]: {
                ...indexState,
                query: routeState.q || indexState.query,
                sortBy: indexState.sortBy || `${productIndex}:sold:desc`,
                page: 1, // Always force page 1 on initial load from URL
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
      <Configure analytics={false} hitsPerPage={12} filters="status = 'PUBLIC'" />

      <div className="mb-16">
        <div className="w-full px-6 lg:px-12 max-w-[1440px] mx-auto py-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
            <div className="space-y-2">
              <h1 className="font-headline text-4xl font-bold tracking-tight text-white">
                Khám phá Trò chơi
              </h1>
              <p className="text-[#acaab0]">Hàng ngàn tựa game tuyệt đỉnh đang chờ bạn.</p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-4 w-full md:w-auto">
              <div className="w-full sm:w-64 lg:hidden">
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
                    value: `${productIndex}:name:asc`,
                    label: 'Tên A-Z',
                  },
                  {
                    value: `${productIndex}:name:desc`,
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
