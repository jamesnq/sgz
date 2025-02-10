'use client'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import React, { useEffect, useMemo, useState } from 'react'

import { Media } from '@/components/Media'
import { Form, Product, ProductVariant } from '@/payload-types'

import AuthDialog from '@/Header/AuthDialog'
import { checkoutAction } from '@/app/_actions/checkout'
import { fields } from '@/blocks/Form/fields'
import RichText from '@/components/RichText'
import { Shell } from '@/components/shell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/providers/Auth'
import { formatPrice } from '@/utilities/formatPrice'
import { cn } from '@/utilities/ui'
import { Loader2, MinusIcon, PlusIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
// TODO Optimize context rerender
type ProductPageContextType = {
  product: Product
  quantity: number
  setQuantity: (quantity: number) => void
  incQuantity: (by?: number) => void
  decQuantity: (by?: number) => void
  calc: {
    totalOriginalPrice: number
    totalDiscountPrice: number
    totalPrice: number
  }
  currentVariant: ProductVariant
  shippingInfo: { [key: string]: any }
  setCurrentVariant: (variant: ProductVariant) => void
  setShippingInfo: (key: string, value: string | number) => void
}
const ProductPageContext = React.createContext<ProductPageContextType | null>(null)

function useProductPageContext() {
  const context = React.useContext(ProductPageContext)
  if (!context) {
    throw new Error('useProductPageContext must be used within a ProductPageProvider')
  }
  return context
}

function ProductPageProvider({
  children,
  product,
}: {
  children: React.ReactNode
  product: Product
}) {
  const [currentVariant, setCurrentVariant] = React.useState<ProductVariant>(
    (product?.variants?.docs && product.variants.docs[0]) as ProductVariant,
  )

  const [quantity, setQuantity] = React.useState(1)

  const [shippingInfo, setShippingInfo] = React.useState<{ [key: string]: any }>({})
  console.log('🚀 ~ shippingInfo:', shippingInfo)
  const [calc, setCalc] = React.useState<{
    totalOriginalPrice: number
    totalDiscountPrice: number
    totalPrice: number
  }>({
    totalOriginalPrice: 0,
    totalDiscountPrice: 0,
    totalPrice: 0,
  })
  React.useEffect(() => {
    const totalOriginalPrice = currentVariant.originalPrice * quantity
    const totalPrice = currentVariant.price * quantity
    const totalDiscountPrice = totalOriginalPrice - totalPrice
    setCalc({ totalOriginalPrice, totalDiscountPrice, totalPrice })
  }, [currentVariant, quantity])
  return (
    <ProductPageContext.Provider
      value={{
        product,
        calc,
        currentVariant,
        setCurrentVariant: (variant: ProductVariant) => {
          setCurrentVariant(variant)
          const form = variant.form as Form
          if (form) {
            const initshippingInfo =
              form.fields?.reduce(
                (acc, field: any) => {
                  acc[field.name] = shippingInfo[field.name] || field.defaultValue
                  return acc
                },
                {} as { [key: string]: string },
              ) || {}

            setShippingInfo(initshippingInfo)
          }
        },
        quantity,
        setQuantity,
        incQuantity(by = 1) {
          setQuantity((prev) => prev + by)
        },
        decQuantity(by = 1) {
          setQuantity((prev) => prev - by)
        },
        shippingInfo,
        setShippingInfo: (key, value) => {
          setShippingInfo((prev) => ({ ...prev, [key]: value }))
        },
      }}
    >
      {children}
    </ProductPageContext.Provider>
  )
}

function Head() {
  const { product, currentVariant } = useProductPageContext()
  return (
    <div className="h-60 mb-5">
      <div className="relative flex h-full items-center gap-[24px] max-md:flex-col md:items-end">
        <Media
          resource={currentVariant?.image || product.image}
          imgClassName="relative h-[242px] w-[180px] rounded-[24px] object-cover md:-bottom-[24px] bg-secondary"
        />
        <div className="flex-1 md:my-[24px]">
          <h1 className="text-[18px] font-bold leading-none max-sm:text-center md:text-[24px] md:leading-[1.4]">
            {currentVariant?.name || product.name}
          </h1>
        </div>
      </div>
    </div>
  )
}
function calculateDiscountPercentage(originalPrice: number, price: number): number {
  if (originalPrice <= 0 || price < 0) {
    return 0
  }
  const discount = originalPrice - price
  const discountPercentage = (discount / originalPrice) * 100
  return discountPercentage
}
function ProductVariantCard({
  productVariant,
  className,
}: {
  productVariant: ProductVariant
  className?: string
}) {
  const { setCurrentVariant, currentVariant, product } = useProductPageContext()
  const discountPercentage = useMemo(
    () => calculateDiscountPercentage(productVariant.originalPrice, productVariant.price),
    [productVariant.originalPrice, productVariant.price],
  )
  return (
    <Card
      onClick={() => {
        setCurrentVariant(productVariant)
      }}
      className={cn(
        'flex transition-all h-28 duration-200 overflow-hidden text-sm cursor-pointer hover:border-primary border-transparent',
        className,
        currentVariant && currentVariant.id == productVariant.id && 'bg-secondary border-primary',
      )}
    >
      <div className="relative h-full w-[98px] overflow-hidden">
        <Media
          resource={productVariant.image || product.image}
          imgClassName="absolute duration-300 ease-in-out scale-100 group-hover:scale-110"
        />
      </div>
      <div className="flex flex-[3] items-start gap-2 p-4">
        <div className="flex h-full flex-1 flex-col justify-between">
          <div className="">{productVariant.name}</div>
          {/* <DisplayProductStatus status={productVariant.status} /> */}
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="font-bold">{formatPrice(productVariant.price, 'VND')}</div>
          {discountPercentage > 0 && (
            <>
              <div className="text-gray-500 line-through">
                {formatPrice(productVariant.originalPrice, 'VND')}
              </div>
              <Badge>-{discountPercentage.toFixed(0)}%</Badge>
            </>
          )}
        </div>
      </div>
    </Card>
  )
}
function ProductVariantsDrawer({
  productVariants,
  className,
}: {
  productVariants: ProductVariant[]
  className?: string
}) {
  return (
    <Card className={cn('w-full p-6', className)}>
      <div className="justify-center">
        <Drawer>
          <DrawerTrigger asChild className="w-full flex items-center justify-center">
            <Button className="w-full font-bold">Chọn sản phẩm</Button>
          </DrawerTrigger>
          <DrawerContent className="max-h-[85%]">
            <DrawerHeader>
              <DrawerTitle></DrawerTitle>
              <DrawerDescription></DrawerDescription>
            </DrawerHeader>
            <div className="no-scrollbar overflow-y-auto">
              {productVariants.map((x) => (
                <ProductVariantCard key={x.id} productVariant={x} className="h-16" />
              ))}
            </div>
            <DrawerFooter className="mt-6">
              <DrawerClose asChild>
                <Button className="w-full">Chọn sản phẩm</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>
    </Card>
  )
}
function ShippingForm({ form }: { form: Form }) {
  const { setShippingInfo } = useProductPageContext()
  return (
    <Card className="w-full overflow-hidden">
      <CardHeader>Thông tin đơn hàng</CardHeader>
      <CardContent className="grid gap-2">
        {form?.fields &&
          form.fields.map((field, index) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const Field: React.FC<any> = fields?.[field.blockType as keyof typeof fields]
            if (Field) {
              return (
                <div className="mb-4 last:mb-0" key={index}>
                  <Field
                    field={field}
                    //@ts-expect-error ignore
                    onChange={(value: string) => setShippingInfo(field.name, value)}
                  />
                </div>
              )
            }
            return null
          })}
      </CardContent>
    </Card>
  )
}
function CheckoutButton() {
  const router = useRouter()

  const { currentVariant, quantity, shippingInfo } = useProductPageContext()

  const [isPending, setIsPending] = useState(false)
  const checkout = () => {
    setIsPending(true)
    checkoutAction({
      quantity,
      productVariantId: currentVariant.id,
      shippingFields: shippingInfo,
    })
      .then((x) => {
        setIsPending(false)
        if (!x?.data?.order) return
        router.push('/user/order/' + x.data.order.id)
      })
      .finally(() => {
        setIsPending(false)
      })
  }

  return (
    <Button className="w-full" disabled={isPending} onClick={() => checkout()}>
      {isPending && <Loader2 className="animate-spin" />}
      Thanh toán
    </Button>
  )
}
function Checkout({ className }: { className?: string }) {
  const { user } = useAuth()
  const { currentVariant, quantity, incQuantity, decQuantity, setQuantity, calc } =
    useProductPageContext()

  return (
    <Card className="p-6">
      {currentVariant.min !== 1 && currentVariant.max !== 1 && (
        <div className="flex justify-between">
          <span>Số lượng</span>
          <div className="flex">
            <Button
              id={`decrement-quantity`}
              type="button"
              variant="outline"
              size="icon"
              className="size-8 shrink-0 rounded-r-none"
              onClick={() => {
                decQuantity()
              }}
            >
              <MinusIcon className="size-3" aria-hidden="true" />
            </Button>
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              className="h-8 w-16 rounded-none border-x-0"
              value={quantity}
              onChange={(e) => {
                const value = e.target.value
                const parsedValue = parseInt(value, 10)
                if (isNaN(parsedValue)) return
                setQuantity(parsedValue)
              }}
            />
            <Button
              id={`increment-quantity`}
              type="button"
              variant="outline"
              size="icon"
              className="size-8 shrink-0 rounded-l-none"
              onClick={() => {
                incQuantity()
              }}
            >
              <PlusIcon className="size-3" aria-hidden="true" />
            </Button>
          </div>
        </div>
      )}

      <div className="flex w-full items-center justify-between space-y-2">
        <span>Giá gốc</span>
        <span>{formatPrice(calc.totalOriginalPrice, 'VND')}</span>
      </div>
      <div className="flex w-full items-center justify-between">
        <span>Giá giảm</span>
        <span>{formatPrice(calc.totalDiscountPrice, 'VND')}</span>
      </div>
      <div className="mt-4 space-y-4">
        <div className="flex w-full items-center justify-between">
          <span className="font-bold">Tổng tiền</span>
          <span className="font-bold">{formatPrice(calc.totalPrice, 'VND')}</span>
        </div>
        {user ? <CheckoutButton></CheckoutButton> : <AuthDialog className="w-full"></AuthDialog>}
      </div>
    </Card>
  )
}
function Screen() {
  const { product, currentVariant } = useProductPageContext()
  return (
    <Shell>
      <Head />
      <div className="flex flex-wrap gap-x-4 max-md:flex-col">
        <div className="flex-[2] flex-col space-y-2 max-md:order-2">
          <div className="max-md:hidden grid grid-flow-row grid-cols-1 lg:grid-cols-2 gap-2">
            {product.variants?.docs &&
              product.variants?.docs.map((variant) => (
                <ProductVariantCard
                  key={(variant as ProductVariant).id}
                  productVariant={variant as ProductVariant}
                />
              ))}
          </div>
          <Card>
            <CardHeader className="font-bold px-4 pb-0">Mô tả</CardHeader>
            <CardContent>
              <RichText data={product.description} enableGutter={false}></RichText>
            </CardContent>
          </Card>
        </div>
        <div className="flex-1 max-md:order-1">
          <ProductVariantsDrawer
            className="md:hidden mb-2"
            productVariants={(product.variants?.docs as ProductVariant[]) || []}
          ></ProductVariantsDrawer>
          <div className={'space-y-2'}>
            {currentVariant.form && (
              <ShippingForm form={currentVariant.form as Form}></ShippingForm>
            )}
            <Checkout></Checkout>
          </div>
        </div>
      </div>
    </Shell>
  )
}
const PageClient = ({ product }: { product: Product }) => {
  /* Force the header to be dark mode while we have an image behind it */
  const { setHeaderTheme } = useHeaderTheme()

  useEffect(() => {
    setHeaderTheme('dark')
  }, [setHeaderTheme])

  return (
    <ProductPageProvider product={product}>
      <Screen />
    </ProductPageProvider>
  )
}

export default PageClient
