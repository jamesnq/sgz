'use client'
import { Media } from '@/components/Media'
import { OrderCardSkeleton } from '@/components/skeletons'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { CustomPagination } from '@/components/ui/custom-pagination'
import { Input } from '@/components/ui/input'
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
import { useEffect, useTransition, useState } from 'react'

function OrderCard({ o }: { o: Order }) {
  // @ts-expect-error ignore
  const image = o.productVariant.image || o.productVariant?.product?.image
  const variant = o.productVariant as ProductVariant
  const product = variant.product as Product
  const productUrl = product?.slug ? Routes.product(product?.slug as string, variant?.id) : '#'
  const orderUrl = Routes.order(o.id)
  return (
    <div key={o.id} className="bg-background border rounded-xl p-4 shadow-lg mb-3 last:mb-0">
      <div className="mb-4">
        <div className="flex justify-between">
          <div className="text-muted-foreground">{formatOrderDate(new Date(o.createdAt))}</div>
          <div>
            <span className="mr-1 text-muted-foreground">Bằng số dư</span>
            <span>{formatPrice(o.totalPrice, 'VND')}</span>
          </div>
        </div>
      </div>
      <div>
        <div className="flex items-start max-md:flex-col md:items-center gap-2">
          <div className="md:hidden space-x-2">
            <span className="text-muted-foreground md:hidden">Mã DH:</span>
            <span className="-ml-1">#{o.id}</span>
          </div>
          <div className="flex items-start gap-2">
            <div className="relative w-[140px] shrink-0 aspect-video bg-secondary rounded-lg items-center overflow-hidden">
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
              <Button variant="secondary" size="sm" className="w-full flex gap-2">
                <Eye size={18}></Eye>
                <span>Chi tiết</span>
              </Button>
            </Link>
            <Link href={orderUrl + '#update'}>
              <Button variant="secondary" size="sm" className="w-full flex gap-2">
                <Pencil size={18}></Pencil>
                <span>Sửa thông tin</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function Orders({ data }: { data: PaginatedDocs<Order> }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [stableLoading, setStableLoading] = useState(false)

  // Debounce the loading state to prevent UI flickering
  useEffect(() => {
    if (isPending) {
      // Set loading immediately when transition starts
      setStableLoading(true)
    } else {
      // Delay turning off loading state to prevent flickering
      const timer = setTimeout(() => {
        setStableLoading(false)
      }, 300) // 300ms delay before showing content
      return () => clearTimeout(timer)
    }
  }, [isPending])

  const [search, setSearch] = useQueryState('q', parseAsString.withDefault(''))
  const debouncedSearch = useDebounce(search, 500)
  const [status, setStatus] = useQueryState(
    'status',
    parseAsString.withDefault(''),
  )
  const [page, setPage] = useQueryState(
    'page',
    parseAsInteger.withDefault(data.page || 1),
  )

  useEffect(() => {
    startTransition(() => {
      const params = new URLSearchParams({
        q: debouncedSearch,
        status,
        page: page.toString(),
      }).toString()
      const url = Routes.ORDERS + (params ? `?${params}` : '')
      router.push(url, { scroll: false })
    })
  }, [debouncedSearch, status, page, router])

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
    <Card className="p-6 w-full overflow-hidden">
      <div className="max-lg:p-1 mb-6">
        <h4 className="text-xl font-bold text-white mb-1">Lịch sử đơn hàng</h4>
        <div className="text-muted-foreground">Thông tin các sản phẩm bạn đã mua</div>
        <div className="lg:flex lg:justify-end mt-4">
          <div className="flex gap-2 max-xl:flex-col w-full lg:w-auto">
            <div className="grid grid-flow-col auto-cols-fr gap-2 max-lg:grid-rows-2">
              <Button
                className={!status ? "w-full font-bold h-11" : "w-full h-11"}
                variant={!status ? 'default' : 'secondary'}
                onClick={() => handleStatusChange('')}
              >
                Tất cả
              </Button>
              {Object.entries(orderStatus).map(([k, v]) => (
                <Button
                  key={k}
                  className={status === k ? "w-full font-bold h-11" : "w-full h-11"}
                  variant={status === k ? 'default' : 'secondary'}
                  onClick={() => handleStatusChange(k)}
                >
                  {v}
                </Button>
              ))}
            </div>
            <div className="relative w-full lg:w-auto">
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="w-full lg:min-w-72 h-11"
                placeholder="Mã đơn / Tên sản phẩm"
              />
            </div>
          </div>
        </div>
      </div>
      <div className="max-lg:p-1">
        {stableLoading ? (
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
          <div className="text-center py-8 text-white">Không có đơn hàng nào</div>
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

const PageClient = ({ data }: { data: PaginatedDocs<Order> }) => {
  /* Force the header to be dark mode while we have an image behind it */
  const { setHeaderTheme } = useHeaderTheme()

  useEffect(() => {
    setHeaderTheme('dark')
  }, [setHeaderTheme])

  return <Orders data={data} />
}

export default PageClient
