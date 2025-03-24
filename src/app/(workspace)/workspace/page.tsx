'use client'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Order } from '@/payload-types'
import { useCallback, useEffect, useState } from 'react'

import { DraggableProvider } from './DraggableContext'
import { Board } from './components'

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
    <div className="w-full" data-draggable-context>
      <DraggableProvider>
        <Board setPendingDrop={setPendingDrop} />
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
      </DraggableProvider>
    </div>
  )
}

export default DraggableBoard
