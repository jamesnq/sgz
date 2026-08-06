'use client'

import { SearchBox } from '@/components/search/searchbox'
import { SortBy } from '@/components/search/sort-by'
import { Product } from '@/payload-types'
import { VisuallyHidden } from '@sgz/ui'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import { instantSearchClient } from '@/utilities/meiliSearchClient'
import { productIndex } from '@/utilities/searchIndexes'
import dynamic from 'next/dynamic'
import { useCallback, useEffect } from 'react'
import { Configure, InstantSearch, useInfiniteHits } from 'react-instantsearch'

const ProductFilters = dynamic(
  () => import('./ProductFilters').then((module) => module.ProductFilters),
  {
    loading: () => (
      <div className="hidden h-96 w-64 animate-pulse rounded-xl bg-white/5 lg:block" />
    ),
  },
)
const MobileProductFilters = dynamic(
  () => import('./ProductFilters').then((module) => module.MobileProductFilters),
  { ssr: false },
)
const VirtualizedProductGrid = dynamic(
  () => import('./VirtualizedProductGrid').then((module) => module.VirtualizedProductGrid),
  { ssr: false, loading: () => <div className="h-[720px] animate-pulse rounded-xl bg-white/5" /> },
)

// ─── Product Hits with Infinite Scroll ───

const ProductHits = () => {
  const { items, showMore, isLastPage, results } = useInfiniteHits()
  const loadMore = useCallback(() => {
    if (!isLastPage) {
      showMore()
    }
  }, [isLastPage, showMore])

  return (
    <div className="mb-8">
      <div className="min-h-[720px]">
        <VirtualizedProductGrid
          items={items as unknown as Product[]}
          isLastPage={isLastPage}
          onNearEnd={loadMore}
        />
      </div>

      {!isLastPage && results && (
        <div className="flex justify-center py-8" role="status" aria-live="polite">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#ba9eff] border-t-transparent" />
          <VisuallyHidden>Đang tải thêm sản phẩm</VisuallyHidden>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ───

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
            const { page: _page, ...restIndexState } = indexState
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
                page: 1,
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
        <div className="w-full px-6 lg:px-12 max-w-[1440px] mx-auto pb-12 pt-8">
          <div className="mb-8 flex flex-col items-end justify-end gap-6 md:flex-row">
            <div className="flex w-full flex-col items-center justify-end gap-4 sm:flex-row md:w-auto">
              <div className="w-full sm:w-64 lg:hidden">
                <SearchBox />
              </div>
              <SortBy
                title="Sắp xếp"
                items={[
                  { value: `${productIndex}:sold:desc`, label: 'Bán chạy nhất' },
                  { value: `${productIndex}:minPrice:asc`, label: 'Giá từ Thấp đến Cao' },
                  { value: `${productIndex}:minPrice:desc`, label: 'Giá từ Cao xuống Thấp' },
                  { value: `${productIndex}:maxDiscount:desc`, label: '% Giảm giá nhiều nhất' },
                  { value: `${productIndex}:createdAt:desc`, label: 'Mới nhất' },
                  { value: `${productIndex}:createdAt:asc`, label: 'Cũ nhất' },
                  { value: `${productIndex}:name:asc`, label: 'Tên A-Z' },
                  { value: `${productIndex}:name:desc`, label: 'Tên Z-A' },
                ]}
              />
            </div>
          </div>

          <div className="flex flex-col lg:flex-row lg:gap-12 mt-4 mb-[120px] lg:mb-0">
            <ProductFilters />
            <div className="flex-1 flex flex-col gap-2">
              <MobileProductFilters />
              <ProductHits />
            </div>
          </div>
        </div>
      </div>
    </InstantSearch>
  )
}
export default PageClient
