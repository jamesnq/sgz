'use client'
import { OrderShippingForm } from '@/components/OrderShippingForm'
import { Shell } from '@/components/shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Form, FormSubmission, Order, ProductVariant, User } from '@/payload-types'
import { formatEmailToUsername } from '@/utilities/formatEmailToUsername'
import { formatOrderDate } from '@/utilities/formatOrderDate'
import { formatPrice } from '@/utilities/formatPrice'
import { formatTimeAgo } from '@/utilities/formatTimeAgo'
import { getOrderStatus } from '@/utilities/getOrderStatus'
import payloadClient from '@/utilities/payloadClient'
import { cn } from '@/utilities/ui'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  createContext,
  memo,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

interface DraggableContextType {
  orders: Order[]
  moveOrder: (orderId: string, targetStatus: Order['status']) => void
  getOrdersByStatus: (status: Order['status']) => Order[]
  updatingOrderId: string | null
  searchQuery: string
  setSearchQuery: (query: string) => void
  columnConfigs: Record<Order['status'], { title: string; dropOnly: boolean }>
  showConfirmation: (orderId: string, status: Order['status'], columnTitle: string) => void
}

const DraggableContext = createContext<DraggableContextType | undefined>(undefined)

interface OrderQuery {
  where?: Record<string, any>
  limit?: number
}

const DEFAULT_QUERIES: OrderQuery[] = [
  {
    where: {
      status: { in: ['IN_QUEUE', 'IN_PROCESS', 'USER_UPDATE'] },
    },
  },
  {
    where: {
      status: { in: ['REFUND', 'COMPLETED'] },
    },
    limit: 10,
  },
]

const createSearchQuery = (searchTerm: string): OrderQuery[] => {
  if (!searchTerm) return DEFAULT_QUERIES

  return [
    {
      where: {
        or: [
          {
            id: {
              like: searchTerm,
            },
          },
          {
            'productVariant.name': {
              like: searchTerm,
            },
          },
        ],
      },
    },
  ]
}

const useOrders = (queries: OrderQuery[]) => {
  const { data, refetch } = useQuery({
    queryKey: ['orders', queries],
    queryFn: async () => {
      const res = await Promise.all(
        queries.map(({ where, limit }) =>
          payloadClient.find({
            collection: 'orders',
            where,
            sort: '-updatedAt',
            depth: 2,
            limit: limit ?? -1,
          }),
        ),
      )
      return res
    },
    select: (data) => data.map((doc) => doc.docs).flat() as Order[],
  })
  return { data, refetch }
}

function DraggableProvider({ children }: { children: ReactNode }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [orders, setOrders] = useState<Order[]>([])
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null)

  const activeQueries = useMemo(() => createSearchQuery(searchQuery), [searchQuery])

  const { data, refetch } = useOrders(activeQueries)

  useEffect(() => {
    if (!data || data.length === 0) return
    setOrders(data)
  }, [data])

  const moveOrder = useCallback(
    async (orderId: string, targetStatus: Order['status']) => {
      const orderToMove = orders.find((order) => order.id.toString() === orderId)
      if (!orderToMove) return

      setUpdatingOrderId(orderId)
      try {
        await payloadClient.updateById({
          collection: 'orders',
          id: Number(orderId),
          data: { status: targetStatus },
        })
        await refetch()
      } finally {
        setUpdatingOrderId(null)
      }
    },
    [orders, refetch],
  )

  const getOrdersByStatus = useCallback(
    (status: string) => {
      return orders.filter((order) => order.status === status)
    },
    [orders],
  )

  // Define column configurations centrally
  const columnConfigs = useMemo(
    () => ({
      IN_QUEUE: { title: 'Chờ xử lý', dropOnly: false },
      IN_PROCESS: { title: 'Đang xử lý', dropOnly: false },
      USER_UPDATE: { title: 'Chờ cập nhật', dropOnly: false },
      COMPLETED: { title: 'Hoàn thành', dropOnly: false },
      REFUND: { title: 'Hoàn trả', dropOnly: true },
    }),
    [],
  )

  // Function to show confirmation dialog
  const showConfirmation = useCallback(
    (orderId: string, status: Order['status'], columnTitle: string) => {
      // Create and dispatch custom event
      const event = new CustomEvent('showConfirmation', {
        detail: { orderId, status, columnTitle },
      })
      document.dispatchEvent(event)
    },
    [],
  )

  const contextValue = useMemo(
    () => ({
      orders,
      moveOrder,
      getOrdersByStatus,
      updatingOrderId,
      searchQuery,
      setSearchQuery,
      columnConfigs,
      showConfirmation,
    }),
    [
      orders,
      moveOrder,
      getOrdersByStatus,
      updatingOrderId,
      searchQuery,
      columnConfigs,
      showConfirmation,
    ],
  )

  return <DraggableContext.Provider value={contextValue}>{children}</DraggableContext.Provider>
}

function useDraggable() {
  const context = useContext(DraggableContext)
  if (context === undefined) {
    throw new Error('useDraggable must be used within a DraggableProvider')
  }
  return context
}

type PendingDropType = {
  orderId: string
  status: Order['status']
  columnTitle: React.ReactNode
} | null

const DraggableBoard = () => {
  const [pendingDrop, setPendingDrop] = useState<PendingDropType>(null)

  const handleConfirmDrop = useCallback(() => {
    if (!pendingDrop) return
    const { orderId, status } = pendingDrop
    setPendingDrop(null)
    const context = document
      .querySelector('[data-draggable-context]')
      ?.getAttribute('data-order-id')
    if (context === orderId) {
      const event = new CustomEvent('confirmDrop', { detail: { orderId, status } })
      document.dispatchEvent(event)
    }
  }, [pendingDrop])

  useEffect(() => {
    const handleShowConfirmation = (e: CustomEvent<PendingDropType>) => {
      setPendingDrop(e.detail)
    }

    document.addEventListener('showConfirmation', handleShowConfirmation as EventListener)
    return () => {
      document.removeEventListener('showConfirmation', handleShowConfirmation as EventListener)
    }
  }, [])

  return (
    <div className="h-screen w-full" data-draggable-context>
      <DraggableProvider>
        <Board setPendingDrop={setPendingDrop} />
      </DraggableProvider>
      <Dialog open={!!pendingDrop} onOpenChange={() => setPendingDrop(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận chuyển trạng thái</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn chuyển đơn hàng #{pendingDrop?.orderId} sang trạng thái{' '}
              {pendingDrop?.columnTitle}? Sau khi chuyển sẽ không thể kéo ra khỏi trạng thái này.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDrop(null)}>
              Hủy
            </Button>
            <Button onClick={handleConfirmDrop}>Xác nhận</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default DraggableBoard

const Board = memo(({ setPendingDrop }: { setPendingDrop: (drop: PendingDropType) => void }) => {
  const { searchQuery, setSearchQuery, columnConfigs } = useDraggable()

  return (
    <Shell>
      <div className="flex flex-col h-full w-full gap-3">
        <div className="w-full max-w-sm">
          <Input
            placeholder="Tìm kiếm theo ID hoặc Sản phẩm..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex h-full w-full gap-3">
          <BoardColumn
            title={getOrderStatus('IN_QUEUE')}
            column="IN_QUEUE"
            dropOnly={columnConfigs['IN_QUEUE'].dropOnly}
            setPendingDrop={setPendingDrop}
          />
          <BoardColumn
            title={getOrderStatus('IN_PROCESS')}
            column="IN_PROCESS"
            dropOnly={columnConfigs['IN_PROCESS'].dropOnly}
            setPendingDrop={setPendingDrop}
          />
          <BoardColumn
            title={getOrderStatus('USER_UPDATE')}
            column="USER_UPDATE"
            dropOnly={columnConfigs['USER_UPDATE'].dropOnly}
            setPendingDrop={setPendingDrop}
          />
          <BoardColumn
            title={getOrderStatus('COMPLETED')}
            column="COMPLETED"
            dropOnly={columnConfigs['COMPLETED'].dropOnly}
            setPendingDrop={setPendingDrop}
          />
          <BoardColumn
            title={getOrderStatus('REFUND')}
            column="REFUND"
            dropOnly={columnConfigs['REFUND'].dropOnly}
            setPendingDrop={setPendingDrop}
          />
        </div>
      </div>
    </Shell>
  )
})
Board.displayName = 'Board'

type BoardColumnProps = {
  title: React.ReactNode
  column: Order['status']

  dropOnly?: boolean
  setPendingDrop: (
    drop: { orderId: string; status: Order['status']; columnTitle: React.ReactNode } | null,
  ) => void
}

const BoardColumn = memo(
  ({ title, column: status, dropOnly = false, setPendingDrop }: BoardColumnProps) => {
    const { getOrdersByStatus, moveOrder } = useDraggable()
    const [active, setActive] = useState(false)

    useEffect(() => {
      const handleConfirmDrop = (e: CustomEvent<{ orderId: string; status: Order['status'] }>) => {
        const { orderId, status: targetStatus } = e.detail
        if (status === targetStatus) {
          moveOrder(orderId, status)
        }
      }

      document.addEventListener('confirmDrop', handleConfirmDrop as EventListener)
      return () => {
        document.removeEventListener('confirmDrop', handleConfirmDrop as EventListener)
      }
    }, [moveOrder, status])

    const handleDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, order: Order) => {
      e.dataTransfer.setData('orderId', order.id.toString())
      const container = document.querySelector('[data-draggable-context]')
      if (container) {
        container.setAttribute('data-order-id', order.id.toString())
      }
    }, [])

    const handleDragEnd = useCallback(
      (e: React.DragEvent<HTMLDivElement>) => {
        const orderId = e.dataTransfer.getData('orderId')
        setActive(false)

        if (dropOnly) {
          setPendingDrop({ orderId, status, columnTitle: title })
        } else {
          moveOrder(orderId, status)
        }
      },
      [dropOnly, moveOrder, setPendingDrop, status, title],
    )

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setActive(true)
    }, [])

    const handleDragLeave = useCallback(() => {
      setActive(false)
    }, [])

    const orders = useMemo(() => getOrdersByStatus(status), [getOrdersByStatus, status])

    return (
      <Card className={`w-56 p-2 shrink-0 ${dropOnly ? 'opacity-90' : ''}`}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className={`font-bold`}>{title}</h3>
          <span className="rounded text-sm text-muted-foreground">{orders.length}</span>
        </div>
        <div
          onDrop={handleDragEnd}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`h-full w-full transition-colors ${
            active ? 'bg-secondary/50' : 'bg-secondary/0'
          }`}
        >
          <DropIndicator status={status} isActive={active} />
          {orders.map((order) => (
            <OrderItem
              key={order.id}
              order={order}
              handleDragStart={handleDragStart}
              dropOnly={dropOnly}
            />
          ))}
        </div>
      </Card>
    )
  },
)
BoardColumn.displayName = 'BoardColumn'

interface OrderItemProps {
  order: Order
  handleDragStart: (e: React.DragEvent<HTMLDivElement>, order: Order) => void
  dropOnly?: boolean
}

const OrderItem = memo(({ order, handleDragStart, dropOnly }: OrderItemProps) => {
  const { updatingOrderId, moveOrder, columnConfigs, showConfirmation } = useDraggable()
  const isUpdating = updatingOrderId === order.id.toString()
  const [isOpen, setIsOpen] = useState(false)

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

  const handlers = useMemo(() => {
    return (
      order.handlers?.map((handler) => {
        const user = handler as User
        return formatEmailToUsername(user.email)
      }) || []
    )
  }, [order.handlers])

  const productName = useMemo(() => {
    return (order.productVariant as ProductVariant)?.name || ''
  }, [order.productVariant])

  const orderedBy = useMemo(() => {
    return order.orderedBy as User
  }, [order.orderedBy])

  const formSubmission = useMemo(() => {
    return order.formSubmission as FormSubmission & {
      submissionData: Record<string, any>
      form: Form
    }
  }, [order.formSubmission])

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
        <ContextMenu>
          <ContextMenuTrigger asChild>
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
                  <span className="text-sm font-medium">#{order.id}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatOrderDate(order.createdAt)}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <motion.div layout="position" className="flex flex-col gap-1">
                  {productName && <span className="text-xs line-clamp-2">{productName}</span>}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{order.quantity}x</span>
                    <span className="text-muted-foreground">
                      {formatPrice(order.totalPrice || 0)}
                    </span>
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
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem onClick={() => handleStatusChange('IN_QUEUE')}>
              Chờ xử lý
            </ContextMenuItem>
            <ContextMenuItem onClick={() => handleStatusChange('IN_PROCESS')}>
              Đang xử lý
            </ContextMenuItem>
            <ContextMenuItem onClick={() => handleStatusChange('USER_UPDATE')}>
              Chờ cập nhật
            </ContextMenuItem>
            <ContextMenuItem onClick={() => handleStatusChange('COMPLETED')}>
              Hoàn thành
            </ContextMenuItem>
            <ContextMenuItem onClick={() => handleStatusChange('REFUND')}>Hoàn trả</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </motion.div>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent
          style={{ maxWidth: 'none' }}
          className="w-full sm:w-[80%] md:w-[60%] lg:w-[40%] xl:w-[30%]"
        >
          <SheetHeader>
            <SheetTitle>Chi tiết đơn hàng #{order.id}</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-6">
            <div>
              <h4 className="text-sm font-medium">Thông tin sản phẩm</h4>
              <div className="mt-3 rounded-md border p-3">
                <p className="font-medium">{productName}</p>
                <p className="text-sm text-muted-foreground">
                  Giá: {formatPrice((order.productVariant as ProductVariant)?.price)}
                </p>
                <p className="text-sm text-muted-foreground">Số lượng: {order.quantity}x</p>
                <p className="text-sm text-muted-foreground">
                  Tổng: {formatPrice(order.totalPrice)}
                </p>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium">Thông tin cung cấp</h4>
              <div className="mt-3">
                {formSubmission?.form?.fields && <OrderShippingForm order={order} />}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium">Thông tin người mua</h4>
              <div className="mt-3 rounded-md border p-3">
                <p className="text-sm">Id: {(order.orderedBy as User).id}</p>
                <p className="text-sm">Email: {orderedBy.email}</p>
                {orderedBy.note && <p className="text-sm">Note: {orderedBy.note}</p>}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium">Người xử lý</h4>
              <div className="mt-3 rounded-md border p-3">
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
            </div>
            <div>
              <h4 className="text-sm font-medium">Thông tin đơn hàng</h4>
              <div className="mt-3 space-y-2 rounded-md border p-3">
                <p className="text-sm">
                  Ngày tạo: {formatOrderDate(order.createdAt)} (
                  {formatTimeAgo(new Date(order.createdAt))})
                </p>
                <p className="text-sm">
                  Cập nhật: {formatOrderDate(order.updatedAt)} (
                  {formatTimeAgo(new Date(order.updatedAt))})
                </p>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
})

OrderItem.displayName = 'OrderItem'

const DropIndicator = ({ isActive }: { status: Order['status']; isActive?: boolean }) => {
  return (
    <div
      className={`mb-3 h-0.5 w-full bg-highlight transition-opacity ${
        isActive ? 'opacity-100' : 'opacity-0'
      }`}
    />
  )
}
