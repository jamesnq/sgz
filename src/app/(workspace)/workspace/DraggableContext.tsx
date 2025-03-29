'use client'
import { Order } from '@/payload-types'
import payloadClient from '@/utilities/payloadClient'
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { OrderQuery, useOrders } from './useOrders'

// Column configuration interface
export interface ColumnConfig {
  title: string
  dropOnly: boolean
  allowedTransitions?: Order['status'][]
}

// Context type definition
export interface DraggableContextType {
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

// Create context
export const DraggableContext = createContext<DraggableContextType | undefined>(undefined)

// Default queries
export const DEFAULT_QUERIES: OrderQuery[] = [
  {
    where: {
      status: { in: ['IN_QUEUE', 'IN_PROCESS', 'USER_UPDATE'] },
    },
  },
  {
    where: {
      status: { in: ['REFUND', 'COMPLETED'] },
    },
    limit: 20,
  },
]

// Create search query function
export const createSearchQuery = (searchTerm: string): OrderQuery[] => {
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
          {
            'orderedBy.email': {
              like: searchTerm,
            },
          },
        ],
      },
    },
  ]
}

// Provider component
export function DraggableProvider({ children }: { children: ReactNode }) {
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
        // allowedTransitions: ['REFUND'] as Order['status'][],
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

// Hook to use the context
export function useDraggable() {
  const context = useContext(DraggableContext)
  if (context === undefined) {
    throw new Error('useDraggable must be used within a DraggableProvider')
  }
  return context
}
