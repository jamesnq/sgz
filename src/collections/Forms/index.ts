import type { CollectionConfig } from 'payload'

import { hasRole } from '@/access/hasRoles'
import { anyone } from '../../access/anyone'
import { fields } from './fields'

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
      validate: (v: any) => {
        if (!v || !v.length) return 'Please add at least one field'
        const fieldNames = new Set<string>()
        for (const [index, field] of (v ?? []).entries()) {
          if (!('name' in field) || !field.name) continue
          if (fieldNames.has(field.name)) {
            return `Duplicate field name '${field.name}' at index ${index}`
          }
          fieldNames.add(field.name)
        }
        return true
      },
    },
  ],
}
