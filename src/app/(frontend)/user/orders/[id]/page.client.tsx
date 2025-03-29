'use client'

import { Shell } from '@/components/shell'
import { Order, Product, ProductVariant } from '@/payload-types'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import { useEffect } from 'react'

import { Media } from '@/components/Media'
import RichText from '@/components/RichText'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { formatOrderDate } from '@/utilities/formatOrderDate'
import { formatPrice } from '@/utilities/formatPrice'
import { getOrderStatus } from '@/utilities/getOrderStatus'
import Link from 'next/link'
import { UpdateOrderShippingForm } from './components/UpdateOrderShippingForm'
import { Routes } from '@/utilities/routes'
import { hasText } from '@payloadcms/richtext-lexical/shared'
import { workingTime } from '@/utilities/constants-react'
import { useRouter } from 'next/navigation'

export function OrderCard({ order, className }: { order: Order; className?: string }) {
  const variant = order.productVariant as ProductVariant
  const product = (variant.product as Product) || null
  const image = variant.image || product?.image
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-start gap-[16px]">
          <div className="relative w-[64px] h-[85px] bg-secondary rounded-lg items-center overflow-hidden">
            <Media resource={image}></Media>
          </div>
          <div className="size-full flex-1">
            <Link
              href={product?.slug ? `/products/${product?.slug}?variant_id=${variant.id}` : '/'}
            >
              {variant.name || product?.name || 'Không xác định'}
            </Link>
            <div className="flex items-center gap-1">
              <span className="max-md:hidden text-muted-foreground">Mã đơn hàng:</span>
              <span className="md:hidden text-muted-foreground">Mã DH:</span>
              <span>#{order.id}</span>
            </div>
            <div>{getOrderStatus(order.status)}</div>
          </div>
        </div>
      </CardHeader>
      <hr className="mx-4 mb-2 border-t border-border" />
      <CardContent>
        <div className="gap-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Thời gian</span>
            <span>{formatOrderDate(new Date(order.createdAt))}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Số lượng</span>
            <span>x{order.quantity}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Tạm tính</span>
            <span>{formatPrice(order.subTotal, 'VND')}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Giảm giá</span>
            <span>{formatPrice(order.totalDiscount, 'VND')}</span>
          </div>
        </div>
      </CardContent>
      <hr className="mx-4 mb-2 border-t border-border" />
      <CardFooter>
        <div className="w-full flex items-center justify-between">
          <span className="text-muted-foreground">Tổng tiền</span>
          <span className="text-highlight">{formatPrice(order.totalPrice, 'VND')}</span>
        </div>
      </CardFooter>
    </Card>
  )
}

const PageClient = ({ order }: { order: Order }) => {
  /* Force the header to be dark mode while we have an image behind it */
  const { setHeaderTheme } = useHeaderTheme()
  const router = useRouter()
  useEffect(() => {
    const intervalId = setInterval(() => {
      router.refresh()
    }, 10000)

    return () => clearInterval(intervalId)
  }, [router])

  useEffect(() => {
    setHeaderTheme('dark')
  }, [setHeaderTheme])

  return (
    <Shell>
      <div className="flex justify-between">
        <h1 className="text-[24px] font-bold">Chi tiết đơn hàng</h1>
        <Link href={Routes.ORDERS} className="underline">
          Quay lại
        </Link>
      </div>
      <div className="flex max-md:flex-col gap-4 text-[14px]">
        <div className=" flex-1 flex flex-col gap-4">
          <OrderCard order={order}></OrderCard>
        </div>
        <div className="flex-[2] flex flex-col gap-4">
          {!['COMPLETED', 'REFUND'].includes(order.status) && (
            <Card>
              <CardContent className="p-4">
                <div className="text-highlight">{workingTime}</div>
              </CardContent>
            </Card>
          )}

          {hasText(order.message) && (
            <Card>
              <CardHeader className="font-bold pb-0">Lời nhắn</CardHeader>
              <CardContent>
                <RichText data={order.message as any} enableGutter={false}></RichText>
              </CardContent>
            </Card>
          )}
          {hasText(order.deliveryContent) && (
            <Card>
              <CardHeader className="font-bold pb-0">Thông tin hàng</CardHeader>
              <CardContent className="pt-0">
                <RichText
                  className="pt-0"
                  data={order.deliveryContent as any}
                  enableGutter={false}
                ></RichText>
              </CardContent>
            </Card>
          )}
          <div>
            {(order.formSubmission as any)?.form && (
              <UpdateOrderShippingForm
                key={(order.formSubmission as any).updatedAt.toString()}
                order={order}
                disabled={order.status === 'REFUND' || order.status === 'COMPLETED'}
              />
            )}
          </div>
        </div>
      </div>
    </Shell>
  )
}

export default PageClient
