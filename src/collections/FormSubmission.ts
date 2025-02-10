import type { CollectionConfig } from 'payload'

import { authenticated } from '@/access/authenticated'
// TODO check access permissions
export const FormSubmissions: CollectionConfig = {
  slug: 'form-submissions',
  access: {
    create: authenticated,
    delete: authenticated,
    read: authenticated,
    update: authenticated,
  },
  admin: {
    useAsTitle: 'form',
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
    {
      name: 'form',
      type: 'relationship',
      relationTo: 'forms',
      required: true,
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
