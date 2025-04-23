import type { AccessArgs } from 'payload'
import type { User } from '../payload-types'
import { config } from '@/config'

export const hasRole =
  (roles: User['roles']) =>
  ({ req }: Pick<AccessArgs, 'req'>): boolean => {
    if (!req.user) {
      return false
    }
    if (typeof req.user === 'object') {
      return req.user.roles.some((role) => roles.includes(role))
    }
    return req.user === config.AUTO_PROCESS_USER_ID
  }

export const userHasRole = (user: User | null, roles: User['roles']) => {
  if (!user) {
    return false
  }
  if (typeof user === 'object') {
    return user.roles.some((role) => roles.includes(role))
  }
  return user === config.AUTO_PROCESS_USER_ID
}
