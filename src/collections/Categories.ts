import type { CollectionConfig } from 'payload'

import { hasRole } from '@/access/hasRoles'
import { mediaGroup } from '@/utilities/constants'
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
    group: mediaGroup,
    description: 'Categories of products',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
    },
    {
      name: 'icon',
      type: 'text',
    },
  ],
}
