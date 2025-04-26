import type { CollectionConfig } from 'payload'

import { hasRole } from '@/access/hasRoles'
import { mediaGroup } from '@/utilities/constants'
import { anyone } from '../access/anyone'

export const CategoryGroups: CollectionConfig = {
  slug: 'category-groups',
  access: {
    create: hasRole(['admin', 'staff']),
    delete: hasRole(['admin', 'staff']),
    read: anyone,
    update: hasRole(['admin', 'staff']),
  },
  admin: {
    useAsTitle: 'title',
    group: mediaGroup,
    description: 'Groups of product categories',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        description: 'Group name',
      },
    },
    {
      name: 'icon',
      type: 'text',
      defaultValue: 'box',
      required: true,
      admin: {
        description: 'Icon identifier from https://lucide.dev/icons/',
      },
    },
    {
      name: 'categories',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
      unique: true,
      admin: {
        description: 'Categories in this group',
      },
    },
  ],
}
