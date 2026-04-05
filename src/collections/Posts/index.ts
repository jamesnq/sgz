import type {
  CollectionAfterChangeHook,
  CollectionBeforeDeleteHook,
  CollectionConfig,
} from 'payload'

import { hasRole } from '@/access/hasRoles'
import { slugField } from '@/fields/slug'
import { Post } from '@/payload-types'
import { mediaGroup } from '@/utilities/constants'
import { defaultLexicalEditor } from '@/utilities/defaultLexicalEditor'
import { revalidatePath, revalidateTag } from 'next/cache'

const revalidatePost: CollectionAfterChangeHook<Post> = ({
  doc,
  previousDoc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate) {
    if (doc._status === 'published') {
      payload.logger.info(`Revalidating post at path: /posts/${doc.slug}`)
      revalidatePath(`/posts/${doc.slug}`)
      revalidateTag('posts-list', 'default')
    }

    if (previousDoc?._status === 'published' && doc._status !== 'published') {
      payload.logger.info(`Revalidating old post at path: /posts/${previousDoc.slug}`)
      revalidatePath(`/posts/${previousDoc.slug}`)
      revalidateTag('posts-list', 'default')
    }
  }
  return doc
}

const revalidateDelete: CollectionBeforeDeleteHook = ({ req: { payload, context } }) => {
  if (!context.disableRevalidate) {
    payload.logger.info(`Revalidating posts list after delete`)
    revalidateTag('posts-list', 'default')
  }
}

export const Posts: CollectionConfig = {
  slug: 'posts',
  access: {
    read: ({ req: { user } }) => {
      if (hasRole(['admin'])({ req: { user } } as any)) return true
      return { _status: { equals: 'published' } }
    },
    update: hasRole(['admin']),
    create: hasRole(['admin']),
    delete: hasRole(['admin']),
  },
  admin: {
    defaultColumns: ['title', 'image', 'tags', '_status', 'publishedAt', 'updatedAt'],
    useAsTitle: 'title',
    group: mediaGroup,
  },
  versions: {
    drafts: {
      autosave: {
        interval: 100,
      },
      schedulePublish: true,
    },
    maxPerDoc: 50,
  },
  hooks: {
    afterChange: [revalidatePost],
    beforeDelete: [revalidateDelete],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'excerpt',
      type: 'textarea',
      admin: {
        description: 'Mô tả ngắn hiển thị trong danh sách bài viết',
      },
    },
    {
      name: 'content',
      type: 'richText',
      editor: defaultLexicalEditor,
      required: true,
    },
    {
      name: 'tags',
      type: 'relationship',
      relationTo: 'post-tags',
      hasMany: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
      hooks: {
        beforeChange: [
          ({ siblingData, value }) => {
            if (siblingData._status === 'published' && !value) {
              return new Date()
            }
            return value
          },
        ],
      },
    },
    ...slugField(),
  ],
}
