import { config } from '@/config'
import { Form, FormSubmission, Order, ProductVariant } from '@/payload-types'
import { formatOrderDate } from '@/utilities/formatOrderDate'
import { orderStatusColors } from '@/utilities/getOrderStatus'
import { getServerSideURL } from '@/utilities/getURL'
import { Routes } from '@/utilities/routes'
import { Novu } from '@novu/api'
import payloadConfig from '@payload-config'
import CryptoJS from 'crypto-js'
import { after } from 'next/server'
import { getPayload } from 'payload'

const webhookChannels = {
  admin: { webhook: config.DISCORD_ADMIN_WEBHOOK_URL, mentions: [config.DISCORD_ADMIN_ROLE_ID] },
  staff: { webhook: config.DISCORD_STAFF_WEBHOOK_URL, mentions: [config.DISCORD_STAFF_ROLE_ID] },
  activities: { webhook: config.DISCORD_ACTIVITIES_WEBHOOK_URL, mentions: [] },
} as const

export interface DiscordEmbedField {
  name: string
  value: string
  inline?: boolean
}

export interface QuickCopyItem {
  label: string
  value: string
}

// Novu channels for staff notifications
export const novuChannels = ['admin', 'staff']

export function extractRawFormItems(
  form: Form | null | undefined,
  submissionData: Record<string, unknown> | null | undefined,
): QuickCopyItem[] {
  if (!submissionData || typeof submissionData !== 'object') return []

  const items: QuickCopyItem[] = []
  const formFields = form?.fields || []

  if (formFields.length > 0) {
    for (const field of formFields) {
      if (!('name' in field) || !field.name) continue

      const val = submissionData[field.name]
      if (val === undefined || val === null || typeof val === 'object') continue

      const stringVal = String(val).trim()
      if (!stringVal) continue

      let displayVal = stringVal
      if (field.blockType === 'select' && 'options' in field && Array.isArray(field.options)) {
        const option = field.options.find((opt: any) => opt.value === val)
        if (option?.label) {
          displayVal = option.label
        }
      }

      items.push({
        label: field.label || field.name,
        value: displayVal,
      })
    }
  } else {
    for (const [key, val] of Object.entries(submissionData)) {
      if (val === undefined || val === null || typeof val === 'object') continue
      const stringVal = String(val).trim()
      if (!stringVal) continue

      items.push({
        label: key,
        value: stringVal,
      })
    }
  }

  return items
}

export function formatFormSubmissionToDiscordFields(
  form: Form | null | undefined,
  submissionData: Record<string, unknown> | null | undefined,
): DiscordEmbedField[] {
  const items = extractRawFormItems(form, submissionData)
  return items.map((item) => ({
    name: item.label,
    value: `\`${item.value}\``,
    inline: false,
  }))
}

export async function discordWebhook({
  subject,
  message,
  redirect,
  color,
  channel,
  isMention = true,
  fields,
}: {
  subject: string
  message?: string
  redirect?: string
  color?: string | null
  channel?: keyof typeof webhookChannels
  isMention?: boolean
  fields?: DiscordEmbedField[]
}) {
  if (process.env.NODE_ENV === 'development') {
    isMention = false
  }
  if (!channel) {
    channel = 'admin'
  }
  try {
    const channelConfig = webhookChannels[channel]
    let attempts = 0
    let lastError

    while (attempts < 3) {
      try {
        return await fetch(channelConfig.webhook, {
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
                fields: fields && fields.length > 0 ? fields : undefined,
              },
            ],
          }),
        })
      } catch (error) {
        lastError = error
        attempts++
        if (attempts >= 3) break
        // Wait a short time before retrying
        await new Promise((resolve) => setTimeout(resolve, 500))
      }
    }
    console.error('Discord webhook failed after 3 attempts:', lastError)
  } catch (error) {
    console.error('Discord webhook error:', error)
  }
}
// Initialize Novu client
export const novu = new Novu({ secretKey: config.NOVU_SECRET_KEY })

const scheduleNotificationAfter = (errorMessage: string, task: () => Promise<void>): void => {
  try {
    after(async () => {
      try {
        await task()
      } catch (error) {
        console.error(errorMessage, error)
      }
    })
  } catch (error) {
    console.error(`${errorMessage} Failed to schedule after() callback:`, error)
  }
}

/**
 * Creates a subscriber hash for Novu authentication
 * @param subscriberId - The subscriber ID to hash
 * @returns The hashed subscriber ID
 */
export function createSubscriberHash(subscriberId: string): string {
  return CryptoJS.HmacSHA256(subscriberId, config.NOVU_SECRET_KEY).toString(CryptoJS.enc.Hex)
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
        site: config.NEXT_PUBLIC_SITE_NAME,
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
 * @param order - The order object or order ID
 */
export async function sendNewOrderStaffNotification(order: any): Promise<void> {
  after(async () => {
    try {
      const orderId = typeof order === 'object' ? order.id : order
      let pvName =
        typeof order === 'object' && typeof order.productVariant === 'object'
          ? order.productVariant?.name
          : undefined
      let quantity = typeof order === 'object' ? order.quantity : undefined
      let rawItems: QuickCopyItem[] = []

      try {
        const payload = await getPayload({ config: payloadConfig })
        const dbOrder = await payload.findByID({
          collection: 'orders',
          id: orderId,
          depth: 2,
        })

        if (dbOrder) {
          if (!pvName && typeof dbOrder.productVariant === 'object') {
            pvName = dbOrder.productVariant.name
          }
          if (!quantity) {
            quantity = dbOrder.quantity
          }
          if (dbOrder.formSubmission && typeof dbOrder.formSubmission === 'object') {
            const formSubmission = dbOrder.formSubmission as FormSubmission
            const form = formSubmission.form as Form
            const submissionData = formSubmission.submissionData as Record<string, unknown>
            rawItems = extractRawFormItems(form, submissionData)
          }
        }
      } catch (err) {
        console.error('Error fetching order details for discord notification:', err)
      }

      const fields: DiscordEmbedField[] = rawItems.map((item) => ({
        name: item.label,
        value: `\`${item.value}\``,
        inline: false,
      }))

      const payload = {
        subject: `Có đơn hàng mới #${orderId}`,
        message: `Đơn hàng #${orderId} **mới ${pvName || 'sản phẩm'} x${quantity || 1}**`,
        redirect: Routes.WORKSPACE,
      }
      await discordWebhook({
        ...payload,
        color: orderStatusColors.IN_QUEUE,
        channel: 'staff',
        fields,
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
  after(async () => {
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
  })
}

/**
 * Sends a notification to staff when a user updates their order
 * @param orderId - The order ID
 * @param updatedItems - Optional list of updated raw items to display and copy
 */
export async function sendOrderUserUpdatedStaffNotification(
  orderId: number | string,
  updatedItems?: QuickCopyItem[],
): Promise<void> {
  after(async () => {
    const payload = {
      subject: `⚡ Đơn hàng #${orderId} đang đợi xử lý`,
      message: `Người dùng đã cập nhật thông tin đơn hàng #${orderId}. Vui lòng xử lý!`,
      redirect: Routes.WORKSPACE,
    }
    try {
      let items = updatedItems
      if (!items || items.length === 0) {
        try {
          const payloadInstance = await getPayload({ config: payloadConfig })
          const dbOrder = await payloadInstance.findByID({
            collection: 'orders',
            id: orderId,
            depth: 2,
          })
          if (dbOrder?.formSubmission && typeof dbOrder.formSubmission === 'object') {
            const formSubmission = dbOrder.formSubmission as FormSubmission
            const form = formSubmission.form as Form
            const submissionData = formSubmission.submissionData as Record<string, unknown>
            items = extractRawFormItems(form, submissionData)
          }
        } catch (err) {
          console.error('Error fetching order form details for staff notification:', err)
        }
      }

      const fields: DiscordEmbedField[] = (items || []).map((item) => ({
        name: `🔹 ${item.label}`,
        value: `\`${item.value}\``,
        inline: false,
      }))

      await discordWebhook({
        ...payload,
        color: orderStatusColors.USER_UPDATE,
        channel: 'staff',
        isMention: true,
        fields,
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
  scheduleNotificationAfter('Error sending order completed notification:', async () => {
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
  scheduleNotificationAfter('Error sending order completed notification:', async () => {
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
  scheduleNotificationAfter('Error sending out of stock notification:', async () => {
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
    const res = await (novu.subscribers as any).list()
    await Promise.all(
      res.result.data.map(async (subscriber: any) => {
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
