import { hasRole } from '@/access/hasRoles'
import { AccessArgs, PayloadRequest, User } from 'payload'

const hasRoleOrSelf =
  (roles: User['roles']) =>
  async ({ req }: { req: PayloadRequest } | AccessArgs): Promise<boolean | any> => {
    if (await hasRole(roles)({ req })) return true
    if (!req.user?.id) return false
    return { id: { equals: req.user.id } }
  }
export default hasRoleOrSelf
