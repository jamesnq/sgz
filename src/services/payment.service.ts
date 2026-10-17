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
import { discordWebhook } from './novu.service'

import { z } from 'zod'

const PAYOS_GATEWAY = 'PAYOS'
const MAX_ORDER_CODE_ATTEMPTS = 3

const CreatePaymentLinkSchema = z.object({
  amount: z.number(),
  currency: z.enum(['VND', 'USD']),
  userId: z.number(),
})
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
    const { amount, currency, userId } = CreatePaymentLinkSchema.parse(data)

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
          cancelUrl: config.PAYOS_CANCEL_URL,
          returnUrl: config.PAYOS_RETURN_URL,
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

      await tx
        .update(recharges)
        .set({
          status: 'SUCCESS',
          data: {
            ...toRecord(lockedRecharge.data),
            webhook: paymentData,
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

      return { alreadySuccess: false as const, user }
    })

    if (transactionResult.alreadySuccess) {
      return 'ok'
    }

    const { user } = transactionResult

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
}

const paymentService = new PaymentService()

export default paymentService
