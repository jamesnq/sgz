import type { CollectionConfig } from 'payload'

import { hasRole } from '@/access/hasRoles'
import { anyone } from '../access/anyone'

export const Categories: CollectionConfig = {
  slug: 'categories',
  access: {
    create: hasRole(['admin', 'staff']),
    delete: hasRole(['admin', 'staff']),
    read: anyone,
    update: hasRole(['admin', 'staff']),
  },
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
    },
  ],
}
