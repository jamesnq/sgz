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
  const payload = await getPayload({ config: payloadConfig })
  const { users } = payload.db.tables

  console.log('🚀 ~ .action ~  payload.db.tables:', users)
})
