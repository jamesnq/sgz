import type { CollectionConfig } from 'payload'

import { hasRole } from '@/access/hasRoles'
import { noOne } from '@/access/noOne'

export const Transactions: CollectionConfig = {
  slug: 'transactions',
  access: {
    read: hasRole(['admin']),
    update: noOne,
    create: noOne,
    delete: noOne,
  },
  admin: {
    defaultColumns: ['user', 'amount', 'balance', 'description', 'createdAt'],
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
