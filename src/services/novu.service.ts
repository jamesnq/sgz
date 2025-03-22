import { env } from '@/config'
import { Novu } from '@novu/api'
import CryptoJS from 'crypto-js'
import { getServerSideURL } from '@/utilities/getURL'
import { Routes } from '@/utilities/routes'
import { formatOrderDate } from '@/utilities/formatOrderDate'

// Novu channels for staff notifications
export const novuChannels = ['admin', 'staff']

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
    subscriberId 
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
  createdAt: Date
): Promise<void> {
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
}

/**
 * Sends a notification to staff about a new order
 * @param orderId - The order ID
 */
export async function sendNewOrderStaffNotification(orderId: number | string): Promise<void> {
  try {
    await novu.trigger({
      workflowId: 'new-order',
      to: {
        subscriberId: 'staff',
      },
      payload: {
        subject: `Có đơn hàng mới #${orderId}`,
        message: ``,
        redirect: Routes.WORKSPACE,
      },
    })
  } catch (error) {
    console.error('Error sending staff notification:', error)
  }
}

/**
 * Sends a notification when an order requires user update
 * @param orderId - The order ID
 * @param subscriberId - The subscriber ID
 */
export async function sendOrderUpdateRequiredNotification(
  orderId: number | string,
  subscriberId: string
): Promise<void> {
  try {
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
  } catch (error) {
    console.error('Error sending order update notification:', error)
  }
}

/**
 * Sends a notification to staff when a user updates their order
 * @param orderId - The order ID
 */
export async function sendOrderUserUpdatedStaffNotification(orderId: number | string): Promise<void> {
  try {
    await novu.trigger({
      workflowId: 'order-update',
      to: {
        subscriberId: 'staff',
      },
      payload: {
        message: `Người dùng đã cập nhật đơn hàng #${orderId}`,
        subject: `Đơn hàng #${orderId} đang đợi xử lý`,
        redirect: Routes.WORKSPACE,
      },
    })
  } catch (error) {
    console.error('Error sending staff notification:', error)
  }
}

/**
 * Deletes all existing subscribers and creates new ones
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
      })
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
