import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  beginTransaction: vi.fn(),
  commitTransaction: vi.fn(),
  rollbackTransaction: vi.fn(),
  findByID: vi.fn(),
  update: vi.fn(),
  getPayload: vi.fn(),
  sendOrderCompletedNotification: vi.fn(),
}))

vi.mock('@payload-config', () => ({ default: {} }))
vi.mock('payload', () => ({ getPayload: mocks.getPayload }))
vi.mock('@/config', () => ({
  config: {
    AUTO_PROCESS_USER_ID: 1,
  },
}))
vi.mock('@/services/novu.service', () => ({
  sendOrderCompletedNotification: mocks.sendOrderCompletedNotification,
  sendProductOutOfStockNotification: vi.fn(),
}))

import { orderProcessingService } from '@/services/orderProcessing/orderProcessingService'

function makeFixedStock() {
  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      children: [
        {
          type: 'paragraph',
          format: '',
          indent: 0,
          version: 1,
          children: [
            {
              type: 'text',
              text: 'STEAM-CODE-123',
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              version: 1,
            },
          ],
          direction: 'ltr',
          textFormat: 0,
          textStyle: '',
        },
      ],
      direction: 'ltr',
    },
  }
}

describe('orderProcessingService fixed stock processing', () => {
  beforeEach(() => {
    vi.resetAllMocks()

    mocks.beginTransaction.mockResolvedValue('tx-1')
    mocks.commitTransaction.mockResolvedValue(undefined)
    mocks.rollbackTransaction.mockResolvedValue(undefined)

    mocks.getPayload.mockResolvedValue({
      db: {
        beginTransaction: mocks.beginTransaction,
        commitTransaction: mocks.commitTransaction,
        rollbackTransaction: mocks.rollbackTransaction,
      },
      findByID: mocks.findByID,
      update: mocks.update,
    })
  })

  it('completes an IN_QUEUE order with AVAILABLE fixed stock and notifies using the updated order', async () => {
    const fixedStock = makeFixedStock()
    const initialOrder = {
      id: 42,
      status: 'IN_QUEUE',
      quantity: 1,
      productVariant: {
        id: 7,
        name: 'Steam Wallet',
        status: 'AVAILABLE',
        fixedStock,
      },
    }
    const updatedOrder = {
      ...initialOrder,
      status: 'COMPLETED',
      deliveryContent: fixedStock,
    }

    mocks.findByID.mockResolvedValueOnce(initialOrder)
    mocks.update.mockResolvedValueOnce({ docs: [updatedOrder] })

    const result = await orderProcessingService.processOrder(42)

    expect(result).toEqual({
      success: true,
      message: 'Fixed stock delivered successfully',
    })
    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'orders',
        where: {
          and: [{ id: { equals: 42 } }, { status: { equals: 'IN_QUEUE' } }],
        },
        data: {
          deliveryContent: fixedStock,
          status: 'COMPLETED',
        },
        user: expect.objectContaining({
          id: 1,
          collection: 'users',
        }),
        req: {
          transactionID: 'tx-1',
          user: expect.objectContaining({
            id: 1,
            collection: 'users',
          }),
        },
        context: { isAutoProcess: true },
        overrideAccess: true,
      }),
    )
    expect(mocks.findByID).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        collection: 'orders',
        id: 42,
        user: expect.objectContaining({
          id: 1,
          collection: 'users',
        }),
        req: {
          transactionID: 'tx-1',
          user: expect.objectContaining({
            id: 1,
            collection: 'users',
          }),
        },
      }),
    )
    expect(mocks.sendOrderCompletedNotification).toHaveBeenCalledWith(updatedOrder)
    expect(mocks.commitTransaction).toHaveBeenCalledWith('tx-1')
    expect(mocks.sendOrderCompletedNotification.mock.invocationCallOrder[0]!).toBeGreaterThan(
      mocks.commitTransaction.mock.invocationCallOrder[0]!,
    )
    expect(mocks.rollbackTransaction).not.toHaveBeenCalled()
  })

  it('fails when the order is no longer IN_QUEUE', async () => {
    mocks.findByID.mockResolvedValueOnce({
      id: 42,
      status: 'COMPLETED',
      quantity: 1,
      productVariant: {
        id: 7,
        name: 'Steam Wallet',
        status: 'AVAILABLE',
        fixedStock: makeFixedStock(),
      },
    })

    const result = await orderProcessingService.processOrder(42)

    expect(result).toEqual({
      success: false,
      message: 'Order status is COMPLETED, only IN_QUEUE orders can be auto-processed',
    })
    expect(mocks.update).not.toHaveBeenCalled()
    expect(mocks.commitTransaction).not.toHaveBeenCalled()
    expect(mocks.rollbackTransaction).toHaveBeenCalledWith('tx-1')
  })

  it('fails when fixed stock is missing and no product metadata processor can be selected', async () => {
    mocks.findByID.mockResolvedValueOnce({
      id: 42,
      status: 'IN_QUEUE',
      quantity: 1,
      productVariant: {
        id: 7,
        name: 'Steam Wallet',
        status: 'AVAILABLE',
        fixedStock: null,
        metadata: {},
      },
    })

    const result = await orderProcessingService.processOrder(42)

    expect(result).toEqual({
      success: false,
      message: 'Invalid metadata: missing or invalid type field',
    })
    expect(mocks.update).not.toHaveBeenCalled()
    expect(mocks.commitTransaction).not.toHaveBeenCalled()
    expect(mocks.rollbackTransaction).toHaveBeenCalledWith('tx-1')
  })
})
