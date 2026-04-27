import type { CollectionConfig } from 'payload'

import { noOne } from '@/access/noOne'
import { hasRole, userHasRole } from '@/access/hasRoles'
import { managerGroup } from '@/utilities/constants'
import { normalizeFormSubmissionData } from '@/utilities/formSubmission'

export const FormSubmissions: CollectionConfig = {
  slug: 'form-submissions',
  access: {
    create: noOne,
    delete: noOne,
    read: ({ req: { user } }) => {
      const test = userHasRole(user, ['admin', 'staff'])
      if (test) return true
      if (!user?.id) return false
      return { user: { equals: user.id } }
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
      name: 'completedOrder',
      type: 'relationship',
      relationTo: 'orders',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Order that completed this submission',
      },
    },
    {
      name: 'completedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'When the related order became completed',
      },
    },
    {
      name: 'completedBy',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'User who completed the order when available',
      },
    },
    {
      name: 'orderStatusAtCompletion',
      type: 'text',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Order status recorded at the time completion audit was written',
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

        ;(data as any).submissionData = normalizeFormSubmissionData(form, submissionData)

        // const requiredFields = form.fields.filter((f: any) => f.required).map((f: any) => f.name)
        // for (const field of requiredFields) {
        //   if (!submissionData[field]) {
        //     return `Field ${field} is required`
        //   }
        // }

        return true
      },
    },
  ],
}
