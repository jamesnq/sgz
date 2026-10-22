'use server'

import { config } from '@/config'
import { quoteCheckout } from '@/services/checkout.service'
import paymentService, { type PendingCheckoutResult } from '@/services/payment.service'
import { checkRateLimit, RATE_LIMITS } from '@/utilities/rateLimit'
import { authActionClient, ServerNotification } from '@/utilities/safe-action'
import payloadConfig from '@payload-config'
import { getPayload } from 'payload'
import { CheckoutSchema, PayosCheckoutStatusSchema } from './schema'

/** PayOS / RechargePayosSchema lower bound; any surplus simply stays in the balance */
const MIN_PAYOS_AMOUNT = 2000
const MAX_PAYOS_AMOUNT = 50_000_000

/**
 * "Thiếu số dư → thanh toán ngay": opens a PayOS link for the shortfall only.
 * The order itself is placed by the PayOS webhook once the money arrives.
 */
export const checkoutPayosAction = authActionClient
  .schema(CheckoutSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    const rl = checkRateLimit(user.id, RATE_LIMITS.rechargePayos)
    if (!rl.allowed) {
      throw new ServerNotification(
        `Bạn thao tác quá nhanh, vui lòng thử lại sau ${Math.ceil(rl.retryAfterMs / 1000)}s`,
      )
    }

    const quote = await quoteCheckout({ input: parsedInput, user })

    const payload = await getPayload({ config: payloadConfig })
    const freshUser = await payload.findByID({
      collection: 'users',
      id: user.id,
      depth: 0,
      overrideAccess: true,
      select: { balance: true },
    })
    const balance = Math.max(0, freshUser?.balance ?? 0)
    const missing = quote.totalPrice - balance

    // Balance already covers it (e.g. topped up in another tab): pay from balance instead
    if (missing <= 0) {
      return { payWithBalance: true as const }
    }

    const amount = Math.max(missing, MIN_PAYOS_AMOUNT)
    if (amount > MAX_PAYOS_AMOUNT) {
      throw new ServerNotification('Số tiền thanh toán vượt quá giới hạn 50.000.000 VND')
    }

    const returnUrl = `${config.NEXT_PUBLIC_SERVER_URL}/checkout/payos`
    const res = await paymentService.createPaymentLink({
      amount,
      currency: 'VND',
      userId: user.id,
      returnUrl,
      cancelUrl: `${returnUrl}?cancel=true`,
      pendingCheckout: {
        productVariantId: parsedInput.productVariantId,
        quantity: parsedInput.quantity,
        shippingFields: quote.shippingFields,
        voucherCode: parsedInput.voucherCode,
        productSlug: quote.productSlug,
        itemName: quote.itemName,
        expectedTotal: quote.totalPrice,
      },
    })

    if (!res) {
      throw new ServerNotification('Không thể tạo liên kết thanh toán')
    }

    return { checkoutUrl: res.checkoutUrl, orderCode: res.orderCode, amount }
  })

/** Polled by /checkout/payos until the webhook has paid and placed the order. */
export const payosCheckoutStatusAction = authActionClient
  .schema(PayosCheckoutStatusSchema)
  .action(async ({ parsedInput: { orderCode }, ctx: { user } }) => {
    const payload = await getPayload({ config: payloadConfig })
    const { docs } = await payload.find({
      collection: 'recharges',
      where: {
        orderCode: { equals: String(orderCode) },
        user: { equals: user.id },
      },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    const recharge = docs[0]
    if (!recharge) {
      throw new ServerNotification('Không tìm thấy giao dịch')
    }

    const data = (recharge.data ?? {}) as {
      pendingCheckout?: { productSlug?: string | null; itemName?: string }
      checkoutResult?: PendingCheckoutResult
      payos?: { checkoutUrl?: string }
    }

    return {
      // Lets the waiting tab reopen PayOS if the payment tab was closed
      checkoutUrl: recharge.status === 'PENDING' ? (data.payos?.checkoutUrl ?? null) : null,
      rechargeStatus: recharge.status,
      amount: recharge.amount,
      checkout: data.checkoutResult ?? null,
      productSlug: data.pendingCheckout?.productSlug ?? null,
      itemName: data.pendingCheckout?.itemName ?? null,
    }
  })
