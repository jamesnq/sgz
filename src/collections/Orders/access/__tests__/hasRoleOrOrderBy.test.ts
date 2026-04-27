import { describe, expect, it, vi } from 'vitest'

vi.mock('@/config', () => ({
  config: {
    AUTO_PROCESS_USER_ID: 123,
  },
}))

import hasRoleOrOrderBy from '@/collections/Orders/access/hasRoleOrOrderBy'

const makeReq = (user: unknown) =>
  ({
    user,
    payload: {
      find: vi.fn(),
    },
  }) as any

describe('hasRoleOrOrderBy', () => {
  it('does not treat an auto-process user object as an admin or staff actor', async () => {
    const access = hasRoleOrOrderBy(['admin', 'staff'])

    await expect(
      access({
        req: makeReq({
          id: 123,
          roles: ['user'],
        }),
      }),
    ).resolves.toEqual({ orderedBy: { equals: 123 } })
  })

  it('allows a normal admin user', async () => {
    const access = hasRoleOrOrderBy(['admin', 'staff'])

    await expect(
      access({
        req: makeReq({
          id: 456,
          roles: ['admin'],
        }),
      }),
    ).resolves.toBe(true)
  })
})
