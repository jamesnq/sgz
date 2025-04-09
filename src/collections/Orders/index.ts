import {
  APIError,
  CollectionAfterChangeHook,
  CollectionBeforeChangeHook,
  FieldHook,
  type Access,
  type CollectionConfig,
} from 'payload'

import { authenticated } from '@/access/authenticated'
import { hasRole } from '@/access/hasRoles'
import { noOne } from '@/access/noOne'
import { transactions, users } from '@/payload-generated-schema'
import { Order } from '@/payload-types'
import {
  discordWebhook,
  sendOrderCompletedStaffNotification,
  sendOrderUpdateRequiredNotification,
  sendOrderUserUpdatedStaffNotification,
} from '@/services/novu.service'
import { managerGroup } from '@/utilities/constants'
import { defaultLexicalEditor } from '@/utilities/defaultLexicalEditor'
import { formatPrice } from '@/utilities/formatPrice'
import { eq, sql } from '@payloadcms/db-postgres/drizzle'
import { after } from 'next/server'
import hasRoleOrOrderBy from './access/hasRoleOrOrderBy'

class ConflictsError extends APIError {
  constructor(message: string) {
    super(message, 400, undefined, true)
  }
}
const orderByOrAdmin: Access = ({ req }) => {
  // allow read to admin and staff or orderedBy
  if (hasRole(['admin', 'staff'])({ req })) return true
  return { orderedBy: { equals: req.user?.id } }
}

// hooks
const trackHandlersHook: CollectionBeforeChangeHook<Order> = ({ data, req, operation }) => {
  if (operation !== 'update' || !data) return

  const user = req.user
  if (!user) throw new ConflictsError('Not authenticated')
  const userId = typeof user === 'object' ? user.id : user
  const orderedById = typeof data.orderedBy === 'object' ? data.orderedBy.id : data.orderedBy

  if (userId != orderedById && !(data.handlers as number[]).includes(userId)) {
    ;(data.handlers as number[]).push(userId)
  }
  return data
}
const notificationUpdateHook: CollectionAfterChangeHook<Order> = async ({
  previousDoc,
  doc,
  operation,
  req,
}) => {
  if (operation !== 'update' || !previousDoc) return
  const user = req.user
  if (!user) throw new ConflictsError('Not authenticated')
  const userId = typeof user === 'object' ? user.id : user
  if (previousDoc.status != doc.status) {
    if (doc.status === 'USER_UPDATE') {
      await sendOrderUpdateRequiredNotification(doc.id, doc.orderedBy.toString())
    }
    if (
      previousDoc.status === 'USER_UPDATE' &&
      doc.status != 'USER_UPDATE' &&
      userId == doc.orderedBy
    ) {
      await sendOrderUserUpdatedStaffNotification(doc.id)
    }
    // Send notification to Discord staff when order is completed
    if (
      doc.status === 'COMPLETED' &&
      previousDoc.status !== 'COMPLETED' &&
      // handle duplicate with auto completed
      previousDoc.status !== 'IN_QUEUE'
    ) {
      await sendOrderCompletedStaffNotification(doc)
    }
  }
}

const refundHook: FieldHook<Order> = async ({
  data,
  value,
  previousValue,
  operation,
  req: { payload },
}) => {
  if (operation !== 'update' || !previousValue || !data) return data
  if (previousValue === 'REFUND' && value !== 'REFUND')
    throw new ConflictsError('Không thể cập nhật trạng thái đơn hàng đã hoàn trả')
  if (previousValue !== 'REFUND' && value === 'REFUND') {
    const orderBy = data.orderedBy
    if (!orderBy) throw new ConflictsError('Không tìm thấy người dùng')
    if (!data.totalPrice) throw new ConflictsError('Không tìm thấy giá trị đơn hàng')

    const { newUser } = await payload.db.drizzle.transaction(async (tx) => {
      const [newUser] = await tx
        .update(users)
        .set({ balance: sql`${users.balance} + ${data.totalPrice}` })
        .where(eq(users.id, orderBy as number))
        .returning({ balance: users.balance, email: users.email })
      if (!newUser || !newUser.balance) throw new ConflictsError('Không tìm thấy người dùng')

      await tx.insert(transactions).values({
        amount: (data.totalPrice as number).toString(),
        user: orderBy as number,
        description: `Hoàn trả đơn hàng #${data.id}`,
        balance: newUser.balance,
      })
      return { newUser }
    })
    after(async () => {
      await discordWebhook({
        subject: `Hoàn Trả Đơn Hàng`,
        message: `${newUser.email} \nĐơn hàng: **#${data.id}** \nSố tiền: **${formatPrice(data.totalPrice as number)}**`,
        color: '#FF0000',
        channel: 'activities',
      })
    })
  }

  return value
}

// TODO add customer review when complete order

export const Orders: CollectionConfig = {
  slug: 'orders',
  access: {
    read: orderByOrAdmin,
    update: hasRoleOrOrderBy(['admin', 'staff']),
    create: authenticated,
    delete: hasRole(['admin']),
  },
  hooks: {
    beforeChange: [trackHandlersHook],
    afterChange: [notificationUpdateHook],
  },
  admin: {
    defaultColumns: [
      'id',
      'status',
      'orderedBy',
      'productVariant',
      'quantity',
      'totalPrice',
      'createdAt',
    ],
    useAsTitle: 'id',
    group: managerGroup,
  },
  fields: [
    {
      name: 'note',
      type: 'richText',
      admin: {
        description: 'Internal note only admin and staff can see',
      },
      editor: defaultLexicalEditor,
      access: {
        create: hasRole(['admin', 'staff']),
        read: hasRole(['admin', 'staff']),
        update: hasRole(['admin', 'staff']),
      },
    },
    {
      name: 'message',
      type: 'richText',
      admin: {
        description: 'Message want to send to customer',
      },
      editor: defaultLexicalEditor,
      access: {
        create: hasRole(['admin', 'staff']),
        update: hasRole(['admin', 'staff']),
      },
    },
    {
      name: 'deliveryContent',
      type: 'richText',
      admin: {
        description: 'Delivery content like key, account,...',
      },
      editor: defaultLexicalEditor,
      access: {
        create: hasRole(['admin', 'staff']),
        update: hasRole(['admin', 'staff']),
      },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'IN_QUEUE',
      access: {
        create: hasRole(['admin', 'staff']),
        update: hasRole(['admin', 'staff']),
      },
      hooks: {
        beforeChange: [refundHook],
      },
      options: [
        { value: 'IN_QUEUE', label: 'In Queue' },
        { value: 'IN_PROCESS', label: 'In Process' },
        { value: 'USER_UPDATE', label: 'User Update' },
        { value: 'COMPLETED', label: 'Completed' },
        { value: 'REFUND', label: 'Refund' },
      ],
      required: true,
    },
    {
      name: 'orderedBy',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: {
        readOnly: true,
      },
      access: {
        create: noOne,
        update: noOne,
      },
    },
    {
      name: 'handlers',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      hasMany: true,
      defaultValue: [],
      admin: {
        readOnly: true,
      },
      access: {
        create: noOne,
        update: noOne,
      },
    },
    {
      name: 'productVariant',
      type: 'relationship',
      relationTo: 'product-variants',
      required: true,
      access: {
        update: noOne,
        create: noOne,
      },
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'formSubmission',
      type: 'relationship',
      relationTo: 'form-submissions',
      admin: {
        readOnly: true,
      },
      access: {
        create: noOne,
        update: noOne,
      },
    },
    {
      name: 'subTotal',
      type: 'number',
      required: true,
      access: {
        create: noOne,
        update: noOne,
      },
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'totalDiscount',
      type: 'number',
      required: true,
      access: {
        create: noOne,
        update: noOne,
      },
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'totalPrice',
      type: 'number',
      required: true,
      access: {
        create: noOne,
        update: noOne,
      },
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'quantity',
      type: 'number',
      required: true,
      access: {
        create: noOne,
        update: noOne,
      },
      admin: {
        readOnly: true,
      },
    },
  ],
  timestamps: true,
}
