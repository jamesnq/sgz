import { env } from '@/config'
import payloadConfig from '@payload-config'
import { eq, sql } from '@payloadcms/db-postgres/drizzle'
import PayOS from '@payos/node'
import { CheckoutResponseDataType } from '@payos/node/lib/type'
import { getPayload } from 'payload'

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
  payos = new PayOS(env.PAYOS_CLIENT_KEY, env.PAYOS_API_KEY, env.PAYOS_CHECKSUM_KEY)
  // private sgzStoreChannel: Channel | null = null

  async init() {
    await this.payos.confirmWebhook(env.PAYOS_WEBHOOK_URL)
  }
  // async getNotifyChannel() {
  //   if (!this.sgzStoreChannel) {
  //     this.sgzStoreChannel = await discordUtils.getChannel('1314128793136398396')
  //     if (!this.sgzStoreChannel) {
  //       throw new Error('Discord notify channel not found')
  //     }
  //   }
  //   if (!this.sgzStoreChannel.isSendable()) {
  //     throw new Error('Cannot send message to discord notify channel')
  //   }
  //   return this.sgzStoreChannel
  // }
  async createPaymentLink(data: z.infer<typeof CreatePaymentLinkSchema>) {
    const { amount, currency } = CreatePaymentLinkSchema.parse(data)
    let attempt = 0
    const maxAttempts = 3
    let result: CheckoutResponseDataType | undefined = undefined
    while (!result && attempt < maxAttempts) {
      try {
        if (currency === 'VND') {
          const r = await this.payos.createPaymentLink({
            orderCode: getRandomInt(1000, Number.MAX_SAFE_INTEGER),
            amount,
            cancelUrl: env.PAYOS_CANCEL_URL,
            returnUrl: env.PAYOS_RETURN_URL,
            description: 'SGZ',
          })
          result = r
        } else {
          return null
        }
      } catch (error) {
        attempt++
        if (attempt >= maxAttempts) {
          throw new Error(
            // @ts-expect-error tsmissmatch
            `Failed to create payment link after ${maxAttempts} attempts: ${error.message}`,
          )
        }
      }
    }
    if (!result) {
      throw new Error('Failed to create payment link')
    }

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

    if (recharge.status === 'SUCCESS') {
      return 'Recharge already success'
    }
    await payload.update({
      collection: 'recharges',
      where: { id: { equals: recharge.id } },
      data: { status: 'SUCCESS' },
      depth: 0,
    })
    const { users, transactions } = payload.db.tables
    await payload.db.drizzle.transaction(async (tx) => {
      const [user] = await tx
        .update(users)
        .set({ balance: sql`${users.balance} + ${paymentData.amount}` })
        .where(eq(users.id, recharge.user))
        .returning({ balance: users.balance })
      if (!user) throw new Error('User not found')
      const _transaction = await tx.insert(transactions).values({
        amount: paymentData.amount,
        user: recharge.user,
        description: `Nạp tiền qua ngân hàng mã nạp #${recharge.orderCode}`,
        balance: user.balance,
      })
    })

    return 'ok'
  }
}

const paymentService = new PaymentService()

export default paymentService
