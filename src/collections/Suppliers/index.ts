import type { CollectionConfig } from 'payload'

import { hasRole } from '@/access/hasRoles'
import { managerGroup } from '@/utilities/constants'

export const Suppliers: CollectionConfig = {
  slug: 'suppliers',
  access: {
    create: hasRole(['admin']),
    delete: hasRole(['admin']),
    read: hasRole(['admin']),
    update: hasRole(['admin']),
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'status', 'updatedAt'],
    group: managerGroup,
    description: 'Suppliers of products',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'ACTIVE',
      options: [
        {
          label: 'Active',
          value: 'ACTIVE',
        },
        {
          label: 'Inactive',
          value: 'INACTIVE',
        },
      ],
      required: true,
    },
    {
      name: 'variantSupplies',
      type: 'join',
      collection: 'product-variant-supplies',
      on: 'supplier',
      admin: {
        defaultColumns: ['productVariant', 'supplier', 'cost', 'purchase', 'updatedAt'],
      },
    },
    {
      name: 'notes',
      type: 'textarea',
      admin: {
        description: 'Internal notes about this supplier',
      },
      access: {
        read: hasRole(['admin']),
        update: hasRole(['admin']),
      },
    },
  ],
}
