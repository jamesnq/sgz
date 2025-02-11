'use server'
import { authActionClient } from '@/utilities/safe-action'
import payloadConfig from '@payload-config'
import { getPayload } from 'payload'
import { UpdateFormSubmissionSchema } from './schema'

export const updateFormSubmissionAction = authActionClient
  .schema(UpdateFormSubmissionSchema)
  .action(async ({ parsedInput: { id, shippingFields }, ctx }) => {
    const { user } = ctx

    const payload = await getPayload({ config: payloadConfig })

    const res = await payload.update({
      collection: 'form-submissions',
      where: { id: { equals: id } },
      data: { submissionData: shippingFields },
      user,
    })
    return { message: 'Cập nhật thông tin thành công' }
  })
