import { ArrowLeftRight, LucideProps, Package } from 'lucide-react'
import { ForwardRefExoticComponent, RefAttributes } from 'react'

export class Routes {
  static readonly HOME = '/'
  static readonly PRODUCTS = '/products'
  static readonly ORDERS = '/user/orders'
  static readonly ADMIN = '/admin'
  static readonly USER_NAV: {
    label: string
    href: string
    icon: ForwardRefExoticComponent<Omit<LucideProps, 'ref'> & RefAttributes<SVGSVGElement>>
  }[] = [
    {
      label: 'Đơn hàng',
      href: '/user/orders',
      icon: Package,
    },
    {
      label: 'Lịch sử giao dịch',
      href: '/user/transactions',
      icon: ArrowLeftRight,
    },
  ]
  static product(slug: string): string {
    return `/products/${slug}`
  }

  static order(id: string | number): string {
    return `/user/orders/${id}`
  }
}
