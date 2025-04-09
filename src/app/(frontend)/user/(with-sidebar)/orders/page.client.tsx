'use client'
import { Media } from '@/components/Media'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { CustomPagination } from '@/components/ui/custom-pagination'
import { Order, Product, ProductVariant } from '@/payload-types'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import { formatOrderDate } from '@/utilities/formatOrderDate'
import { formatPrice } from '@/utilities/formatPrice'
import { getOrderStatus, orderStatus } from '@/utilities/getOrderStatus'
import { Routes } from '@/utilities/routes'
import { useDebounce } from '@/utilities/useDebounce'
import { Eye, Pencil } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { parseAsInteger, parseAsString, useQueryState } from 'nuqs'
import { PaginatedDocs } from 'payload'
import { useEffect, useTransition } from 'react'

function OrderCard({ o }: { o: Order }) {
  // @ts-expect-error ignore
  const image = o.productVariant.image || o.productVariant?.product?.image
  const variant = o.productVariant as ProductVariant
  const product = variant.product as Product
  const productUrl = product?.slug ? Routes.product(product?.slug as string) : '/'
  const orderUrl = Routes.order(o.id)
  return (
    <Card key={o.id}>
      <CardHeader className="p-4">
        <div className="flex justify-between">
          <div className="text-muted-foreground">{formatOrderDate(new Date(o.createdAt))}</div>
          <div>
            <span className="mr-1 text-muted-foreground">Bằng số dư</span>
            <span>{formatPrice(o.totalPrice, 'VND')}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="flex items-start max-md:flex-col md:items-center gap-2">
          <div className="md:hidden space-x-2">
            <span className="text-muted-foreground md:hidden">Mã DH:</span>
            <span className="-ml-1">#{o.id}</span>
          </div>
          <div className="flex items-start gap-2">
            <div className="relative w-[64px] h-[85px] bg-secondary rounded-lg items-center overflow-hidden">
              <Media resource={image}></Media>
            </div>
            <div className="flex-1">
              <Link href={productUrl}>{variant.name || product.name}</Link>
              <div className="mt-2 flex items-center gap-2 max-md:hidden">
                <span className="text-muted-foreground">Mã đơn hàng:</span>
                <span className="-ml-1">#{o.id}</span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                {getOrderStatus(o.status)}
                <div className="text-center md:hidden md:flex-1">
                  <div>{`x${o.quantity}`}</div>
                </div>
              </div>
            </div>
          </div>
          <div className="text-center max-md:hidden md:flex-1">
            <div>{formatPrice(o.totalPrice, 'VND')}</div>
            <span>x{o.quantity}</span>
          </div>
          <div className="flex flex-wrap gap-[8px] max-md:w-full flex-col">
            <Link href={orderUrl}>
              <Button variant={'secondary'} size={'sm'} className="w-full rounded-full flex gap-2">
                <Eye size={18}></Eye>
                <span>Chi tiết</span>
              </Button>
            </Link>
            <Link href={orderUrl + '#update'}>
              <Button variant={'secondary'} size={'sm'} className="w-full rounded-full flex gap-2">
                <Pencil size={18}></Pencil>
                <span>Sửa thông tin</span>
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function OrderCardSkeleton() {
  return (
    <Card>
      <CardHeader className="p-4">
        <div className="flex justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-32" />
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="flex items-start max-md:flex-col md:items-center gap-4">
          <div className="flex items-start gap-2">
            <Skeleton className="w-[64px] h-[85px] rounded-lg" />
            <div className="flex-1">
              <Skeleton className="h-5 w-48 mb-2" />
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-5 w-24" />
            </div>
          </div>
          <div className="text-center max-md:hidden md:flex-1">
            <Skeleton className="h-5 w-20 mx-auto mb-1" />
            <Skeleton className="h-5 w-10 mx-auto" />
          </div>
          <div className="flex flex-wrap gap-[8px] max-lg:w-full lg:flex-col">
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-28" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
function Orders({ data }: { data: PaginatedDocs<Order> }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [search, setSearch] = useQueryState('q', parseAsString.withDefault(''))
  const debouncedSearch = useDebounce(search, 500)
  const [status, setStatus] = useQueryState(
    'status',
    parseAsString.withDefault('').withOptions({ shallow: false }),
  )
  const [page, setPage] = useQueryState(
    'page',
    parseAsInteger.withDefault(data.page || 1).withOptions({ shallow: false }),
  )

  useEffect(() => {
    startTransition(() => {
      const params = new URLSearchParams({
        q: debouncedSearch,
        status,
        page: page.toString(),
      }).toString()
      const url = Routes.ORDERS + (params ? `?${params}` : '')
      router.push(url)
    })
  }, [debouncedSearch, status, page, router, search])

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus)
    setPage(1)
  }

  // Helper function to create pagination URLs
  const getPaginationUrl = (pageNum: number) => {
    const params = new URLSearchParams({
      q: debouncedSearch,
      status,
      page: pageNum.toString(),
    }).toString()
    return Routes.ORDERS + (params ? `?${params}` : '')
  }

  // Handle page change
  const handlePageChange = (pageNum: number) => {
    startTransition(() => {
      setPage(pageNum)
    })
  }

  return (
    <Card className="max-lg:border-0">
      <CardHeader className="max-lg:p-1">
        <h4 className="font-bold">Lịch sử đơn hàng</h4>
        <div className="text-muted-foreground">Thông tin các sản phẩm bạn đã mua</div>
        <div className="lg:flex lg:justify-end">
          <div className="flex gap-2 max-xl:flex-col">
            <div className="grid grid-flow-col auto-cols-fr gap-2 max-lg:grid-rows-2">
              <Button
                className="w-full rounded-full"
                variant={!status ? 'default' : 'outline'}
                onClick={() => handleStatusChange('')}
              >
                Tất cả
              </Button>
              {Object.entries(orderStatus).map(([k, v]) => (
                <Button
                  key={k}
                  className="w-full rounded-full"
                  variant={status === k ? 'default' : 'outline'}
                  onClick={() => handleStatusChange(k)}
                >
                  {v}
                </Button>
              ))}
            </div>
            <div className="relative">
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="min-w-72 max-lg:w-full pr-10"
                placeholder="Mã đơn / Tên sản phẩm"
              />
            </div>
          </div>
        </div>{' '}
      </CardHeader>
      <CardContent className="max-lg:p-1">
        {isPending ? (
          <div className="flex flex-col text-sm gap-2">
            {Array(5)
              .fill(0)
              .map((_, i) => (
                <OrderCardSkeleton key={i} />
              ))}
          </div>
        ) : data?.docs && data.docs.length > 0 ? (
          <div className="flex flex-col text-sm gap-2">
            {data.docs.map((o: any) => (
              <OrderCard key={o.id} o={o} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">Không có đơn hàng nào</div>
        )}
      </CardContent>
      <CardFooter>
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
      </CardFooter>
    </Card>
  )
}

const PageClient = ({ data }: { data: PaginatedDocs<Order> }) => {
  /* Force the header to be dark mode while we have an image behind it */
  const { setHeaderTheme } = useHeaderTheme()

  useEffect(() => {
    setHeaderTheme('dark')
  }, [setHeaderTheme])

  return <Orders data={data} />
}

export default PageClient
