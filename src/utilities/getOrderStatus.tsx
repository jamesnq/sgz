import { Order } from '@/payload-types'
export const orderStatusColors: Record<Order['status'], string> = {
  IN_QUEUE: '#3B82F6',
  IN_PROCESS: '#EAB308',
  USER_UPDATE: '#d2a8ff',
  COMPLETED: '#22C55E',
  REFUND: '#EF4444',
}

export const orderStatus: Record<Order['status'], React.ReactNode> = {
  IN_QUEUE: <p style={{ color: orderStatusColors.IN_QUEUE }}>Chờ xử lý</p>,
  IN_PROCESS: <p style={{ color: orderStatusColors.IN_PROCESS }}>Đang xử lý</p>,
  USER_UPDATE: <p style={{ color: orderStatusColors.USER_UPDATE }}>Chờ cập nhật</p>,
  COMPLETED: <p style={{ color: orderStatusColors.COMPLETED }}>Hoàn thành</p>,
  REFUND: <p style={{ color: orderStatusColors.REFUND }}>Hoàn trả</p>,
}

export function getOrderStatus(status: Order['status']) {
  return orderStatus[status]
}
