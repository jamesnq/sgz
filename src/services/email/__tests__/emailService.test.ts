import { describe, expect, it, vi } from 'vitest'
import { EmailDeliveryError, createResilientEmailService } from '../service'
import { createOrderCompleteDeliveryEmail, createPromotionalDealsEmail } from '../templates'

describe('email templates', () => {
  it('renders order complete delivery email content', () => {
    const message = createOrderCompleteDeliveryEmail({
      customerName: 'James',
      email: 'james@example.com',
      orderId: 42,
      productName: 'Steam Wallet 100K',
      quantity: 1,
      deliveryLines: ['CODE-123'],
      orderUrl: 'https://subgamezone.com/user/orders/42',
    })

    expect(message.category).toBe('transactional')
    expect(message.subject).toContain('#42')
    expect(message.html).toContain('Steam Wallet 100K')
    expect(message.html).toContain('CODE-123')
    expect(message.text).toContain('https://subgamezone.com/user/orders/42')
  })

  it('renders promotional deals email content', () => {
    const message = createPromotionalDealsEmail({
      email: 'james@example.com',
      subject: 'Ưu đãi mới tại SubGameZone',
      previewText: 'Top deals this week',
      title: 'Ưu đãi mới dành cho bạn',
      intro: 'Tuần này SubGameZone có một số deal đáng chú ý:',
      deals: [
        {
          title: 'Weekend Sale',
          description: 'Discount on top-up products',
          ctaLabel: 'Shop now',
          ctaUrl: 'https://subgamezone.com/deals/weekend-sale',
        },
      ],
      unsubscribeUrl: 'https://subgamezone.com/unsubscribe',
    })

    expect(message.category).toBe('promotional')
    expect(message.subject).toBe('Ưu đãi mới tại SubGameZone')
    expect(message.html).toContain('Weekend Sale')
    expect(message.text).toContain('https://subgamezone.com/unsubscribe')
  })

  it('renders promotional deals email using admin-provided content', () => {
    const message = createPromotionalDealsEmail({
      email: 'james@example.com',
      subject: 'Flash Sale 24h',
      previewText: 'Giảm giá nạp game trong 24 giờ',
      title: 'Flash Sale cuối tuần',
      intro: 'Ưu đãi nổi bật dành cho bạn hôm nay.',
      deals: [
        {
          title: 'Steam Wallet 100K',
          description: 'Giảm trực tiếp 10%',
          ctaLabel: 'Mua ngay',
          ctaUrl: 'https://subgamezone.com/products/steam-wallet-100k',
        },
      ],
      unsubscribeUrl: 'https://subgamezone.com/unsubscribe',
    })

    expect(message.subject).toBe('Flash Sale 24h')
    expect(message.html).toContain('Flash Sale cuối tuần')
    expect(message.html).toContain('Ưu đãi nổi bật dành cho bạn hôm nay.')
    expect(message.text).toContain('Mua ngay: https://subgamezone.com/products/steam-wallet-100k')
  })
})

describe('resilient email service', () => {
  it('queues retry payload when provider delivery fails', async () => {
    const send = vi.fn().mockRejectedValue(new Error('provider offline'))
    const enqueueRetry = vi.fn().mockResolvedValue(undefined)
    const logger = {
      info: vi.fn(),
      error: vi.fn(),
    }

    const service = createResilientEmailService({
      provider: { send },
      enqueueRetry,
      logger,
    })

    const message = createOrderCompleteDeliveryEmail({
      customerName: 'James',
      email: 'james@example.com',
      orderId: 99,
      productName: 'Steam Wallet 50K',
      quantity: 1,
      deliveryLines: ['CODE-999'],
    })

    await expect(service.send(message)).resolves.toEqual({
      status: 'queued_for_retry',
    })

    expect(send).toHaveBeenCalledOnce()
    expect(enqueueRetry).toHaveBeenCalledWith(
      expect.objectContaining({
        attempt: 1,
        message: expect.objectContaining({
          to: ['james@example.com'],
          subject: message.subject,
        }),
        error: 'provider offline',
      }),
    )
    expect(logger.error).toHaveBeenCalledWith(
      'Email delivery failed; queued retry',
      expect.objectContaining({
        error: 'provider offline',
        category: 'transactional',
      }),
    )
  })

  it('throws when retry enqueue also fails', async () => {
    const send = vi.fn().mockRejectedValue(new Error('provider offline'))
    const enqueueRetry = vi.fn().mockRejectedValue(new Error('queue offline'))
    const logger = {
      info: vi.fn(),
      error: vi.fn(),
    }

    const service = createResilientEmailService({
      provider: { send },
      enqueueRetry,
      logger,
    })

    const message = createPromotionalDealsEmail({
      email: 'james@example.com',
      subject: 'Ưu đãi mới tại SubGameZone',
      previewText: 'Top deals this week',
      title: 'Ưu đãi mới dành cho bạn',
      intro: 'Tuần này SubGameZone có một số deal đáng chú ý:',
      deals: [
        {
          title: 'Weekend Sale',
          description: 'Discount on top-up products',
          ctaLabel: 'Shop now',
          ctaUrl: 'https://subgamezone.com/deals/weekend-sale',
        },
      ],
      unsubscribeUrl: 'https://subgamezone.com/unsubscribe',
    })

    await expect(service.send(message)).rejects.toBeInstanceOf(EmailDeliveryError)
    expect(logger.error).toHaveBeenCalledWith(
      'Email retry enqueue failed',
      expect.objectContaining({
        error: 'queue offline',
        category: 'promotional',
      }),
    )
  })
})
