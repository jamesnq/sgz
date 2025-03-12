'use server'
import { userHasRole } from '@/access/hasRoles'
import { authActionClient } from '@/utilities/safe-action'
import payloadConfig from '@payload-config'
import { getPayload } from 'payload'

export const testAction = authActionClient.action(async ({ ctx }) => {
  const { user } = ctx
  if (!userHasRole(user, ['admin'])) {
    return
  }
  const _payload = await getPayload({ config: payloadConfig })
})
