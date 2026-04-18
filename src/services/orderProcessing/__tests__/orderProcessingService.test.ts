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

describe('OrderProcessingService fixed-stock processing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fails when the completed order update returns no document', async () => {
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
        fixedStock: {
          root: {
            children: [{ type: 'paragraph', children: [{ type: 'text', text: 'KEY-123' }] }],
            direction: null,
            format: '',
            indent: 0,
            type: 'root',
            version: 1,
          },
        },
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

    expect(result.success).toBe(false)
    expect(result.message).toContain('Order completion update returned no document')
    expect(update).toHaveBeenCalledOnce()
    expect(commitTransaction).not.toHaveBeenCalled()
    expect(rollbackTransaction).toHaveBeenCalledWith('tx-1')
    expect(mocks.sendOrderCompletedNotification).not.toHaveBeenCalled()
  })
})
