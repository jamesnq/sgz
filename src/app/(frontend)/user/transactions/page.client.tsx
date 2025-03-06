'use client'
import { Shell } from '@/components/shell'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Transaction } from '@/payload-types'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import { formatPrice } from '@/utilities/formatPrice'
import { useDebounce } from '@/utilities/useDebounce'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { parseAsInteger, parseAsString, useQueryState } from 'nuqs'
import { PaginatedDocs } from 'payload'
import { useEffect } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from '@/components/ui/button'

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

function Transactions({ data }: { data: PaginatedDocs<Transaction> }) {
  const router = useRouter()
  const [search, setSearch] = useQueryState('q', parseAsString.withDefault(''))
  const debouncedSearch = useDebounce(search, 500)
  const [page, setPage] = useQueryState(
    'page',
    parseAsInteger.withDefault(data.page || 1).withOptions({ shallow: false }),
  )

  useEffect(() => {
    const params = new URLSearchParams({
      q: debouncedSearch,
      page: page.toString(),
    }).toString()
    const url = `/user/transactions${params ? `?${params}` : ''}`
    router.push(url)
  }, [debouncedSearch, page, router])

  return (
    <Card className="max-md:border-0">
      <CardHeader className="max-md:p-1">
        <h4 className="font-bold">Lịch sử giao dịch</h4>
        <div>Thông tin các giao dịch của tài khoản</div>
        <div className="md:flex md:justify-end">
          <div className="flex gap-2 max-md:flex-col">
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="min-w-72 max-md:w-full"
              placeholder="Nội dung giao dịch"
            ></Input>
          </div>
        </div>
      </CardHeader>
      <CardContent className="max-md:p-1">
        {data?.docs && data.docs.length > 0 ? (
          <div className="rounded-md border">
            <Table>
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
                    <TableCell className={transaction.amount > 0 ? "text-green-600" : "text-red-600"}>
                      {transaction.amount > 0 ? "+" : ""}{formatPrice(transaction.amount, 'VND')}
                    </TableCell>
                    <TableCell>{formatPrice(transaction.balance, 'VND')}</TableCell>
                    <TableCell>{transaction.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8">Không có giao dịch nào</div>
        )}
      </CardContent>
      <CardFooter>
        <div className="flex justify-end w-full">
          {data.totalPages > 0 && (
            <div className="flex items-center gap-2">
              <Button
                variant={'ghost'}
                size={'icon'}
                onClick={() => data.prevPage && setPage(data.prevPage)}
                disabled={!data.hasPrevPage}
              >
                <ChevronLeft />
              </Button>
              {data.totalPages &&
                Array(data.totalPages)
                  .fill(0)
                  .map((_, i) => i + 1)
                  .map((p) => (
                    <Button
                      key={p}
                      variant={p === page ? 'default' : 'outline'}
                      size={'icon'}
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </Button>
                  ))}
              <Button
                variant={'ghost'}
                size={'icon'}
                onClick={() => data.nextPage && setPage(data.nextPage)}
                disabled={!data.hasNextPage}
              >
                <ChevronRight />
              </Button>
            </div>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}

const PageClient = ({ data }: { data: PaginatedDocs<Transaction> }) => {
  /* Force the header to be dark mode while we have an image behind it */
  const { setHeaderTheme } = useHeaderTheme()

  useEffect(() => {
    setHeaderTheme('dark')
  }, [setHeaderTheme])

  return (
    <Shell>
      <Transactions data={data} />
    </Shell>
  )
}

export default PageClient
