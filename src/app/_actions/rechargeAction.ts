'use server'
import doiThe from '@/services/doithe.service'
import paymentService from '@/services/payment.service'
import { authActionClient } from '@/utilities/safe-action'
import { RechargeDoiTheSchema, RechargePayosSchema } from './schema'

export const rechargePayosAction = authActionClient
  .schema(RechargePayosSchema)
  .action(async ({ parsedInput: { amount }, ctx }) => {
    try {
      const { user } = ctx
      console.log('[rechargePayosAction] Creating payment link:', { amount, userId: user.id })

      const res = await paymentService.createPaymentLink({
        amount,
        currency: 'VND',
        userId: user.id,
      })

      if (!res) {
        console.error('[rechargePayosAction] Payment link is undefined')
        throw new Error('Payment link undefined')
      }

      console.log('[rechargePayosAction] Payment link created successfully:', res.checkoutUrl)
      return {
        checkoutUrl: res.checkoutUrl,
      }
    } catch (error) {
      console.error('[rechargePayosAction] Error:', error)
      throw error
    }
  })

export const rechargeDoiTheAction = authActionClient
  .schema(RechargeDoiTheSchema)
  .action(async ({ parsedInput: { amount, telco, code, serial }, ctx }) => {
    const res = await doiThe.chargeCardPost(telco, code, serial, amount, ctx.user.id)
    return res
  })
