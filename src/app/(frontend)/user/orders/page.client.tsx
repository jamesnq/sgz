'use client'
import { Media } from '@/components/Media'
import { Shell } from '@/components/shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Order, Product, ProductVariant } from '@/payload-types'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import { formatOrderDate } from '@/utilities/formatOrderDate'
import { formatPrice } from '@/utilities/formatPrice'
import { getOrderStatus, orderStatus } from '@/utilities/getOrderStatus'
import { useDebounce } from '@/utilities/useDebounce'
import { ChevronLeft, ChevronRight, Eye, Pencil } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { parseAsInteger, parseAsString, useQueryState } from 'nuqs'
import { PaginatedDocs } from 'payload'
import { useEffect } from 'react'

function OrderCard({ o }: { o: Order }) {
  // @ts-expect-error ignore
  const image = o.productVariant.image || o.productVariant.product.image
  const variant = o.productVariant as ProductVariant
  const product = variant.product as Product
  return (
    <Card key={o.id}>
      <CardHeader className="p-4">
        <div className="flex justify-between">
          <div>{formatOrderDate(new Date(o.createdAt))}</div>
          <div>{`Bằng số dư ${formatPrice(o.totalPrice, 'VND')}`}</div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="flex items-start max-md:flex-col md:items-center gap-4">
          <div className="md:hidden space-x-2">
            <span className="md:hidden">Mã DH:</span>
            <span className="-ml-1">#{o.id}</span>
          </div>
          <div className="flex items-start gap-2">
            <div className="relative w-[64px] h-[85px] bg-secondary rounded-lg items-center overflow-hidden">
              <Media resource={image}></Media>
            </div>
            <div className="flex-1">
              <Link href={`/products/${product.slug}`}>{variant.name || product.name}</Link>
              <div className="mt-2 flex items-center gap-2 max-md:hidden">
                <span>Mã đơn hàng:</span>
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
            <div>{formatPrice(variant.price, 'VND')}</div>
            <span>x{o.quantity}</span>
          </div>
          <div className="flex flex-wrap gap-[8px] max-md:w-full md:flex-col">
            <Link href={`/user/orders/${o.id}`}>
              <Button variant={'secondary'} size={'sm'} className="w-full rounded-full flex gap-2">
                <Eye size={18}></Eye>
                <span>Chi tiết</span>
              </Button>
            </Link>
            <Link href={`/user/orders/${o.id}#update`}>
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

function Orders({ data }: { data: PaginatedDocs<Order> }) {
  const router = useRouter()
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
    const params = new URLSearchParams({
      q: debouncedSearch,
      status,
      page: page.toString(),
    }).toString()
    const url = `/user/orders${params ? `?${params}` : ''}`
    router.push(url)
  }, [debouncedSearch, status, page, router])

  return (
    <Card className="max-md:border-0">
      <CardHeader className="max-md:p-1">
        <h4 className="font-bold">Lịch sử đơn hàng</h4>
        <div> thông tin các sản phẩm bạn đã mua</div>
        <div className="md:flex md:justify-end">
          <div className="flex gap-2 max-md:flex-col">
            <div className="flex gap-2">
              <Button
                className="w-full rounded-full"
                variant={!status ? 'default' : 'outline'}
                onClick={() => setStatus('')}
              >
                Tất cả
              </Button>
              {Object.entries(orderStatus).map(([k, v]) => (
                <Button
                  key={k}
                  className="w-full rounded-full"
                  variant={status === k ? 'default' : 'outline'}
                  onClick={() => setStatus(k)}
                >
                  {v}
                </Button>
              ))}
            </div>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="min-w-72 max-md:w-full"
              placeholder="Mã đơn / Tên sản phẩm"
            ></Input>
          </div>
        </div>
      </CardHeader>
      <CardContent className="max-md:p-1">
        {data?.docs && data.docs.length > 0 ? (
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

const PageClient = ({ data }: { data: PaginatedDocs<Order> }) => {
  /* Force the header to be dark mode while we have an image behind it */
  const { setHeaderTheme } = useHeaderTheme()

  useEffect(() => {
    setHeaderTheme('dark')
  }, [setHeaderTheme])

  return (
    <Shell>
      <Orders data={data} />
    </Shell>
  )
}

export default PageClient
