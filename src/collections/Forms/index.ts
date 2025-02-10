import type { CollectionConfig } from 'payload'

import { anyone } from '../../access/anyone'
import { authenticated } from '../../access/authenticated'
import { fields } from './fields'
// TODO check access permissions
// TODO check duplicate key
export const Forms: CollectionConfig = {
  slug: 'forms',
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
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
