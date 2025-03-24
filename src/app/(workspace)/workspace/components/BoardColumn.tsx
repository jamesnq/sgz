'use client'
import { autoProcessOrderAction } from '@/app/_actions/autoProcessOrderAction'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Order } from '@/payload-types'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import { useDraggable } from '../DraggableContext'

import { Bot, Loader2 } from 'lucide-react'
import { DropIndicator } from './DropIndicator'
import { OrderItem } from './OrderItem'

export type BoardColumnProps = {
  title: React.ReactNode
  column: Order['status']
  dropOnly?: boolean
  setPendingDrop: (
    drop: { orderId: string; status: Order['status']; columnTitle: React.ReactNode } | null,
  ) => void
}

export const BoardColumn = memo(
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
        className={`w-56 p-2 shrink-0 transition-opacity duration-200 flex flex-col h-full
          ${dropOnly ? 'opacity-90' : ''}
          ${currentDragStatus && !isValidDropTarget ? 'opacity-50 cursor-not-allowed' : ''}
          ${active ? 'ring-2 ring-primary' : ''}`}
      >
        <div className="sticky top-0 z-10 mb-3 flex items-center justify-between bg-card">
          <h3 className="text-lg font-bold">{title}</h3>
          <span className="rounded text-sm text-muted-foreground">{orders.length}</span>
        </div>

        {status === 'IN_QUEUE' && (
          <div className="sticky top-12 z-10 mb-2 bg-card">
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
          className={`flex-1 overflow-y-auto pr-1 transition-colors ${
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
