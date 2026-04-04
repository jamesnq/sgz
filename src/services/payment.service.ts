import { config } from '@/config'
import { transactions, users } from '@/payload-generated-schema'
import { formatPrice } from '@/utilities/formatPrice'
import payloadConfig from '@payload-config'
import { eq, sql } from '@payloadcms/db-postgres/drizzle'
import { PayOS } from '@payos/node'
type CheckoutResponseDataType = any
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
  payos = new PayOS({
    clientId: config.PAYOS_CLIENT_KEY,
    apiKey: config.PAYOS_API_KEY,
    checksumKey: config.PAYOS_CHECKSUM_KEY,
  })
  async init() {
    await this.payos.webhooks.confirm(config.PAYOS_WEBHOOK_URL)
  }

  async createPaymentLink(data: z.infer<typeof CreatePaymentLinkSchema>) {
    console.log('[PaymentService] Creating payment link with data:', data)
    const { amount, currency, userId } = CreatePaymentLinkSchema.parse(data)
    console.log('[PaymentService] Parsed data:', { amount, currency, userId })

    let attempt = 0
    const maxAttempts = 3
    let result: CheckoutResponseDataType | undefined = undefined
    while (!result && attempt < maxAttempts) {
      try {
        console.log(`[PaymentService] Attempt ${attempt + 1}/${maxAttempts}`)
        if (currency === 'VND') {
          const orderCode = getRandomInt(1000, Number.MAX_SAFE_INTEGER)
          console.log('[PaymentService] Generated orderCode:', orderCode)
          console.log('[PaymentService] PayOS config:', {
            cancelUrl: config.PAYOS_CANCEL_URL,
            returnUrl: config.PAYOS_RETURN_URL,
            hasClientKey: !!config.PAYOS_CLIENT_KEY,
            hasApiKey: !!config.PAYOS_API_KEY,
            hasChecksumKey: !!config.PAYOS_CHECKSUM_KEY,
          })

          const r = await this.payos.paymentRequests.create({
            orderCode,
            amount,
            cancelUrl: config.PAYOS_CANCEL_URL,
            returnUrl: config.PAYOS_RETURN_URL,
            description: 'SGZ',
          })
          console.log('[PaymentService] PayOS response:', r)
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
            // @ts-expect-error tsmissmatch
            `Failed to create payment link after ${maxAttempts} attempts: ${error.message}`,
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
    const paymentData = await this.payos.webhooks.verify(data)
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

    const { user } = await payload.db.drizzle.transaction(async (tx) => {
      const [user] = await tx
        .update(users)
        .set({ balance: sql`${users.balance} + ${paymentData.amount}` })
        .where(eq(users.id, recharge.user as number))
        .returning({ balance: users.balance, email: users.email })
      if (!user || user.balance === null) throw new Error('User not found')

      const _transaction = await tx.insert(transactions).values({
        amount: paymentData.amount.toString(),
        user: recharge.user as number,
        description: `Nạp tiền qua ngân hàng mã nạp #${recharge.orderCode}`,
        balance: user.balance,
      })
      return { user }
    })
    after(async () => {
      await discordWebhook({
        subject: `Nạp Tiền Qua Ngân Hàng`,
        message: `Người dùng: ${user.email} \nSố tiền: **${formatPrice(paymentData.amount)}** \nMã nạp: **#${recharge.orderCode}**`,
        color: '#00FF00',
        channel: 'activities',
      })
    })

    return 'ok'
  }
}

const paymentService = new PaymentService()

export default paymentService
