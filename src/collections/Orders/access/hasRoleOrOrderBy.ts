import { hasRole } from '@/access/hasRoles'
import { AccessArgs, PayloadRequest, User } from 'payload'

const hasRoleOrOrderBy =
  (roles: User['roles']) =>
  async ({ req }: { req: PayloadRequest } | AccessArgs): Promise<boolean | any> => {
    if (await hasRole(roles)({ req })) return true
    return { orderedBy: { equals: req.user?.id } }
  }
export default hasRoleOrOrderBy
