import type { CollectionConfig } from 'payload'

import { hasRole } from '@/access/hasRoles'

export const Transactions: CollectionConfig = {
  slug: 'transactions',
  access: {
    read: hasRole(['admin']),
    update: hasRole(['admin']),
    create: hasRole(['admin']),
    delete: hasRole(['admin']),
  },
  admin: {
    defaultColumns: ['user', 'amount', 'description', 'updatedAt'],
    useAsTitle: 'amount',
  },
  fields: [
    {
      name: 'amount',
      type: 'number',
      required: true,
    },
    {
      name: 'balance',
      type: 'number',
      required: true,
    },
    {
      name: 'description',
      type: 'text',
      required: true,
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
  ],
  timestamps: true,
}
