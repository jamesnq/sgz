import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getPayload: vi.fn(),
  sendOrderCompletedNotification: vi.fn(),
  sendProductOutOfStockNotification: vi.fn(),
}))

vi.mock('@payload-config', () => ({
  default: {},
}))

vi.mock('payload', () => ({
  getPayload: mocks.getPayload,
}))

vi.mock('@/config', () => ({
  config: {
    AUTO_PROCESS_USER_ID: 123,
  },
}))

vi.mock('@/services/novu.service', () => ({
  sendOrderCompletedNotification: mocks.sendOrderCompletedNotification,
  sendProductOutOfStockNotification: mocks.sendProductOutOfStockNotification,
}))

import { orderProcessingService } from '../orderProcessingService'

const makeFixedStock = () => ({
  root: {
    children: [{ type: 'paragraph', children: [{ type: 'text', text: 'KEY-123' }] }],
    direction: null,
    format: '',
    indent: 0,
    type: 'root',
    version: 1,
  },
})

describe('OrderProcessingService fixed-stock processing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('completes fixed-stock orders using the scoped auto-process actor', async () => {
    const fixedStock = makeFixedStock()
    const updatedOrder = {
      id: 42,
      status: 'COMPLETED',
      quantity: 1,
      deliveryContent: fixedStock,
      productVariant: {
        id: 7,
        status: 'AVAILABLE',
        fixedStock,
      },
    }
    const beginTransaction = vi.fn().mockResolvedValue('tx-1')
    const commitTransaction = vi.fn().mockResolvedValue(undefined)
    const rollbackTransaction = vi.fn().mockResolvedValue(undefined)
    const findByID = vi.fn().mockResolvedValue({
      id: 42,
      status: 'IN_QUEUE',
      quantity: 1,
      productVariant: {
        id: 7,
        status: 'AVAILABLE',
        fixedStock,
      },
    })
    const update = vi.fn().mockResolvedValue({ docs: [updatedOrder] })

    mocks.getPayload.mockResolvedValue({
      db: {
        beginTransaction,
        commitTransaction,
        rollbackTransaction,
      },
      findByID,
      update,
    })

    const result = await orderProcessingService.processOrder(42)

    expect(result).toEqual({
      success: true,
      message: 'Fixed stock delivered successfully',
    })
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'orders',
        where: {
          and: [{ id: { equals: 42 } }, { status: { equals: 'IN_QUEUE' } }],
        },
        user: expect.objectContaining({
          id: 123,
          collection: 'users',
        }),
        req: {
          transactionID: 'tx-1',
          user: expect.objectContaining({
            id: 123,
            collection: 'users',
          }),
        },
        context: { isAutoProcess: true },
        overrideAccess: true,
      }),
    )
    expect(commitTransaction).toHaveBeenCalledWith('tx-1')
    expect(rollbackTransaction).not.toHaveBeenCalled()
    expect(mocks.sendOrderCompletedNotification).toHaveBeenCalledWith(updatedOrder)
    expect(mocks.sendOrderCompletedNotification.mock.invocationCallOrder[0]!).toBeGreaterThan(
      commitTransaction.mock.invocationCallOrder[0]!,
    )
  })

  it('skips completion when the conditional fixed-stock update returns no document', async () => {
    const beginTransaction = vi.fn().mockResolvedValue('tx-1')
    const commitTransaction = vi.fn().mockResolvedValue(undefined)
    const rollbackTransaction = vi.fn().mockResolvedValue(undefined)
    const findByID = vi.fn().mockResolvedValue({
      id: 42,
      status: 'IN_QUEUE',
      quantity: 1,
      productVariant: {
        id: 7,
        status: 'AVAILABLE',
        fixedStock: makeFixedStock(),
      },
    })
    const update = vi.fn().mockResolvedValue({ docs: [] })

    mocks.getPayload.mockResolvedValue({
      db: {
        beginTransaction,
        commitTransaction,
        rollbackTransaction,
      },
      findByID,
      update,
    })

    const result = await orderProcessingService.processOrder(42)

    expect(result).toEqual({
      success: false,
      message: 'Order is no longer IN_QUEUE, auto-processing skipped',
    })
    expect(update).toHaveBeenCalledOnce()
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'orders',
        where: {
          and: [{ id: { equals: 42 } }, { status: { equals: 'IN_QUEUE' } }],
        },
      }),
    )
    expect(commitTransaction).not.toHaveBeenCalled()
    expect(rollbackTransaction).toHaveBeenCalledWith('tx-1')
    expect(mocks.sendOrderCompletedNotification).not.toHaveBeenCalled()
  })

  it('rolls back and reports Payload errors from the completion update', async () => {
    const beginTransaction = vi.fn().mockResolvedValue('tx-1')
    const commitTransaction = vi.fn().mockResolvedValue(undefined)
    const rollbackTransaction = vi.fn().mockResolvedValue(undefined)
    const findByID = vi.fn().mockResolvedValue({
      id: 42,
      status: 'IN_QUEUE',
      quantity: 1,
      productVariant: {
        id: 7,
        status: 'AVAILABLE',
        fixedStock: makeFixedStock(),
      },
    })
    const update = vi.fn().mockResolvedValue({
      docs: [],
      errors: [{ id: 42, message: 'after() callback is unavailable' }],
    })

    mocks.getPayload.mockResolvedValue({
      db: {
        beginTransaction,
        commitTransaction,
        rollbackTransaction,
      },
      findByID,
      update,
    })

    const result = await orderProcessingService.processOrder(42)

    expect(result).toEqual({
      success: false,
      message: 'Failed to process order: Order completion update failed: after() callback is unavailable',
    })
    expect(commitTransaction).not.toHaveBeenCalled()
    expect(rollbackTransaction).toHaveBeenCalledWith('tx-1')
    expect(mocks.sendOrderCompletedNotification).not.toHaveBeenCalled()
  })

  it('notifies direct auto-process orders only after commit', async () => {
    const updatedOrder = {
      id: 42,
      status: 'COMPLETED',
      quantity: 1,
      productVariant: {
        id: 7,
        status: 'AVAILABLE',
        autoProcess: 'direct',
      },
    }
    const beginTransaction = vi.fn().mockResolvedValue('tx-1')
    const commitTransaction = vi.fn().mockResolvedValue(undefined)
    const rollbackTransaction = vi.fn().mockResolvedValue(undefined)
    const findByID = vi.fn().mockResolvedValue({
      id: 42,
      status: 'IN_QUEUE',
      quantity: 1,
      productVariant: {
        id: 7,
        status: 'AVAILABLE',
        autoProcess: 'direct',
      },
    })
    const update = vi.fn().mockResolvedValue({ docs: [updatedOrder] })

    mocks.getPayload.mockResolvedValue({
      db: {
        beginTransaction,
        commitTransaction,
        rollbackTransaction,
      },
      findByID,
      update,
    })

    const result = await orderProcessingService.processOrder(42)

    expect(result).toEqual({
      success: true,
      message: 'Order completed directly',
    })
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'orders',
        where: {
          and: [{ id: { equals: 42 } }, { status: { equals: 'IN_QUEUE' } }],
        },
        data: {
          status: 'COMPLETED',
        },
      }),
    )
    expect(commitTransaction).toHaveBeenCalledWith('tx-1')
    expect(rollbackTransaction).not.toHaveBeenCalled()
    expect(mocks.sendOrderCompletedNotification).toHaveBeenCalledWith(updatedOrder)
    expect(mocks.sendOrderCompletedNotification.mock.invocationCallOrder[0]!).toBeGreaterThan(
      commitTransaction.mock.invocationCallOrder[0]!,
    )
  })

  it('notifies key auto-process orders only after commit', async () => {
    const stocks = [
      { id: 1, data: { code: 'A' } },
      { id: 2, data: { code: 'B' } },
    ]
    const updatedOrder = {
      id: 42,
      status: 'COMPLETED',
      quantity: 2,
      productVariant: {
        id: 7,
        name: 'Key Product',
        status: 'AVAILABLE',
        autoProcess: 'key',
      },
    }
    const beginTransaction = vi.fn().mockResolvedValue('tx-1')
    const commitTransaction = vi.fn().mockResolvedValue(undefined)
    const rollbackTransaction = vi.fn().mockResolvedValue(undefined)
    const findByID = vi.fn().mockResolvedValue({
      id: 42,
      status: 'IN_QUEUE',
      quantity: 2,
      productVariant: {
        id: 7,
        name: 'Key Product',
        status: 'AVAILABLE',
        autoProcess: 'key',
      },
    })
    const find = vi.fn().mockResolvedValue({ docs: stocks })
    const count = vi.fn().mockResolvedValue({ totalDocs: 0 })
    const update = vi
      .fn()
      .mockResolvedValueOnce({ docs: [] })
      .mockResolvedValueOnce({ docs: [] })
      .mockResolvedValueOnce({ docs: [updatedOrder] })

    mocks.getPayload.mockResolvedValue({
      db: {
        beginTransaction,
        commitTransaction,
        rollbackTransaction,
      },
      count,
      find,
      findByID,
      update,
    })

    const result = await orderProcessingService.processOrder(42)

    expect(result).toEqual({
      success: true,
      message: 'Stocks processed successfully',
    })
    expect(update).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        collection: 'orders',
        where: {
          and: [{ id: { equals: 42 } }, { status: { equals: 'IN_QUEUE' } }],
        },
        data: expect.objectContaining({
          status: 'COMPLETED',
          deliveryContent: expect.any(Object),
        }),
      }),
    )
    expect(commitTransaction).toHaveBeenCalledWith('tx-1')
    expect(rollbackTransaction).not.toHaveBeenCalled()
    expect(mocks.sendOrderCompletedNotification).toHaveBeenCalledWith(updatedOrder)
    expect(mocks.sendOrderCompletedNotification.mock.invocationCallOrder[0]!).toBeGreaterThan(
      commitTransaction.mock.invocationCallOrder[0]!,
    )
  })

  it('rolls back key auto-process side effects when completion loses the IN_QUEUE race', async () => {
    const beginTransaction = vi.fn().mockResolvedValue('tx-1')
    const commitTransaction = vi.fn().mockResolvedValue(undefined)
    const rollbackTransaction = vi.fn().mockResolvedValue(undefined)
    const findByID = vi.fn().mockResolvedValue({
      id: 42,
      status: 'IN_QUEUE',
      quantity: 1,
      productVariant: {
        id: 7,
        name: 'Key Product',
        status: 'AVAILABLE',
        autoProcess: 'key',
      },
    })
    const find = vi.fn().mockResolvedValue({ docs: [{ id: 1, data: { code: 'A' } }] })
    const count = vi.fn().mockResolvedValue({ totalDocs: 0 })
    const update = vi
      .fn()
      .mockResolvedValueOnce({ docs: [] })
      .mockResolvedValueOnce({ docs: [] })
      .mockResolvedValueOnce({ docs: [] })

    mocks.getPayload.mockResolvedValue({
      db: {
        beginTransaction,
        commitTransaction,
        rollbackTransaction,
      },
      count,
      find,
      findByID,
      update,
    })

    const result = await orderProcessingService.processOrder(42)

    expect(result).toEqual({
      success: false,
      message: 'Order is no longer IN_QUEUE, auto-processing skipped',
    })
    expect(commitTransaction).not.toHaveBeenCalled()
    expect(rollbackTransaction).toHaveBeenCalledWith('tx-1')
    expect(mocks.sendOrderCompletedNotification).not.toHaveBeenCalled()
  })
})
