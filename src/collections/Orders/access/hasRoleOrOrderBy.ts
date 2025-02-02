import { hasRole } from '@/access/hasRoles'
import { AccessArgs, PayloadRequest, User } from 'payload'

const hasRoleOrOrderBy =
  (roles: User['roles']) =>
  ({ req }: { req: PayloadRequest } | AccessArgs): boolean | Promise<boolean> => {
    if (hasRole(roles)({ req })) return true
    //@ts-expect-error ts missmatch
    return { orderedBy: { equals: req.user?.id } }
  }
export default hasRoleOrOrderBy
