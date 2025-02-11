'use client'

import { Shell } from '@/components/shell'
import { Form, FormSubmission, Order, Product, ProductVariant } from '@/payload-types'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import { useEffect, useState } from 'react'

import { updateFormSubmissionAction } from '@/app/_actions/updateFormSubmission'
import { fields } from '@/blocks/Form/fields'
import { Media } from '@/components/Media'
import RichText from '@/components/RichText'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { formatOrderDate } from '@/utilities/formatOrderDate'
import { formatPrice } from '@/utilities/formatPrice'
import { getOrderStatus } from '@/utilities/getOrderStatus'
import Link from 'next/link'

function UpdateOrderShippingForm({
  form,
  formSubmission,
  disabled,
}: {
  form: Form
  formSubmission: FormSubmission
  disabled?: boolean
}) {
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
          onClick={(x) => {
            updateFormSubmissionAction({
              id: formSubmission.id,
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
      <CardHeader>
        <div className="flex items-start gap-[16px]">
          <div className="relative w-[64px] h-[85px] bg-secondary rounded-lg items-center overflow-hidden">
            <Media resource={image}></Media>
          </div>
          <div className="size-full flex-1">
            <Link href={`/products/${product.slug}?variant_id=${variant.id}`}>
              {variant.name || product.name}
            </Link>
            <div className="flex items-center gap-1">
              <span className="max-md:hidden">Mã đơn hàng:</span>
              <span className="md:hidden">Mã DH:</span>
              <span>#{order.id}</span>
            </div>
            <div>{getOrderStatus(order.status)}</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="gap-4">
          <div className="flex items-center justify-between">
            <span>Thời gian</span>
            <span>{formatOrderDate(new Date(order.createdAt))}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Số lượng</span>
            <span>x{order.quantity}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <div className="w-full flex items-center justify-between">
          <span>Tổng tiền</span>
          <span>{formatPrice(order.totalPrice, 'VND')}</span>
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
            {(order.formSubmission as any)?.form && (
              <UpdateOrderShippingForm
                form={(order.formSubmission as any).form}
                formSubmission={order.formSubmission as any}
              />
            )}
          </div>
        </div>
      </div>
    </Shell>
  )
}

export default PageClient
