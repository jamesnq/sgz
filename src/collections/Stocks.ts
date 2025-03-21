import type { CollectionConfig } from 'payload'

import { hasRole } from '@/access/hasRoles'
import { managerGroup } from '@/utilities/constants'

export const Stocks: CollectionConfig = {
  slug: 'stocks',
  access: {
    create: hasRole(['admin']),
    delete: hasRole(['admin']),
    read: hasRole(['admin']),
    update: hasRole(['admin']),
  },
  admin: {
    useAsTitle: 'productVariant',
    defaultColumns: ['productVariant', 'id', 'data', 'expiredAt', 'createdAt', 'order'],
    group: managerGroup,
  },
  fields: [
    // If order is not set, the stock is available
    {
      name: 'order',
      type: 'relationship',
      relationTo: 'orders',
    },
    {
      name: 'productVariant',
      type: 'relationship',
      relationTo: 'product-variants',
      required: true,
    },
    {
      name: 'data',
      type: 'json',
      required: true,
    },
    {
      name: 'expiredAt',
      type: 'date',
    },
  ],
}
