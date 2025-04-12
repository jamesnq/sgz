import type { CollectionConfig } from 'payload'

import { hasRole } from '@/access/hasRoles'
import { managerGroup } from '@/utilities/constants'

export const ProductVariantSupplies: CollectionConfig = {
  slug: 'product-variant-supplies',
  indexes: [{ unique: true, fields: ['productVariant', 'supplier'] }],
  access: {
    create: hasRole(['admin']),
    delete: hasRole(['admin']),
    read: hasRole(['admin']),
    update: hasRole(['admin']),
  },
  admin: {
    useAsTitle: 'productVariant',
    defaultColumns: ['productVariant', 'supplier', 'costPrice', 'updatedAt'],
    group: managerGroup,
  },
  fields: [
    {
      name: 'productVariant',
      type: 'relationship',
      relationTo: 'product-variants',
      required: true,
      admin: {
        description: 'The product variant being supplied',
      },
    },
    {
      name: 'supplier',
      type: 'relationship',
      relationTo: 'suppliers',
      required: true,
      admin: {
        description: 'The supplier providing this product variant',
      },
    },
    {
      name: 'costPrice',
      type: 'number',
      defaultValue: 0,
      required: true,
      admin: {
        description: 'Cost price per unit from this supplier',
      },
    },
    {
      name: 'isPreferred',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Mark this as the preferred supply source for this product variant',
      },
    },
    {
      name: 'note',
      type: 'textarea',
      admin: {
        description: 'Notes about supply conditions, delivery time, etc.',
      },
    },
  ],
}
