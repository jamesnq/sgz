import type { AccessArgs } from 'payload'
import type { User } from '../payload-types'

export const hasRoles = (roles: User['roles']) => {
  return ({ req: { user } }: AccessArgs): boolean => {
    if (!user) {
      return false
    }
    return user.roles.some((role) => roles.includes(role))
  }
}
