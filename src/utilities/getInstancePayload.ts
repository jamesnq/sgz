'use server'

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { headers } from 'next/headers'

export const getInstancePayload = async () => {
  const payload = await getPayload({ config: configPromise })
  return payload
}

export const getInstancePayloadAuth = async () => {
  const payload = await getInstancePayload()
  const { user } = await payload.auth({ headers: await headers() })
  return { payload, user }
}
