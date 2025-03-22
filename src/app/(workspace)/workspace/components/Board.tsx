'use client'
import { Input } from '@/components/ui/input'
import { Shell } from '@/components/shell'
import { Order } from '@/payload-types'
import { getOrderStatus } from '@/utilities/getOrderStatus'
import { memo } from 'react'
import { useDraggable } from '../DraggableContext'
import { BoardColumn } from './BoardColumn'

export type PendingDropType = {
  orderId: string
  status: Order['status']
  columnTitle: React.ReactNode
} | null

interface BoardProps {
  setPendingDrop: (drop: PendingDropType) => void
}

export const Board = memo(({ setPendingDrop }: BoardProps) => {
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
