'use client'

import { Shell } from '@/components/shell'
import { Form, FormSubmission, Order, Product, ProductVariant } from '@/payload-types'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import { useEffect, useMemo, useState } from 'react'

import { updateOrderAction } from '@/app/_actions/updateFormSubmissionAction'
import { fields } from '@/blocks/Form/fields'
import { Media } from '@/components/Media'
import RichText from '@/components/RichText'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { formatOrderDate } from '@/utilities/formatOrderDate'
import { formatPrice } from '@/utilities/formatPrice'
import { getOrderStatus } from '@/utilities/getOrderStatus'
import Link from 'next/link'

function UpdateOrderShippingForm({ disabled, order }: { order: Order; disabled?: boolean }) {
  const formSubmission = useMemo(() => order.formSubmission as FormSubmission, [order])
  const form = useMemo(() => formSubmission.form as Form, [formSubmission])
  const [formSubmissionData, setFormSubmissionData] = useState(formSubmission?.submissionData || {})
  return (
    <Card>
      <CardHeader>Cung cấp thông tin tài khoản</CardHeader>
      <CardContent>
        <div>
          {form.fields &&
            form.fields.map((field, index) => {
              const Field: React.FC<any> = fields?.[field.blockType as keyof typeof fields]
              if (!Field) {
                return null
              }
              // @ts-expect-error ignore
              field.defaultValue = formSubmissionData[field.name]
              return (
                <div className="mb-4 last:mb-0" key={index}>
                  <Field
                    field={field}
                    disabled={disabled}
                    onChange={(v: string) =>
                      setFormSubmissionData((p: any) => {
                        const newData = {
                          ...p,
                          //@ts-expect-error ignore
                          [field.name]: v,
                        }
                        return newData
                      })
                    }
                  />
                </div>
              )
            })}
        </div>
      </CardContent>
      <CardFooter>
        <Button
          disabled={disabled}
          className="w-full"
          onClick={() => {
            updateOrderAction({
              id: order.id,
              shippingFields: formSubmissionData,
            })
          }}
        >
          Cập nhật thông tin
        </Button>
      </CardFooter>
    </Card>
  )
}

export function OrderCard({ order, className }: { order: Order; className?: string }) {
  const variant = order.productVariant as ProductVariant
  const product = variant.product as Product
  const image = variant.image || product.image
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-start gap-[16px]">
          <div className="relative w-[64px] h-[85px] bg-secondary rounded-lg items-center overflow-hidden">
            <Media resource={image}></Media>
          </div>
          <div className="size-full flex-1">
            <Link href={`/products/${product.slug}?variant_id=${variant.id}`}>
              {variant.name || product.name}
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

  useEffect(() => {
    setHeaderTheme('dark')
  }, [setHeaderTheme])

  return (
    <Shell>
      <div className="flex justify-between">
        <h1 className="text-[24px]">Chi tiết đơn hàng</h1>
        <Link href="/user/orders" className="underline">
          Quay lại
        </Link>
      </div>
      <div className="flex max-md:flex-col gap-4 text-[14px]">
        <div className="flex-1 flex flex-col gap-4">
          <OrderCard order={order}></OrderCard>
        </div>
        <div className="flex-[2] flex flex-col gap-4">
          {order.message && (
            <Card>
              <CardHeader className="font-bold pb-0">Lời nhắn</CardHeader>
              <CardContent>
                <RichText data={order.message} enableGutter={false}></RichText>
              </CardContent>
            </Card>
          )}
          <div>
            {(order.formSubmission as any)?.form && <UpdateOrderShippingForm order={order} />}
          </div>
        </div>
      </div>
    </Shell>
  )
}

export default PageClient
