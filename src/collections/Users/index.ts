import type { CollectionConfig } from 'payload'

import { authenticated } from '../../access/authenticated'
import { hasRoles } from '@/access/hasRoles'
export const Users: CollectionConfig = {
  slug: 'users',
  access: {
    admin: authenticated,
    create: authenticated,
    delete: authenticated,
    read: authenticated,
    update: authenticated,
  },
  admin: {
    defaultColumns: ['name', 'email'],
    useAsTitle: 'name',
  },
  auth: { tokenExpiration: 60 * 60 * 24 * 30, maxLoginAttempts: 5, lockTime: 5000 },
  fields: [
    {
      name: 'name',
      type: 'text',
    },
    {
      access: {
        update: hasRoles(['admin']),
      },
      name: 'roles',
      type: 'select',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Staff', value: 'staff' },
        { label: 'User', value: 'user' },
      ],
      hasMany: true,
      required: true,
      defaultValue: ['user'],
    },
  ],
  timestamps: true,
}
