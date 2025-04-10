'use client'

import { useHeaderTheme } from '@/providers/HeaderTheme'
import { debounce } from 'lodash'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState, useTransition } from 'react'

import { Media } from '@/components/Media'
import RichText from '@/components/RichText'
import { Shell } from '@/components/shell'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { CustomPagination } from '@/components/ui/custom-pagination'
import { Input } from '@/components/ui/input'
import { env } from '@/config'
import { cn } from '@/lib/utils'
import { Category, Product } from '@/payload-types'
import { formatPrice } from '@/utilities/formatPrice'
import { formatSold } from '@/utilities/formatSold'
import { Routes } from '@/utilities/routes'
import { hasText } from '@payloadcms/richtext-lexical/shared'
import { Search, X } from 'lucide-react'
import Link from 'next/link'
import { PaginatedDocs } from 'payload'
import AnimatedWordCycle from '@/components/ui/animated-text-cycle'

const ProductCard = ({ product }: { product: Product }) => {
  return (
    <div className="relative h-full w-full group pt-1 pb-2 px-0.5">
      <Link
        className="block h-full w-full cursor-pointer transition-all duration-300"
        href={product.slug ? Routes.product(product.slug) : '#'}
      >
        <Card className="w-full h-[131px] overflow-hidden !p-0 transition-all duration-300 hover:shadow-md border border-transparent group-hover:border-secondary/20 group-hover:-translate-y-1 transform-gpu">
          <div className="w-full">
            <div className="text-[14px] flex items-start p-0">
              <div className="relative h-[131px] w-[98px] overflow-hidden flex items-center justify-center">
                <Media
                  resource={product.image}
                  className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-110"
                  imgClassName="absolute inset-0 h-[131px] w-[98px] object-center object-contain"
                />
              </div>
              <div className="flex w-full h-[131px] flex-1 flex-col items-start justify-between gap-[8px] p-2">
                <div>
                  <div className="flex items-center gap-1 justify-between">
                    <p className="line-clamp-1 h-auto text-[14px] font-bold leading-[17px] transition-colors duration-300 group-hover:text-primary">
                      {product.name}
                    </p>
                    {product.maxDiscount > 0 && (
                      <Badge className="transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                        -{product.maxDiscount.toFixed(0)}%
                      </Badge>
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
                    <span className="leading-[13px] text-muted-foreground transition-colors duration-300 group-hover:text-primary/80">
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
  isPending,
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
    <div className="w-full lg:w-[280px] lg:min-w-[280px] lg:pr-6 mb-8 lg:mb-0">
      <div className="sticky top-24">
        <div className="relative mb-6">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Tìm kiếm sản phẩm..."
            className="pl-8"
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
                className="pl-8"
                value={categorySearchTerm}
                onChange={(e) => setCategorySearchTerm(e.target.value)}
              />
            </div>

            {selectedCategoryIds.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-muted-foreground mb-2">
                  Đã chọn {selectedCategoryIds.length} danh mục
                </p>
                <div className="flex flex-wrap gap-1 mb-3">
                  {selectedCategoryIds.map((id) => {
                    const category = categories.find((c) => c.id.toString() === id)
                    if (!category) return null

                    return (
                      <Badge
                        key={`selected-${id}`}
                        variant="default"
                        className="pr-1 flex items-center gap-1"
                      >
                        {category.title}
                        <button
                          className="hover:bg-primary-foreground/20 rounded-full p-0.5"
                          onClick={() => handleCategoryToggle(id)}
                          disabled={isPending}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="max-h-[300px] overflow-y-auto pr-2">
              <div className="flex flex-wrap gap-2 lg:flex-col lg:gap-2">
                {filteredCategories.length > 0 ? (
                  filteredCategories.map((category) => {
                    const isSelected = selectedCategoryIds.includes(category.id.toString())
                    return (
                      <Badge
                        key={category.id}
                        variant={isSelected ? 'default' : 'outline'}
                        className={cn(
                          'cursor-pointer transition-colors lg:w-full lg:justify-start',
                          isPending && 'opacity-70 pointer-events-none',
                          !isSelected && 'hover:bg-secondary/80',
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
        <div className="flex max-w-[61.25rem] flex-col md:py-6 md:pb-4 lg:py-12 lg:pb-10 mx-auto items-center gap-2 text-center">
          <div className="font-bold tracking-tighter lg:leading-[1.1] text-3xl md:text-5xl animate-fade-up">
            {env.NEXT_PUBLIC_SITE_NAME}
          </div>
          <h1 className="font-bold tracking-tighter lg:leading-[1.1] text-3xl md:text-5xl animate-fade-up">
            Dịch vụ{' '}
            <AnimatedWordCycle
              words={['nạp game', 'nạp ứng dụng', 'cung cấp tài khoản']}
              interval={3000}
            />{' '}
            giá rẻ
          </h1>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
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
