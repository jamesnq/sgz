'use server'
import { authActionClient } from '@/utilities/safe-action'
import payloadConfig from '@payload-config'
import { getPayload } from 'payload'

export const testAction = authActionClient.action(async ({ ctx }) => {
  const { user } = ctx

  const payload = await getPayload({ config: payloadConfig })
  const { users } = payload.db.tables

  console.log('🚀 ~ .action ~  payload.db.tables:', users)
})
