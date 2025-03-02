'use client'
import { Order } from '@/payload-types'
import payloadClient from '@/utilities/payloadClient'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { createContext, ReactNode, useContext, useEffect, useState } from 'react'

export type DraggableItem = {
  id: string
  title: string
  status: Order['status']
  data: Order
}

interface DraggableContextType {
  items: DraggableItem[]
  moveItem: (itemId: string, targetStatus: Order['status']) => void
  getItemsByStatus: (status: Order['status']) => DraggableItem[]
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

  const [items, setItems] = useState<DraggableItem[]>([])

  useEffect(() => {
    if (!data || data.length === 0) return
    const mappedItems = data.map((order) => ({
      id: order.id.toString(),
      title: `Order #${order.id}`,
      status: order.status,
      data: order,
    }))
    setItems(mappedItems)
  }, [data])

  const moveItem = async (itemId: string, targetStatus: Order['status']) => {
    let itemToMove = items.find((item) => item.id === itemId)
    if (!itemToMove) return
    itemToMove = { ...itemToMove, status: targetStatus }

    await payloadClient.updateById({
      collection: 'orders',
      id: Number(itemId),
      data: { status: targetStatus },
    })
    refetch()
  }

  const getItemsByStatus = (status: string) => {
    return items.filter((item) => item.status === status)
  }

  return (
    <DraggableContext.Provider
      value={{
        items,
        moveItem,
        getItemsByStatus,
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

type ItemProps = {
  title: string
  id: string
  status: Order['status']
  handleDragStart: (e: React.DragEvent<HTMLDivElement>, item: DraggableItem) => void
}

type DropIndicatorProps = {
  status: Order['status']
  isActive?: boolean
}

const DraggableBoard = () => {
  return (
    <div className="h-screen w-full bg-neutral-900 text-neutral-50">
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
  const { getItemsByStatus, moveItem } = useDraggable()
  const [active, setActive] = useState(false)

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, item: DraggableItem) => {
    e.dataTransfer.setData('itemId', item.id)
  }

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    const itemId = e.dataTransfer.getData('itemId')
    setActive(false)
    moveItem(itemId, status)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setActive(true)
  }

  const handleDragLeave = () => {
    setActive(false)
  }

  const filteredItems = getItemsByStatus(status)

  return (
    <div className={`w-56 shrink-0 ${dropOnly ? 'opacity-90' : ''}`}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className={`font-medium ${headingColor}`}>{title}</h3>
        <span className="rounded text-sm text-neutral-400">{filteredItems.length}</span>
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
        {filteredItems.map((item) => (
          <DraggableItem
            key={item.id}
            {...item}
            handleDragStart={handleDragStart}
            dropOnly={dropOnly}
          />
        ))}
      </div>
    </div>
  )
}

const DraggableItem = ({
  title,
  id,
  status,
  handleDragStart,
  dropOnly,
}: ItemProps & { dropOnly?: boolean }) => {
  return (
    <motion.div
      layout
      layoutId={id} // Add layoutId back to maintain animation between columns
      draggable={!dropOnly}
      // @ts-expect-error ignore
      onDragStart={(e) => !dropOnly && handleDragStart(e, { id, title, status } as DraggableItem)}
      className={`mb-2 rounded border border-neutral-700 bg-neutral-800 p-3 ${
        !dropOnly ? 'cursor-grab active:cursor-grabbing' : 'cursor-default opacity-75'
      }`}
    >
      <motion.p layout="position" className="text-sm font-medium">
        {title}
      </motion.p>
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
