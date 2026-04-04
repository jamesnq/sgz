import { Users } from '@/collections/Users'
import { managerGroup } from '@/utilities/constants'
import { CollectionConfig } from 'payload'
import { withAdminAccountCollection } from 'payload-auth-plugin/collection'
export const Accounts: CollectionConfig = withAdminAccountCollection(
  {
    slug: 'accounts',
    admin: {
      group: managerGroup,
      description: 'User account',
    },
  },
  Users.slug,
)
