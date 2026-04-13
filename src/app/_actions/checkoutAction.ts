'use server'
import { config } from '@/config'
import { orders, product_variants, products, transactions, users, vouchers } from '@/payload-generated-schema'
import { Form, Product } from '@/payload-types'
import { discordWebhook, sendNewOrderStaffNotification } from '@/services/novu.service'
import { autoProcessOrder } from '@/services/orderProcessing'
import { formatPrice } from '@/utilities/formatPrice'
import { checkRateLimit, RATE_LIMITS } from '@/utilities/rateLimit'
import { authActionClient, ServerNotification } from '@/utilities/safe-action'
import {
  validateVoucher,
  calculateVoucherDiscount,
  validateVoucherScope,
} from '@/utilities/voucher'
import payloadConfig from '@payload-config'
import { sql } from '@payloadcms/db-postgres'
import { eq } from '@payloadcms/db-postgres/drizzle'
import { after } from 'next/server'
import { getPayload } from 'payload'
import { CheckoutSchema } from './schema'

export const checkoutAction = authActionClient
  .schema(CheckoutSchema)
  .action(
    async ({ parsedInput: { productVariantId, quantity, shippingFields, voucherCode }, ctx }) => {
      const { user } = ctx

      const rl = checkRateLimit(user.id, RATE_LIMITS.checkout)
      if (!rl.allowed) {
        throw new ServerNotification(`Bạn thao tác quá nhanh, vui lòng thử lại sau ${Math.ceil(rl.retryAfterMs / 1000)}s`)
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
      const subTotal = quantity * pv.originalPrice
      let totalPrice = quantity * pv.price
      let totalDiscount = subTotal - totalPrice

      let formSubmissionId: any = undefined
      try {
        if (pv.form) {
          const res = await payload.create({
            collection: 'form-submissions',
            data: {
              form: (pv.form as Form).id,
              user: user.id,
              submissionData: shippingFields,
            },
          })
          formSubmissionId = res.id
        }
      } catch (e) {
        console.log(e)
        throw new ServerNotification('Vui lòng điền đầy đủ thông tin giao hàng')
      }

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
        const [newUser] = await tx
          .update(users)
          .set({ balance: sql`${users.balance} - ${totalPrice}` })
          .where(eq(users.id, user.id))
          .returning({ balance: users.balance })
        if (!newUser) throw new ServerNotification('Không tìm thấy người dùng')
        const newUserBalance = newUser.balance ?? 0
        if (newUserBalance < 0) throw new ServerNotification('Số dư không đủ')

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
            ...(voucherId
              ? { voucher: voucherId, voucherDiscount: voucherDiscountAmount }
              : {}),
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
            // update supplier
            (async () => {
              const defaultSupplierId =
                pv.defaultSupplier && typeof pv.defaultSupplier === 'object'
                  ? pv.defaultSupplier.id
                  : pv.defaultSupplier
              await payload.update({
                collection: 'orders',
                where: { id: { equals: order.id } },
                data: { supplier: defaultSupplierId },
                user: config.AUTO_PROCESS_USER_ID,
                limit: 1,
              })
            })(),
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
          payload.logger.error({ err: e, message: `Failed to execute after() callbacks for order #${order.id}` })
        }
      })
      const result = await autoProcessOrder(order.id)
      if (!result?.success) {
        await sendNewOrderStaffNotification(order)
      }

      // if (
      //   pv.metadata &&
      //   typeof pv.metadata === 'object' &&
      //   'isAuto' in pv.metadata &&
      //   pv.metadata.isAuto &&
      //   'type' in pv.metadata
      // ) {
      //   const result = await autoProcessOrder(order.id)
      // }
      return { order }
    },
  )
