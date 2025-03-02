'use client'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Order, ProductVariant, User } from '@/payload-types'
import { formatEmailToUsername } from '@/utilities/formatEmailToUsername'
import { formatOrderDate } from '@/utilities/formatOrderDate'
import payloadClient from '@/utilities/payloadClient'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { createContext, ReactNode, useContext, useEffect, useState } from 'react'

interface DraggableContextType {
  orders: Order[]
  moveOrder: (orderId: string, targetStatus: Order['status']) => void
  getOrdersByStatus: (status: Order['status']) => Order[]
}

const DraggableContext = createContext<DraggableContextType | undefined>(undefined)

const useOrdersByStatus = (orders: { status: Order['status']; limit?: number }[]) => {
  const { data, refetch } = useQuery({
    queryKey: ['orders', orders],
    queryFn: async () => {
      const res = await Promise.all(
        orders.map(({ status, limit }) =>
          payloadClient.find({
            collection: 'orders',
            where: { status: { equals: status } },
            sort: 'updatedAt',
            depth: 2,
            limit,
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
  const { data, refetch } = useOrdersByStatus([
    { status: 'IN_QUEUE', limit: -1 },
    { status: 'IN_PROCESS', limit: -1 },
    { status: 'USER_UPDATE', limit: -1 },
    { status: 'COMPLETED', limit: 10 },
    { status: 'REFUND', limit: 10 },
  ])

  const [orders, setOrders] = useState<Order[]>([])

  useEffect(() => {
    if (!data || data.length === 0) return
    setOrders(data)
  }, [data])

  const moveOrder = async (orderId: string, targetStatus: Order['status']) => {
    const orderToMove = orders.find((order) => order.id.toString() === orderId)
    if (!orderToMove) return

    await payloadClient.updateById({
      collection: 'orders',
      id: Number(orderId),
      data: { status: targetStatus },
    })
    refetch()
  }

  const getOrdersByStatus = (status: string) => {
    return orders.filter((order) => order.status === status)
  }

  return (
    <DraggableContext.Provider
      value={{
        orders,
        moveOrder,
        getOrdersByStatus,
      }}
    >
      {children}
    </DraggableContext.Provider>
  )
}

export function useDraggable() {
  const context = useContext(DraggableContext)
  if (context === undefined) {
    throw new Error('useDraggable must be used within a DraggableProvider')
  }
  return context
}

type BoardColumnProps = {
  title: string
  column: Order['status']
  headingColor: string
  dropOnly?: boolean
}

type OrderItemProps = {
  order: Order
  handleDragStart: (e: React.DragEvent<HTMLDivElement>, order: Order) => void
  dropOnly?: boolean
}

type DropIndicatorProps = {
  status: Order['status']
  isActive?: boolean
}

const DraggableBoard = () => {
  return (
    <div className="h-screen w-full">
      <DraggableProvider>
        <Board />
      </DraggableProvider>
    </div>
  )
}

export default DraggableBoard

const Board = () => {
  return (
    <div className="flex h-full w-full gap-3 overflow-scroll p-12">
      <BoardColumn title="In queue" column="IN_QUEUE" headingColor="text-yellow-200" />
      <BoardColumn title="In progress" column="IN_PROCESS" headingColor="text-blue-200" />
      <BoardColumn title="User update" column="USER_UPDATE" headingColor="text-blue-200" />
      <BoardColumn title="Complete" column="COMPLETED" headingColor="text-emerald-200" />
      <BoardColumn title="Refund" column="REFUND" headingColor="text-red-200" dropOnly />
    </div>
  )
}

const BoardColumn = ({
  title,
  headingColor,
  column: status,
  dropOnly = false,
}: BoardColumnProps) => {
  const { getOrdersByStatus, moveOrder } = useDraggable()
  const [active, setActive] = useState(false)

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, order: Order) => {
    e.dataTransfer.setData('orderId', order.id.toString())
  }

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    const orderId = e.dataTransfer.getData('orderId')
    setActive(false)
    moveOrder(orderId, status)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setActive(true)
  }

  const handleDragLeave = () => {
    setActive(false)
  }

  const orders = getOrdersByStatus(status)

  return (
    <div className={`w-56 shrink-0 ${dropOnly ? 'opacity-90' : ''}`}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className={`font-medium ${headingColor}`}>{title}</h3>
        <span className="rounded text-sm text-neutral-400">{orders.length}</span>
      </div>
      <div
        onDrop={handleDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`h-full w-full transition-colors ${
          active ? 'bg-neutral-800/50' : 'bg-neutral-800/0'
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
    </div>
  )
}

const OrderItem = ({ order, handleDragStart, dropOnly }: OrderItemProps) => {
  return (
    <motion.div
      layout
      layoutId={order.id.toString()}
      draggable={!dropOnly}
      // @ts-expect-error ignore
      onDragStart={(e) => !dropOnly && handleDragStart(e, order)}
    >
      <Card
        className={`mb-2 text-xs ${!dropOnly ? 'cursor-grab active:cursor-grabbing' : 'cursor-default opacity-75'}`}
      >
        <CardHeader className="p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">#{order.id}</span>
            <span className="text-xs text-neutral-400">
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
}

const DropIndicator = ({ status, isActive }: DropIndicatorProps) => {
  return (
    <div
      data-status={status}
      className={`mb-3 h-0.5 w-full bg-violet-400 transition-opacity ${
        isActive ? 'opacity-100' : 'opacity-0'
      }`}
    />
  )
}
