import type { CollectionConfig } from 'payload'

import { authenticated } from '../../access/authenticated'
import { hasRole } from '@/access/hasRoles'
import hasRoleOrSelf from './access/hasRoleOrSelf'
export const Users: CollectionConfig = {
  slug: 'users',
  access: {
    admin: hasRoleOrSelf(['admin', 'staff']),
    create: authenticated,
    delete: hasRole(['admin']),
    read: hasRoleOrSelf(['admin', 'staff']),
    update: hasRoleOrSelf(['admin', 'staff']),
  },
  admin: {
    defaultColumns: ['name', 'email', 'roles'],
    useAsTitle: 'name',
  },
  auth: {
    tokenExpiration: 60 * 60 * 24 * 30,
    maxLoginAttempts: 5,
    lockTime: 5000,
    verify: true,
    forgotPassword: {},
    // forgotPassword: {
    //   generateEmailHTML: ({ req, token, user }) => {
    //     // Use the token provided to allow your user to reset their password
    //     const resetPasswordURL = `https://yourfrontend.com/reset-password?token=${token}`

    //     return `
    //     <!doctype html>
    //     <html>
    //       <body>
    //         <h1>Here is my custom email template!</h1>
    //         <p>Hello, ${user.email}!</p>
    //         <p>Click below to reset your password.</p>
    //         <p>
    //           <a href="${resetPasswordURL}">${resetPasswordURL}</a>
    //         </p>
    //       </body>
    //     </html>
    //   `
    //   },
    // },
  },
  fields: [
    {
      name: 'name',
      type: 'text',
    },
    {
      name: 'balance',
      type: 'number',
      defaultValue: 0,
      access: {
        create: hasRole(['admin']),
        update: hasRole(['admin']),
      },
    },
    {
      access: {
        create: hasRole(['admin']),
        update: hasRole(['admin']),
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
    { name: 'transactions', type: 'join', collection: 'transactions', on: 'user' },
    { name: 'orders', type: 'join', collection: 'orders', on: 'orderedBy' },
    { name: 'handle', type: 'join', collection: 'orders', on: 'handlers' },
  ],
  timestamps: true,
}
