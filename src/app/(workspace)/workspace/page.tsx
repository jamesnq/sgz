'use client'
import { Shell } from '@/components/shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Order, ProductVariant, User } from '@/payload-types'
import { formatEmailToUsername } from '@/utilities/formatEmailToUsername'
import { formatOrderDate } from '@/utilities/formatOrderDate'
import payloadClient from '@/utilities/payloadClient'
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
}

const DraggableContext = createContext<DraggableContextType | undefined>(undefined)

interface OrderQuery {
  where?: Record<string, any>
  limit?: number
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
            sort: 'updatedAt',
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

export function DraggableProvider({ children }: { children: ReactNode }) {
  const [searchQuery, setSearchQuery] = useState('')

  const { data, refetch } = useOrders(
    searchQuery
      ? [
          {
            where: {
              or: [
                {
                  id: {
                    like: searchQuery,
                  },
                },
                {
                  'productVariant.name': {
                    like: searchQuery,
                  },
                },
              ],
            },
          },
        ]
      : [
          {
            where: {
              status: { in: ['IN_QUEUE', 'IN_PROCESS', 'USER_UPDATE'] },
            },
          },
          {
            where: {
              status: { equals: 'COMPLETED' },
            },
            limit: 10,
          },
          {
            where: {
              status: { equals: 'REFUND' },
            },
            limit: 10,
          },
        ],
  )

  const [orders, setOrders] = useState<Order[]>([])
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null)

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

  const contextValue = useMemo(
    () => ({
      orders,
      moveOrder,
      getOrdersByStatus,
      updatingOrderId,
      searchQuery,
      setSearchQuery,
    }),
    [orders, moveOrder, getOrdersByStatus, updatingOrderId, searchQuery],
  )

  return <DraggableContext.Provider value={contextValue}>{children}</DraggableContext.Provider>
}

export function useDraggable() {
  const context = useContext(DraggableContext)
  if (context === undefined) {
    throw new Error('useDraggable must be used within a DraggableProvider')
  }
  return context
}

type PendingDropType = {
  orderId: string
  status: Order['status']
  columnTitle: string
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
  const { searchQuery, setSearchQuery } = useDraggable()

  return (
    <Shell>
      <div className="flex flex-col h-full w-full gap-3">
        <div className="w-full max-w-sm">
          <Input
            placeholder="Tìm kiếm theo ID hoặc email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex h-full w-full gap-3">
          <BoardColumn
            title="In queue"
            column="IN_QUEUE"
            headingColor="text-yellow-200"
            setPendingDrop={setPendingDrop}
          />
          <BoardColumn
            title="In progress"
            column="IN_PROCESS"
            headingColor="text-blue-200"
            setPendingDrop={setPendingDrop}
          />
          <BoardColumn
            title="User update"
            column="USER_UPDATE"
            headingColor="text-blue-200"
            setPendingDrop={setPendingDrop}
          />
          <BoardColumn
            title="Complete"
            column="COMPLETED"
            headingColor="text-emerald-200"
            setPendingDrop={setPendingDrop}
          />
          <BoardColumn
            title="Refund"
            column="REFUND"
            headingColor="text-red-200"
            dropOnly
            setPendingDrop={setPendingDrop}
          />
        </div>
      </div>
    </Shell>
  )
})
Board.displayName = 'Board'

type BoardColumnProps = {
  title: string
  column: Order['status']
  headingColor: string
  dropOnly?: boolean
  setPendingDrop: (
    drop: { orderId: string; status: Order['status']; columnTitle: string } | null,
  ) => void
}

const BoardColumn = memo(
  ({ title, headingColor, column: status, dropOnly = false, setPendingDrop }: BoardColumnProps) => {
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
          <h3 className={`font-medium ${headingColor} font-bold`}>{title}</h3>
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

type OrderItemProps = {
  order: Order
  handleDragStart: (e: React.DragEvent<HTMLDivElement>, order: Order) => void
  dropOnly?: boolean
}

const OrderItem = memo(({ order, handleDragStart, dropOnly }: OrderItemProps) => {
  const { updatingOrderId } = useDraggable()
  const isUpdating = updatingOrderId === order.id.toString()

  return (
    <motion.div
      layout
      layoutId={order.id.toString()}
      draggable={!dropOnly && !isUpdating}
      // @ts-expect-error ignore
      onDragStart={(e) => !dropOnly && !isUpdating && handleDragStart(e, order)}
    >
      <Card
        className={`mb-2 text-xs ${
          !dropOnly ? 'cursor-grab active:cursor-grabbing' : 'cursor-default opacity-75'
        } ${isUpdating ? 'opacity-50 cursor-progress' : ''} relative`}
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
              {formatOrderDate(new Date(order.createdAt))}
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <motion.div layout="position" className="flex flex-col gap-1">
            {order.productVariant && (
              <span className="text-xs line-clamp-2">
                {(order.productVariant as ProductVariant).name}
              </span>
            )}
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{order.quantity}x</span>
              <span className="text-muted-foreground">
                {Intl.NumberFormat('vi-VN', {
                  style: 'currency',
                  currency: 'VND',
                }).format(order.totalPrice || 0)}
              </span>
            </div>
            {order.orderedBy && (
              <span className="text-xs">
                By: {formatEmailToUsername((order.orderedBy as User).email)}
              </span>
            )}
            <span className="text-muted-foreground">Handlers:</span>
            {order.handlers && (
              <div className="flex flex-wrap gap-1">
                {order.handlers.map((handler, index) => (
                  <span key={index} className="">
                    {formatEmailToUsername((handler as User).email)}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  )
})
OrderItem.displayName = 'OrderItem'

const DropIndicator = ({ status, isActive }: { status: Order['status']; isActive?: boolean }) => {
  return (
    <div
      data-status={status}
      className={`mb-3 h-0.5 w-full bg-highlight transition-opacity ${
        isActive ? 'opacity-100' : 'opacity-0'
      }`}
    />
  )
}
