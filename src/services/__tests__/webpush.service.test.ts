import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  find: vi.fn(),
  delete: vi.fn(),
  sendNotification: vi.fn(),
  getPayload: vi.fn(),
}))

vi.mock('@payload-config', () => ({ default: {} }))
vi.mock('payload', () => ({ getPayload: mocks.getPayload }))
vi.mock('web-push', () => ({
  default: {
    setVapidDetails: vi.fn(),
    sendNotification: mocks.sendNotification,
  },
}))
vi.mock('@/config', () => ({
  config: {
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: 'test-public-key',
    VAPID_PRIVATE_KEY: 'test-private-key',
    VAPID_SUBJECT: 'mailto:admin@example.com',
  },
}))

import { sendWebPushToUser } from '../webpush.service'

describe('WebPushService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getPayload.mockResolvedValue({
      find: mocks.find,
      delete: mocks.delete,
    })
  })

  it('sends push notifications to all active subscriptions of a user', async () => {
    mocks.find.mockResolvedValueOnce({
      docs: [
        {
          id: 1,
          endpoint: 'https://push.example.com/sub-1',
          p256dh: 'p256dh-key-1',
          auth: 'auth-secret-1',
        },
        {
          id: 2,
          endpoint: 'https://push.example.com/sub-2',
          p256dh: 'p256dh-key-2',
          auth: 'auth-secret-2',
        },
      ],
    })

    mocks.sendNotification.mockResolvedValue({ statusCode: 201 })

    await sendWebPushToUser(123, {
      title: 'Đơn hàng hoàn tất',
      body: 'Đơn hàng #42 đã hoàn tất!',
      url: '/user/orders/42',
    })

    expect(mocks.find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'push-subscriptions',
        where: { user: { equals: 123 } },
      }),
    )

    expect(mocks.sendNotification).toHaveBeenCalledTimes(2)
    expect(mocks.sendNotification).toHaveBeenCalledWith(
      {
        endpoint: 'https://push.example.com/sub-1',
        keys: { p256dh: 'p256dh-key-1', auth: 'auth-secret-1' },
      },
      expect.stringContaining('Đơn hàng hoàn tất'),
    )
    expect(mocks.delete).not.toHaveBeenCalled()
  })

  it('cleans up 410 Gone subscriptions automatically', async () => {
    mocks.find.mockResolvedValueOnce({
      docs: [
        {
          id: 10,
          endpoint: 'https://push.example.com/sub-dead',
          p256dh: 'dead-p256dh',
          auth: 'dead-auth',
        },
      ],
    })

    const error410 = new Error('Subscription expired')
    ;(error410 as any).statusCode = 410
    mocks.sendNotification.mockRejectedValueOnce(error410)
    mocks.delete.mockResolvedValueOnce({})

    await sendWebPushToUser(456, {
      title: 'Thông báo',
      body: 'Kiểm tra',
    })

    expect(mocks.delete).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'push-subscriptions',
        id: 10,
      }),
    )
  })

  it('skips gracefully if user has no subscriptions', async () => {
    mocks.find.mockResolvedValueOnce({ docs: [] })

    await sendWebPushToUser(789, {
      title: 'Không có thiết bị',
      body: 'Nội dung',
    })

    expect(mocks.sendNotification).not.toHaveBeenCalled()
    expect(mocks.delete).not.toHaveBeenCalled()
  })
})
