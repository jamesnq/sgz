'use server'

import {
  form_submissions,
  orders,
  product_variant_supplies,
  product_variants,
  products,
  transactions,
  users,
  vouchers,
} from '@/payload-generated-schema'
import type { Form } from '@/payload-types'
import { discordWebhook, sendNewOrderStaffNotification } from '@/services/novu.service'
import { autoProcessOrder } from '@/services/orderProcessing'
import { formatPrice } from '@/utilities/formatPrice'
import { normalizeFormSubmissionData } from '@/utilities/formSubmission'
import { checkRateLimit, RATE_LIMITS } from '@/utilities/rateLimit'
import { authActionClient, ServerNotification } from '@/utilities/safe-action'
import {
  calculateVoucherDiscount,
  validateVoucher,
  validateVoucherScope,
} from '@/utilities/voucher'
import payloadConfig from '@payload-config'
import { sql } from '@payloadcms/db-postgres'
import { and, eq } from '@payloadcms/db-postgres/drizzle'
import { after } from 'next/server'
import { getPayload } from 'payload'
import { CheckoutSchema } from './schema'

type CheckoutInput = {
  productVariantId: number
  quantity: number
  shippingFields?: unknown
  voucherCode?: string
}

type CheckoutUser = {
  id: number
  email?: string | null
}

export const checkoutWithUser = async ({
  parsedInput: { productVariantId, quantity, shippingFields, voucherCode },
  user,
}: {
  parsedInput: CheckoutInput
  user: CheckoutUser
}) => {
  const rl = checkRateLimit(user.id, RATE_LIMITS.checkout)
  if (!rl.allowed) {
    throw new ServerNotification(
      `Bạn thao tác quá nhanh, vui lòng thử lại sau ${Math.ceil(rl.retryAfterMs / 1000)}s`,
    )
  }

  const payload = await getPayload({ config: payloadConfig })
  const pv = await payload.findByID({
    collection: 'product-variants',
    id: productVariantId,
    depth: 1,
    select: {
      id: true,
      price: true,
      originalPrice: true,
      status: true,
      min: true,
      max: true,
      form: true,
      product: true,
      metadata: true,
      name: true,
      defaultSupplier: true,
    },
  })

  if (!pv || pv.status === 'PRIVATE') {
    throw new ServerNotification('Không tìm thấy sản phẩm')
  }
  if (pv.status === 'STOPPED') {
    throw new ServerNotification('Sản phẩm đã ngừng bán')
  }
  if (pv.min && quantity < pv.min) {
    throw new ServerNotification(`Số lượng mua tối thiểu là ${pv.min}`)
  }
  if (pv.max && quantity > pv.max) {
    throw new ServerNotification(`Số lượng mua tối đa là ${pv.max}`)
  }
  if (pv.form && !shippingFields) {
    throw new ServerNotification('Vui lòng cung cấp thông tin giao hàng')
  }

  let formSubmissionInput:
    | {
        formId: number
        submissionData: Record<string, unknown>
      }
    | undefined

  if (pv.form) {
    const form =
      typeof pv.form === 'object'
        ? (pv.form as Form)
        : await payload.findByID({
            collection: 'forms',
            id: pv.form,
            depth: 0,
            overrideAccess: true,
          })

    if (!form || !form.fields?.length) {
      throw new ServerNotification('Vui lòng điền đầy đủ thông tin giao hàng')
    }

    formSubmissionInput = {
      formId: form.id,
      submissionData: normalizeFormSubmissionData(form, shippingFields),
    }
  }

  const subTotal = quantity * pv.originalPrice
  let totalPrice = quantity * pv.price
  let totalDiscount = subTotal - totalPrice
  let voucherDiscountAmount = 0
  const db = payload.db.drizzle

  const order = await db.transaction(async (tx) => {
    // --- Voucher validation with row-level lock ---
    let voucherId: number | undefined = undefined
    let affiliateUserId: number | undefined = undefined
    let affiliateCommission = 0

    if (voucherCode) {
      // Lock the voucher row to prevent race conditions (e.g. maxUses bypass)
      const [lockedVoucher] = await tx
        .select({ id: vouchers.id })
        .from(vouchers)
        .where(eq(vouchers.code, voucherCode.toUpperCase().trim()))
        .for('update')

      if (!lockedVoucher) {
        throw new ServerNotification('Mã voucher không hợp lệ')
      }

      const { docs: fetchedVouchers } = await payload.find({
        collection: 'vouchers',
        where: { id: { equals: lockedVoucher.id } },
        limit: 1,
        depth: 0,
        overrideAccess: true,
      })
      const voucher = fetchedVouchers[0]
      if (!voucher) {
        throw new ServerNotification('Mã voucher không hợp lệ')
      }

      try {
        validateVoucher(voucher, totalPrice)
        validateVoucherScope(
          voucher,
          typeof pv.product === 'object' ? pv.product.id : pv.product,
          pv.id,
        )

        // Prevent self-referral for affiliate vouchers
        if (voucher.affiliateUser) {
          const affiliateId =
            typeof voucher.affiliateUser === 'object'
              ? voucher.affiliateUser.id
              : voucher.affiliateUser
          if (affiliateId === user.id) {
            throw new Error('Bạn không thể sử dụng mã voucher affiliate của chính mình')
          }
        }
      } catch (e) {
        throw new ServerNotification((e as Error).message)
      }

      voucherDiscountAmount = calculateVoucherDiscount(voucher, totalPrice)
      totalPrice = totalPrice - voucherDiscountAmount
      totalDiscount = totalDiscount + voucherDiscountAmount
      voucherId = voucher.id

      // Affiliate commission calculation
      if (voucher.affiliateUser && voucher.commissionType && voucher.commissionValue) {
        affiliateUserId =
          typeof voucher.affiliateUser === 'object'
            ? voucher.affiliateUser.id
            : voucher.affiliateUser
        if (voucher.commissionType === 'percentage') {
          affiliateCommission = Math.round((quantity * pv.price * voucher.commissionValue) / 100)
        } else {
          affiliateCommission = voucher.commissionValue * quantity
        }
      }
    }

    let formSubmissionId: number | undefined
    if (formSubmissionInput) {
      try {
        const [formSubmission] = await tx
          .insert(form_submissions)
          .values({
            form: formSubmissionInput.formId,
            user: user.id,
            submissionData: formSubmissionInput.submissionData,
          })
          .returning({ id: form_submissions.id })

        if (!formSubmission) {
          throw new Error('Form submission insert returned no document')
        }
        formSubmissionId = formSubmission.id
      } catch {
        throw new ServerNotification('Vui lòng điền đầy đủ thông tin giao hàng')
      }
    }

    const [newUser] = await tx
      .update(users)
      .set({ balance: sql`${users.balance} - ${totalPrice}` })
      .where(eq(users.id, user.id))
      .returning({ balance: users.balance })
    if (!newUser) throw new ServerNotification('Không tìm thấy người dùng')
    const newUserBalance = newUser.balance ?? 0
    if (newUserBalance < 0) throw new ServerNotification('Số dư không đủ')

    const defaultSupplierId =
      pv.defaultSupplier && typeof pv.defaultSupplier === 'object'
        ? pv.defaultSupplier.id
        : pv.defaultSupplier

    let cost = 0
    let revenue = totalPrice
    let supplierPaid = false

    if (defaultSupplierId) {
      const [variantSupply] = await tx
        .select()
        .from(product_variant_supplies)
        .where(
          and(
            eq(product_variant_supplies.supplier, defaultSupplierId as number),
            eq(product_variant_supplies.productVariant, pv.id as number),
          ),
        )
        .limit(1)

      if (variantSupply) {
        cost = (variantSupply.cost ?? 0) * quantity
        revenue = totalPrice - cost
        supplierPaid = variantSupply.prepaid ?? false
      }
    }

    const [order] = await tx
      .insert(orders)
      .values({
        status: 'IN_QUEUE',
        orderedBy: user.id,
        productVariant: pv.id,
        formSubmission: formSubmissionId,
        quantity: quantity,
        totalDiscount: totalDiscount,
        subTotal: subTotal,
        totalPrice: totalPrice,
        supplier: defaultSupplierId as number | undefined,
        cost: cost,
        revenue: revenue,
        supplierPaid: supplierPaid,
        ...(voucherId ? { voucher: voucherId, voucherDiscount: voucherDiscountAmount } : {}),
        ...(affiliateUserId
          ? {
              affiliateUser: affiliateUserId,
              affiliateCommission: affiliateCommission,
              affiliatePaid: false,
            }
          : {}),
      })
      .returning({
        id: orders.id,
        quantity: orders.quantity,
      })
    if (!order) throw new ServerNotification('Tạo đơn hàng thất bại')
    ;(order as any).productVariant = pv

    await tx.insert(transactions).values({
      amount: -totalPrice,
      user: user.id,
      description: `Thanh toán đơn hàng #${order.id}`,
      balance: newUserBalance,
    })

    if (voucherId) {
      await tx
        .update(vouchers)
        .set({ usedCount: sql`COALESCE(${vouchers.usedCount}, 0) + 1` })
        .where(eq(vouchers.id, voucherId))
    }

    return order
  })

  after(async () => {
    try {
      await Promise.all([
        // update product and product_variant sold
        db
          .update(products)
          .set({ sold: sql`${products.sold} + ${quantity}` })
          .where(eq(products.id, typeof pv.product === 'object' ? pv.product.id : pv.product)),
        db
          .update(product_variants)
          .set({ sold: sql`${product_variants.sold} + ${quantity}` })
          .where(eq(product_variants.id, pv.id)),
        discordWebhook({
          subject: `Thanh Toán Đơn Hàng`,
          message: `Người dùng: ${user.email} \nĐơn hàng: **#${order.id}** \nSản phẩm: **${pv.name}** x${quantity} \nSố tiền: **${formatPrice(totalPrice)}**${voucherDiscountAmount > 0 ? ` \nVoucher giảm: **${formatPrice(voucherDiscountAmount)}**` : ''}`,
          color: '#00FF00',
          channel: 'activities',
        }),
      ])
    } catch (e) {
      payload.logger.error({
        err: e,
        message: `Failed to execute after() callbacks for order #${order.id}`,
      })
    }
  })

  let updatedOrder = order as any
  const result = await autoProcessOrder(order.id)
  if (!result?.success) {
    await sendNewOrderStaffNotification(order)
  } else {
    try {
      const dbOrder = await payload.findByID({
        collection: 'orders',
        id: order.id,
        overrideAccess: true,
      })
      updatedOrder = { ...order, ...dbOrder }
    } catch (e) {
      console.error('[checkoutAction] Failed to fetch updated order status:', e)
    }
  }

  return { order: updatedOrder }
}

export const checkoutAction = authActionClient
  .schema(CheckoutSchema)
  .action(async ({ parsedInput, ctx }) => checkoutWithUser({ parsedInput, user: ctx.user }))
