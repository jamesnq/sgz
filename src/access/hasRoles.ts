import type { AccessArgs } from 'payload'
import type { User } from '../payload-types'

export const hasRole =
  (roles: User['roles']) =>
  ({ req }: Pick<AccessArgs, 'req'>): boolean => {
    if (!req.user) {
      return false
    }
    return req.user.roles.some((role) => roles.includes(role))
  }

export const userHasRole = (user: User | null, roles: User['roles']) => {
  if (!user) {
    return false
  }
  return user.roles.some((role) => roles.includes(role))
}
