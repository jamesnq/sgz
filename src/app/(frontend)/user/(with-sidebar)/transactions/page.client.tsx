'use client'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  TableBody,
  TableCell,
  TableCustom,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { CustomPagination } from '@/components/ui/custom-pagination'
import { Transaction } from '@/payload-types'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import { formatPrice } from '@/utilities/formatPrice'
import { useDebounce } from '@/utilities/useDebounce'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { parseAsInteger, parseAsString, useQueryState } from 'nuqs'
import { PaginatedDocs } from 'payload'
import { useEffect, useState, useTransition } from 'react'

function formatTransactionDate(date: Date): string {
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date)
}

function TransactionTableSkeleton() {
  return (
    <div className="rounded-md border">
      <TableCustom>
        <TableHeader>
          <TableRow>
            <TableHead>Thời gian</TableHead>
            <TableHead>Số tiền</TableHead>
            <TableHead>Số dư</TableHead>
            <TableHead>Nội dung</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array(10)
            .fill(0)
            .map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <Skeleton className="h-5 w-32" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-full" />
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </TableCustom>
    </div>
  )
}

function Transactions({ data }: { data: PaginatedDocs<Transaction> }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isSearching, setIsSearching] = useState(false)
  const [search, setSearch] = useQueryState('q', parseAsString.withDefault(''))
  const debouncedSearch = useDebounce(search, 500)
  const [page, setPage] = useQueryState(
    'page',
    parseAsInteger.withDefault(data.page || 1).withOptions({ shallow: false }),
  )

  useEffect(() => {
    if (debouncedSearch !== search) {
      setIsSearching(true)
    }

    startTransition(() => {
      const params = new URLSearchParams({
        q: debouncedSearch,
        page: page.toString(),
      }).toString()
      const url = `/user/transactions${params ? `?${params}` : ''}`
      router.push(url)
    })

    // Reset searching state after navigation
    return () => {
      setIsSearching(false)
    }
  }, [debouncedSearch, page, router, search])

  // Helper function to create pagination URLs
  const getPaginationUrl = (pageNum: number) => {
    const params = new URLSearchParams({
      q: debouncedSearch,
      page: pageNum.toString(),
    }).toString()
    return `/user/transactions${params ? `?${params}` : ''}`
  }

  // Handle page change
  const handlePageChange = (pageNum: number) => {
    startTransition(() => {
      setPage(pageNum)
    })
  }

  return (
    <Card className="p-6 w-full overflow-hidden">
      <div className="max-md:p-1 mb-6">
        <h4 className="text-xl font-bold text-white mb-1">Lịch sử giao dịch</h4>
        <div className="text-muted-foreground">Thông tin các giao dịch của tài khoản</div>
        <div className="md:flex md:justify-end">
          <div className="flex gap-2 max-md:flex-col w-full md:w-auto mt-4 md:mt-0">
            <div className="relative w-full md:w-auto">
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="w-full md:min-w-72 pr-10 h-11"
                placeholder="Nội dung giao dịch"
                disabled={isPending}
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="max-md:p-1 overflow-x-auto">
        {isPending ? (
          <TransactionTableSkeleton />
        ) : data?.docs && data.docs.length > 0 ? (
          <TableCustom>
            <TableHeader>
              <TableRow>
                <TableHead>Thời gian</TableHead>
                <TableHead>Số tiền</TableHead>
                <TableHead>Số dư</TableHead>
                <TableHead>Nội dung</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.docs.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-medium">
                    {formatTransactionDate(new Date(transaction.createdAt))}
                  </TableCell>
                  <TableCell className={transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}>
                    {transaction.amount > 0 ? '+' : ''}
                    {formatPrice(transaction.amount, 'VND')}
                  </TableCell>
                  <TableCell>
                    <div className="text-nowrap">{formatPrice(transaction.balance, 'VND')}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-nowrap">{transaction.description}</div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </TableCustom>
        ) : (
          <div className="text-center py-8 text-white">Không có giao dịch nào</div>
        )}
      </div>
      <div className="pt-6">
        <div className="flex justify-center w-full">
          {data.totalPages > 0 && (
            <CustomPagination
              currentPage={page}
              totalPages={data.totalPages}
              isPending={isPending}
              handlePageChange={handlePageChange}
              getPaginationUrl={getPaginationUrl}
            />
          )}
        </div>
      </div>
    </Card>
  )
}

const PageClient = ({ data }: { data: PaginatedDocs<Transaction> }) => {
  /* Force the header to be dark mode while we have an image behind it */
  const { setHeaderTheme } = useHeaderTheme()

  useEffect(() => {
    setHeaderTheme('dark')
  }, [setHeaderTheme])

  return <Transactions data={data} />
}

export default PageClient
