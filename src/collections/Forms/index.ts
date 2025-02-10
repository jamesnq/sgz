import type { CollectionConfig } from 'payload'

import { hasRole } from '@/access/hasRoles'
import { anyone } from '../../access/anyone'
import { fields } from './fields'
// TODO check duplicate key
export const Forms: CollectionConfig = {
  slug: 'forms',
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
    {
      name: 'fields',
      type: 'blocks',
      blocks: Object.values(fields),
    },
  ],
}
