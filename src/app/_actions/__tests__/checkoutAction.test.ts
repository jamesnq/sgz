import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  after: vi.fn(),
  autoProcessOrder: vi.fn(),
  calculateVoucherDiscount: vi.fn(),
  checkRateLimit: vi.fn(),
  discordWebhook: vi.fn(),
  getPayload: vi.fn(),
  sendNewOrderStaffNotification: vi.fn(),
  validateVoucher: vi.fn(),
  validateVoucherScope: vi.fn(),
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

vi.mock('@/services/orderProcessing', () => ({
  autoProcessOrder: mocks.autoProcessOrder,
}))

vi.mock('@/services/novu.service', () => ({
  discordWebhook: mocks.discordWebhook,
  sendNewOrderStaffNotification: mocks.sendNewOrderStaffNotification,
}))

vi.mock('@/utilities/rateLimit', () => ({
  RATE_LIMITS: {
    checkout: {
      limit: 1,
      windowMs: 1000,
    },
  },
  checkRateLimit: mocks.checkRateLimit,
}))

vi.mock('@/utilities/voucher', () => ({
  calculateVoucherDiscount: mocks.calculateVoucherDiscount,
  validateVoucher: mocks.validateVoucher,
  validateVoucherScope: mocks.validateVoucherScope,
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

import { checkoutWithUser } from '@/app/_actions/checkoutAction'
import {
  form_submissions,
  orders,
  product_variant_supplies,
  transactions,
  users,
  vouchers,
} from '@/payload-generated-schema'

type TxState = {
  committedFormSubmissions: unknown[]
  committedOrders: unknown[]
  committedTransactions: unknown[]
  committedVoucherUpdates: unknown[]
}

const checkoutUser = { id: 12, email: 'user@example.com' }

const checkoutInput = {
  productVariantId: 7,
  quantity: 1,
  shippingFields: {
    account: 'player-one',
    unknown: 'strip-me',
  },
}

const makeProductVariant = () => ({
  id: 7,
  defaultSupplier: null,
  form: {
    id: 3,
    fields: [{ name: 'account', blockType: 'text' }],
    title: 'Checkout form',
  },
  max: null,
  min: null,
  name: 'Steam Wallet',
  originalPrice: 1200,
  price: 1000,
  product: 11,
  status: 'AVAILABLE',
})

const makeInsertReturning = <T,>(value: T) => ({
  returning: vi.fn().mockResolvedValue([value]),
})

const makeTxHarness = ({
  lockedVoucherRows = [],
  userBalance = 100000,
}: {
  lockedVoucherRows?: unknown[]
  userBalance?: number
} = {}) => {
  const state: TxState = {
    committedFormSubmissions: [],
    committedOrders: [],
    committedTransactions: [],
    committedVoucherUpdates: [],
  }

  const transaction = vi.fn(async (callback) => {
    const pending = {
      formSubmissions: [] as unknown[],
      orders: [] as unknown[],
      transactions: [] as unknown[],
      voucherUpdates: [] as unknown[],
    }

    const tx = {
      insert: vi.fn((table) => ({
        values: vi.fn((values) => {
          if (table === form_submissions) {
            pending.formSubmissions.push({ id: 501, ...values })
            return makeInsertReturning({ id: 501 })
          }
          if (table === orders) {
            pending.orders.push({ id: 777, ...values })
            return makeInsertReturning({ id: 777, quantity: values.quantity })
          }
          if (table === transactions) {
            pending.transactions.push(values)
            return Promise.resolve()
          }
          throw new Error('Unexpected insert table')
        }),
      })),
      select: vi.fn(() => ({
        from: vi.fn((table) => {
          if (table === vouchers) {
            return {
              where: vi.fn(() => ({
                for: vi.fn().mockResolvedValue(lockedVoucherRows),
              })),
            }
          }
          if (table === product_variant_supplies) {
            return {
              where: vi.fn(() => ({
                limit: vi.fn().mockResolvedValue([]),
              })),
            }
          }
          throw new Error('Unexpected select table')
        }),
      })),
      update: vi.fn((table) => ({
        set: vi.fn((values) => {
          if (table === users) {
            return {
              where: vi.fn(() => ({
                returning: vi.fn().mockResolvedValue([{ balance: userBalance }]),
              })),
            }
          }
          if (table === vouchers) {
            return {
              where: vi.fn().mockImplementation(async () => {
                pending.voucherUpdates.push(values)
              }),
            }
          }
          throw new Error('Unexpected update table')
        }),
      })),
    }

    const result = await callback(tx)
    state.committedFormSubmissions.push(...pending.formSubmissions)
    state.committedOrders.push(...pending.orders)
    state.committedTransactions.push(...pending.transactions)
    state.committedVoucherUpdates.push(...pending.voucherUpdates)
    return result
  })

  return {
    db: {
      transaction,
      update: vi.fn(),
    },
    state,
  }
}

const makePayload = (db: ReturnType<typeof makeTxHarness>['db']) => ({
  create: vi.fn(),
  db: {
    drizzle: db,
  },
  find: vi.fn(),
  findByID: vi.fn(),
  logger: {
    error: vi.fn(),
  },
})

describe('checkoutWithUser form submission transactionality', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.after.mockImplementation(() => undefined)
    mocks.autoProcessOrder.mockResolvedValue({ success: false })
    mocks.calculateVoucherDiscount.mockReturnValue(0)
    mocks.checkRateLimit.mockReturnValue({ allowed: true })
  })

  it('does not create a form submission before voucher validation succeeds', async () => {
    const harness = makeTxHarness({ lockedVoucherRows: [] })
    const payload = makePayload(harness.db)
    payload.findByID.mockResolvedValue(makeProductVariant())
    mocks.getPayload.mockResolvedValue(payload)

    await expect(
      checkoutWithUser({
        parsedInput: {
          ...checkoutInput,
          voucherCode: 'BADCODE',
        },
        user: checkoutUser,
      }),
    ).rejects.toThrow()

    expect(payload.create).not.toHaveBeenCalled()
    expect(harness.state.committedFormSubmissions).toEqual([])
    expect(harness.state.committedOrders).toEqual([])
    expect(harness.state.committedTransactions).toEqual([])
  })

  it('rolls back the transaction-scoped form submission when balance is insufficient', async () => {
    const harness = makeTxHarness({ userBalance: -1 })
    const payload = makePayload(harness.db)
    payload.findByID.mockResolvedValue(makeProductVariant())
    mocks.getPayload.mockResolvedValue(payload)

    await expect(
      checkoutWithUser({
        parsedInput: checkoutInput,
        user: checkoutUser,
      }),
    ).rejects.toThrow()

    expect(payload.create).not.toHaveBeenCalled()
    expect(harness.state.committedFormSubmissions).toEqual([])
    expect(harness.state.committedOrders).toEqual([])
    expect(harness.state.committedTransactions).toEqual([])
  })

  it('commits one normalized form submission and links it to the created order', async () => {
    const harness = makeTxHarness()
    const payload = makePayload(harness.db)
    payload.findByID.mockResolvedValue(makeProductVariant())
    mocks.getPayload.mockResolvedValue(payload)

    const result = await checkoutWithUser({
      parsedInput: checkoutInput,
      user: checkoutUser,
    })

    expect(result.order).toEqual(
      expect.objectContaining({
        id: 777,
        productVariant: expect.objectContaining({ id: 7 }),
      }),
    )
    expect(payload.create).not.toHaveBeenCalled()
    expect(harness.state.committedFormSubmissions).toEqual([
      expect.objectContaining({
        form: 3,
        id: 501,
        submissionData: { account: 'player-one' },
        user: 12,
      }),
    ])
    expect(harness.state.committedOrders).toEqual([
      expect.objectContaining({
        formSubmission: 501,
        id: 777,
        orderedBy: 12,
        productVariant: 7,
      }),
    ])
    expect(harness.state.committedTransactions).toHaveLength(1)
    expect(mocks.sendNewOrderStaffNotification).toHaveBeenCalledWith(
      expect.objectContaining({ id: 777 }),
    )
  })
})
