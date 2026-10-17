import type { Access, CollectionConfig } from 'payload'

import { authenticated } from '@/access/authenticated'
import { managerGroup } from '@/utilities/constants'

const isOwnerOrAdmin: Access = ({ req }) => {
  if (req.user && (req.user.roles?.includes('admin') || req.user.roles?.includes('staff'))) {
    return true
  }
  if (!req.user?.id) return false
  return { user: { equals: req.user.id } }
}

export const PushSubscriptions: CollectionConfig = {
  slug: 'push-subscriptions',
  access: {
    read: isOwnerOrAdmin,
    create: authenticated,
    update: isOwnerOrAdmin,
    delete: isOwnerOrAdmin,
  },
  admin: {
    defaultColumns: ['user', 'endpoint', 'createdAt'],
    useAsTitle: 'endpoint',
    group: managerGroup,
    description: 'Web Push notification subscriptions',
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
    },
    {
      name: 'endpoint',
      type: 'textarea',
      required: true,
      index: true,
    },
    {
      name: 'p256dh',
      type: 'text',
      required: true,
    },
    {
      name: 'auth',
      type: 'text',
      required: true,
    },
    {
      name: 'userAgent',
      type: 'text',
    },
  ],
}
