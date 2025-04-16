import { env } from '@/config'
import { Order, ProductVariant } from '@/payload-types'
import { formatOrderDate } from '@/utilities/formatOrderDate'
import { orderStatusColors } from '@/utilities/getOrderStatus'
import { getServerSideURL } from '@/utilities/getURL'
import { Routes } from '@/utilities/routes'
import { Novu } from '@novu/api'
import CryptoJS from 'crypto-js'
import { after } from 'next/server'
const webhookChannels = {
  admin: { webhook: env.DISCORD_ADMIN_WEBHOOK_URL, mentions: [env.DISCORD_ADMIN_ROLE_ID] },
  staff: { webhook: env.DISCORD_STAFF_WEBHOOK_URL, mentions: [env.DISCORD_STAFF_ROLE_ID] },
  activities: { webhook: env.DISCORD_ACTIVITIES_WEBHOOK_URL, mentions: [] },
} as const
// Novu channels for staff notifications
export const novuChannels = ['admin', 'staff']
export async function discordWebhook({
  subject,
  message,
  redirect,
  color,
  channel,
  isMention = true,
}: {
  subject: string
  message?: string
  redirect?: string
  color?: string | null
  channel?: keyof typeof webhookChannels
  isMention?: boolean
}) {
  if (process.env.NODE_ENV === 'development') {
    isMention = false
  }
  if (!channel) {
    channel = 'admin'
  }
  try {
    const channelConfig = webhookChannels[channel]
    return fetch(channelConfig.webhook, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: isMention ? channelConfig.mentions.map((id) => `<@&${id}>`).join(' ') : '',
        attachments: [],
        embeds: [
          {
            title: subject,
            description: message,
            url: redirect
              ? redirect.startsWith('http://') || redirect.startsWith('https://')
                ? redirect
                : getServerSideURL() + redirect
              : undefined,
            color: color ? parseInt(color.replace('#', ''), 16) : undefined,
          },
        ],
      }),
    })
  } catch {}
}
// Initialize Novu client
export const novu = new Novu({ secretKey: env.NOVU_SECRET_KEY })

/**
 * Creates a subscriber hash for Novu authentication
 * @param subscriberId - The subscriber ID to hash
 * @returns The hashed subscriber ID
 */
export function createSubscriberHash(subscriberId: string): string {
  return CryptoJS.HmacSHA256(subscriberId, env.NOVU_SECRET_KEY).toString(CryptoJS.enc.Hex)
}

/**
 * Creates a new Novu subscriber
 * @param subscriberId - The subscriber ID
 * @param email - The subscriber's email
 * @returns Object containing novuHash and subscriberId
 */
export async function createNovuSubscriber({
  subscriberId,
  email,
}: {
  subscriberId: string
  email: string
}): Promise<{ novuHash: string; subscriberId: string }> {
  try {
    await novu.subscribers.create({
      subscriberId: subscriberId,
      email: email,
    })
  } catch (error) {
    console.error('Error creating Novu subscriber:', error)
  }

  return {
    novuHash: createSubscriberHash(subscriberId),
    subscriberId,
  }
}

/**
 * Sends a welcome notification to a new subscriber
 * @param subscriberId - The subscriber ID
 */
export async function sendWelcomeNotification(subscriberId: string): Promise<void> {
  try {
    await novu.trigger({
      workflowId: 'welcome',
      to: {
        subscriberId: subscriberId,
      },
      payload: {
        site: env.NEXT_PUBLIC_SITE_NAME,
        host: getServerSideURL(),
      },
    })
  } catch (error) {
    console.error('Error sending welcome notification:', error)
  }
}

/**
 * Sends a notification about a new order
 * @param orderId - The order ID
 * @param subscriberId - The subscriber ID
 * @param createdAt - The order creation date
 */
export async function sendNewOrderNotification(
  orderId: number | string,
  subscriberId: string,
  createdAt: Date,
): Promise<void> {
  after(async () => {
    try {
      await novu.trigger({
        workflowId: 'new-order',
        to: {
          subscriberId: subscriberId.toString(),
        },
        payload: {
          subject: `Tạo đơn hàng mới thành công`,
          message: `Đơn hàng #${orderId} được tạo thành công lúc ${formatOrderDate(createdAt)} ấn để xem chi tiết`,
          redirect: Routes.order(orderId),
        },
      })
    } catch (error) {
      console.error('Error sending new order notification:', error)
    }
  })
}

/**
 * Sends a notification to staff about a new order
 * @param orderId - The order ID
 */
export async function sendNewOrderStaffNotification(order: any): Promise<void> {
  after(async () => {
    try {
      const payload = {
        subject: `Có đơn hàng mới #${order.id}`,
        message: ``,
        redirect: Routes.WORKSPACE,
      }
      await novu.trigger({
        workflowId: 'new-order',
        to: {
          subscriberId: 'staff',
        },
        payload,
      })
      await discordWebhook({
        ...payload,
        message: `Đơn hàng #${order.id} **mới ${order.productVariant.name} x${order.quantity}**`,
        color: orderStatusColors.IN_QUEUE,
        channel: 'staff',
      })
    } catch (error) {
      console.error('Error sending staff notification:', error)
    }
  })
}

/**
 * Sends a notification when an order requires user update
 * @param orderId - The order ID
 * @param subscriberId - The subscriber ID
 */
export async function sendOrderUpdateRequiredNotification(
  orderId: number | string,
  subscriberId: string,
): Promise<void> {
  try {
    after(async () => {
      await novu.trigger({
        workflowId: 'order-update',
        to: {
          subscriberId: subscriberId.toString(),
        },
        payload: {
          message: 'Vui lòng bổ sung thông tin cho đơn hàng để tiếp tục',
          subject: `Yêu cầu hành động với đơn hàng #${orderId}`,
          redirect: Routes.order(orderId),
        },
      })
    })
  } catch (error) {
    console.error('Error sending order update notification:', error)
  }
}

/**
 * Sends a notification to staff when a user updates their order
 * @param orderId - The order ID
 */
export async function sendOrderUserUpdatedStaffNotification(
  orderId: number | string,
): Promise<void> {
  after(async () => {
    const payload = {
      subject: `Đơn hàng #${orderId} đang đợi xử lý`,
      message: `Người dùng đã cập nhật đơn hàng #${orderId}`,
      redirect: Routes.WORKSPACE,
    }
    try {
      await novu.trigger({
        workflowId: 'order-update',
        to: {
          subscriberId: 'staff',
        },
        payload,
      })
      await discordWebhook({
        ...payload,
        color: orderStatusColors.USER_UPDATE,
        channel: 'staff',
      })
    } catch (error) {
      console.error('Error sending staff notification:', error)
    }
  })
}

/**
 * Sends a notification to staff when an order is completed
 * @param order - The completed order
 */
export async function sendOrderCompletedStaffNotification(order: Order): Promise<void> {
  console.log('🚀 ~ sendOrderCompletedStaffNotification ~ order:', order)
  after(async () => {
    const payload = {
      subject: `Đơn hàng #${order.id} đã hoàn thành`,
      message: ``,
      redirect: Routes.WORKSPACE,
    }
    try {
      // await novu.trigger({
      //   workflowId: 'order-update',
      //   to: {
      //     subscriberId: 'staff',
      //   },
      //   payload,
      // })
      await discordWebhook({
        ...payload,
        color: orderStatusColors.COMPLETED,
        channel: 'staff',
        isMention: false,
      })
    } catch (error) {
      console.error('Error sending order completed notification:', error)
    }
  })
}

/**
 * Sends a notification to staff when an order is automatically completed
 * @param orderId - The order ID
 * @param productVariantName - The name of the product variant
 */
export async function sendOrderCompletedNotification(order: Order): Promise<void> {
  after(async () => {
    try {
      const productVariant = order.productVariant
      if (typeof productVariant !== 'object') {
        return
      }

      const payload = {
        subject: `Đơn hàng #${order.id} đã hoàn thành tự động`,
        message: `Đơn hàng cho sản phẩm "${productVariant.name}"  x${order.quantity} đã được xử lý tự động.`,
        redirect: Routes.WORKSPACE,
        color: orderStatusColors.COMPLETED,
        isMention: false,
      }

      await discordWebhook({
        ...payload,
        channel: 'staff',
      })
    } catch (error) {
      console.error('Error sending order completed notification:', error)
    }
  })
}

/**
 * Sends a notification to admin channel when a product variant goes out of stock
 * @param productVariant - The product variant that is out of stock
 */
export async function sendProductOutOfStockNotification(
  productVariant: ProductVariant,
): Promise<void> {
  after(async () => {
    try {
      if (typeof productVariant !== 'object') {
        return
      }

      const payload = {
        subject: `Sản phẩm hết hàng`,
        message: `Sản phẩm "${productVariant.name}" đã hết hàng.`,
        redirect: Routes.adminProductVariant(productVariant.id),
        color: '#FF0000', // Red color for warning
      }

      await discordWebhook({
        ...payload,
        channel: 'admin',
      })
    } catch (error) {
      console.error('Error sending out of stock notification:', error)
    }
  })
}

/**
 * Resets all subscribers and creates new ones
 * @param subscriberIds - Array of subscriber IDs to create
 */
export async function resetAndCreateSubscribers(subscriberIds: string[]): Promise<void> {
  try {
    // Delete existing subscribers
    const res = await novu.subscribers.list()
    await Promise.all(
      res.result.data.map(async (subscriber) => {
        if (subscriber.subscriberId) {
          await novu.subscribers.delete(subscriber.subscriberId)
        }
      }),
    )

    // Create new subscribers
    const subscribers = subscriberIds.map((id) => ({ subscriberId: id }))
    await novu.subscribers.createBulk({
      subscribers,
    })
  } catch (error) {
    console.error('Error resetting subscribers:', error)
  }
}
