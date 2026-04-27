import { describe, expect, it, vi } from 'vitest'

vi.mock('@/config', () => ({
  config: {
    AUTO_PROCESS_USER_ID: 123,
  },
}))

import { hasRole, isAutoProcessActor, userHasRole } from '@/access/hasRoles'
import type { User } from '@/payload-types'

const makeReq = (user: unknown, context?: Record<string, unknown>) =>
  ({
    user,
    context,
    payload: {
      find: vi.fn(),
    },
  }) as any

describe('userHasRole', () => {
  it('does not grant admin access to the auto-process user id without an admin role', () => {
    const user = {
      id: 123,
      roles: ['user'],
    } as User

    expect(userHasRole(user, ['admin'])).toBe(false)
  })

  it('grants admin access to a normal admin user', () => {
    const user = {
      id: 456,
      roles: ['admin'],
    } as User

    expect(userHasRole(user, ['admin'])).toBe(true)
  })

  it('does not grant role access to a primitive auto-process actor', () => {
    expect(userHasRole(123, ['admin'])).toBe(false)
  })
})

describe('hasRole', () => {
  it('does not grant admin access to the auto-process user id without an admin role', async () => {
    const req = makeReq({
      id: 123,
      roles: ['user'],
    })

    await expect(hasRole(['admin'])({ req })).resolves.toBe(false)
    expect(req.payload.find).not.toHaveBeenCalled()
  })

  it('grants admin access to a normal admin user', async () => {
    await expect(
      hasRole(['admin'])({
        req: makeReq({
          id: 456,
          roles: ['admin'],
        }),
      }),
    ).resolves.toBe(true)
  })

  it('grants access to the scoped auto-process actor only with explicit context', async () => {
    await expect(
      hasRole(['admin'])({
        req: makeReq(
          {
            id: 123,
            collection: 'users',
          },
          { isAutoProcess: true },
        ),
      }),
    ).resolves.toBe(true)
  })
})

describe('isAutoProcessActor', () => {
  it('requires the auto-process user and explicit auto-process context', () => {
    expect(isAutoProcessActor(makeReq(123, { isAutoProcess: true }))).toBe(true)
    expect(
      isAutoProcessActor(makeReq({ id: 123, collection: 'users' }, { isAutoProcess: true })),
    ).toBe(true)
    expect(isAutoProcessActor(makeReq(123))).toBe(false)
    expect(isAutoProcessActor(makeReq({ id: 123, roles: ['user'] }))).toBe(false)
  })
})
