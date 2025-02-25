import { noOne } from '@/access/noOne'
import type { CollectionConfig } from 'payload'

export const NovuChannels: CollectionConfig = {
  slug: 'novu-channels',
  access: {
    create: noOne,
    update: noOne,
    delete: noOne,
    read: async ({ req }) => {
      const user = req.user
      if (!user) {
        return false
      }
      return { subscriberId: { in: user.roles } }
    },
  },
  fields: [
    {
      name: 'subscriberId',
      type: 'text',
      required: true,
    },
    {
      name: 'hash',
      type: 'text',
      required: true,
      // admin: {
      //   hidden: true,
      // },
    },
  ],
}
