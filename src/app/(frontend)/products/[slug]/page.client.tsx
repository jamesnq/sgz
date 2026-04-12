'use client'

import { useHeaderTheme } from '@/providers/HeaderTheme'
import React, { useEffect, useMemo, useState } from 'react'
import { createContext, useContextSelector } from 'use-context-selector'

import { Media } from '@/components/Media'
import { Form, Product, ProductVariant } from '@/payload-types'

import { checkoutAction } from '@/app/_actions/checkoutAction'
import { getAvailableVouchersAction, type AvailableVoucher } from '@/app/_actions/getAvailableVouchersAction'
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
import { workingTime, instantDelivery } from '@/utilities/constants-react'
import { formatPrice } from '@/utilities/formatPrice'
import { formatSold } from '@/utilities/formatSold'
import { Routes } from '@/utilities/routes'
import { cn } from '@/utilities/ui'
import { useActionWarper } from '@/utilities/useActionWarper'
import { validateRequiredFields } from '@/utilities/validateFormFields'
import { hasText } from '@payloadcms/richtext-lexical/shared'
import {
  ArrowUpDown,
  Loader2,
  MinusIcon,
  PlusIcon,
  Search,
  TriangleAlert,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  Tag,
  Clock,
} from 'lucide-react'
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
    <section className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
      <Media
        resource={currentVariant?.image || product.image}
        imgClassName="w-full h-auto object-cover aspect-video lg:aspect-auto max-h-[500px]"
        size="(max-width: 1024px) 100vw, 50vw"
        priority={true}
      />
    </section>
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
              size="72px"
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
      <div
        id="shipping-form"
        className="bg-[#16161e] border border-white/10 rounded-2xl p-6 shadow-xl w-full overflow-hidden"
      >
        <h2 className="text-xl font-bold text-white mb-4">Thông tin đơn hàng</h2>
        <div>
          {form.fields?.map((field: any, index: number) => {
            const Field: React.FC<any> = fields?.[field.blockType as keyof typeof fields]
            if (!Field) return null

            return (
              <div className="mb-4 last:mb-0" key={index}>
                <MemoizedFormField field={field} onChange={createFieldChangeHandler(field.name)} />
              </div>
            )
          })}
        </div>
      </div>
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
    }).then((x: any) => {
      if (!x?.data?.order) return
      router.push(Routes.order(x.data.order.id))
    })
  }, [executeAsync, quantity, currentVariant.id, shippingInfo, voucherCode, router])

  return (
    <button
      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-4 rounded-xl font-bold shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 flex justify-center items-center"
      disabled={isExecuting || !isFormValid}
      onClick={checkout}
    >
      {isExecuting && <Loader2 className="animate-spin mr-2" />}
      Thanh toán
    </button>
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
  const currentVariant = useProductPageContext((state) => state.currentVariant)
  const { executeAsync, isExecuting } = useActionWarper(validateVoucherAction)
  const [_error, setError] = React.useState<string | null>(null)
  const [applied, setApplied] = React.useState(false)
  const pendingAutoApplyRef = React.useRef(false)

  const handleApply = React.useCallback(async (codeOverride?: string) => {
    const code = codeOverride || voucherCode
    if (!code.trim()) return
    setError(null)
    const result = await executeAsync({
      voucherCode: code.trim(),
      totalPrice: calc.totalPrice,
      productVariantId: currentVariant.id,
    })
    if (result?.data) {
      setAppliedVoucherDiscount(result.data.discountAmount)
      setApplied(true)
    }
  }, [voucherCode, calc.totalPrice, currentVariant.id, executeAsync, setAppliedVoucherDiscount])

  // Auto-apply when voucher code is set from slideshow
  React.useEffect(() => {
    if (pendingAutoApplyRef.current && voucherCode.trim()) {
      pendingAutoApplyRef.current = false
      handleApply(voucherCode)
    }
  }, [voucherCode, handleApply])

  const handleClear = React.useCallback(() => {
    setVoucherCode('')
    setAppliedVoucherDiscount(0)
    setApplied(false)
    setError(null)
  }, [setVoucherCode, setAppliedVoucherDiscount])

  // Expose auto-apply trigger via a callback that slideshow can use
  const handleAutoApply = React.useCallback((code: string) => {
    if (applied) {
      // Clear current voucher first
      setAppliedVoucherDiscount(0)
      setApplied(false)
      setError(null)
    }
    setVoucherCode(code)
    pendingAutoApplyRef.current = true
  }, [applied, setVoucherCode, setAppliedVoucherDiscount])

  return (
    <div className="space-y-1.5 w-full">
      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Voucher</label>
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
          className="flex-1 bg-[#0f0f13] border-white/10 rounded-lg text-sm text-white focus:ring-[#8b5cf6] focus:border-[#8b5cf6] py-2 h-[42px]"
          disabled={applied}
        />
        {applied ? (
          <button
            className="px-4 py-2 bg-[#2d2d39] hover:bg-[#3d3d4d] text-white rounded-lg text-xs font-bold transition-colors h-[42px]"
            onClick={handleClear}
          >
            Huỷ
          </button>
        ) : (
          <button
            className="px-4 py-2 bg-[#2d2d39] hover:bg-[#3d3d4d] text-white rounded-lg text-xs font-bold transition-colors h-[42px] disabled:opacity-50 flex items-center justify-center"
            onClick={() => handleApply()}
            disabled={isExecuting || !voucherCode.trim()}
          >
            {isExecuting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Áp dụng'}
          </button>
        )}
      </div>
      {_error && <p className="text-xs text-red-500 mt-1">{_error}</p>}
      <VoucherSlideshow onApply={handleAutoApply} />
    </div>
  )
}

// Scarcity text helper for voucher expiration
function getExpirationDisplay(expirationDate: string): { text: string; className: string } {
  const now = new Date()
  const expiry = new Date(expirationDate)
  const diffMs = expiry.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays <= 0) {
    return { text: '⏰ Hết hạn hôm nay!', className: 'text-red-400 font-semibold' }
  }
  if (diffDays === 1) {
    return { text: '⏰ Còn vài giờ!', className: 'text-red-400 font-semibold' }
  }
  if (diffDays <= 3) {
    return { text: `Còn ${diffDays} ngày`, className: 'text-orange-400 font-medium' }
  }
  if (diffDays <= 7) {
    return { text: `Còn ${diffDays} ngày`, className: 'text-yellow-400' }
  }
  const d = expiry.getDate().toString().padStart(2, '0')
  const m = (expiry.getMonth() + 1).toString().padStart(2, '0')
  return { text: `HSD: ${d}/${m}`, className: 'text-gray-400' }
}

// Format voucher discount value for display
function formatVoucherDiscount(voucher: AvailableVoucher): string {
  if (voucher.discountType === 'percentage') {
    return `-${voucher.discountValue}%`
  }
  return `-${formatPrice(voucher.discountValue)}`
}

// Voucher slideshow component
function VoucherSlideshow({ onApply }: { onApply: (code: string) => void }) {
  const product = useProductPageContext((state) => state.product)
  const currentVariant = useProductPageContext((state) => state.currentVariant)
  const [vouchers, setVouchers] = React.useState<AvailableVoucher[]>([])
  const [loading, setLoading] = React.useState(true)
  const { executeAsync } = useActionWarper(getAvailableVouchersAction)

  const [itemsPerPage, setItemsPerPage] = React.useState(2)
  const [currentPage, setCurrentPage] = React.useState(0)

  React.useEffect(() => {
    let cancelled = false
    setLoading(true)
    executeAsync({
      productId: product.id,
      productVariantId: currentVariant?.id,
    }).then((result: any) => {
      if (!cancelled && result?.data) {
        setVouchers(result.data)
      }
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id, currentVariant?.id])

  React.useEffect(() => {
    const handleResize = () => {
      // 1 item on mobile, 2 items on pc/tablet
      setItemsPerPage(window.innerWidth < 768 ? 1 : 2)
    }
    
    // Set initial
    handleResize()

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const totalPages = Math.ceil(vouchers.length / itemsPerPage)
  
  // reset page if resize makes current page out of bounds
  React.useEffect(() => {
    if (currentPage >= totalPages && totalPages > 0) {
       setCurrentPage(Math.max(0, totalPages - 1))
    }
  }, [totalPages, currentPage])

  const handlePrev = React.useCallback(() => {
    setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages)
  }, [totalPages])

  const handleNext = React.useCallback(() => {
    setCurrentPage((prev) => (prev + 1) % totalPages)
  }, [totalPages])

  // To support swipe on mobile without triggering re-renders on every pixel move
  const touchStartX = React.useRef<number | null>(null)
  const touchEndX = React.useRef<number | null>(null)

  if (loading || vouchers.length === 0) return null

  const pages = []
  for (let i = 0; i < vouchers.length; i += itemsPerPage) {
    pages.push(vouchers.slice(i, i + itemsPerPage))
  }

  const minSwipeDistance = 50

  const onTouchStart = (e: React.TouchEvent) => {
    touchEndX.current = null
    const touch = e.targetTouches?.[0] || e.touches?.[0]
    if (touch) {
      touchStartX.current = touch.clientX
    }
  }

  const onTouchMove = (e: React.TouchEvent) => {
    const touch = e.targetTouches?.[0] || e.touches?.[0]
    if (touch) {
      touchEndX.current = touch.clientX
    }
  }

  const onTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return
    const distance = touchStartX.current - touchEndX.current
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe) {
      handleNext()
    } else if (isRightSwipe) {
      handlePrev()
    }
    
    touchStartX.current = null
    touchEndX.current = null
  }

  return (
    <div className="mt-3 relative group w-full">
      <div 
        className="overflow-hidden w-full"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentPage * 100}%)` }}
        >
          {pages.map((pageVouchers, pageIndex) => (
            <div key={pageIndex} className="w-full shrink-0">
              <div 
                className={cn(
                  "grid gap-3", 
                  itemsPerPage === 1 ? "grid-cols-1" : "grid-cols-2"
                )}
              >
                {pageVouchers.map((voucher) => (
                  <div
                    key={voucher.code}
                    className="bg-[#0f0f13] border border-white/10 rounded-xl p-3 flex flex-col justify-between gap-3 hover:border-[#8b5cf6]/40 transition-colors h-full"
                  >
                    <div className="flex flex-col gap-1.5">
                      {/* Voucher code */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5 text-[#8b5cf6] shrink-0" />
                          <span className="text-sm font-bold text-white tracking-wide truncate">
                            {voucher.code}
                          </span>
                        </div>
                        <span className="text-sm font-bold text-[#8b5cf6]">
                          {formatVoucherDiscount(voucher)}
                        </span>
                      </div>

                      {/* Optional info */}
                      {(voucher.remainingUses !== null || voucher.expirationDate) && (
                        <div className="flex flex-col gap-1 mt-1">
                          {voucher.remainingUses !== null && (
                            <span className="text-xs text-gray-400">
                              Còn {voucher.remainingUses} lượt
                            </span>
                          )}
                          {voucher.expirationDate && (
                            <span className={cn('text-xs flex items-center gap-1', getExpirationDisplay(voucher.expirationDate).className)}>
                              <Clock className="w-3 h-3" />
                              {getExpirationDisplay(voucher.expirationDate).text}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Apply button */}
                    <button
                      onClick={() => onApply(voucher.code)}
                      className="w-full text-xs font-bold py-2 rounded-lg bg-[#8b5cf6]/15 text-[#8b5cf6] hover:bg-[#8b5cf6]/25 transition-colors border border-[#8b5cf6]/20 mt-1"
                    >
                      Áp dụng
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center mt-4 gap-4">
          <button
            onClick={handlePrev}
            className="w-8 h-8 rounded-full bg-[#16161e] border border-white/10 hover:bg-[#8b5cf6] hover:border-[#8b5cf6] flex items-center justify-center text-white transition-colors shadow-sm"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <div className="flex justify-center gap-1.5">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i)}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-300',
                  currentPage === i ? 'w-6 bg-[#8b5cf6]' : 'w-1.5 bg-gray-600 hover:bg-gray-400',
                )}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="w-8 h-8 rounded-full bg-[#16161e] border border-white/10 hover:bg-[#8b5cf6] hover:border-[#8b5cf6] flex items-center justify-center text-white transition-colors shadow-sm"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}

// Memoized checkout component
const MemoizedCheckout = React.memo(
  function CheckoutInner({ className }: { className?: string }) {
    const user = useAuth().user
    const product = useProductPageContext((state) => state.product)
    const variants = product.variants as ProductVariant[]
    const currentVariant = useProductPageContext((state) => state.currentVariant)
    const setCurrentVariant = useProductPageContext((state) => state.setCurrentVariant)
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

    const productTitle = currentVariant?.name || product.name
    const discountPercentage =
      calc.totalOriginalPrice > 0
        ? ((calc.totalDiscountPrice / calc.totalOriginalPrice) * 100).toFixed(0)
        : 0

    return (
      <div
        id="checkout"
        style={{ scrollMarginTop: '100px' }}
        className={cn('bg-[#16161e] border border-white/10 rounded-2xl p-6 shadow-xl', className)}
      >
        <h1 className="text-xl font-bold text-white mb-2 leading-tight">{productTitle}</h1>

        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl font-bold text-[#8b5cf6]">
            {formatPrice(finalPrice, 'VND')}
          </span>
          {calc.totalDiscountPrice > 0 && (
            <>
              <span className="text-sm text-gray-500 line-through">
                {formatPrice(calc.totalOriginalPrice, 'VND')}
              </span>
              <span className="bg-[#8b5cf6]/20 text-[#8b5cf6] text-xs font-bold px-2 py-0.5 rounded">
                -{discountPercentage}%
              </span>
            </>
          )}
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-3 w-full">
            {variants?.length > 0 && (
              <div
                className={`space-y-1.5 ${currentVariant.max > 1 ? 'col-span-3' : 'col-span-4'}`}
              >
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block whitespace-nowrap">
                  Phiên bản
                </label>
                <Select
                  value={String(currentVariant.id)}
                  onValueChange={(val) => {
                    const selected = variants.find((v) => String(v.id) === val)
                    if (selected) {
                      setCurrentVariant(selected)
                    }
                  }}
                >
                  <SelectTrigger className="w-full bg-[#0f0f13] border-white/10 rounded-lg text-sm text-white focus:ring-[#8b5cf6] focus:border-[#8b5cf6] h-[42px]">
                    <SelectValue placeholder="Chọn phiên bản" />
                  </SelectTrigger>
                  <SelectContent>
                    {variants.map((v) => (
                      <SelectItem key={v.id} value={String(v.id)}>
                        {v.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {currentVariant.max > 1 && (
              <div className={`space-y-1.5 ${variants?.length > 0 ? 'col-span-1' : 'col-span-4'}`}>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block whitespace-nowrap text-center">
                  Số lượng
                </label>
                <div className="flex items-center justify-between bg-[#0f0f13] border border-white/10 rounded-lg p-1 w-full h-[42px]">
                  <button
                    id={`decrement-quantity`}
                    disabled={quantity <= currentVariant.min}
                    type="button"
                    className="w-7 h-7 flex shrink-0 items-center justify-center hover:bg-white/5 rounded text-white disabled:opacity-50"
                    onClick={() => decQuantity()}
                  >
                    <MinusIcon className="size-3" aria-hidden="true" />
                  </button>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    className="w-full min-w-0 px-1 text-sm font-bold text-center text-white bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:outline-none"
                    value={editingQuantity !== undefined ? editingQuantity : quantity}
                    onFocus={() => setEditingQuantity(quantity)}
                    onChange={handleQuantityChange}
                    onBlur={handleQuantityBlur}
                  />
                  <button
                    id={`increment-quantity`}
                    disabled={quantity >= currentVariant.max}
                    type="button"
                    className="w-7 h-7 flex shrink-0 items-center justify-center hover:bg-white/5 rounded text-white disabled:opacity-50"
                    onClick={() => incQuantity()}
                  >
                    <PlusIcon className="size-3" aria-hidden="true" />
                  </button>
                </div>
              </div>
            )}
          </div>

          <ImportantNotice />

          {currentVariant.status !== 'STOPPED' && <VoucherInput />}

          <div className="pt-6 border-t border-white/5 flex items-center justify-between flex-wrap gap-2">
            <span className="text-sm font-medium text-gray-400">Tổng thanh toán:</span>
            <div className="flex flex-col items-end gap-1 text-right">
              {appliedVoucherDiscount > 0 && currentVariant.status !== 'STOPPED' && (
                <span className="text-sm text-green-500">
                  Khuyến mãi: -{formatPrice(appliedVoucherDiscount, 'VND')}
                </span>
              )}
              <span className="text-xl font-bold text-white">{formatPrice(currentVariant.status === 'STOPPED' ? calc.totalPrice : finalPrice, 'VND')}</span>
            </div>
          </div>

          {currentVariant.status === 'STOPPED' && (
            <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-xl flex flex-col gap-3 mt-4">
              <div className="flex items-center gap-2 text-orange-400">
                <TriangleAlert className="h-5 w-5 shrink-0" />
                <span className="font-bold text-sm">Sản phẩm hiện đang hết hàng!</span>
              </div>
              <p className="text-orange-200/90 text-xs leading-relaxed">
                Mọi thông tin chi tiết vui lòng liên hệ qua Fanpage để kiểm tra giá và biết tình trạng hiện tại của sản phẩm.
              </p>
              <a
                href="https://www.facebook.com/subgamezoneoffical"
                target="_blank"
                rel="noreferrer"
                className="mt-1 flex items-center justify-center gap-2 bg-[#1877F2] hover:bg-[#166FE5] text-white py-2.5 px-4 rounded-lg font-semibold transition-colors w-full text-sm"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Liên hệ Fanpage
              </a>
            </div>
          )}

          {currentVariant.status === 'ORDER' && workingTime}
          {currentVariant.status === 'AVAILABLE' && instantDelivery}
          {currentVariant.status === 'STOPPED' ? (
            <button disabled className="w-full bg-gray-600/50 text-gray-400 py-4 flex justify-center items-center rounded-xl font-bold cursor-not-allowed mt-2">
              Hết hàng
            </button>
          ) : user ? (
            <CheckoutButton />
          ) : (
            <AuthDialog>
              <button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-4 flex justify-center items-center rounded-xl font-bold shadow-lg shadow-primary/20 transition-all active:scale-[0.98]">
                Đăng nhập để thanh toán
              </button>
            </AuthDialog>
          )}
        </div>
      </div>
    )
  },
)

function Checkout({ className }: { className?: string }) {
  return <MemoizedCheckout className={className} />
}

function GridProductCard({ product }: { product: Product }) {
  const discount = product.maxDiscount || 0
  const salePrice = product.minPrice || 0
  const originalPrice = discount > 0 ? Math.round(salePrice / (1 - discount / 100)) : salePrice

  return (
    <div className="group cursor-pointer flex flex-col h-full bg-[#16161e] border border-white/5 rounded-xl p-2 hover:bg-white/[0.04] transition-colors">
      <div className="relative aspect-video rounded-xl overflow-hidden mb-3 bg-[#16161e] shrink-0">
        <Media
          resource={product.image}
          className="w-full h-full"
          imgClassName="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        {discount > 0 && (
          <div className="absolute top-2 left-2 bg-[#ff97b5] text-[#380018] font-bold px-1.5 py-0.5 rounded text-[10px]">
            -{discount.toFixed(0)}%
          </div>
        )}
        <div className="absolute bottom-2 right-2 translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
          <Link
            href={product.slug ? Routes.product(product.slug) : '#'}
            className="bg-[#8b5cf6] text-white p-2 rounded-xl shadow-xl flex hover:bg-white hover:text-[#8b5cf6] transition-colors"
          >
            <ShoppingCart className="w-4 h-4 leading-none" />
          </Link>
        </div>
      </div>
      <Link href={product.slug ? Routes.product(product.slug) : '#'} className="mb-1">
        <h3 className="font-bold text-white text-sm line-clamp-1 hover:text-[#8b5cf6] transition-colors">
          {product.name}
        </h3>
      </Link>
      
      <div className="text-[10px] text-gray-500 mb-2 mt-0.5 flex items-center gap-1.5 font-medium">
        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-flame text-orange-500/80 fill-orange-500/20"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
        Đã bán {formatSold(product.sold || 0)}
      </div>

      <div className="flex items-center gap-1.5 mt-auto pt-1">
        {discount > 0 && (
          <span className="text-gray-500 line-through text-[11px]">
            {formatPrice(originalPrice)}
          </span>
        )}
        <span className="text-[#8b5cf6] font-bold text-sm">{formatPrice(salePrice)}</span>
      </div>
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

  const [currentPage, setCurrentPage] = useState(0)

  if (relatedProducts.length <= 0) return null

  const itemsPerPage = 4
  const totalPages = Math.ceil(relatedProducts.length / itemsPerPage)

  const handlePrev = React.useCallback(() => {
    setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages)
  }, [totalPages])

  const handleNext = React.useCallback(() => {
    setCurrentPage((prev) => (prev + 1) % totalPages)
  }, [totalPages])

  const pages = []
  for (let i = 0; i < relatedProducts.length; i += itemsPerPage) {
    pages.push(relatedProducts.slice(i, i + itemsPerPage))
  }

  return (
    <section className={cn('pt-4', className)}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <span className="w-1.5 h-6 bg-[#8b5cf6] rounded-full"></span>
          Sản phẩm liên quan
        </h2>
        {totalPages > 1 && (
          <div className="flex items-center gap-2 hidden md:flex">
            <button
              onClick={handlePrev}
              className="w-8 h-8 rounded-full bg-[#16161e] border border-white/10 hover:bg-[#8b5cf6] hover:border-[#8b5cf6] flex items-center justify-center text-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNext}
              className="w-8 h-8 rounded-full bg-[#16161e] border border-white/10 hover:bg-[#8b5cf6] hover:border-[#8b5cf6] flex items-center justify-center text-white transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      <div className="relative w-full group">
        <div className="overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentPage * 100}%)` }}
          >
            {pages.map((pageProducts, pageIndex) => (
              <div key={pageIndex} className="w-full shrink-0">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                  {pageProducts.map((relatedProduct) => (
                    <GridProductCard key={relatedProduct.id} product={relatedProduct} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center mt-6 gap-2">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i)}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-300',
                  currentPage === i ? 'w-6 bg-[#8b5cf6]' : 'w-1.5 bg-gray-600 hover:bg-gray-400',
                )}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

// Important Notice Component
const ImportantNotice = React.memo(function ImportantNotice({ className }: { className?: string }) {
  const important = useProductPageContext((state) => state.currentVariant.important)

  const isImportantEmpty = React.useMemo(() => {
    if (!important) return true
    if (typeof important === 'object' && 'root' in important) {
      const root = (important as any).root
      if (!root?.children?.length) return true
      // Check if all children (paragraphs) are empty
      const hasContent = root.children.some((child: any) => {
        if (child.children?.length > 0) return true
        if (typeof child.text === 'string' && child.text.trim() !== '') return true
        return false
      })
      return !hasContent
    }
    return !hasText(important)
  }, [important])

  if (isImportantEmpty) return null

  return (
    <section className={cn('bg-red-500/10 border border-red-500/20 rounded-2xl p-4', className)}>
      <div className="space-y-3 text-red-200/80 leading-relaxed text-sm">
        <RichText className="text-sm" data={important as any} overrideClassName></RichText>
      </div>
    </section>
  )
})

// Product Description Component
const ProductDescription = React.memo(function ProductDescription() {
  const productDescription = useProductPageContext((state) => state.product.description)
  const variantDescription = useProductPageContext((state) => state.currentVariant.description)

  const description = useMemo(() => {
    return hasText(variantDescription) ? variantDescription : productDescription
  }, [variantDescription, productDescription])

  const contentRef = React.useRef<HTMLDivElement>(null)
  const [isExpanded, setIsExpanded] = React.useState(false)
  const [isLongContent, setIsLongContent] = React.useState(false)

  React.useEffect(() => {
    const checkHeight = () => {
      if (contentRef.current && contentRef.current.scrollHeight > 320) {
        setIsLongContent(true)
      } else {
        setIsLongContent(false)
        setIsExpanded(true) // Expand implicitly so it doesn't clip if slightly over
      }
    }

    checkHeight()
    const timeout = setTimeout(checkHeight, 500)
    return () => clearTimeout(timeout)
  }, [description])

  if (!hasText(description)) return null

  return (
    <section
      className="bg-[#16161e] border border-white/10 rounded-2xl p-6 md:p-8"
      id="product-details"
    >
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
        <span className="w-1 h-6 bg-[#8b5cf6] rounded-full"></span>
        Mô tả sản phẩm
      </h2>
      <div
        ref={contentRef}
        className={cn(
          'relative transition-all duration-500 ease-in-out',
          !isExpanded && isLongContent ? 'max-h-[300px] overflow-hidden' : '',
        )}
      >
        <div className="space-y-4 text-gray-300 leading-relaxed text-sm md:text-base">
          <RichText className="text-sm" data={description as any} enableGutter={false}></RichText>
        </div>

        {!isExpanded && isLongContent && (
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#16161e] to-transparent pointer-events-none" />
        )}
      </div>

      {isLongContent && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-[#8b5cf6] hover:text-white transition-colors text-sm font-semibold py-2 px-6 rounded-full border border-[#8b5cf6]/30 hover:bg-[#8b5cf6]/10 flex items-center justify-center min-w-[140px]"
          >
            {isExpanded ? 'Thu gọn' : 'Hiển thị thêm'}
          </button>
        </div>
      )}
    </section>
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
)



// Memoized Screen component
const MemoizedScreen = React.memo(function ScreenInner() {
  return (
    <main className="max-w-[1440px] px-6 lg:px-12 mx-auto py-8">
      <div className="flex flex-col lg:grid lg:grid-cols-[1fr_400px] gap-8">
        <div className="order-1 lg:col-start-1 lg:row-start-1">
          <Head />
        </div>

        <aside
          className="order-2 lg:col-start-2 lg:row-start-1 lg:row-span-2 space-y-6 w-full lg:w-[400px] lg:order-none"
          data-purpose="checkout-sidebar"
        >
          <div className="space-y-6 lg:sticky lg:top-24">
            <ProductForm />
            <Checkout />
          </div>
        </aside>

        <div
          className="order-3 lg:col-start-1 lg:row-start-2 space-y-8 lg:order-none"
          data-purpose="content-left"
        >
          <ProductDescription />
          <ProductRelated className="mt-8" />
        </div>
      </div>
    </main>
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
