import { Users } from '@/collections/Users'
import { managerGroup } from '@/utilities/constants'
import { CollectionConfig } from 'payload'
import { withAccountCollection } from 'payload-auth-plugin/collection'
export const Accounts: CollectionConfig = withAccountCollection(
  {
    slug: 'accounts',
    admin: {
      group: managerGroup,
      description: 'User account',
    },
  },
  Users.slug,
)
