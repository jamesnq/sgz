import type { CollectionConfig } from 'payload'

import { noOne } from '@/access/noOne'
import { hasRole } from '@/access/hasRoles'

export const FormSubmissions: CollectionConfig = {
  slug: 'form-submissions',
  access: {
    create: noOne,
    delete: noOne,
    read: hasRole(['admin', 'staff']),
    update: hasRole(['admin', 'staff']),
  },
  admin: {
    useAsTitle: 'form',
    defaultColumns: ['id', 'form', 'user', 'createdAt'],
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'form',
      type: 'relationship',
      relationTo: 'forms',
      required: true,
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
      // @ts-expect-error ts missmatch
      validate: async (value, { req: { payload }, req }) => {
        /* Don't run in the client side */
        if (!payload) {
          return true
        }

        if (payload) {
          let _existingForm

          try {
            _existingForm = await payload.findByID({
              id: value,
              collection: 'forms',
              req,
            })

            return true
          } catch (error) {
            return 'Cannot create this submission because this form does not exist.'
          }
        }
      },
    },
    {
      name: 'submissionData',
      type: 'json',
      required: true,
    },
  ],
}
