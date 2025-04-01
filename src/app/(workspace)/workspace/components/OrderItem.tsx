'use client'
import { autoProcessOrderAction } from '@/app/_actions/autoProcessOrderAction'
import { OrderShippingForm } from '@/app/(workspace)/workspace/components/OrderShippingForm'
import RichText from '@/components/RichText'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Form, FormSubmission, Order, ProductVariant, User } from '@/payload-types'
import { formatEmailToUsername } from '@/utilities/formatEmailToUsername'
import { formatOrderDate } from '@/utilities/formatOrderDate'
import { formatPrice } from '@/utilities/formatPrice'
import { formatTimeAgo } from '@/utilities/formatTimeAgo'
import { getOrderStatus } from '@/utilities/getOrderStatus'
import { cn } from '@/utilities/ui'
import { hasText } from '@payloadcms/richtext-lexical/shared'
import { motion } from 'framer-motion'
import { ArrowRightLeft, Bot, Pencil } from 'lucide-react'
import { memo, useCallback, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import { useDraggable } from '../DraggableContext'

export interface OrderItemProps {
  order: Order
  handleDragStart: (e: React.DragEvent<HTMLDivElement>, order: Order) => void
  dropOnly?: boolean
}

export const OrderItem = memo(({ order, handleDragStart, dropOnly }: OrderItemProps) => {
  const {
    updatingOrderIds,
    moveOrder,
    columnConfigs,
    showConfirmation,
    refetch,
    isTransitionAllowed,
  } = useDraggable()
  const isUpdating = updatingOrderIds.includes(order.id.toString())
  const [isOpen, setIsOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isUpdating) {
        e.preventDefault()
        e.stopPropagation()
        setIsOpen(true)
      }
    },
    [isUpdating],
  )

  const handleAutoProcess = useCallback(
    async (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault()
      e.stopPropagation()

      if (isProcessing || isUpdating) return

      setIsProcessing(true)
      try {
        const result = await autoProcessOrderAction({ orderId: order.id })
        if (result && result.data?.success) {
          toast.success(result.data.message)
          // Fetch orders after successful processing
          refetch()
        }
      } catch (error: any) {
        // Handle error from ServerNotification
        if (error.serverError?.notify) {
          toast.error(error.serverError.message)
        } else {
          toast.error('Đã xảy ra lỗi khi xử lý đơn hàng')
        }
      } finally {
        setIsProcessing(false)
      }
    },
    [order.id, isProcessing, isUpdating, refetch],
  )

  const handlers = useMemo(() => {
    return (
      order.handlers?.map((handler) => {
        const user = handler as User
        return formatEmailToUsername(user.email)
      }) || []
    )
  }, [order.handlers])

  const pv = useMemo(() => {
    return order.productVariant as ProductVariant
  }, [order.productVariant])
  const productName = useMemo(() => {
    return pv?.name || ''
  }, [pv])

  const orderedBy = useMemo(() => {
    return order.orderedBy as User
  }, [order.orderedBy])

  const formSubmission = useMemo(() => {
    return order.formSubmission as FormSubmission & {
      submissionData: Record<string, any>
      form: Form
    }
  }, [order.formSubmission])
  const deliveryContent = useMemo(() => {
    if (hasText(order.deliveryContent)) return order.deliveryContent
    return (order.productVariant as ProductVariant).fixedStock
  }, [order.deliveryContent, order.productVariant])
  const handleStatusChange = useCallback(
    (status: Order['status']) => {
      if (!dropOnly && !isUpdating) {
        const targetColumnConfig = columnConfigs[status]

        if (targetColumnConfig.dropOnly) {
          // Get the container and set the order ID for the confirmation
          const container = document.querySelector('[data-draggable-context]')
          if (container) {
            container.setAttribute('data-order-id', order.id.toString())
            // Use the showConfirmation function from context
            showConfirmation(order.id.toString(), status, targetColumnConfig.title)
          }
        } else {
          // Directly move the order if not a dropOnly column
          moveOrder(order.id.toString(), status)
        }
      }
    },
    [dropOnly, isUpdating, moveOrder, order.id, columnConfigs, showConfirmation],
  )

  return (
    <>
      <motion.div
        layout
        layoutId={order.id.toString()}
        draggable={!dropOnly && !isUpdating}
        // @ts-expect-error ignore
        onDragStart={(e) => !dropOnly && !isUpdating && handleDragStart(e, order)}
      >
        <Card
          onClick={handleClick}
          className={cn(
            'mb-2 text-xs relative transition-all',
            !dropOnly ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer opacity-75',
            isUpdating && 'opacity-50 cursor-progress',
            isOpen && 'ring-2 ring-highlight ring-offset-1',
          )}
        >
          {isUpdating && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-50">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          )}
          <CardHeader className="p-3">
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-highlight">#{order.id}</span>
              <div className="flex items-center gap-2">
                {order.status == 'IN_QUEUE' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={handleAutoProcess}
                    disabled={isProcessing || isUpdating}
                    title="Xử lý tự động"
                  >
                    {isProcessing ? (
                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    ) : (
                      <Bot></Bot>
                    )}
                  </Button>
                )}
                <span className="text-xs text-muted-foreground">
                  {formatOrderDate(order.createdAt)}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <motion.div layout="position" className="flex flex-col gap-1">
              {productName && <span className="text-xs line-clamp-2">{productName}</span>}
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{order.quantity}x</span>
                <span className="text-muted-foreground">{formatPrice(order.totalPrice || 0)}</span>
              </div>

              {orderedBy.email && (
                <span className="text-xs">Bởi: {formatEmailToUsername(orderedBy.email)}</span>
              )}
              {handlers.length > 0 && (
                <>
                  <span className="text-muted-foreground">Người xử lý:</span>
                  <div className="flex flex-wrap gap-1">
                    {handlers.map((username, index) => (
                      <span key={index} className="text-xs">
                        {username}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent
          style={{ maxWidth: 'none' }}
          className="w-full sm:w-[80%] md:w-[60%] flex flex-col"
        >
          <SheetHeader>
            <SheetTitle>
              <div className="flex items-center justify-between w-full">
                <div className="flex space-x-2">
                  {getOrderStatus(order.status)} <div>-</div> <div>Đơn hàng #{order.id}</div>
                </div>
                <div className="flex items-center gap-2">
                  {!dropOnly && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <ArrowRightLeft className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {['IN_QUEUE', 'IN_PROCESS', 'USER_UPDATE', 'COMPLETED', 'REFUND'].map(
                          (status) => {
                            const targetStatus = status as Order['status']
                            // Only show status options that are allowed based on current order status
                            if (isTransitionAllowed(order.status, targetStatus)) {
                              return (
                                <DropdownMenuItem
                                  key={status}
                                  onClick={() => handleStatusChange(targetStatus)}
                                >
                                  {getOrderStatus(targetStatus)}
                                </DropdownMenuItem>
                              )
                            }
                            return null
                          },
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogTitle></DialogTitle>
                    <DialogDescription></DialogDescription>
                    <DialogContent className="w-full max-w-4xl h-[80vh] p-0">
                      <div className="flex-1 h-full">
                        <iframe
                          src={`/admin/collections/orders/${order.id}`}
                          className="w-full h-full border-0"
                        />
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-4 overflow-y-auto flex-grow pb-4">
            <Accordion
              type="multiple"
              defaultValue={['product', 'submission', 'buyer', 'delivery', 'message', 'note']}
              className="space-y-4"
            >
              <AccordionItem value="product" className="border rounded-md">
                <AccordionTrigger className="px-3">
                  <h4 className="text-lg font-bold">Thông tin sản phẩm</h4>
                </AccordionTrigger>
                <AccordionContent className="px-3">
                  <p className="text-lg font-medium text-highlight">{productName}</p>
                  <span className="text-sm text-muted-foreground">
                    Giá: {formatPrice((order.productVariant as ProductVariant)?.price)}
                  </span>
                  <div className="flex space-x-2 items-center">
                    <p className="text-sm text-muted-foreground">Số lượng: </p>
                    <span className="text-sm text-highlight font-bold">x{order.quantity}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Tổng: {formatPrice(order.totalPrice)}
                  </p>
                </AccordionContent>
              </AccordionItem>
              {hasText(order.note) && (
                <AccordionItem value="note" className="border rounded-md">
                  <AccordionTrigger className="px-3">
                    <h4 className="text-lg font-bold">Ghi chú</h4>
                  </AccordionTrigger>
                  <AccordionContent className="px-3">
                    <RichText data={order.note as any} enableGutter={false} />
                  </AccordionContent>
                </AccordionItem>
              )}

              {hasText(order.message) && (
                <AccordionItem value="message" className="border rounded-md">
                  <AccordionTrigger className="px-3">
                    <h4 className="text-lg font-bold">Lời nhắn</h4>
                  </AccordionTrigger>
                  <AccordionContent className="px-3">
                    <RichText data={order.message as any} enableGutter={false} />
                  </AccordionContent>
                </AccordionItem>
              )}

              {hasText(deliveryContent) && (
                <AccordionItem value="delivery" className="border rounded-md">
                  <AccordionTrigger className="px-3">
                    <h4 className="text-lg font-bold">Thông tin hàng</h4>
                  </AccordionTrigger>
                  <AccordionContent className="px-3">
                    <RichText data={deliveryContent as any} enableGutter={false} />
                  </AccordionContent>
                </AccordionItem>
              )}
              {formSubmission?.form?.fields && (
                <AccordionItem value="submission" className="border rounded-md">
                  <AccordionTrigger className="px-3">
                    <h4 className="text-lg font-bold">Thông tin cung cấp</h4>
                  </AccordionTrigger>
                  <AccordionContent className="px-3">
                    <OrderShippingForm order={order} />
                  </AccordionContent>
                </AccordionItem>
              )}
              <AccordionItem value="buyer" className="border rounded-md">
                <AccordionTrigger className="px-3">
                  <h4 className="text-lg font-bold">Thông tin người mua</h4>
                </AccordionTrigger>
                <AccordionContent className="px-3">
                  <div className="rounded-md border p-3">
                    <p className="text-sm">#{(order.orderedBy as User).id}</p>
                    <p className="text-sm">Email: {orderedBy.email}</p>
                    <p className="text-sm">Số dư: {formatPrice(orderedBy.balance)}</p>
                    {orderedBy.note && <p className="text-sm">Note: {orderedBy.note}</p>}
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="handlers" className="border rounded-md">
                <AccordionTrigger className="px-3">
                  <h4 className="text-lg font-bold">Người xử lý</h4>
                </AccordionTrigger>
                <AccordionContent className="px-3">
                  <div className="rounded-md border p-3">
                    {handlers.length > 0 ? (
                      handlers.map((username, index) => (
                        <p key={index} className="text-sm">
                          {username}
                        </p>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">Chưa có người xử lý</p>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="details" className="border rounded-md">
                <AccordionTrigger className="px-3">
                  <h4 className="text-lg font-bold">Thông tin chi tiết</h4>
                </AccordionTrigger>
                <AccordionContent className="px-3">
                  <div className="space-y-2 rounded-md border p-3">
                    <p className="text-sm">
                      Ngày tạo: {formatOrderDate(order.createdAt)} (
                      {formatTimeAgo(new Date(order.createdAt))})
                    </p>
                    <p className="text-sm">
                      Cập nhật: {formatOrderDate(order.updatedAt)} (
                      {formatTimeAgo(new Date(order.updatedAt))})
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
})

OrderItem.displayName = 'OrderItem'
