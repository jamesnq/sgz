import { hasRole } from '@/access/hasRoles'
import { AccessArgs, PayloadRequest, User } from 'payload'

const hasRoleOrSelf =
  (roles: User['roles']) =>
  ({ req }: { req: PayloadRequest } | AccessArgs): boolean | Promise<boolean> => {
    if (hasRole(roles)({ req })) return true
    if (process.env.NODE_ENV === 'development') {
      //@ts-expect-error ts missmatch
      return { id: { equals: req.user?.id } }
    }
    return false
  }
export default hasRoleOrSelf
