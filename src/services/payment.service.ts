import { config } from '@/config'
import type { Recharge } from '@/payload-types'
import { recharges, transactions, users } from '@/payload-generated-schema'
import { formatPrice } from '@/utilities/formatPrice'
import payloadConfig from '@payload-config'
import { eq, sql } from '@payloadcms/db-postgres/drizzle'
import PayOS from '@payos/node'
import type { CheckoutResponseDataType } from '@payos/node/lib/type'
import { after } from 'next/server'
import { getPayload } from 'payload'
import { checkoutWithUser, type CheckoutInput } from './checkout.service'
import { discordWebhook } from './novu.service'

import { z } from 'zod'

const PAYOS_GATEWAY = 'PAYOS'
const MAX_ORDER_CODE_ATTEMPTS = 3

const CreatePaymentLinkSchema = z.object({
  amount: z.number(),
  currency: z.enum(['VND', 'USD']),
  userId: z.number(),
  returnUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
  /** Checkout to place automatically once this top-up is paid */
  pendingCheckout: z.custom<PendingCheckout>().optional(),
})

export type PendingCheckout = CheckoutInput & {
  productSlug: string | null
  itemName: string
  expectedTotal: number
}

export type PendingCheckoutResult =
  | { status: 'PROCESSING' }
  | { status: 'COMPLETED'; orderId: number }
  | { status: 'FAILED'; message: string }

const getPendingCheckout = (data: unknown): PendingCheckout | null => {
  const pending = toRecord(data).pendingCheckout
  if (!pending || typeof pending !== 'object') return null
  return pending as PendingCheckout
}
function getRandomInt(min: number, max: number) {
  const minCeiled = Math.ceil(min)
  const maxFloored = Math.floor(max)
  return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled)
}

const toRecord = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {}
  }
  return value as Record<string, unknown>
}

const serializeError = (error: unknown) => ({
  message: error instanceof Error ? error.message : 'Unknown error',
  name: error instanceof Error ? error.name : undefined,
})

const isOrderCodeCollision = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') {
    return false
  }

  const errorRecord = error as Record<string, unknown>
  const message = error instanceof Error ? error.message : String(errorRecord.message ?? '')
  const constraint = String(errorRecord.constraint ?? '')
  const detail = String(errorRecord.detail ?? '')

  return (
    errorRecord.code === '23505' &&
    (constraint.includes('recharges_order_code') ||
      constraint.includes('orderCode_gateway') ||
      message.includes('recharges_order_code') ||
      message.includes('orderCode_gateway') ||
      detail.includes('order_code'))
  )
}

export class PaymentService {
  payos = new PayOS(config.PAYOS_CLIENT_KEY, config.PAYOS_API_KEY, config.PAYOS_CHECKSUM_KEY)
  async init() {
    await this.payos.confirmWebhook(config.PAYOS_WEBHOOK_URL)
  }

  async createPaymentLink(data: z.infer<typeof CreatePaymentLinkSchema>) {
    const { amount, currency, userId, returnUrl, cancelUrl, pendingCheckout } =
      CreatePaymentLinkSchema.parse(data)

    if (currency !== 'VND') {
      console.error('[PaymentService] Unsupported currency:', currency)
      return null
    }

    const payload = await getPayload({ config: payloadConfig })

    for (let attempt = 1; attempt <= MAX_ORDER_CODE_ATTEMPTS; attempt++) {
      const orderCode = getRandomInt(1000, Number.MAX_SAFE_INTEGER)
      let reservedRecharge: Recharge | undefined

      try {
        reservedRecharge = await payload.create({
          collection: 'recharges',
          data: {
            gateway: PAYOS_GATEWAY,
            orderCode: orderCode.toString(),
            amount,
            user: userId,
            status: 'PENDING',
            data: {
              creationAttempt: {
                provider: PAYOS_GATEWAY,
                orderCode,
                status: 'RESERVED',
              },
              ...(pendingCheckout ? { pendingCheckout } : {}),
            },
          },
          overrideAccess: true,
        })
      } catch (error) {
        if (isOrderCodeCollision(error) && attempt < MAX_ORDER_CODE_ATTEMPTS) {
          console.warn(`[PaymentService] PayOS orderCode collision on attempt ${attempt}`, {
            orderCode,
          })
          continue
        }

        throw error
      }

      let result: CheckoutResponseDataType
      try {
        result = await this.payos.createPaymentLink({
          orderCode,
          amount,
          cancelUrl: cancelUrl ?? config.PAYOS_CANCEL_URL,
          returnUrl: returnUrl ?? config.PAYOS_RETURN_URL,
          description: 'SGZ',
        })
      } catch (error) {
        await payload.update({
          collection: 'recharges',
          where: { id: { equals: reservedRecharge.id } },
          data: {
            status: 'CANCEL',
            data: {
              ...toRecord(reservedRecharge.data),
              creationAttempt: {
                provider: PAYOS_GATEWAY,
                orderCode,
                status: 'FAILED',
              },
              error: serializeError(error),
            },
          },
          overrideAccess: true,
          limit: 1,
          depth: 0,
        })

        throw new Error(
          `Failed to create payment link: ${error instanceof Error ? error.message : 'Unknown error'}`,
        )
      }

      await payload.update({
        collection: 'recharges',
        where: { id: { equals: reservedRecharge.id } },
        data: {
          data: {
            ...toRecord(reservedRecharge.data),
            creationAttempt: {
              provider: PAYOS_GATEWAY,
              orderCode,
              status: 'LINK_CREATED',
            },
            payos: result,
          },
        },
        overrideAccess: true,
        limit: 1,
        depth: 0,
      })

      return result
    }

    throw new Error(`Failed to reserve PayOS recharge after ${MAX_ORDER_CODE_ATTEMPTS} attempts`)
  }
  async webhookHandle(data: any) {
    const paymentData = this.payos.verifyPaymentWebhookData(data)
    if (paymentData.orderCode < 999) return 't'
    const payload = await getPayload({ config: payloadConfig })
    const { docs } = await payload.find({
      collection: 'recharges',
      where: {
        orderCode: { equals: paymentData.orderCode.toString() },
        gateway: { equals: PAYOS_GATEWAY },
      },
      depth: 0,
      limit: 1,
    })
    const recharge = docs[0]
    if (!recharge) {
      throw new Error('Recharge not found')
    }

    const transactionResult = await payload.db.drizzle.transaction(async (tx) => {
      const [lockedRecharge] = await tx
        .select({ id: recharges.id, status: recharges.status, data: recharges.data })
        .from(recharges)
        .where(eq(recharges.id, recharge.id))
        .for('update')

      if (!lockedRecharge) throw new Error('Recharge not found')

      if (lockedRecharge.status === 'SUCCESS') {
        return { alreadySuccess: true as const }
      }

      const pendingCheckout = getPendingCheckout(lockedRecharge.data)

      await tx
        .update(recharges)
        .set({
          status: 'SUCCESS',
          data: {
            ...toRecord(lockedRecharge.data),
            webhook: paymentData,
            ...(pendingCheckout
              ? { checkoutResult: { status: 'PROCESSING' } satisfies PendingCheckoutResult }
              : {}),
          },
        })
        .where(eq(recharges.id, recharge.id))

      const [user] = await tx
        .update(users)
        .set({ balance: sql`${users.balance} + ${paymentData.amount}` })
        .where(eq(users.id, recharge.user as number))
        .returning({ balance: users.balance, email: users.email })

      if (!user || user.balance === null) throw new Error('User not found')

      await tx.insert(transactions).values({
        amount: paymentData.amount,
        user: recharge.user as number,
        description: `Nạp tiền qua ngân hàng mã nạp #${recharge.orderCode}`,
        balance: user.balance,
      })

      return { alreadySuccess: false as const, user, pendingCheckout }
    })

    if (transactionResult.alreadySuccess) {
      return 'ok'
    }

    const { user, pendingCheckout } = transactionResult

    // The top-up is committed first: if the order cannot be placed, the money stays in balance
    if (pendingCheckout) {
      await this.completePendingCheckout({
        rechargeId: recharge.id,
        orderCode: recharge.orderCode,
        user: { id: recharge.user as number, email: user.email },
        pendingCheckout,
      })
    }

    after(async () => {
      try {
        await discordWebhook({
          subject: `Nạp Tiền Qua Ngân Hàng`,
          message: `Người dùng: ${user.email} \nSố tiền: **${formatPrice(paymentData.amount)}** \nMã nạp: **#${recharge.orderCode}**`,
          color: '#00FF00',
          channel: 'activities',
        })
      } catch (e) {
        payload.logger.error({
          err: e,
          message: 'Failed to send discord webhook for PayOS recharge',
        })
      }
    })

    return 'ok'
  }

  /**
   * Place the order the user asked for when they chose "pay the shortfall via PayOS".
   * Never throws: a failed checkout (price changed, sold out, voucher used up) leaves the
   * paid amount in the user's balance and records why, for the return page and staff.
   */
  async completePendingCheckout({
    rechargeId,
    orderCode,
    user,
    pendingCheckout,
  }: {
    rechargeId: number
    orderCode: string
    user: { id: number; email?: string | null }
    pendingCheckout: PendingCheckout
  }) {
    const payload = await getPayload({ config: payloadConfig })
    let result: PendingCheckoutResult

    try {
      const { order } = await checkoutWithUser(
        {
          parsedInput: {
            productVariantId: pendingCheckout.productVariantId,
            quantity: pendingCheckout.quantity,
            shippingFields: pendingCheckout.shippingFields,
            voucherCode: pendingCheckout.voucherCode,
          },
          user,
        },
        { skipRateLimit: true },
      )
      result = { status: 'COMPLETED', orderId: order.id }
    } catch (error) {
      result = {
        status: 'FAILED',
        message: error instanceof Error ? error.message : 'Không thể tạo đơn hàng',
      }
      payload.logger.error({
        err: error,
        message: `PayOS checkout #${orderCode} paid but order creation failed`,
      })
      try {
        await discordWebhook({
          subject: `Thanh Toán PayOS Không Tạo Được Đơn`,
          message: `Người dùng: ${user.email} \nMã nạp: **#${orderCode}** \nSản phẩm: **${pendingCheckout.itemName}** x${pendingCheckout.quantity} \nLý do: ${result.message} \nTiền đã được cộng vào số dư.`,
          color: '#FF0000',
          channel: 'activities',
        })
      } catch (e) {
        payload.logger.error({ err: e, message: 'Failed to send discord webhook for PayOS checkout' })
      }
    }

    // jsonb merge so concurrent writers to other keys are not overwritten
    await payload.db.drizzle
      .update(recharges)
      .set({
        data: sql`COALESCE(${recharges.data}, '{}'::jsonb) || ${JSON.stringify({ checkoutResult: result })}::jsonb`,
      })
      .where(eq(recharges.id, rechargeId))

    return result
  }
}

const paymentService = new PaymentService()

export default paymentService
