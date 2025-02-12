'use client'

import { CircleHelp, CircleX, Rocket, Truck } from 'lucide-react'

function ProductStatusIcon({ status }: { status: string }) {
  const productStatusIcons: any = {
    AVAILABLE: <Rocket className="w-4 h-4" />,
    ORDER: <Truck className="w-4 h-4" />,
    STOPPED: <Truck className="w-4 h-4" />,
  }
  return productStatusIcons[status] || <CircleHelp />
}
function ProductStatusName({ status }: { status: string }) {
  const statusMap: any = {
    AVAILABLE: 'Giao ngay',
    ORDER: 'Đặt hàng',
    STOPPED: 'Hết hàng',
  }
  return <p>{statusMap[status] || 'Không xác định'}</p>
}
export function DisplayProductStatus({ status }: { status: string }) {
  const statusColor: any = {
    AVAILABLE: 'text-green-500',
    ORDER: 'text-blue-400',
    STOPPED: 'text-gray-500',
  }

  return (
    <div className={`flex space-x-1 items-center ${statusColor[status] || 'text-gray-500'}`}>
      <ProductStatusIcon status={status} />
      <ProductStatusName status={status} />
    </div>
  )
}
