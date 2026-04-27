import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => {
  const payos = {
    confirmWebhook: vi.fn(),
    createPaymentLink: vi.fn(),
    verifyPaymentWebhookData: vi.fn(),
  }

  return {
    after: vi.fn(),
    discordWebhook: vi.fn(),
    getPayload: vi.fn(),
    payos,
    PayOS: vi.fn(function PayOS() {
      return payos
    }),
  }
})

vi.mock('@payload-config', () => ({
  default: {},
}))

vi.mock('@payos/node', () => ({
  default: mocks.PayOS,
}))

vi.mock('payload', () => ({
  getPayload: mocks.getPayload,
}))

vi.mock('next/server', () => ({
  after: mocks.after,
}))

vi.mock('@/config', () => ({
  config: {
    PAYOS_API_KEY: 'api-key',
    PAYOS_CANCEL_URL: 'https://example.com/cancel',
    PAYOS_CHECKSUM_KEY: 'checksum-key',
    PAYOS_CLIENT_KEY: 'client-key',
    PAYOS_RETURN_URL: 'https://example.com/return',
    PAYOS_WEBHOOK_URL: 'https://example.com/webhook',
  },
}))

vi.mock('@/services/novu.service', () => ({
  discordWebhook: mocks.discordWebhook,
}))

import { PaymentService } from '@/services/payment.service'

const makePayosResponse = (orderCode: number) => ({
  accountName: 'SGZ',
  accountNumber: '123456789',
  amount: 50000,
  bin: '970422',
  checkoutUrl: `https://payos.test/${orderCode}`,
  currency: 'VND',
  description: 'SGZ',
  orderCode,
  paymentLinkId: `link-${orderCode}`,
  qrCode: `qr-${orderCode}`,
  status: 'PENDING',
})

const makePayload = () => ({
  create: vi.fn(),
  db: {
    drizzle: {
      transaction: vi.fn(),
    },
  },
  find: vi.fn(),
  logger: {
    error: vi.fn(),
  },
  update: vi.fn(),
})

const makeDuplicateOrderCodeError = () =>
  Object.assign(new Error('duplicate key value violates unique constraint "orderCode_gateway_idx"'), {
    code: '23505',
    constraint: 'orderCode_gateway_idx',
    detail: 'Key (order_code, gateway) already exists.',
  })

const makeLockedSelect = (rows: unknown[]) => {
  const forUpdate = vi.fn().mockResolvedValue(rows)
  const where = vi.fn(() => ({ for: forUpdate }))
  const from = vi.fn(() => ({ where }))
  const select = vi.fn(() => ({ from }))

  return { select }
}

const makePayosWebhookData = () => ({
  accountNumber: '123456789',
  amount: 50000,
  code: '00',
  currency: 'VND',
  desc: 'success',
  description: 'SGZ',
  orderCode: 1000,
  paymentLinkId: 'link-1000',
  reference: 'ref-1000',
  transactionDateTime: '2026-04-27 12:00:00',
})

describe('PaymentService PayOS recharge creation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('reserves a local recharge before calling PayOS and stores the provider response', async () => {
    const payload = makePayload()
    const service = new PaymentService()
    const payosResponse = makePayosResponse(1000)

    vi.spyOn(Math, 'random').mockReturnValue(0)
    payload.create.mockResolvedValue({
      id: 9,
      data: {
        creationAttempt: {
          orderCode: 1000,
          provider: 'PAYOS',
          status: 'RESERVED',
        },
      },
    })
    payload.update.mockResolvedValue({ docs: [{ id: 9 }] })
    mocks.getPayload.mockResolvedValue(payload)
    mocks.payos.createPaymentLink.mockResolvedValue(payosResponse)

    const result = await service.createPaymentLink({
      amount: 50000,
      currency: 'VND',
      userId: 12,
    })

    expect(result).toEqual(payosResponse)
    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'recharges',
        data: expect.objectContaining({
          amount: 50000,
          gateway: 'PAYOS',
          orderCode: '1000',
          status: 'PENDING',
          user: 12,
        }),
        overrideAccess: true,
      }),
    )
    expect(payload.create.mock.invocationCallOrder[0]!).toBeLessThan(
      mocks.payos.createPaymentLink.mock.invocationCallOrder[0]!,
    )
    expect(mocks.payos.createPaymentLink).toHaveBeenCalledWith({
      amount: 50000,
      cancelUrl: 'https://example.com/cancel',
      description: 'SGZ',
      orderCode: 1000,
      returnUrl: 'https://example.com/return',
    })
    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'recharges',
        data: {
          data: expect.objectContaining({
            creationAttempt: {
              orderCode: 1000,
              provider: 'PAYOS',
              status: 'LINK_CREATED',
            },
            payos: payosResponse,
          }),
        },
        where: { id: { equals: 9 } },
      }),
    )
  })

  it('retries local orderCode collisions before calling PayOS', async () => {
    const payload = makePayload()
    const service = new PaymentService()

    vi.spyOn(Math, 'random').mockReturnValueOnce(0).mockReturnValueOnce(0.5)
    payload.create
      .mockRejectedValueOnce(makeDuplicateOrderCodeError())
      .mockResolvedValueOnce({ id: 10, data: {} })
    payload.update.mockResolvedValue({ docs: [{ id: 10 }] })
    mocks.getPayload.mockResolvedValue(payload)
    mocks.payos.createPaymentLink.mockImplementation(async ({ orderCode }) =>
      makePayosResponse(orderCode),
    )

    const result = await service.createPaymentLink({
      amount: 50000,
      currency: 'VND',
      userId: 12,
    })

    expect(payload.create).toHaveBeenCalledTimes(2)
    expect(mocks.payos.createPaymentLink).toHaveBeenCalledTimes(1)
    expect(mocks.payos.createPaymentLink.mock.calls[0]![0].orderCode).not.toBe(1000)
    expect(result?.orderCode).toBe(mocks.payos.createPaymentLink.mock.calls[0]![0].orderCode)
  })

  it('marks the reserved recharge as cancelled when PayOS link creation fails', async () => {
    const payload = makePayload()
    const service = new PaymentService()

    vi.spyOn(Math, 'random').mockReturnValue(0)
    payload.create.mockResolvedValue({
      id: 9,
      data: {
        creationAttempt: {
          orderCode: 1000,
          provider: 'PAYOS',
          status: 'RESERVED',
        },
      },
    })
    payload.update.mockResolvedValue({ docs: [{ id: 9 }] })
    mocks.getPayload.mockResolvedValue(payload)
    mocks.payos.createPaymentLink.mockRejectedValue(new Error('network timeout'))

    await expect(
      service.createPaymentLink({
        amount: 50000,
        currency: 'VND',
        userId: 12,
      }),
    ).rejects.toThrow('Failed to create payment link: network timeout')

    expect(payload.create).toHaveBeenCalledTimes(1)
    expect(mocks.payos.createPaymentLink).toHaveBeenCalledTimes(1)
    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'recharges',
        data: {
          data: expect.objectContaining({
            creationAttempt: {
              orderCode: 1000,
              provider: 'PAYOS',
              status: 'FAILED',
            },
            error: expect.objectContaining({
              message: 'network timeout',
            }),
          }),
          status: 'CANCEL',
        },
        where: { id: { equals: 9 } },
      }),
    )
  })
})

describe('PaymentService PayOS webhook idempotency', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.after.mockImplementation(() => undefined)
  })

  it('credits balance only once when the same successful webhook is delivered twice', async () => {
    const payload = makePayload()
    const service = new PaymentService()
    const recharge = {
      id: 9,
      orderCode: '1000',
      status: 'PENDING',
      user: 12,
    }
    const payosWebhookData = makePayosWebhookData()
    const pendingSelect = makeLockedSelect([{ id: 9, status: 'PENDING', data: {} }])
    const successSelect = makeLockedSelect([{ id: 9, status: 'SUCCESS', data: {} }])
    const firstTx = {
      insert: vi.fn(() => ({ values: vi.fn().mockResolvedValue(undefined) })),
      select: pendingSelect.select,
      update: vi
        .fn()
        .mockReturnValueOnce({
          set: vi.fn(() => ({ where: vi.fn().mockResolvedValue(undefined) })),
        })
        .mockReturnValueOnce({
          set: vi.fn(() => ({
            where: vi.fn(() => ({
              returning: vi.fn().mockResolvedValue([{ balance: 150000, email: 'user@example.com' }]),
            })),
          })),
        }),
    }
    const secondTx = {
      insert: vi.fn(),
      select: successSelect.select,
      update: vi.fn(),
    }

    payload.find.mockResolvedValue({ docs: [recharge] })
    payload.db.drizzle.transaction
      .mockImplementationOnce(async (callback) => callback(firstTx))
      .mockImplementationOnce(async (callback) => callback(secondTx))
    mocks.getPayload.mockResolvedValue(payload)
    mocks.payos.verifyPaymentWebhookData.mockReturnValue(payosWebhookData)

    await expect(service.webhookHandle({})).resolves.toBe('ok')
    await expect(service.webhookHandle({})).resolves.toBe('ok')

    expect(firstTx.update).toHaveBeenCalledTimes(2)
    expect(firstTx.insert).toHaveBeenCalledTimes(1)
    expect(secondTx.update).not.toHaveBeenCalled()
    expect(secondTx.insert).not.toHaveBeenCalled()
    expect(mocks.after).toHaveBeenCalledTimes(1)
  })
})
