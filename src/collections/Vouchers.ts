import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload'

import { hasRole } from '@/access/hasRoles'
import { managerGroup } from '@/utilities/constants'

const uppercaseCode: CollectionBeforeChangeHook = ({ data }) => {
  if (data.code && typeof data.code === 'string') {
    data.code = data.code.toUpperCase().trim()
  }
  return data
}

export const Vouchers: CollectionConfig = {
  slug: 'vouchers',
  access: {
    create: hasRole(['admin']),
    update: hasRole(['admin']),
    delete: hasRole(['admin']),
    read: hasRole(['admin', 'staff']),
  },
  admin: {
    useAsTitle: 'code',
    group: managerGroup,
  },
  hooks: {
    beforeChange: [uppercaseCode],
  },
  fields: [
    {
      name: 'code',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'Mã voucher (tự động viết hoa)',
      },
    },
    {
      name: 'discountType',
      type: 'select',
      required: true,
      options: [
        { label: 'Phần trăm', value: 'percentage' },
        { label: 'Số tiền cố định', value: 'fixed' },
      ],
      admin: {
        description: 'Loại giảm giá',
      },
    },
    {
      name: 'discountValue',
      type: 'number',
      required: true,
      min: 0,
      admin: {
        description: 'Giá trị giảm (% hoặc VND tuỳ loại)',
      },
    },
    {
      name: 'minPurchase',
      type: 'number',
      min: 0,
      admin: {
        description: 'Giá trị đơn hàng tối thiểu để sử dụng (bỏ trống = không giới hạn)',
      },
    },
    {
      name: 'maxUses',
      type: 'number',
      min: 0,
      admin: {
        description: 'Số lần sử dụng tối đa (bỏ trống = không giới hạn)',
      },
    },
    {
      name: 'usedCount',
      type: 'number',
      defaultValue: 0,
      admin: {
        readOnly: true,
        description: 'Số lần đã sử dụng',
      },
      access: {
        create: () => false,
        update: () => false,
      },
    },
    {
      name: 'startDate',
      type: 'date',
      admin: {
        description: 'Ngày bắt đầu hiệu lực (bỏ trống = có hiệu lực ngay)',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'expirationDate',
      type: 'date',
      admin: {
        description: 'Ngày hết hạn (bỏ trống = không hết hạn)',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Bật/tắt voucher',
        position: 'sidebar',
      },
    },
    {
      name: 'applicableProducts',
      type: 'relationship',
      relationTo: 'products',
      hasMany: true,
      admin: {
        position: 'sidebar',
        description: 'Sản phẩm áp dụng (bỏ trống = tất cả)',
      },
    },
    {
      name: 'applicableProductVariants',
      type: 'relationship',
      relationTo: 'product-variants',
      hasMany: true,
      admin: {
        position: 'sidebar',
        description: 'Phiên bản sản phẩm áp dụng (bỏ trống = tất cả)',
      },
    },
  ],
}
