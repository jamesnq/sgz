'use client'

import { useHeaderTheme } from '@/providers/HeaderTheme'
import { debounce } from 'lodash'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState, useTransition } from 'react'

import { Media } from '@/components/Media'
import RichText from '@/components/RichText'
import { Shell } from '@/components/shell'
import AnimatedWordCycle from '@/components/ui/animated-text-cycle'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { CustomPagination } from '@/components/ui/custom-pagination'
import { Input } from '@/components/ui/input'
import { env } from '@/config'
import { getProductCardStyles } from '@/lib/product-card-styles'
import { cn } from '@/lib/utils'
import { Category, Product } from '@/payload-types'
import { formatPrice } from '@/utilities/formatPrice'
import { formatSold } from '@/utilities/formatSold'
import { Routes } from '@/utilities/routes'
import { hasText } from '@payloadcms/richtext-lexical/shared'
import { Search, X } from 'lucide-react'
import Link from 'next/link'
import { PaginatedDocs } from 'payload'

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
                  {hasText(product.description) && (
                    <RichText
                      className="text-[12px] text-muted-foreground mt-2 line-clamp-2 overflow-hidden"
                      data={product.description as any}
                      enableGutter={false}
                      textOnly
                    />
                  )}
                </div>
                <div className="flex w-full items-center justify-between">
                  <div className="flex">
                    <span className={cn('leading-[13px] text-muted-foreground', styles.price)}>
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

// Sidebar component for search and filters
const Sidebar = ({
  searchTerm,
  handleSearchChange,
  categories,
  selectedCategoryIds,
  handleCategoryToggle,
  handleClearCategories,
}: {
  searchTerm: string
  handleSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  categories: Category[]
  selectedCategoryIds: string[]
  handleCategoryToggle: (categoryId: string) => void
  handleClearCategories: () => void
  isPending: boolean
}) => {
  const [categorySearchTerm, setCategorySearchTerm] = useState('')

  // Filter categories based on search term
  const filteredCategories = categories.filter((category) =>
    category.title.toLowerCase().includes(categorySearchTerm.toLowerCase()),
  )

  return (
    <div className="w-full lg:w-[280px] lg:min-w-[280px] lg:pr-2 mb-8 lg:mb-0">
      <div className="sticky top-24">
        <div className="relative mb-6">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Tìm kiếm sản phẩm..."
            className="pl-8 transition-all duration-300 hover:shadow-md hover:-translate-y-1 transform-gpu border-border hover:border"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>

        {categories.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium">Danh mục</h2>
              {selectedCategoryIds.length > 0 && (
                <button
                  onClick={handleClearCategories}
                  className="text-xs text-muted-foreground hover:text-primary flex items-center"
                >
                  <X className="h-3 w-3 mr-1" />
                  Xóa bộ lọc
                </button>
              )}
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Tìm kiếm danh mục..."
                className="pl-8 transition-all duration-300 hover:shadow-md hover:-translate-y-1 transform-gpu border-border hover:border"
                value={categorySearchTerm}
                onChange={(e) => setCategorySearchTerm(e.target.value)}
              />
            </div>

            {selectedCategoryIds.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  Đã chọn {selectedCategoryIds.length} danh mục
                </p>
                <div className="flex flex-wrap gap-1 mb-1">
                  {selectedCategoryIds.map((id) => {
                    const category = categories.find((c) => c.id.toString() === id)
                    if (!category) return null

                    return (
                      <Badge
                        key={`selected-${id}`}
                        variant="default"
                        className="cursor-pointer flex items-center gap-1 transition-all duration-300 hover:shadow-md hover:-translate-y-1 transform-gpu"
                        onClick={() => handleCategoryToggle(id)}
                      >
                        {category.title}
                      </Badge>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="mt-2 max-h-[300px] overflow-y-auto pr-2">
              <div className="flex flex-wrap gap-2 lg:flex-col lg:gap-2 mt-2">
                {filteredCategories.length > 0 ? (
                  filteredCategories.map((category) => {
                    const isSelected = selectedCategoryIds.includes(category.id.toString())
                    return (
                      <Badge
                        key={category.id}
                        variant={isSelected ? 'default' : 'outline'}
                        className={cn(
                          'cursor-pointer transition-all duration-300 hover:shadow-md hover:-translate-y-1 transform-gpu',
                          isSelected && 'bg-primary text-primary-foreground',
                        )}
                        onClick={() => handleCategoryToggle(category.id.toString())}
                      >
                        {category.title}
                      </Badge>
                    )
                  })
                ) : (
                  <p className="text-sm text-muted-foreground">Không tìm thấy danh mục phù hợp</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const PageClient = ({
  data,
  searchQuery = '',
  categories = [],
  selectedCategoryIds = [],
}: {
  data: PaginatedDocs<Product>
  searchQuery?: string
  categories?: Category[]
  selectedCategoryIds?: string[]
}) => {
  /* Force the header to be dark mode while we have an image behind it */
  const { setHeaderTheme } = useHeaderTheme()
  const [searchTerm, setSearchTerm] = useState(searchQuery)
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentPage = data.page || 1
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    setHeaderTheme('dark')
  }, [setHeaderTheme])

  // Create a debounced search function
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      startTransition(() => {
        const params = new URLSearchParams(searchParams.toString())

        if (value) {
          params.set('name', value)
        } else {
          params.delete('name')
        }

        params.set('page', '1')
        router.push(`/products?${params.toString()}`)
      })
    }, 300),
    [searchParams, router],
  )

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)
    debouncedSearch(value)
  }

  // Handle category filter change
  const handleCategoryToggle = (categoryId: string) => {
    if (isPending) return

    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString())
      let newSelectedCategories = [...selectedCategoryIds]

      if (newSelectedCategories.includes(categoryId)) {
        // Remove category if already selected
        newSelectedCategories = newSelectedCategories.filter((id) => id !== categoryId)
      } else {
        // Add category if not selected
        newSelectedCategories.push(categoryId)
      }

      if (newSelectedCategories.length > 0) {
        params.set('categories', newSelectedCategories.join(','))
      } else {
        params.delete('categories')
      }

      params.set('page', '1')
      router.push(`/products?${params.toString()}`)
    })
  }

  // Clear all selected categories
  const handleClearCategories = () => {
    if (isPending) return

    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString())
      params.delete('categories')
      params.set('page', '1')
      router.push(`/products?${params.toString()}`)
    })
  }

  // Helper function to create pagination URLs
  const getPaginationUrl = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', page.toString())
    if (searchQuery) {
      params.set('name', searchQuery)
    }
    return `/products?${params.toString()}`
  }

  const handlePageChange = (page: number) => {
    startTransition(() => {
      router.push(getPaginationUrl(page))
    })
  }

  return (
    <Shell>
      <div className="grid container items-center pb-4 max-w-6xl gap-0">
        <div className="grid container items-center pb-4 max-w-6xl gap-0">
          <div className="flex max-w-[61.25rem] flex-col md:py-6 md:pb-4 lg:py-12 lg:pb-10 mx-auto items-center gap-2 text-center">
            <div className="font-bold tracking-tighter lg:leading-[1.1] text-3xl md:text-5xl animate-fade-up wave-text">
              {env.NEXT_PUBLIC_SITE_NAME}
            </div>
            <h1 className="font-bold tracking-tighter lg:leading-[1.1] text-3xl md:text-5xl animate-fade-up">
              Dịch vụ{' '}
              <AnimatedWordCycle
                className="text-highlight"
                words={['nạp', 'nạp', '', '']}
                interval={3000}
              />{' '}
              <AnimatedWordCycle
                className="text-highlight"
                words={['ứng dụng', 'game', 'tài khoản', 'phần mềm']}
                interval={3000}
              />{' '}
              giá rẻ
            </h1>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row lg:gap-6">
        {/* Sidebar for search and filters */}
        <Sidebar
          searchTerm={searchTerm}
          handleSearchChange={handleSearchChange}
          categories={categories}
          selectedCategoryIds={selectedCategoryIds}
          handleCategoryToggle={handleCategoryToggle}
          handleClearCategories={handleClearCategories}
          isPending={isPending}
        />

        {/* Main content area */}
        <div className="flex-1">
          {data.docs.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-8">
                {data.docs.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              <CustomPagination
                currentPage={currentPage}
                totalPages={data.totalPages}
                isPending={isPending}
                handlePageChange={handlePageChange}
                getPaginationUrl={getPaginationUrl}
              />
            </>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-xl font-medium mb-2">Không tìm thấy sản phẩm nào</h3>
              <p className="text-muted-foreground">Vui lòng thử tìm kiếm với từ khóa khác</p>
            </div>
          )}
        </div>
      </div>
    </Shell>
  )
}

export default PageClient
