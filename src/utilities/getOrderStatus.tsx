export const orderStatus: Record<string, React.ReactNode> = {
  // PENDING: 'Chờ thanh toán',
  IN_QUEUE: <p style={{ color: '#3B82F6' }}>Chờ xử lý</p>,
  IN_PROCESS: <p style={{ color: '#EAB308' }}>Đang xử lý</p>,
  COMPLETED: <p style={{ color: '#22C55E' }}>Đã xử lý</p>,
  // IN_CART: "Trong vỏ hàng",
  // CANCELLED: <p style={{ color: '#FCA5A5' }}>Hủy</p>,
  REFUND: <p style={{ color: '#EF4444' }}>Hoàn trả</p>,
}

export function getOrderStatus(status: string) {
  return orderStatus[status]
}
