'use server'
import paymentService from '@/services/payment.service'
import { authActionClient } from '@/utilities/safe-action'
import payloadConfig from '@payload-config'
import { getPayload } from 'payload'
import { RechargeSchema } from './schema'

export const rechargeAction = authActionClient
  .schema(RechargeSchema)
  .action(async ({ parsedInput: { amount }, ctx }) => {
    const { user } = ctx
    const res = await paymentService.createPaymentLink({
      amount,
      currency: 'VND',
      userId: user.id,
    })

    if (!res) {
      throw new Error('Payment link undefined')
    }
    const payload = await getPayload({ config: payloadConfig })
    const recharge = await payload.create({
      collection: 'recharges',
      data: {
        gateway: 'PAYOS',
        orderCode: res.orderCode.toString(),
        amount,
        user: user.id,
        status: 'PENDING',
        data: res,
      },
    })
    return {
      checkoutUrl: res.checkoutUrl,
    }
  })
