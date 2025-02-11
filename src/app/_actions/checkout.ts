'use server'
import { Form } from '@/payload-types'
import { authActionClient } from '@/utilities/safe-action'
import payloadConfig from '@payload-config'
import { sql } from '@payloadcms/db-postgres'
import { eq } from '@payloadcms/db-postgres/drizzle'
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
        status: true,
        sku: true,
        min: true,
        max: true,
        form: true,
      },
    })

    if (!pv) {
      throw new Error('Không tìm thấy sản phẩm')
    }
    if (pv.status == 'STOPPED') {
      throw new Error('Sản phẩm đã ngừng bán')
    }
    if (pv.min && quantity < pv.min) {
      throw new Error(`Số lượng mua tối thiểu là ${pv.min}`)
    }
    if (pv.max && quantity > pv.max) {
      throw new Error(`Số lượng mua tối đa là ${pv.max}`)
    }
    if (pv.form && !shippingFields) {
      throw new Error('Vui lòng cung cấp thông tin giao hàng')
    }

    const totalPrice = quantity * pv.price
    const { users, transactions, orders } = payload.db.tables

    const order = await payload.db.drizzle.transaction(async (tx) => {
      const [newUser] = await tx
        .update(users)
        .set({ balance: sql`${users.balance} - ${totalPrice}` })
        .where(eq(users.id, user.id))
        .returning({ balance: users.balance })
      if (!newUser) throw new Error('User not found')
      let formSubmissionId: any = undefined
      // TODO validate form submission
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
        .returning({ id: orders.id })
      if (!order) throw new Error('Order not found')
      const transaction = await tx.insert(transactions).values({
        amount: -totalPrice,
        user: user.id,
        description: `Thanh toán đơn hàng #${order.id}`,
        balance: newUser.balance,
      })
      return order
    })

    return { order }
  })
