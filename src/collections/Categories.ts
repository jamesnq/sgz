import type { CollectionConfig } from 'payload'

import { hasRole } from '@/access/hasRoles'
import { anyone } from '../access/anyone'
import { mediaGroup } from '@/utilities/constants'

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
