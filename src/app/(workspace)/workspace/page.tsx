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
import { cn } from '@/utilities/ui'
import { formatEmailToUsername } from '@/utilities/formatEmailToUsername'
import { formatOrderDate } from '@/utilities/formatOrderDate'
import { formatPrice } from '@/utilities/formatPrice'
import { formatTimeAgo } from '@/utilities/formatTimeAgo'
import { getOrderStatus } from '@/utilities/getOrderStatus'
import { autoProcessOrderAction } from '@/app/_actions/autoProcessOrderAction'
import { toast } from 'react-toastify'
import { useQuery } from '@tanstack/react-query'
import payloadClient from '@/utilities/payloadClient'
import { Bot, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { Form, FormSubmission, Order, ProductVariant, User } from '@/payload-types'
import {
  createContext,
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  ReactNode,
  useState,
} from 'react'
import RichText from '@/components/RichText'

// TODO check order metadata to know it can auto process or not
interface ColumnConfig {
  title: string
  dropOnly: boolean
  allowedTransitions?: Order['status'][]
}

interface DraggableContextType {
  orders: Order[]
  moveOrder: (orderId: string, targetStatus: Order['status']) => void
  getOrdersByStatus: (status: Order['status']) => Order[]
  updatingOrderIds: string[]
  searchQuery: string
  setSearchQuery: (query: string) => void
  columnConfigs: Record<Order['status'], ColumnConfig>
  showConfirmation: (orderId: string, status: Order['status'], columnTitle: string) => void
  refetch: () => Promise<any>
  isTransitionAllowed: (fromStatus: Order['status'], toStatus: Order['status']) => boolean
  currentDragStatus: Order['status'] | null
  setCurrentDragStatus: (status: Order['status'] | null) => void
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
    select: (data: any[]) => data.map((doc: any) => doc.docs).flat() as Order[],
  })
  return { data, refetch }
}

function DraggableProvider({ children }: { children: ReactNode }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [orders, setOrders] = useState<Order[]>([])
  const [updatingOrderIds, setUpdatingOrderIds] = useState<string[]>([])
  const [currentDragStatus, setCurrentDragStatus] = useState<Order['status'] | null>(null)

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

      setUpdatingOrderIds((prev) => [...prev, orderId])
      try {
        await payloadClient.updateById({
          collection: 'orders',
          id: Number(orderId),
          data: { status: targetStatus },
        })
        await refetch()
      } finally {
        setUpdatingOrderIds((prev) => prev.filter((id) => id !== orderId))
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
  const columnConfigs: Record<Order['status'], ColumnConfig> = useMemo(
    () => ({
      IN_QUEUE: {
        title: 'Chờ xử lý',
        dropOnly: false,
      },
      IN_PROCESS: {
        title: 'Đang xử lý',
        dropOnly: false,
      },
      USER_UPDATE: {
        title: 'Chờ cập nhật',
        dropOnly: false,
      },
      COMPLETED: {
        title: 'Hoàn thành',
        dropOnly: false,
        allowedTransitions: ['REFUND'] as Order['status'][],
      },
      REFUND: {
        title: 'Hoàn trả',
        dropOnly: true,
        allowedTransitions: [] as Order['status'][],
      },
    }),
    [],
  )

  // Function to check if a transition is allowed
  const isTransitionAllowed = useCallback(
    (fromStatus: Order['status'], toStatus: Order['status']) => {
      // If the statuses are the same, it's always allowed (no change)
      if (fromStatus === toStatus) return true

      // If allowedTransitions is undefined, all transitions are allowed
      if (columnConfigs[fromStatus].allowedTransitions === undefined) return true

      // Check if the transition is allowed based on the configuration
      return columnConfigs[fromStatus].allowedTransitions!.includes(toStatus)
    },
    [columnConfigs],
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
      updatingOrderIds,
      searchQuery,
      setSearchQuery,
      columnConfigs,
      showConfirmation,
      refetch,
      isTransitionAllowed,
      currentDragStatus,
      setCurrentDragStatus,
    }),
    [
      orders,
      moveOrder,
      getOrdersByStatus,
      updatingOrderIds,
      searchQuery,
      columnConfigs,
      showConfirmation,
      refetch,
      isTransitionAllowed,
      currentDragStatus,
      setCurrentDragStatus,
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
    const {
      getOrdersByStatus,
      moveOrder,
      refetch,
      isTransitionAllowed,
      currentDragStatus,
      setCurrentDragStatus,
    } = useDraggable()
    const [active, setActive] = useState(false)
    const [isProcessingAll, setIsProcessingAll] = useState(false)
    const [processedCount, setProcessedCount] = useState(0)
    const [totalToProcess, setTotalToProcess] = useState(0)

    // Determine if this column is a valid drop target based on the current drag status
    const isValidDropTarget = useMemo(() => {
      if (!currentDragStatus) return true
      return isTransitionAllowed(currentDragStatus, status)
    }, [currentDragStatus, isTransitionAllowed, status])

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

    const handleDragStart = useCallback(
      (e: React.DragEvent<HTMLDivElement>, order: Order) => {
        e.dataTransfer.setData('orderId', order.id.toString())
        e.dataTransfer.setData('orderStatus', order.status)

        // Set the current drag status in the context
        setCurrentDragStatus(order.status)

        const container = document.querySelector('[data-draggable-context]')
        if (container) {
          container.setAttribute('data-order-id', order.id.toString())
          container.setAttribute('data-order-status', order.status)
        }
      },
      [setCurrentDragStatus],
    )

    const handleDragEnd = useCallback(
      (e: React.DragEvent<HTMLDivElement>) => {
        const orderId = e.dataTransfer.getData('orderId')
        const fromStatus = e.dataTransfer.getData('orderStatus') as Order['status']

        // Reset the drag status
        setCurrentDragStatus(null)
        setActive(false)

        // Check if the transition is allowed
        if (!isTransitionAllowed(fromStatus, status)) {
          return
        }

        if (dropOnly) {
          setPendingDrop({ orderId, status, columnTitle: title })
        } else {
          moveOrder(orderId, status)
        }
      },
      [
        dropOnly,
        moveOrder,
        setPendingDrop,
        status,
        title,
        isTransitionAllowed,
        setCurrentDragStatus,
      ],
    )

    const handleDragOver = useCallback(
      (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()

        // Only set active state if this is a valid drop target
        if (isValidDropTarget) {
          e.dataTransfer.dropEffect = 'move'
          setActive(true)
        } else {
          e.dataTransfer.dropEffect = 'none'
        }
      },
      [isValidDropTarget],
    )

    const handleDragLeave = useCallback(() => {
      setActive(false)
    }, [])

    const orders = useMemo(() => getOrdersByStatus(status), [getOrdersByStatus, status])

    const handleProcessAllOrders = async () => {
      if (isProcessingAll) return

      try {
        const ordersToProcess = getOrdersByStatus('IN_QUEUE')
        if (ordersToProcess.length === 0) {
          toast.info('Không có đơn hàng nào cần xử lý')
          return
        }

        setIsProcessingAll(true)
        setProcessedCount(0)
        setTotalToProcess(ordersToProcess.length)

        // Process orders one by one
        let successCount = 0
        let errorCount = 0

        for (const order of ordersToProcess) {
          try {
            // TODO promise all
            const result = await autoProcessOrderAction({
              orderId: order.id,
            })

            if (result && result.data?.success) {
              successCount++
            } else {
              errorCount++
            }

            // Update progress
            setProcessedCount((prev) => prev + 1)
          } catch (error) {
            console.error(`Error processing order ${order.id}:`, error)
            errorCount++
            setProcessedCount((prev) => prev + 1)
          }
        }

        // Show final result
        if (successCount > 0) {
          toast.success(
            `Đã xử lý ${successCount} đơn hàng thành công${errorCount > 0 ? `, ${errorCount} lỗi` : ''}`,
          )

          // Refresh the board data after a short delay
          refetch()
        } else if (errorCount > 0) {
          toast.error(`Lỗi khi xử lý ${errorCount} đơn hàng`)
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Lỗi khi xử lý đơn hàng')
      } finally {
        setIsProcessingAll(false)
        setProcessedCount(0)
        setTotalToProcess(0)
      }
    }

    return (
      <Card
        className={`w-56 p-2 shrink-0 transition-opacity duration-200
          ${dropOnly ? 'opacity-90' : ''}
          ${currentDragStatus && !isValidDropTarget ? 'opacity-50 cursor-not-allowed' : ''}
          ${active ? 'ring-2 ring-primary' : ''}`}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-bold">{title}</h3>
          <span className="rounded text-sm text-muted-foreground">{orders.length}</span>
        </div>

        {status === 'IN_QUEUE' && (
          <div className="mb-2">
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={handleProcessAllOrders}
              disabled={isProcessingAll || getOrdersByStatus('IN_QUEUE').length === 0}
            >
              {isProcessingAll ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {processedCount > 0
                    ? `Đang xử lý (${processedCount}/${totalToProcess})`
                    : 'Đang xử lý...'}
                </>
              ) : (
                <>
                  <Bot className="mr-2 h-4 w-4" />
                  Xử lý tất cả
                </>
              )}
            </Button>
          </div>
        )}

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
  const { updatingOrderIds, moveOrder, columnConfigs, showConfirmation, refetch } = useDraggable()
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
          className="w-full sm:w-[80%] md:w-[60%] flex flex-col"
        >
          <SheetHeader>
            <SheetTitle>
              <div className="flex space-x-2">
                {getOrderStatus(order.status)} <div>-</div> <div>Đơn hàng #{order.id}</div>
              </div>
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-4 overflow-y-auto flex-grow pb-4">
            <div>
              <h4 className="text-lg font-bold">Thông tin sản phẩm</h4>
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
              <h4 className="text-lg font-bold">Thông tin giao hàng</h4>
              <div className="mt-3">
                {order.deliveryContent?.root.children.length && (
                  <RichText data={order.deliveryContent} enableGutter={false} />
                )}
              </div>
            </div>
            <div>
              <h4 className="text-lg font-bold">Thông tin cung cấp</h4>
              <div className="mt-3">
                {formSubmission?.form?.fields && <OrderShippingForm order={order} />}
              </div>
            </div>

            <div>
              <h4 className="text-lg font-bold">Thông tin người mua</h4>
              <div className="mt-3 rounded-md border p-3">
                <p className="text-sm">Id: {(order.orderedBy as User).id}</p>
                <p className="text-sm">Email: {orderedBy.email}</p>
                <p className="text-sm">Số dư: {formatPrice(orderedBy.balance)}</p>
                {orderedBy.note && <p className="text-sm">Note: {orderedBy.note}</p>}
              </div>
            </div>

            <div>
              <h4 className="text-lg font-bold">Người xử lý</h4>
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
              <h4 className="text-lg font-bold">Thông tin chi tiết</h4>
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
