'use server'
import doiThe from '@/services/doithe.service'
import paymentService from '@/services/payment.service'
import { checkRateLimit, RATE_LIMITS } from '@/utilities/rateLimit'
import { authActionClient, ServerNotification } from '@/utilities/safe-action'
import { RechargeDoiTheSchema, RechargePayosSchema } from './schema'

export const rechargePayosAction = authActionClient
  .schema(RechargePayosSchema)
  .action(async ({ parsedInput: { amount }, ctx }) => {
    const { user } = ctx

    const rl = checkRateLimit(user.id, RATE_LIMITS.rechargePayos)
    if (!rl.allowed) {
      throw new ServerNotification(`Bạn thao tác quá nhanh, vui lòng thử lại sau ${Math.ceil(rl.retryAfterMs / 1000)}s`)
    }

    const res = await paymentService.createPaymentLink({
      amount,
      currency: 'VND',
      userId: user.id,
    })

    if (!res) {
      throw new ServerNotification('Không thể tạo liên kết thanh toán')
    }

    return {
      checkoutUrl: res.checkoutUrl,
    }
  })

export const rechargeDoiTheAction = authActionClient
  .schema(RechargeDoiTheSchema)
  .action(async ({ parsedInput: { amount, telco, code, serial }, ctx }) => {
    const rl = checkRateLimit(ctx.user.id, RATE_LIMITS.rechargeDoiThe)
    if (!rl.allowed) {
      throw new ServerNotification(`Bạn thao tác quá nhanh, vui lòng thử lại sau ${Math.ceil(rl.retryAfterMs / 1000)}s`)
    }

    const res = await doiThe.chargeCardPost(telco, code, serial, amount, ctx.user.id)
    return res
  })
