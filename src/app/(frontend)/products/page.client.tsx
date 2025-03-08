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
import { Input } from '@/components/ui/input'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
} from '@/components/ui/pagination'
import { cn } from '@/lib/utils'
import { Product, Category } from '@/payload-types'
import { formatSold } from '@/utilities/formatSold'
import { Loader2, Search } from 'lucide-react'
import Link from 'next/link'
import { PaginatedDocs } from 'payload'

const ProductCard = ({ product }: { product: Product }) => {
  return (
    <Link
      className="relative block h-full w-full cursor-pointer overflow-hidden transition-all duration-300 hover:border-secondary"
      href={`/products/${product.slug}`}
    >
      <Card className="w-full h-[131px] overflow-hidden !p-0">
        <div className="w-full">
          <div className="text-[14px] flex items-start p-0">
            <div className="relative h-[131px] w-[98px] overflow-hidden flex items-center justify-center">
              <Media
                resource={product.image}
                className="object-cover w-full h-full"
                imgClassName="absolute inset-0 h-[131px] w-[98px] object-center object-contain"
              />
            </div>
            <div className="flex w-full h-[131px] flex-1 flex-col items-start justify-between gap-[8px] p-2">
              <div>
                <div className="truncate h-auto overflow-hidden text-[14px] font-[400] leading-[17px]">
                  {product.name}
                </div>
                <div className="peer mt-2 flex items-end">
                  {/* <span className="leading-[13px] text-muted-foreground">24,500đ ~ 2,376,000đ</span> */}
                </div>
                {product.description.root.direction && (
                  <RichText
                    className="text-[12px] text-muted-foreground mt-2 line-clamp-2 overflow-hidden"
                    data={product.description}
                    enableGutter={false}
                  />
                )}
              </div>
              <div className="flex w-full items-center justify-end">
                <span className="text-[12px] leading-none text-muted-foreground">
                  Đã bán {formatSold(product.sold)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  )
}

// Sidebar component for search and filters
const Sidebar = ({
  searchTerm,
  handleSearchChange,
  categories,
  selectedCategoryId,
  handleCategoryClick,
  isPending,
}: {
  searchTerm: string
  handleSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  categories: Category[]
  selectedCategoryId: string
  handleCategoryClick: (categoryId: string) => void
  isPending: boolean
}) => {
  return (
    <div className="w-full lg:w-[250px] lg:min-w-[250px] lg:pr-6 mb-8 lg:mb-0">
      <div className="sticky top-24">
        <h2 className="text-lg font-medium mb-4">Tìm kiếm</h2>
        <div className="relative mb-6">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Tìm kiếm sản phẩm..."
            className="pl-8"
            value={searchTerm}
            onChange={handleSearchChange}
            disabled={isPending}
          />
          {isPending && (
            <div className="absolute right-2.5 top-2.5">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          )}
        </div>

        {categories.length > 0 && (
          <div>
            <h2 className="text-lg font-medium mb-4">Danh mục</h2>
            <div className="flex flex-wrap gap-2 lg:flex-col lg:gap-3">
              {categories.map((category) => (
                <Badge
                  key={category.id}
                  variant={selectedCategoryId === category.id.toString() ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer hover:bg-secondary/80 transition-colors lg:w-full lg:justify-start",
                    isPending && "opacity-70 pointer-events-none"
                  )}
                  onClick={() => handleCategoryClick(category.id.toString())}
                >
                  {category.title}
                </Badge>
              ))}
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
  selectedCategoryId = '',
}: {
  data: PaginatedDocs<Product>
  searchQuery?: string
  categories?: Category[]
  selectedCategoryId?: string
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
  const handleCategoryClick = (categoryId: string) => {
    if (isPending) return
    
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString())
      
      if (categoryId === selectedCategoryId) {
        // If clicking the already selected category, remove the filter
        params.delete('category')
      } else {
        // Otherwise set the new category filter
        params.set('category', categoryId)
      }
      
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
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-8">Sản phẩm</h1>

        <div className="flex flex-col lg:flex-row lg:gap-6">
          {/* Sidebar for search and filters */}
          <Sidebar 
            searchTerm={searchTerm}
            handleSearchChange={handleSearchChange}
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            handleCategoryClick={handleCategoryClick}
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

                {data.totalPages > 1 && (
                  <div className="flex justify-center mt-8">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <Link href={getPaginationUrl(1)} passHref>
                            <PaginationLink
                              isActive={currentPage === 1}
                              onClick={(e) => {
                                if (currentPage !== 1 && !isPending) {
                                  e.preventDefault()
                                  handlePageChange(1)
                                }
                              }}
                              aria-disabled={isPending}
                            >
                              1
                            </PaginationLink>
                          </Link>
                        </PaginationItem>

                        {currentPage > 3 && <PaginationEllipsis />}

                        {currentPage > 2 && (
                          <PaginationItem>
                            <Link href={getPaginationUrl(currentPage - 1)} passHref>
                              <PaginationLink
                                onClick={(e) => {
                                  if (!isPending) {
                                    e.preventDefault()
                                    handlePageChange(currentPage - 1)
                                  }
                                }}
                                aria-disabled={isPending}
                              >
                                {currentPage - 1}
                              </PaginationLink>
                            </Link>
                          </PaginationItem>
                        )}

                        {currentPage !== 1 && currentPage !== data.totalPages && (
                          <PaginationItem>
                            <Link href={getPaginationUrl(currentPage)} passHref>
                              <PaginationLink isActive>{currentPage}</PaginationLink>
                            </Link>
                          </PaginationItem>
                        )}

                        {currentPage < data.totalPages - 1 && (
                          <PaginationItem>
                            <Link href={getPaginationUrl(currentPage + 1)} passHref>
                              <PaginationLink
                                onClick={(e) => {
                                  if (!isPending) {
                                    e.preventDefault()
                                    handlePageChange(currentPage + 1)
                                  }
                                }}
                                aria-disabled={isPending}
                              >
                                {currentPage + 1}
                              </PaginationLink>
                            </Link>
                          </PaginationItem>
                        )}

                        {currentPage < data.totalPages - 2 && <PaginationEllipsis />}

                        {data.totalPages > 1 && (
                          <PaginationItem>
                            <Link href={getPaginationUrl(data.totalPages)} passHref>
                              <PaginationLink
                                isActive={currentPage === data.totalPages}
                                onClick={(e) => {
                                  if (currentPage !== data.totalPages && !isPending) {
                                    e.preventDefault()
                                    handlePageChange(data.totalPages)
                                  }
                                }}
                                aria-disabled={isPending}
                              >
                                {data.totalPages}
                              </PaginationLink>
                            </Link>
                          </PaginationItem>
                        )}

                        {isPending && (
                          <PaginationItem>
                            <div className="flex items-center justify-center ml-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                            </div>
                          </PaginationItem>
                        )}
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-xl font-medium mb-2">Không tìm thấy sản phẩm nào</h3>
                <p className="text-muted-foreground">Vui lòng thử tìm kiếm với từ khóa khác</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Shell>
  )
}

export default PageClient
