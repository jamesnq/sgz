import type { CollectionConfig } from 'payload'

import { hasRole } from '@/access/hasRoles'
import { anyone } from '@/access/anyone'
import { slugField } from '@/fields/slug'
import { mediaGroup } from '@/utilities/constants'

export const PostTags: CollectionConfig = {
  slug: 'post-tags',
  access: {
    create: hasRole(['admin']),
    delete: hasRole(['admin']),
    read: anyone,
    update: hasRole(['admin']),
  },
  admin: {
    useAsTitle: 'title',
    group: mediaGroup,
    description: 'Tags cho bài viết',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    ...slugField(),
  ],
}
