'use client'

import { useHeaderTheme } from '@/providers/HeaderTheme'
import { useEffect, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

import { Media } from '@/components/Media'
import { Product } from '@/payload-types'
import { Shell } from '@/components/shell'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationEllipsis,
} from '@/components/ui/pagination'
import RichText from '@/components/RichText'
import { formatSold } from '@/utilities/formatSold'
import Link from 'next/link'
import { Loader2, Search } from 'lucide-react'
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

const PageClient = ({
  data,
  searchQuery = '',
}: {
  data: PaginatedDocs<Product>
  searchQuery?: string
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString())

      if (searchTerm) {
        params.set('name', searchTerm)
      } else {
        params.delete('name')
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

        <div className="mb-8">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Tìm kiếm sản phẩm..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={isPending}
              />
            </div>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang tìm...
                </>
              ) : (
                'Tìm kiếm'
              )}
            </Button>
          </form>
        </div>

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
    </Shell>
  )
}

export default PageClient
