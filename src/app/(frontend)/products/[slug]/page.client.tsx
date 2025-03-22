'use client'

import { useHeaderTheme } from '@/providers/HeaderTheme'
import React, { useEffect, useMemo, useState } from 'react'

import { Media } from '@/components/Media'
import { Form, Product, ProductVariant } from '@/payload-types'

import AuthDialog from '@/collections/Globals/Header/AuthDialog'
import { checkoutAction } from '@/app/_actions/checkoutAction'
import { fields } from '@/blocks/Form/fields'
import RichText from '@/components/RichText'
import { DisplayProductStatus } from '@/components/display-product-status'
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
import { useActionWarper } from '@/utilities/useActionWarper'
import { Loader2, MinusIcon, PlusIcon, TriangleAlert } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Routes } from '@/utilities/routes'
import { hasText } from '@payloadcms/richtext-lexical/shared'

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

const ProductPageContext = React.createContext<ProductPageContextType>({} as ProductPageContextType)

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
    (product?.variants && product.variants[0]) as ProductVariant,
  )

  const [quantity, setQuantity] = React.useState(1)

  const getInitShippingInfo = React.useCallback(
    (shippingInfo: { [key: string]: any }) => {
      const form = currentVariant.form as Form
      if (!form || !form.fields) return {}
      const initShippingInfo = form.fields.reduce(
        (acc, field: any) => {
          acc[field.name] = shippingInfo[field.name] || field.defaultValue || ''
          return acc
        },
        {} as { [key: string]: any },
      )
      return initShippingInfo
    },
    [currentVariant.form],
  )

  const [shippingInfo, setShippingInfo] = React.useState<{ [key: string]: any }>(
    getInitShippingInfo({}),
  )

  const calc = useMemo(() => {
    const totalOriginalPrice = currentVariant.originalPrice * quantity
    const totalPrice = currentVariant.price * quantity
    const totalDiscountPrice = totalOriginalPrice - totalPrice
    return {
      totalOriginalPrice,
      totalDiscountPrice,
      totalPrice,
    }
  }, [currentVariant.originalPrice, currentVariant.price, quantity])

  const initShippingInfoFromForm = React.useCallback(
    (form: Form) => {
      if (!form) return
      const initShippingInfo = form.fields?.reduce(
        (acc, field: any) => {
          acc[field.name] = shippingInfo[field.name] || field.defaultValue
          return acc
        },
        {} as { [key: string]: any },
      )
      setShippingInfo(initShippingInfo || {})
    },
    [shippingInfo],
  )

  React.useEffect(() => {
    setShippingInfo(getInitShippingInfo(shippingInfo))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <ProductPageContext.Provider
      value={{
        product,
        calc,
        currentVariant,
        setCurrentVariant: (variant: ProductVariant) => {
          setCurrentVariant(variant)
          setQuantity((prevQuantity) => Math.min(prevQuantity, variant.max))
          initShippingInfoFromForm(variant.form as Form)
        },
        quantity,
        setQuantity,
        incQuantity(by = 1) {
          setQuantity((prev) => prev + by)
        },
        decQuantity(by = 1) {
          setQuantity((prev) => Math.max(1, prev - by))
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
        'flex transition-all h-[96px] duration-200 overflow-hidden text-sm cursor-pointer hover:border-primary border-transparent',
        className,
        currentVariant && currentVariant.id == productVariant.id && 'bg-secondary border-primary',
      )}
    >
      <div className="relative h-[96px] w-[72px] overflow-hidden">
        <Media
          resource={productVariant.image || product.image}
          imgClassName="absolute duration-300 h-[96px] w-[72px] ease-in-out scale-100 group-hover:scale-110"
        />
      </div>
      <div className="flex flex-[3] items-start gap-2 p-4">
        <div className="flex h-full flex-1 flex-col justify-between">
          <div className="">{productVariant.name}</div>
          <DisplayProductStatus status={productVariant.status} />
        </div>
        <div className="flex flex-col items-end gap-1">
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
        {form.fields &&
          form.fields.map((field, index) => {
            const Field: React.FC<any> = fields?.[field.blockType as keyof typeof fields]
            if (Field) {
              return (
                <div className="mb-4 last:mb-0" key={index}>
                  <Field
                    field={field}
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
  const { executeAsync, isExecuting } = useActionWarper(checkoutAction)
  const { currentVariant, quantity, shippingInfo } = useProductPageContext()

  const checkout = () => {
    executeAsync({
      quantity,
      productVariantId: currentVariant.id,
      shippingFields: shippingInfo,
    }).then((x) => {
      if (!x?.data?.order) return
      router.push(Routes.order(x.data.order.id))
    })
  }

  return (
    <Button className="w-full font-bold" disabled={isExecuting} onClick={() => checkout()}>
      {isExecuting && <Loader2 className="animate-spin" />}
      Thanh toán
    </Button>
  )
}

function Checkout({ className }: { className?: string }) {
  const { user } = useAuth()
  const { currentVariant, quantity, incQuantity, decQuantity, setQuantity, calc } =
    useProductPageContext()
  const [editingQuantity, setEditingQuantity] = useState<number | undefined>(undefined)
  return (
    <Card className={cn('p-6', className)}>
      {currentVariant.max > 1 && (
        <div className="flex justify-between">
          <span>Số lượng</span>
          <div className="flex">
            <Button
              id={`decrement-quantity`}
              disabled={quantity <= currentVariant.min}
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
              value={editingQuantity != undefined ? editingQuantity : quantity}
              onFocus={() => setEditingQuantity(quantity)}
              onChange={(e) => setEditingQuantity(parseInt(e.target.value, 10))}
              onBlur={(e) => {
                const parsedValue = Math.min(
                  Math.max(parseInt(e.target.value, 10) || currentVariant.min, currentVariant.min),
                  currentVariant.max,
                )
                setQuantity(parsedValue)
                setEditingQuantity(undefined)
              }}
            />
            <Button
              id={`increment-quantity`}
              disabled={quantity >= currentVariant.max}
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

      <div className="flex w-full text-sm items-center justify-between">
        <span>Giá gốc</span>
        <span>{formatPrice(calc.totalOriginalPrice, 'VND')}</span>
      </div>
      <div className="flex w-full text-sm items-center justify-between">
        <span>Giá giảm</span>
        <span>{formatPrice(calc.totalDiscountPrice, 'VND')}</span>
      </div>
      <hr className="my-4 border-t border-border" />
      <div className="space-y-4">
        <div className="flex w-full items-center justify-between">
          <span className="font-bold">Tổng tiền</span>
          <span className="font-bold text-highlight">{formatPrice(calc.totalPrice, 'VND')}</span>
        </div>
        {user ? <CheckoutButton></CheckoutButton> : <AuthDialog className="w-full"></AuthDialog>}
      </div>
    </Card>
  )
}

function Screen() {
  const { product, currentVariant } = useProductPageContext()
  const description = useMemo(() => {
    return hasText(currentVariant.description) ? currentVariant.description : product.description
  }, [currentVariant.description, product.description])
  return (
    <Shell>
      <Head />
      <div className="flex flex-wrap gap-x-4 max-md:flex-col">
        <div className="flex-[2] flex-col space-y-2 max-md:order-2">
          {hasText(currentVariant?.important) && (
            <Card>
              <CardHeader className="font-bold px-4 pb-1">
                <div className="flex gap-2">
                  <TriangleAlert></TriangleAlert>
                  <span>Thông báo quan trọng</span>
                </div>
              </CardHeader>
              <CardContent className="px-4">
                <RichText
                  className="text-sm"
                  data={currentVariant.important as any}
                  overrideClassName
                ></RichText>
              </CardContent>
            </Card>
          )}
          <div className="max-md:hidden grid grid-flow-row grid-cols-1 lg:grid-cols-2 gap-2">
            {product.variants &&
              product.variants.map((variant) => (
                <ProductVariantCard
                  key={(variant as ProductVariant).id}
                  productVariant={variant as ProductVariant}
                />
              ))}
          </div>
          {hasText(description) && (
            <Card>
              <CardHeader className="font-bold px-4 pb-1">
                <div className="flex gap-2">
                  <span>Mô tả</span>
                </div>
              </CardHeader>
              <CardContent className="px-4">
                <RichText
                  className="text-sm"
                  data={description as any}
                  enableGutter={false}
                ></RichText>
              </CardContent>
            </Card>
          )}
        </div>
        <div className="flex-1 max-md:order-1">
          <ProductVariantsDrawer
            className="md:hidden mb-2"
            productVariants={(product.variants as ProductVariant[]) || []}
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
