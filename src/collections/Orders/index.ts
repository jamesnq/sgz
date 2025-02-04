import type { CollectionConfig } from 'payload'

import { authenticated } from '@/access/authenticated'
import { hasRole } from '@/access/hasRoles'
import hasRoleOrOrderBy from './access/hasRoleOrOrderBy'
export const Orders: CollectionConfig = {
  slug: 'orders',
  access: {
    read: ({ req }) => {
      if (!hasRole(['admin', 'staff'])({ req })) return false
      return { orderedBy: { equals: req.user?.id } }
    },
    update: hasRoleOrOrderBy(['admin', 'staff']),
    create: authenticated,
    delete: hasRole(['admin']),
  },
  admin: {
    defaultColumns: ['id', 'createdAt'],
    useAsTitle: 'id',
  },
  fields: [
    {
      name: 'status',
      type: 'select',
      defaultValue: 'PENDING',
      options: [
        { value: 'PENDING', label: 'Pending' },
        { value: 'IN_QUEUE', label: 'In Queue' },
        { value: 'IN_PROCESS', label: 'In Process' },
        { value: 'COMPLETED', label: 'Completed' },
        { value: 'CANCELLED', label: 'Cancelled' },
        { value: 'REFUND', label: 'Refund' },
      ],
      required: true,
    },
    {
      name: 'orderedBy',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
    {
      name: 'handlers',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      hasMany: true,
    },
    {
      name: 'productVariant',
      type: 'relationship',
      relationTo: 'product-variants',
      required: true,
      access: {
        create: hasRole(['admin', 'staff']),
        update: hasRole(['admin']),
      },
    },
    {
      name: 'formSubmission',
      type: 'relationship',
      relationTo: 'form-submissions',
      access: {
        create: hasRole(['admin', 'staff']),
        update: hasRole(['admin', 'staff']),
      },
    },
    {
      name: 'totalPrice',
      type: 'number',
      required: true,
      access: {
        create: hasRole(['admin']),
        update: hasRole(['admin']),
      },
    },
    {
      name: 'quantity',
      type: 'number',
      required: true,
      access: {
        create: hasRole(['admin']),
        update: hasRole(['admin']),
      },
    },
    {
      name: 'note',
      type: 'text',
      access: {
        create: hasRole(['admin', 'staff']),
        read: hasRole(['admin', 'staff']),
        update: hasRole(['admin', 'staff']),
      },
    },
    {
      name: 'message',
      type: 'textarea',
      access: {
        create: hasRole(['admin', 'staff']),
        read: hasRole(['admin', 'staff']),
        update: hasRole(['admin', 'staff']),
      },
    },
  ],
  timestamps: true,
}
