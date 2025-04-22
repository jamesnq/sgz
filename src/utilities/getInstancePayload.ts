'use server'

import configPromise from '@payload-config'
import { headers } from 'next/headers'
import { getPayload, Payload } from 'payload'
let payloadInstance: null | Payload = null
export const getInstancePayload = async () => {
  if (payloadInstance) return payloadInstance
  payloadInstance = await getPayload({ config: configPromise })
  return payloadInstance
}

export const getInstancePayloadAuth = async () => {
  const payload = await getInstancePayload()
  const { user } = await payload.auth({ headers: await headers() })
  return { payload, user }
}
