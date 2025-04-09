'use client'

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
} from '@/components/ui/pagination'
import { cn } from '@/lib/utils'
import Link from 'next/link'

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
  if (totalPages <= 1) return null

  return (
    <div className="flex justify-center mt-8">
      <Pagination>
        <PaginationContent className="gap-2">
          <PaginationItem>
            <Link href={getPaginationUrl(1)} passHref>
              <PaginationLink
                className={cn(
                  currentPage === 1
                    ? 'outline outline-2 outline-primary'
                    : 'outline outline-1 outline-muted',
                )}
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
                  className="outline outline-1 outline-muted hover:outline-secondary"
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

          {currentPage !== 1 && currentPage !== totalPages && (
            <PaginationItem>
              <Link href={getPaginationUrl(currentPage)} passHref>
                <PaginationLink className="outline outline-2 outline-primary">
                  {currentPage}
                </PaginationLink>
              </Link>
            </PaginationItem>
          )}

          {currentPage < totalPages - 1 && (
            <PaginationItem>
              <Link href={getPaginationUrl(currentPage + 1)} passHref>
                <PaginationLink
                  className="outline outline-1 outline-muted hover:outline-secondary"
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

          {currentPage < totalPages - 2 && <PaginationEllipsis />}

          {totalPages > 1 && (
            <PaginationItem>
              <Link href={getPaginationUrl(totalPages)} passHref>
                <PaginationLink
                  className={cn(
                    currentPage === totalPages
                      ? 'outline outline-2 outline-primary'
                      : 'outline outline-1 outline-muted',
                  )}
                  onClick={(e) => {
                    if (currentPage !== totalPages && !isPending) {
                      e.preventDefault()
                      handlePageChange(totalPages)
                    }
                  }}
                  aria-disabled={isPending}
                >
                  {totalPages}
                </PaginationLink>
              </Link>
            </PaginationItem>
          )}
        </PaginationContent>
      </Pagination>
    </div>
  )
}
