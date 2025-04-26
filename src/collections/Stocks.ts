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
    description: 'Product stock inventory management',
  },
  fields: [
    // If order is not set, the stock is available
    {
      name: 'order',
      type: 'relationship',
      relationTo: 'orders',
      admin: {
        description: 'Associated order (if assigned)',
      },
    },
    {
      name: 'productVariant',
      type: 'relationship',
      relationTo: 'product-variants',
      required: true,
      admin: {
        description: 'Related product variant',
      },
    },
    {
      name: 'data',
      type: 'json',
      required: true,
      admin: {
        description: 'Stock item data (keys, codes, etc.)',
      },
    },
    // TODO need to handle expiredAt
    {
      name: 'expiredAt',
      type: 'date',
      admin: {
        description: 'Expiration date of the stock item',
      },
    },
  ],
}
