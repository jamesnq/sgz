import { ArrowLeftRight, LucideProps, Package } from 'lucide-react'
import { ForwardRefExoticComponent, RefAttributes } from 'react'

export class Routes {
  static readonly PRODUCTS = '/products'
  static readonly HOME = this.PRODUCTS
  static readonly ORDERS = '/user/orders'
  static readonly ADMIN = '/admin'
  static readonly WORKSPACE = '/workspace'
  static readonly TRANSACTIONS = '/user/transactions'
  static readonly USER_NAV: {
    label: string
    href: string
    icon: ForwardRefExoticComponent<Omit<LucideProps, 'ref'> & RefAttributes<SVGSVGElement>>
  }[] = [
    {
      label: 'Đơn hàng',
      href: Routes.ORDERS,
      icon: Package,
    },
    {
      label: 'Lịch sử giao dịch',
      href: Routes.TRANSACTIONS,
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
