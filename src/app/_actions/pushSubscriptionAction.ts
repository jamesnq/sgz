'use server'

import { SubscribePushSchema, UnsubscribePushSchema } from '@/app/_actions/schema'
import { authActionClient } from '@/utilities/safe-action'
import payloadConfig from '@payload-config'
import { getPayload } from 'payload'

export const subscribePushAction = authActionClient
  .schema(SubscribePushSchema)
  .action(async ({ parsedInput: { endpoint, keys, userAgent }, ctx }) => {
    const { user } = ctx
    const payload = await getPayload({ config: payloadConfig })

    // Check if subscription with this endpoint already exists
    const { docs: existing } = await payload.find({
      collection: 'push-subscriptions' as any,
      where: {
        endpoint: { equals: endpoint },
      },
      depth: 0,
      limit: 1,
      overrideAccess: true,
    })

    if (existing.length > 0) {
      // Update existing subscription to point to this user
      await payload.update({
        collection: 'push-subscriptions' as any,
        id: existing[0].id,
        data: {
          user: user.id,
          p256dh: keys.p256dh,
          auth: keys.auth,
          userAgent: userAgent || null,
        },
        overrideAccess: true,
      })
    } else {
      // Create new subscription
      await payload.create({
        collection: 'push-subscriptions' as any,
        data: {
          user: user.id,
          endpoint,
          p256dh: keys.p256dh,
          auth: keys.auth,
          userAgent: userAgent || null,
        },
        overrideAccess: true,
      })
    }

    return { success: true }
  })

export const unsubscribePushAction = authActionClient
  .schema(UnsubscribePushSchema)
  .action(async ({ parsedInput: { endpoint }, ctx }) => {
    const { user } = ctx
    const payload = await getPayload({ config: payloadConfig })

    await payload.delete({
      collection: 'push-subscriptions' as any,
      where: {
        endpoint: { equals: endpoint },
        user: { equals: user.id },
      },
      overrideAccess: true,
    })

    return { success: true }
  })
