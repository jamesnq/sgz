'use server'
import { Form, Product } from '@/payload-types'
import { authActionClient, ServerNotification } from '@/utilities/safe-action'
import payloadConfig from '@payload-config'
import { sql } from '@payloadcms/db-postgres'
import { eq } from '@payloadcms/db-postgres/drizzle'
import { getPayload } from 'payload'
import { CheckoutSchema } from './schema'
import { after } from 'next/server'
import { novu } from '@/services/novu.service'
import { formatOrderDate } from '@/utilities/formatOrderDate'

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
        status: true,
        sku: true,
        min: true,
        max: true,
        form: true,
        product: true,
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

    const totalPrice = quantity * pv.price
    const { users, transactions, orders } = payload.db.tables

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
      if (newUser.balance < 0) throw new ServerNotification('Số dư không đủ')

      const [order] = await tx
        .insert(orders)
        .values({
          status: 'IN_QUEUE',
          orderedBy: user.id,
          productVariant: pv.id,
          formSubmission: formSubmissionId,
          quantity,
          totalPrice,
        })
        .returning({ id: orders.id, orderedBy: orders.orderedBy, createdAt: orders.createdAt })
      if (!order) throw new ServerNotification('Tạo đơn hàng thất bại')
      await tx.insert(transactions).values({
        amount: -totalPrice,
        user: user.id,
        description: `Thanh toán đơn hàng #${order.id}`,
        balance: newUser.balance,
      })
      return order
    })
    after(async () => {
      // update product and product_variant sold
      const { products, product_variants } = payload.db.tables
      await Promise.all([
        db
          .update(products)
          .set({ sold: sql`${products.sold} + ${quantity}` })
          .where(eq(products.id, (pv.product as Product).id)),
        db
          .update(product_variants)
          .set({ sold: sql`${product_variants.sold} + ${quantity}` })
          .where(eq(product_variants.id, pv.id)),
        novu.trigger({
          workflowId: 'new-order',
          to: {
            subscriberId: order.orderedBy.toString(),
          },
          payload: {
            orderId: order.id,
            createAt: formatOrderDate(new Date(order.createdAt)),
          },
        }),
      ])
    })
    return { order }
  })
