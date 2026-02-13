'use client'

import { useHeaderTheme } from '@/providers/HeaderTheme'
import React, { useEffect, useMemo, useState } from 'react'
import { createContext, useContextSelector } from 'use-context-selector'

import { Media } from '@/components/Media'
import { Form, Product, ProductVariant } from '@/payload-types'

import { checkoutAction } from '@/app/_actions/checkoutAction'
import { validateVoucherAction } from '@/app/_actions/validateVoucherAction'
import { fields } from '@/blocks/Form/fields'
import AuthDialog from '@/collections/Globals/Header/AuthDialog'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { config } from '@/config'
import { getProductCardStyles } from '@/lib/product-card-styles'
import { useAuth } from '@/providers/Auth'
import calculateDiscountPercentage from '@/utilities/calculateDiscountPercentage'
import { workingTime } from '@/utilities/constants-react'
import { formatPrice } from '@/utilities/formatPrice'
import { formatSold } from '@/utilities/formatSold'
import { Routes } from '@/utilities/routes'
import { cn } from '@/utilities/ui'
import { useActionWarper } from '@/utilities/useActionWarper'
import { validateRequiredFields } from '@/utilities/validateFormFields'
import { hasText } from '@payloadcms/richtext-lexical/shared'
import { ArrowUpDown, Loader2, MinusIcon, PlusIcon, Search, TriangleAlert } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { parseAsInteger, useQueryState } from 'nuqs'

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
  isFormValid: boolean
  setCurrentVariant: (variant: ProductVariant) => void
  setShippingInfo: (key: string, value: string | number) => void
  voucherCode: string
  setVoucherCode: (code: string) => void
  appliedVoucherDiscount: number
  setAppliedVoucherDiscount: (amount: number) => void
}

const ProductPageContext = createContext<ProductPageContextType>({} as ProductPageContextType)

function useProductPageContext<Selected>(
  selector: (state: ProductPageContextType) => Selected,
): Selected {
  return useContextSelector(ProductPageContext, selector)
}

function ProductPageProvider({
  children,
  product,
}: {
  children: React.ReactNode
  product: Product
}) {
  const [variantParam, setVariantParam] = useQueryState(
    'variant',
    parseAsInteger.withOptions({
      shallow: true,
    }),
  )

  // Keep track of the previous form ID to prevent unnecessary re-renders
  const previousFormIdRef = React.useRef<string | null>(null)

  const [currentVariant, setCurrentVariant] = React.useState<ProductVariant>(() => {
    if (variantParam && product?.variants) {
      const matchingVariant = (product.variants as ProductVariant[]).find(
        (v) => v.id === variantParam,
      )
      if (matchingVariant) {
        // Initialize the previous form ID ref
        previousFormIdRef.current = matchingVariant.form ? String(matchingVariant.form) : null
        return matchingVariant
      }
    }
    const initialVariant =
      (product?.variants as ProductVariant[])?.find((v) => v.status !== 'STOPPED') ||
      ((product?.variants && product.variants[0]) as ProductVariant)

    // Initialize the previous form ID ref with null check
    if (initialVariant) {
      previousFormIdRef.current = initialVariant.form ? String(initialVariant.form) : null
    }
    return initialVariant
  })

  const [quantity, setQuantity] = React.useState(1)
  const [voucherCode, setVoucherCode] = React.useState('')
  const [appliedVoucherDiscount, setAppliedVoucherDiscount] = React.useState(0)

  // Memoize the shipping info initialization function to prevent unnecessary recalculations
  const getInitShippingInfo = React.useCallback(
    (shippingInfo: { [key: string]: any }, form: Form | null) => {
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
    [],
  )

  const [shippingInfo, setShippingInfo] = React.useState<{ [key: string]: any }>(() =>
    getInitShippingInfo({}, currentVariant?.form as Form | null),
  )

  // Memoize form validation to prevent unnecessary recalculations
  const isFormValid = useMemo(() => {
    const form = currentVariant?.form as Form | null
    if (!form || !form.fields) return true
    return validateRequiredFields(form.fields, shippingInfo)
  }, [currentVariant?.form, shippingInfo])

  // Memoize price calculations to prevent unnecessary recalculations
  const calc = useMemo(() => {
    const totalOriginalPrice =
      Math.max(currentVariant.originalPrice, currentVariant.price) * quantity
    const totalPrice = currentVariant.price * quantity
    const totalDiscountPrice = totalOriginalPrice - totalPrice
    return {
      totalOriginalPrice,
      totalDiscountPrice,
      totalPrice,
    }
  }, [currentVariant.originalPrice, currentVariant.price, quantity])

  // Batch state updates in a single function to prevent multiple re-renders
  const handleVariantChange = React.useCallback(
    (variant: ProductVariant) => {
      // Check if the form ID is the same to prevent unnecessary re-renders
      const newFormId = variant.form ? String(variant.form) : null
      const isSameForm = newFormId === previousFormIdRef.current

      // Update the URL parameter
      setVariantParam(variant.id)

      // Update the current variant
      setCurrentVariant(variant)

      // Update quantity based on variant limits
      setQuantity((prevQuantity) => {
        if (prevQuantity === 0) return Math.min(variant.min, variant.max)
        return Math.min(prevQuantity, variant.max)
      })

      // Only update shipping info if the form has changed
      if (!isSameForm) {
        const form = variant.form as Form
        if (form) {
          const newShippingInfo = getInitShippingInfo({}, form)
          setShippingInfo(newShippingInfo)
        } else {
          setShippingInfo({})
        }

        // Update the previous form ID reference
        previousFormIdRef.current = newFormId
      }
    },
    [getInitShippingInfo, setVariantParam],
  )

  return (
    <ProductPageContext.Provider
      value={{
        product,
        calc,
        currentVariant,
        setCurrentVariant: handleVariantChange,
        quantity,
        setQuantity,
        incQuantity(by = 1) {
          setQuantity((prev) => prev + by)
        },
        decQuantity(by = 1) {
          setQuantity((prev) => Math.max(1, prev - by))
        },
        shippingInfo,
        isFormValid,
        setShippingInfo: (key, value) => {
          setShippingInfo((prev) => ({ ...prev, [key]: value }))
        },
        voucherCode,
        setVoucherCode,
        appliedVoucherDiscount,
        setAppliedVoucherDiscount,
      }}
    >
      {children}
    </ProductPageContext.Provider>
  )
}

function Head() {
  const product = useProductPageContext((state) => state.product)
  const currentVariant = useProductPageContext((state) => state.currentVariant)
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

// Memoized ProductVariantCard component with custom comparison function
const MemoizedProductVariantCard = React.memo(
  function ProductVariantCardInner({
    productVariant,
    className,
    currentVariantId,
    setCurrentVariant,
    productImage,
  }: {
    productVariant: ProductVariant
    className?: string
    currentVariantId?: number
    setCurrentVariant: (variant: ProductVariant) => void
    productImage: any
  }) {
    const styles = getProductCardStyles()
    const discountPercentage = useMemo(
      () => calculateDiscountPercentage(productVariant.originalPrice, productVariant.price),
      [productVariant.originalPrice, productVariant.price],
    )

    return (
      <div className={styles.wrapper}>
        <Card
          onClick={() => {
            setCurrentVariant(productVariant)
          }}
          className={cn(
            'flex h-[96px] text-sm cursor-pointer',
            styles.card,
            className,
            currentVariantId &&
              currentVariantId === productVariant.id &&
              'bg-secondary border-primary',
            'max-md:text-xs',
          )}
        >
          <div className={cn('h-[96px] w-[72px]', styles.mediaContainer)}>
            <Media
              resource={productVariant.image || productImage}
              imgClassName={cn('absolute h-[96px] w-[72px] ease-in-out object-cover', styles.media)}
            />
          </div>
          <div className="flex flex-[3] items-start gap-1 p-1">
            <div className="flex h-full flex-1 flex-col justify-between">
              <div className={styles.name + ' max-md:line-clamp-2 line-clamp-3'}>
                {productVariant.name}
              </div>
              <DisplayProductStatus status={productVariant.status} />
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className={cn('font-bold', styles.price)}>
                {formatPrice(productVariant.price, 'VND')}
              </div>
              {discountPercentage > 0 && (
                <>
                  <div className="text-gray-500 line-through">
                    {formatPrice(productVariant.originalPrice, 'VND')}
                  </div>
                  <Badge className={cn(styles.badge, 'text-xs px-1 py-0')}>
                    -{discountPercentage.toFixed(0)}%
                  </Badge>
                </>
              )}
            </div>
          </div>
        </Card>
      </div>
    )
  },
  (prevProps, nextProps) => {
    // Only re-render if these specific props change
    return (
      prevProps.productVariant.id === nextProps.productVariant.id &&
      prevProps.className === nextProps.className &&
      prevProps.currentVariantId === nextProps.currentVariantId &&
      prevProps.productVariant.price === nextProps.productVariant.price &&
      prevProps.productVariant.originalPrice === nextProps.productVariant.originalPrice &&
      prevProps.productVariant.status === nextProps.productVariant.status
    )
  },
)

// Wrapper component that gets context values and passes them as props
function ProductVariantCard({
  productVariant,
  className,
}: {
  productVariant: ProductVariant
  className?: string
}) {
  const setCurrentVariant = useProductPageContext((state) => state.setCurrentVariant)
  const currentVariant = useProductPageContext((state) => state.currentVariant)
  const product = useProductPageContext((state) => state.product)

  return (
    <MemoizedProductVariantCard
      productVariant={productVariant}
      className={className}
      currentVariantId={currentVariant?.id}
      setCurrentVariant={setCurrentVariant}
      productImage={product.image}
    />
  )
}

// Hook for filtering and sorting product variants
function useProductVariantFilter(variants: ProductVariant[]) {
  const [filteredVariants, setFilteredVariants] = useState<ProductVariant[]>(variants || [])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | ''>('')

  // Get unique statuses for filter options
  const statuses = useMemo(() => {
    const statusSet = new Set<string>()
    variants?.forEach((variant) => {
      if (variant.status) statusSet.add(variant.status)
    })
    return Array.from(statusSet)
  }, [variants])

  // Filter and sort variants
  useEffect(() => {
    let result = [...(variants || [])]

    // Apply search filter
    if (searchTerm) {
      result = result.filter((variant) =>
        variant.name?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter((variant) => variant.status === statusFilter)
    }

    // Apply sorting only if a sort order is selected
    if (sortOrder) {
      result.sort((a, b) => {
        if (sortOrder === 'asc') {
          return a.price - b.price
        } else {
          return b.price - a.price
        }
      })
    }

    setFilteredVariants(result)
  }, [variants, searchTerm, statusFilter, sortOrder])

  return {
    filteredVariants,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    sortOrder,
    setSortOrder,
    statuses,
  }
}

// Reusable filter controls component
function ProductVariantFilterControls({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  sortOrder,
  setSortOrder,
  statuses,
  className,
}: {
  searchTerm: string
  setSearchTerm: (value: string) => void
  statusFilter: string
  setStatusFilter: (value: string) => void
  sortOrder: 'asc' | 'desc' | ''
  setSortOrder: (value: 'asc' | 'desc' | '') => void
  statuses: string[]
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div className="flex items-center justify-end">
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <ArrowUpDown className="h-4 w-4" />
                {sortOrder === 'asc'
                  ? 'Giá tăng dần'
                  : sortOrder === 'desc'
                    ? 'Giá giảm dần'
                    : 'Sắp xếp giá'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuRadioGroup
                value={sortOrder}
                onValueChange={(value) => setSortOrder(value as 'asc' | 'desc' | '')}
              >
                <DropdownMenuRadioItem value="">Mặc định</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="asc">Giá tăng dần</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="desc">Giá giảm dần</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              {statuses.map((status) => (
                <SelectItem key={status} value={status}>
                  <div className="flex items-center gap-2">
                    <DisplayProductStatus status={status} />
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Tìm kiếm sản phẩm..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-8"
        />
      </div>
    </div>
  )
}

// Reusable empty state component
function NoProductVariantsFound() {
  return (
    <div className="py-4 text-center text-muted-foreground">Không tìm thấy sản phẩm phù hợp</div>
  )
}

function ProductVariantsDrawer({
  productVariants,
  className,
}: {
  productVariants: ProductVariant[]
  className?: string
}) {
  const {
    filteredVariants,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    sortOrder,
    setSortOrder,
    statuses,
  } = useProductVariantFilter(productVariants)

  const canBuyVariants = useMemo(
    () => productVariants.filter((variant) => variant.status !== 'STOPPED'),
    [productVariants],
  )
  return (
    <Card className={cn('w-full p-6', className)}>
      <div className="justify-center">
        <Drawer>
          <DrawerTrigger asChild className="w-full flex items-center justify-center">
            <Button className="w-full font-bold">
              Chọn {canBuyVariants.length > 0 ? canBuyVariants.length : ''} sản phẩm khác
            </Button>
          </DrawerTrigger>
          <DrawerContent className="max-h-[85%]">
            <DrawerHeader>
              <DrawerTitle className="text-lg font-semibold">Sản phẩm</DrawerTitle>
              <DrawerDescription></DrawerDescription>
            </DrawerHeader>
            <ProductVariantFilterControls
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              sortOrder={sortOrder}
              setSortOrder={setSortOrder}
              statuses={statuses}
              className="p-4 pt-0"
            />
            <div className="no-scrollbar overflow-y-auto px-4 pt-1">
              {filteredVariants.length > 0 ? (
                filteredVariants.map((x) => (
                  <ProductVariantCard key={x.id} productVariant={x} className="h-16 mb-2" />
                ))
              ) : (
                <NoProductVariantsFound />
              )}
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

// Filter and sort component for product variants
function FilterProductVariants({ variants }: { variants: ProductVariant[] }) {
  const {
    filteredVariants,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    sortOrder,
    setSortOrder,
    statuses,
  } = useProductVariantFilter(variants)

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <ProductVariantFilterControls
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          statuses={statuses}
        />
      </CardHeader>
      <CardContent>
        <div className="grid grid-flow-row grid-cols-1 lg:grid-cols-2 gap-x-1 gap-y-2">
          {filteredVariants.length > 0 ? (
            filteredVariants.map((variant) => (
              <ProductVariantCard key={variant.id} productVariant={variant} />
            ))
          ) : (
            <NoProductVariantsFound />
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function MemoizedFormField({ field, onChange }: { field: any; onChange: (value: string) => void }) {
  const Field: React.FC<any> = fields?.[field.blockType as keyof typeof fields]

  if (!Field) return null

  return <Field field={field} onChange={onChange} />
}

// Memoized ShippingForm component
const MemoizedShippingForm = React.memo(
  function ShippingFormInner({ form }: { form: Form }) {
    const setShippingInfo = useProductPageContext((state) => state.setShippingInfo)

    // Create a stable callback factory that returns a callback for each field
    const createFieldChangeHandler = React.useCallback(
      (fieldName: string) => (value: string) => {
        setShippingInfo(fieldName, value)
      },
      [setShippingInfo],
    )

    return (
      <Card id="shipping-form" className="w-full overflow-hidden">
        <CardHeader>Thông tin đơn hàng</CardHeader>
        <CardContent>
          <div>
            {form.fields?.map((field: any, index: number) => {
              const Field: React.FC<any> = fields?.[field.blockType as keyof typeof fields]
              if (!Field) return null

              return (
                <div className="mb-4 last:mb-0" key={index}>
                  <MemoizedFormField
                    field={field}
                    onChange={createFieldChangeHandler(field.name)}
                  />
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    )
  },
  // Custom comparison function to prevent re-renders when form ID is the same
  (prevProps, nextProps) => {
    // Only re-render if the form ID changes
    return prevProps.form?.id === nextProps.form?.id
  },
)

function ShippingForm({ form }: { form: Form }) {
  return <MemoizedShippingForm form={form} />
}

// Memoized checkout button component
const MemoizedCheckoutButton = React.memo(function CheckoutButtonInner() {
  const router = useRouter()
  const { executeAsync, isExecuting } = useActionWarper(checkoutAction)
  const currentVariant = useProductPageContext((state) => state.currentVariant)
  const quantity = useProductPageContext((state) => state.quantity)
  const shippingInfo = useProductPageContext((state) => state.shippingInfo)
  const isFormValid = useProductPageContext((state) => state.isFormValid)
  const voucherCode = useProductPageContext((state) => state.voucherCode)

  const checkout = React.useCallback(() => {
    executeAsync({
      quantity,
      productVariantId: currentVariant.id,
      shippingFields: shippingInfo,
      voucherCode: voucherCode || undefined,
    }).then((x) => {
      if (!x?.data?.order) return
      router.push(Routes.order(x.data.order.id))
    })
  }, [executeAsync, quantity, currentVariant.id, shippingInfo, voucherCode, router])

  return (
    <Button className="w-full font-bold" disabled={isExecuting || !isFormValid} onClick={checkout}>
      {isExecuting && <Loader2 className="animate-spin mr-2" />}
      Thanh toán
    </Button>
  )
})

function CheckoutButton() {
  return <MemoizedCheckoutButton />
}

// Voucher code input component
function VoucherInput() {
  const voucherCode = useProductPageContext((state) => state.voucherCode)
  const setVoucherCode = useProductPageContext((state) => state.setVoucherCode)
  const setAppliedVoucherDiscount = useProductPageContext(
    (state) => state.setAppliedVoucherDiscount,
  )
  const calc = useProductPageContext((state) => state.calc)
  const { executeAsync, isExecuting } = useActionWarper(validateVoucherAction)
  const [_error, setError] = React.useState<string | null>(null)
  const [applied, setApplied] = React.useState(false)

  const handleApply = React.useCallback(async () => {
    if (!voucherCode.trim()) return
    setError(null)
    const result = await executeAsync({
      voucherCode: voucherCode.trim(),
      totalPrice: calc.totalPrice,
    })
    if (result?.data) {
      setAppliedVoucherDiscount(result.data.discountAmount)
      setApplied(true)
    }
  }, [voucherCode, calc.totalPrice, executeAsync, setAppliedVoucherDiscount])

  const handleClear = React.useCallback(() => {
    setVoucherCode('')
    setAppliedVoucherDiscount(0)
    setApplied(false)
    setError(null)
  }, [setVoucherCode, setAppliedVoucherDiscount])

  return (
    <div className="space-y-1">
      <div className="flex gap-2">
        <Input
          placeholder="Nhập mã voucher"
          value={voucherCode}
          onChange={(e) => {
            setVoucherCode(e.target.value)
            if (applied) {
              setApplied(false)
              setAppliedVoucherDiscount(0)
            }
          }}
          className="flex-1"
          disabled={applied}
        />
        {applied ? (
          <Button variant="outline" size="sm" onClick={handleClear}>
            Huỷ
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={handleApply}
            disabled={isExecuting || !voucherCode.trim()}
          >
            {isExecuting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Áp dụng'}
          </Button>
        )}
      </div>
    </div>
  )
}

// Memoized checkout component
const MemoizedCheckout = React.memo(
  function CheckoutInner({ className }: { className?: string }) {
    const user = useAuth().user
    const currentVariant = useProductPageContext((state) => state.currentVariant)
    const quantity = useProductPageContext((state) => state.quantity)
    const incQuantity = useProductPageContext((state) => state.incQuantity)
    const decQuantity = useProductPageContext((state) => state.decQuantity)
    const setQuantity = useProductPageContext((state) => state.setQuantity)
    const calc = useProductPageContext((state) => state.calc)
    const [editingQuantity, setEditingQuantity] = useState<number | undefined>(undefined)

    const handleQuantityChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseInt(e.target.value, 10)
      if (!isNaN(value)) {
        setEditingQuantity(value)
      }
    }, [])

    const handleQuantityBlur = React.useCallback(
      (e: React.FocusEvent<HTMLInputElement>) => {
        const parsedValue = Math.min(
          Math.max(parseInt(e.target.value, 10) || currentVariant.min, currentVariant.min),
          currentVariant.max,
        )
        setQuantity(parsedValue)
        setEditingQuantity(undefined)
      },
      [currentVariant.max, currentVariant.min, setQuantity],
    )

    const appliedVoucherDiscount = useProductPageContext((state) => state.appliedVoucherDiscount)
    const finalPrice = Math.max(0, calc.totalPrice - appliedVoucherDiscount)

    return (
      <Card id="checkout" style={{ scrollMarginTop: '100px' }} className={cn('p-6', className)}>
        <div className="flex w-full text-sm items-center justify-between">
          <span>Giá gốc</span>
          <span>{formatPrice(calc.totalOriginalPrice, 'VND')}</span>
        </div>
        {calc.totalDiscountPrice > 0 ? (
          <div className="flex w-full text-sm items-center justify-between">
            <span>Giá giảm</span>
            <span>{formatPrice(calc.totalDiscountPrice, 'VND')}</span>
          </div>
        ) : null}
        {appliedVoucherDiscount > 0 && (
          <div className="flex w-full text-sm items-center justify-between text-green-500">
            <span>Mã giảm giá</span>
            <span>-{formatPrice(appliedVoucherDiscount, 'VND')}</span>
          </div>
        )}
        {currentVariant.max > 1 && (
          <div className="flex justify-between mt-2">
            <span>Số lượng</span>
            <div className="flex">
              <Button
                id={`decrement-quantity`}
                disabled={quantity <= currentVariant.min}
                type="button"
                variant="outline"
                size="icon"
                className="size-8 shrink-0 rounded-r-none"
                onClick={() => decQuantity()}
              >
                <MinusIcon className="size-3 text-highlight" aria-hidden="true" />
              </Button>
              <div className="flex items-center justify-center h-8 w-16 rounded-none border-y border-x-0">
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  className="w-full text-center bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  value={editingQuantity !== undefined ? editingQuantity : quantity}
                  onFocus={() => setEditingQuantity(quantity)}
                  onChange={handleQuantityChange}
                  onBlur={handleQuantityBlur}
                />
              </div>
              <Button
                id={`increment-quantity`}
                disabled={quantity >= currentVariant.max}
                type="button"
                variant="outline"
                size="icon"
                className="size-8 shrink-0 rounded-l-none"
                onClick={() => incQuantity()}
              >
                <PlusIcon className="size-3 text-highlight" aria-hidden="true" />
              </Button>
            </div>
          </div>
        )}

        <hr className="my-4 border-t border-border" />
        <div className="space-y-4">
          <VoucherInput />
          <div className="flex w-full items-center justify-between">
            <span className="font-bold">Tổng tiền</span>
            <span className="font-bold text-highlight">{formatPrice(finalPrice, 'VND')}</span>
          </div>
          {currentVariant.status === 'ORDER' && workingTime}
          {user ? <CheckoutButton /> : <AuthDialog className="w-full" />}
        </div>
      </Card>
    )
  },
  // Custom comparison function to prevent re-renders when form ID is the same
  (_prevProps, _nextProps) => {
    // We don't actually use props here since we're getting data from context
    // But we can still prevent unnecessary re-renders
    return true
  },
)

function Checkout({ className }: { className?: string }) {
  return <MemoizedCheckout className={className} />
}

function ProductCard({ product }: { product: Product }) {
  const styles = getProductCardStyles()

  return (
    <div className={styles.wrapper}>
      <Link
        href={Routes.product(product.slug!)}
        className={cn('flex p-1 items-center rounded-md', styles.link)}
      >
        <Card className={cn('flex w-full items-center', styles.card)}>
          <div className={cn('h-[64px] w-[48px] rounded-md', styles.mediaContainer)}>
            <Media
              resource={product.image}
              imgClassName={cn('absolute h-[64px] w-[48px] ease-in-out object-cover', styles.media)}
            />
          </div>
          <div className="flex flex-1 items-start gap-2 p-2">
            <div className="flex h-full flex-col justify-between">
              <div className={cn('font-bold text-sm', styles.name)}>{product.name}</div>
              <div className="flex items-center gap-2">
                <div className={cn('text-xs text-muted-foreground', styles.price)}>
                  {product.minPrice === product.maxPrice
                    ? formatPrice(product.minPrice)
                    : `${formatPrice(product.minPrice)} ~ ${formatPrice(product.maxPrice)}`}
                </div>
                {product.maxDiscount > 0 && (
                  <Badge className={cn('text-xs px-1 py-0', styles.badge)}>
                    -{product.maxDiscount.toFixed(0)}%
                  </Badge>
                )}
              </div>
              {product.sold > 0 && (
                <div className="text-xs text-muted-foreground">
                  Đã bán {formatSold(product.sold)}
                </div>
              )}
            </div>
          </div>
        </Card>
      </Link>
    </div>
  )
}

function ProductRelated({ className }: { className?: string }) {
  const product = useProductPageContext((state) => state.product)
  const relatedProducts = useMemo(() => {
    if (!product.relatedProducts) return []
    if (product.relatedProducts.length === 0) return []
    if (typeof product.relatedProducts[0] !== 'object') return []
    return product.relatedProducts as Product[]
  }, [product])
  if (relatedProducts.length <= 0) return null
  return (
    <Card className={cn(className)}>
      <CardHeader className="font-bold pb-2">Sản phẩm liên quan</CardHeader>
      <CardContent>
        {relatedProducts.map((relatedProduct) => (
          <ProductCard key={relatedProduct.id} product={relatedProduct} />
        ))}
      </CardContent>
    </Card>
  )
}

// Important Notice Component
const ImportantNotice = React.memo(function ImportantNotice() {
  const important = useProductPageContext((state) => state.currentVariant.important)

  if (!hasText(important)) return null

  return (
    <Card>
      <CardHeader className="font-bold px-4 pb-1">
        <div className="flex gap-2">
          <TriangleAlert></TriangleAlert>
          <span>Thông báo quan trọng</span>
        </div>
      </CardHeader>
      <CardContent className="px-4">
        <RichText className="text-sm" data={important as any} overrideClassName></RichText>
      </CardContent>
    </Card>
  )
})

// Product Description Component
const ProductDescription = React.memo(function ProductDescription() {
  const productDescription = useProductPageContext((state) => state.product.description)
  const variantDescription = useProductPageContext((state) => state.currentVariant.description)

  const description = useMemo(() => {
    return hasText(variantDescription) ? variantDescription : productDescription
  }, [variantDescription, productDescription])

  if (!hasText(description)) return null

  return (
    <Card>
      <CardHeader className="font-bold px-4 pb-1">
        <div className="flex gap-2">
          <span>Mô tả</span>
        </div>
      </CardHeader>
      <CardContent className="px-4">
        <RichText className="text-sm" data={description as any} enableGutter={false}></RichText>
      </CardContent>
    </Card>
  )
})

// Product Variants Filter Component for Desktop
const DesktopVariantsFilter = React.memo(function DesktopVariantsFilter() {
  const variants = useProductPageContext((state) => state.product.variants) as ProductVariant[]

  return (
    <div className="max-md:hidden">
      <FilterProductVariants variants={variants} />
    </div>
  )
})

// Mobile Variants Drawer Component
const MobileVariantsDrawer = React.memo(function MobileVariantsDrawer() {
  const variants = useProductPageContext((state) => state.product.variants) as ProductVariant[]

  if (!variants || variants.length <= 1) return null

  return <ProductVariantsDrawer className="md:hidden mb-2" productVariants={variants || []} />
})

// Product Form Component
const ProductForm = React.memo(
  function ProductForm() {
    const form = useProductPageContext((state) => state.currentVariant?.form) as Form | null
    const status = useProductPageContext((state) => state.currentVariant?.status)

    if (!form || status === 'STOPPED') return null

    return <ShippingForm form={form} />
  },
  // Custom comparison function to prevent re-renders when form ID is the same
  (_prevProps, _nextProps) => {
    // We don't actually use props here since we're getting data from context
    // But we can still prevent unnecessary re-renders
    return true
  },
)

// Out of Stock Component
const OutOfStockNotice = React.memo(function OutOfStockNotice() {
  const status = useProductPageContext((state) => state.currentVariant.status)

  if (status !== 'STOPPED') return null

  return (
    <Card className="p-4">
      <CardHeader className="font-bold pb-2">
        <div className="flex items-center gap-2">
          <span>Sản phẩm hết hàng</span>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Thông báo sản phẩm hiện đã hết hàng, mọi thông tin chi tiết vui lòng liên hệ qua chat hỗ
          trợ hoặc các kênh cộng đồng của chúng tôi để kiểm tra giá và biết tình trạng hiện tại của
          sản phẩm.
        </p>
        <p className="mt-2 text-sm font-semibold">
          Email :{' '}
          <a
            href={`mailto:${config.NEXT_PUBLIC_EMAIL_CONTACT}`}
            className="text-primary hover:underline"
          >
            {config.NEXT_PUBLIC_EMAIL_CONTACT}
          </a>
        </p>
      </CardContent>
    </Card>
  )
})

// Checkout or Out of Stock Component
const CheckoutOrOutOfStock = React.memo(function CheckoutOrOutOfStock() {
  const status = useProductPageContext((state) => state.currentVariant.status)

  return status === 'STOPPED' ? <OutOfStockNotice /> : <Checkout />
})

// Memoized Screen component
const MemoizedScreen = React.memo(function ScreenInner() {
  return (
    <Shell>
      <Head />
      <div className="flex flex-wrap gap-x-4 max-md:flex-col">
        <div className="flex-[2] flex-col space-y-2 max-md:order-2">
          <ImportantNotice />
          <DesktopVariantsFilter />
          <ProductDescription />
          <ProductRelated className="md:hidden" />
        </div>
        <div className="flex-1 max-md:order-1 max-md:mt-3">
          <MobileVariantsDrawer />
          <div className={'space-y-2'}>
            <ProductForm />
            <CheckoutOrOutOfStock />
            <ProductRelated className="hidden md:block" />
          </div>
        </div>
      </div>
    </Shell>
  )
})

function Screen() {
  return <MemoizedScreen />
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
