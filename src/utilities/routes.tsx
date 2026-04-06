import { ArrowLeftRight, HandCoins, LucideProps, Package } from 'lucide-react'
import { ForwardRefExoticComponent, RefAttributes } from 'react'

export class Routes {
  static readonly HOME = '/'
  static readonly PRODUCTS = '/products'
  static readonly POSTS = '/posts'
  static readonly ORDERS = '/user/orders'
  static readonly ADMIN = '/admin'
  static readonly WORKSPACE = '/workspace'
  static readonly TRANSACTIONS = '/user/transactions'
  static readonly AFFILIATE = '/user/affiliate'
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
    {
      label: 'Thu nhập Affiliate',
      href: Routes.AFFILIATE,
      icon: HandCoins,
    },
  ]
  static adminProductVariant(id: string | number): string {
    return `${Routes.ADMIN}/collections/product-variants/${id}`
  }
  static product(slug: string, variant?: string | number): string {
    return `/products/${slug}${variant ? `?variant=${variant}` : ''}`
  }

  static order(id: string | number): string {
    return `/user/orders/${id}`
  }

  static post(slug: string): string {
    return `/posts/${slug}`
  }
}

