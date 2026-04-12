import { config } from '@/config'
import { recharges, transactions, users } from '@/payload-generated-schema'
import { formatPrice } from '@/utilities/formatPrice'
import payloadConfig from '@payload-config'
import { eq, sql } from '@payloadcms/db-postgres/drizzle'
import PayOS from '@payos/node'
import { CheckoutResponseDataType } from '@payos/node/lib/type'
import { after } from 'next/server'
import { getPayload } from 'payload'
import { discordWebhook } from './novu.service'

import { z } from 'zod'

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

export class PaymentService {
  payos = new PayOS(config.PAYOS_CLIENT_KEY, config.PAYOS_API_KEY, config.PAYOS_CHECKSUM_KEY)
  async init() {
    await this.payos.confirmWebhook(config.PAYOS_WEBHOOK_URL)
  }

  async createPaymentLink(data: z.infer<typeof CreatePaymentLinkSchema>) {
    const { amount, currency, userId } = CreatePaymentLinkSchema.parse(data)

    let attempt = 0
    const maxAttempts = 3
    let result: CheckoutResponseDataType | undefined = undefined
    while (!result && attempt < maxAttempts) {
      try {
        if (currency === 'VND') {
          const orderCode = getRandomInt(1000, Number.MAX_SAFE_INTEGER)

          const r = await this.payos.createPaymentLink({
            orderCode,
            amount,
            cancelUrl: config.PAYOS_CANCEL_URL,
            returnUrl: config.PAYOS_RETURN_URL,
            description: 'SGZ',
          })
          result = r
        } else {
          console.error('[PaymentService] Unsupported currency:', currency)
          return null
        }
      } catch (error) {
        attempt++
        console.error(`[PaymentService] Attempt ${attempt} failed:`, error)
        console.error('[PaymentService] Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          error,
        })
        if (attempt >= maxAttempts) {
          throw new Error(
            `Failed to create payment link after ${maxAttempts} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`,
          )
        }
      }
    }
    if (!result) {
      throw new Error('Failed to create payment link')
    }
    const payload = await getPayload({ config: payloadConfig })
    const _recharge = await payload.create({
      collection: 'recharges',
      data: {
        gateway: 'PAYOS',
        orderCode: result.orderCode.toString(),
        amount,
        user: userId,
        status: 'PENDING',
        data: result,
      },
    })

    return result
  }
  async webhookHandle(data: any) {
    const paymentData = this.payos.verifyPaymentWebhookData(data)
    if (paymentData.orderCode < 999) return 't'
    const payload = await getPayload({ config: payloadConfig })
    const { docs } = await payload.find({
      collection: 'recharges',
      where: {
        orderCode: { equals: paymentData.orderCode },
        gateway: { equals: 'PAYOS' },
      },
      depth: 0,
    })
    const recharge = docs[0]
    if (!recharge) {
      throw new Error('Recharge not found')
    }

    const { user } = await payload.db.drizzle.transaction(async (tx) => {
      const [lockedRecharge] = await tx
        .select({ id: recharges.id, status: recharges.status })
        .from(recharges)
        .where(eq(recharges.id, recharge.id))
        .for('update')
        
      if (!lockedRecharge) throw new Error('Recharge not found')

      if (lockedRecharge.status === 'SUCCESS') {
        throw new Error('Recharge already success')
      }
      
      await tx
        .update(recharges)
        .set({ status: 'SUCCESS' })
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
      
      return { user }
    })

    after(async () => {
      try {
        await discordWebhook({
          subject: `Nạp Tiền Qua Ngân Hàng`,
          message: `Người dùng: ${user.email} \nSố tiền: **${formatPrice(paymentData.amount)}** \nMã nạp: **#${recharge.orderCode}**`,
          color: '#00FF00',
          channel: 'activities',
        })
      } catch (e) {
        payload.logger.error({ err: e, message: 'Failed to send discord webhook for PayOS recharge' })
      }
    })

    return 'ok'
  }
}

const paymentService = new PaymentService()

export default paymentService
