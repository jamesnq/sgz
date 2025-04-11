'use client'

import { useState, useEffect } from 'react'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from '@/components/ui/pagination'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export interface CustomPaginationProps {
  currentPage: number
  totalPages: number
  isPending?: boolean
  handlePageChange: (page: number) => void
  getPaginationUrl: (page: number) => string
}

export function CustomPagination({
  currentPage,
  totalPages,
  isPending = false,
  handlePageChange,
  getPaginationUrl,
}: CustomPaginationProps) {
  const [inputPage, setInputPage] = useState<string>('')
  const [visualCurrentPage, setVisualCurrentPage] = useState<number>(currentPage)

  // Update visual current page when the actual current page changes from props
  useEffect(() => {
    setVisualCurrentPage(currentPage)
  }, [currentPage])

  if (totalPages <= 1) return null

  const handleGoToPage = () => {
    const page = parseInt(inputPage)
    if (!isNaN(page) && page >= 1 && page <= totalPages && page !== currentPage && !isPending) {
      setVisualCurrentPage(page) // Update visual state immediately
      handlePageChange(page)
      setInputPage('')
    }
  }

  const handlePageClick = (page: number) => {
    if (page !== currentPage && !isPending) {
      setVisualCurrentPage(page) // Update visual state immediately
      handlePageChange(page)
    }
  }

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleGoToPage()
    }
  }

  const commonLinkClasses =
    'transition-all duration-300 hover:shadow-md hover:-translate-y-1 transform-gpu'

  return (
    <div className="flex justify-center mt-8">
      <Pagination>
        <PaginationContent className="gap-2 items-center">
          {/* Previous page button */}
          <PaginationItem>
            {visualCurrentPage > 1 && !isPending ? (
              <Link href={getPaginationUrl(visualCurrentPage - 1)} passHref>
                <PaginationLink
                  className={cn(commonLinkClasses, 'outline outline-1 outline-muted')}
                  onClick={(e) => {
                    e.preventDefault()
                    handlePageClick(visualCurrentPage - 1)
                  }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </PaginationLink>
              </Link>
            ) : (
              <PaginationLink
                className={cn(
                  commonLinkClasses,
                  'outline outline-1 outline-muted opacity-50 cursor-not-allowed',
                )}
                disabled={true}
              >
                <ChevronLeft className="h-4 w-4" />
              </PaginationLink>
            )}
          </PaginationItem>

          <PaginationItem>
            <Link href={getPaginationUrl(1)} passHref>
              <PaginationLink
                className={cn(
                  commonLinkClasses,
                  visualCurrentPage === 1
                    ? 'outline outline-2 outline-primary'
                    : 'outline outline-1 outline-muted',
                )}
                onClick={(e) => {
                  if (visualCurrentPage !== 1 && !isPending) {
                    e.preventDefault()
                    handlePageClick(1)
                  }
                }}
                aria-disabled={isPending}
              >
                1
              </PaginationLink>
            </Link>
          </PaginationItem>

          {visualCurrentPage > 2 && (
            <PaginationItem>
              <Link href={getPaginationUrl(visualCurrentPage - 1)} passHref>
                <PaginationLink
                  className={cn(
                    commonLinkClasses,
                    'outline outline-1 outline-muted hover:outline-secondary',
                  )}
                  onClick={(e) => {
                    if (!isPending) {
                      e.preventDefault()
                      handlePageClick(visualCurrentPage - 1)
                    }
                  }}
                  aria-disabled={isPending}
                >
                  {visualCurrentPage - 1}
                </PaginationLink>
              </Link>
            </PaginationItem>
          )}

          {visualCurrentPage !== 1 && visualCurrentPage !== totalPages && (
            <PaginationItem>
              <Link href={getPaginationUrl(visualCurrentPage)} passHref>
                <PaginationLink
                  className={cn(commonLinkClasses, 'outline outline-2 outline-primary')}
                >
                  {visualCurrentPage}
                </PaginationLink>
              </Link>
            </PaginationItem>
          )}

          {visualCurrentPage < totalPages - 1 && (
            <PaginationItem>
              <Link href={getPaginationUrl(visualCurrentPage + 1)} passHref>
                <PaginationLink
                  className={cn(
                    commonLinkClasses,
                    'outline outline-1 outline-muted hover:outline-secondary',
                  )}
                  onClick={(e) => {
                    if (!isPending) {
                      e.preventDefault()
                      handlePageClick(visualCurrentPage + 1)
                    }
                  }}
                  aria-disabled={isPending}
                >
                  {visualCurrentPage + 1}
                </PaginationLink>
              </Link>
            </PaginationItem>
          )}

          {/* Replace ellipsis with page input */}
          {(visualCurrentPage > 3 || visualCurrentPage < totalPages - 2) && (
            <PaginationItem>
              <div className="flex items-center">
                <Input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={inputPage}
                  onChange={(e) => setInputPage(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  placeholder="..."
                  className="w-10 h-10 text-center transition-all duration-300 hover:shadow-md hover:-translate-y-1 transform-gpu border-border outline outline-1 outline-muted [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  disabled={isPending}
                />
              </div>
            </PaginationItem>
          )}

          {totalPages > 1 && (
            <PaginationItem>
              <Link href={getPaginationUrl(totalPages)} passHref>
                <PaginationLink
                  className={cn(
                    commonLinkClasses,
                    visualCurrentPage === totalPages
                      ? 'outline outline-2 outline-primary'
                      : 'outline outline-1 outline-muted',
                  )}
                  onClick={(e) => {
                    if (visualCurrentPage !== totalPages && !isPending) {
                      e.preventDefault()
                      handlePageClick(totalPages)
                    }
                  }}
                  aria-disabled={isPending}
                >
                  {totalPages}
                </PaginationLink>
              </Link>
            </PaginationItem>
          )}

          {/* Next page button */}
          <PaginationItem>
            {visualCurrentPage < totalPages && !isPending ? (
              <Link href={getPaginationUrl(visualCurrentPage + 1)} passHref>
                <PaginationLink
                  className={cn(commonLinkClasses, 'outline outline-1 outline-muted')}
                  onClick={(e) => {
                    e.preventDefault()
                    handlePageClick(visualCurrentPage + 1)
                  }}
                >
                  <ChevronRight className="h-4 w-4" />
                </PaginationLink>
              </Link>
            ) : (
              <PaginationLink
                className={cn(
                  commonLinkClasses,
                  'outline outline-1 outline-muted opacity-50 cursor-not-allowed',
                )}
                disabled={true}
              >
                <ChevronRight className="h-4 w-4" />
              </PaginationLink>
            )}
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}
