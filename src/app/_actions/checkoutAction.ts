'use server'
import { orders, product_variants, products, transactions, users } from '@/payload-generated-schema'
import { Form, Product } from '@/payload-types'
import { discordWebhook, sendNewOrderStaffNotification } from '@/services/novu.service'
import { autoProcessOrder } from '@/services/orderProcessing'
import { authActionClient, ServerNotification } from '@/utilities/safe-action'
import { formatPrice } from '@/utilities/formatPrice'
import payloadConfig from '@payload-config'
import { sql } from '@payloadcms/db-postgres'
import { eq } from '@payloadcms/db-postgres/drizzle'
import { after } from 'next/server'
import { getPayload } from 'payload'
import { CheckoutSchema } from './schema'

export const checkoutAction = authActionClient
  .schema(CheckoutSchema)
  .action(async ({ parsedInput: { productVariantId, quantity, shippingFields }, ctx }) => {
    const { user } = ctx
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
        sku: true,
        min: true,
        max: true,
        form: true,
        product: true,
        metadata: true,
        name: true,
      },
    })
    if (!pv) {
      throw new ServerNotification('Không tìm thấy sản phẩm')
    }
    if (pv.status == 'STOPPED') {
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
    const totalPrice = quantity * pv.price
    const totalDiscount = subTotal - totalPrice

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
    } catch {
      throw new ServerNotification('Vui lòng điển đầy đủ thông tin giao hàng')
    }
    const db = payload.db.drizzle
    const order = await db.transaction(async (tx) => {
      const [newUser] = await tx
        .update(users)
        .set({ balance: sql`${users.balance} - ${totalPrice}` })
        .where(eq(users.id, user.id))
        .returning({ balance: users.balance })
      if (!newUser) throw new ServerNotification('Không tìm thấy người dùng')
      const newUserBalance = parseFloat(newUser.balance as string)
      if (newUserBalance < 0) throw new ServerNotification('Số dư không đủ')

      const [order] = await tx
        .insert(orders)
        .values({
          status: 'IN_QUEUE',
          orderedBy: user.id,
          productVariant: pv.id,
          formSubmission: formSubmissionId,
          quantity: quantity.toString(),
          totalDiscount: totalDiscount.toString(),
          subTotal: subTotal.toString(),
          totalPrice: totalPrice.toString(),
        })
        .returning({
          id: orders.id,
          quantity: orders.quantity,
        })
      if (!order) throw new ServerNotification('Tạo đơn hàng thất bại')
      ;(order as any).productVariant = pv
      await tx.insert(transactions).values({
        amount: (-totalPrice).toString(),
        user: user.id,
        description: `Thanh toán đơn hàng #${order.id}`,
        balance: newUserBalance.toString(),
      })
      return order
    })
    after(async () => {
      // update product and product_variant sold

      await Promise.all([
        db
          .update(products)
          .set({ sold: sql`${products.sold} + ${quantity}` })
          .where(eq(products.id, (pv.product as Product).id)),
        db
          .update(product_variants)
          .set({ sold: sql`${product_variants.sold} + ${quantity}` })
          .where(eq(product_variants.id, pv.id)),
        // sendNewOrderNotification(order.id, order.orderedBy.toString(), new Date(order.createdAt)),
        discordWebhook({
          subject: `Thanh Toán Đơn Hàng`,
          message: `Người dùng: ${user.email} \nĐơn hàng: **#${order.id}** \nSản phẩm: **${pv.name}** x${quantity} \nSố tiền: **${formatPrice(totalPrice)}**`,
          color: '#00FF00',
          channel: 'activities',
        }),
      ])
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
  })
