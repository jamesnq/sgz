'use server'
import doiThe from '@/services/doithe.service'
import paymentService from '@/services/payment.service'
import { authActionClient } from '@/utilities/safe-action'
import { RechargeDoiTheSchema, RechargePayosSchema } from './schema'

export const rechargePayosAction = authActionClient
  .schema(RechargePayosSchema)
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

    return {
      checkoutUrl: res.checkoutUrl,
    }
  })

export const rechargeDoiTheAction = authActionClient
  .schema(RechargeDoiTheSchema)
  .action(async ({ parsedInput: { amount, telco, code, serial }, ctx }) => {
    const res = await doiThe.chargeCardPost(telco, code, serial, amount, ctx.user.id)
    return res
  })
