import type { CollectionConfig } from 'payload'

import { noOne } from '@/access/noOne'
import { hasRole, userHasRole } from '@/access/hasRoles'
import { managerGroup } from '@/utilities/constants'

export const FormSubmissions: CollectionConfig = {
  slug: 'form-submissions',
  access: {
    create: noOne,
    delete: noOne,
    read: ({ req: { user } }) => {
      const test = userHasRole(user, ['admin', 'staff'])
      if (test) return true
      return { user: { equals: user?.id } }
    },
    update: hasRole(['admin', 'staff']),
  },
  admin: {
    useAsTitle: 'form',
    defaultColumns: ['id', 'form', 'user', 'createdAt'],
    group: managerGroup,
    description: 'User submitted form data',
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
        description: 'User who submitted the form',
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
        description: 'Form template used',
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
          } catch {
            return 'Cannot create this submission because this form does not exist.'
          }
        }
      },
    },
    {
      name: 'submissionData',
      type: 'json',
      required: true,
      admin: {
        description: 'Form submission data',
      },
      validate: async (_value, { data, req: { payload } }) => {
        /* Don't run in the client side */
        if (!payload) {
          return true
        }
        const submissionData = (data as any).submissionData
        const form = await payload.findByID({
          id: (data as any).form,
          collection: 'forms',
        })

        if (!form) {
          return 'Form not found'
        }
        if (form.fields?.length === 0) {
          return 'Form has no fields'
        }
        for (const [key] of Object.entries(submissionData)) {
          if (!form.fields?.some((f: any) => f.name === key)) {
            return `Field ${key} not found in form`
          }
          // const requiredFields = form.fields.filter((f: any) => f.required).map((f: any) => f.name)
          // for (const field of requiredFields) {
          //   if (!submissionData[field]) {
          //     return `Field ${field} is required`
          //   }
          // }
        }

        return true
      },
    },
  ],
}
