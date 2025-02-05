import type { CollectionConfig } from 'payload'

import { hasRole } from '@/access/hasRoles'
// TODO indexes orderCode, gateway
export const Recharges: CollectionConfig = {
  slug: 'recharges',
  access: {
    read: hasRole(['admin']),
    update: hasRole(['admin']),
    create: hasRole(['admin']),
    delete: hasRole(['admin']),
  },
  admin: {
    defaultColumns: ['status', 'updatedAt'],
    useAsTitle: 'status',
  },
  fields: [
    {
      name: 'status',
      type: 'select',
      defaultValue: 'PENDING',
      options: [
        { value: 'PENDING', label: 'Pending' },
        { value: 'CANCEL', label: 'Cancel' },
        { value: 'SUCCESS', label: 'Success' },
        { value: 'REFUND', label: 'Refund' },
      ],
      required: true,
    },
    {
      name: 'orderCode',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'gateway',
      type: 'select',
      defaultValue: 'PAYOS',
      options: [{ value: 'PAYOS', label: 'PAYOS' }],
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'data',
      type: 'json',
    },
    {
      name: 'amount',
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
