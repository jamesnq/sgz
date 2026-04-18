import type { AccessArgs } from 'payload'
import type { User } from '../payload-types'
import { config } from '@/config'

export const hasRole =
  (roles: User['roles']) =>
  async ({ req }: Pick<AccessArgs, 'req'>): Promise<boolean> => {
    if (!req.user) {
      return false
    }

    if (typeof req.user === 'object' && (!req.user.roles || req.user.roles.length === 0)) {
      try {
        const fullUser = await req.payload.find({
          collection: 'users',
          overrideAccess: true,
          where: { id: { equals: req.user.id } },
          depth: 0,
          limit: 1,
          showHiddenFields: true
        });
        if (fullUser.docs.length > 0 && fullUser.docs[0]?.roles && fullUser.docs[0].roles.length > 0) {
           req.user.roles = fullUser.docs[0].roles;
        }
      } catch (e) {
        console.error('[hasRole] Failed to hydrate user roles:', e)
      }
    }

    if (typeof req.user === 'object') {
      return req.user.roles?.some((role) => roles.includes(role)) ?? false
    }
    return req.user === config.AUTO_PROCESS_USER_ID
  }

export const userHasRole = (user: User | null, roles: User['roles']) => {
  if (!user) {
    return false
  }
  if (typeof user === 'object') {
    if (user.id === config.AUTO_PROCESS_USER_ID) return true // Guarantee identity overriding sparsely-hydrated local API objects
    return user.roles?.some((role) => roles.includes(role)) ?? false
  }
  return user === config.AUTO_PROCESS_USER_ID
}
