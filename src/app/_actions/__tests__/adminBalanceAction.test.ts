import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  after: vi.fn(),
  checkRateLimit: vi.fn(),
  discordWebhook: vi.fn(),
  getPayload: vi.fn(),
}))

vi.mock('@payload-config', () => ({
  default: {},
}))

vi.mock('payload', () => ({
  getPayload: mocks.getPayload,
}))

vi.mock('next/server', () => ({
  after: mocks.after,
}))

vi.mock('@/config', () => ({
  config: {
    NEXT_PUBLIC_SITE_NAME: 'SGZ',
  },
}))

vi.mock('@/services/novu.service', () => ({
  discordWebhook: mocks.discordWebhook,
}))

vi.mock('@/utilities/rateLimit', () => ({
  RATE_LIMITS: {
    adminBalance: {
      limit: 1,
      windowMs: 1000,
    },
  },
  checkRateLimit: mocks.checkRateLimit,
}))

vi.mock('@/utilities/safe-action', () => {
  class ServerNotification extends Error {
    notify = { type: 'toast' }
    readonly __isServerNotification = true
  }

  return {
    ServerNotification,
    authActionClient: {
      schema: vi.fn(() => ({
        action: vi.fn((handler) => handler),
      })),
    },
  }
})

import { adminBalanceWithUser } from '@/app/_actions/adminBalanceAction'

const adminUser = {
  id: 1,
  email: 'admin@example.com',
  roles: ['admin'],
} as const

const makePayload = (newBalance: number | null) => {
  const insertedTransactions: unknown[] = []
  const tx = {
    insert: vi.fn(() => ({
      values: vi.fn(async (values) => {
        insertedTransactions.push(values)
      }),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn().mockResolvedValue(
            newBalance === null ? [] : [{ balance: newBalance, email: 'user@example.com' }],
          ),
        })),
      })),
    })),
  }

  return {
    insertedTransactions,
    payload: {
      db: {
        drizzle: {
          transaction: vi.fn((callback) => callback(tx)),
        },
      },
    },
    tx,
  }
}

describe('adminBalanceWithUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.after.mockImplementation(() => undefined)
    mocks.checkRateLimit.mockReturnValue({ allowed: true })
  })

  it('allows subtracting a user balance down to exactly zero', async () => {
    const { insertedTransactions, payload, tx } = makePayload(0)
    mocks.getPayload.mockResolvedValue(payload)

    const result = await adminBalanceWithUser({
      parsedInput: {
        amount: -100,
        note: 'manual correction',
        userId: 12,
      },
      user: adminUser as any,
    })

    expect(result).toEqual({ balance: 0 })
    expect(tx.update).toHaveBeenCalledOnce()
    expect(insertedTransactions).toEqual([
      expect.objectContaining({
        amount: -100,
        balance: 0,
        user: 12,
      }),
    ])
    expect(mocks.after).toHaveBeenCalledOnce()
  })
})
