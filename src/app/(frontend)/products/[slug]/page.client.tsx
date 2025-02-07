'use client'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import React, { useEffect, useMemo } from 'react'

import { Media } from '@/components/Media'
import { Product, ProductVariant } from '@/payload-types'

import RichText from '@/components/RichText'
import { Shell } from '@/components/shell'
import { Badge } from '@/components/ui/badge'
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
import { cn } from '@/utilities/ui'
import { Button } from '@/components/ui/button'

type ProductPageContextType = {
  product: Product
  quantity: number
  currentVariant: ProductVariant
  setCurrentVariant: React.Dispatch<React.SetStateAction<ProductVariant>>
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
  return (
    <ProductPageContext.Provider
      value={{ product, currentVariant, setCurrentVariant, quantity: 1 }}
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
          <div className="font-bold">{productVariant.price}</div>
          {discountPercentage > 0 && (
            <>
              <div className="text-gray-500 line-through">
                {productVariant.originalPrice}
                {/* {formatPrice(productVariant.originalPrice, productVariant.currency)} */}
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
function Screen() {
  const { product } = useProductPageContext()
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
          {/* <div className={'space-y-2'}>
            {(product.form?.fields.length ||
              collectionInit.products[0].formTemplate?.fields.length) && (
              <ShippingForm form={product.formTemplate}></ShippingForm>
            )}
            <Checkout product={product}></Checkout>
          </div> */}
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
