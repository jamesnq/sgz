import {
  CollectionAfterChangeHook,
  CollectionBeforeChangeHook,
  FieldHook,
  type Access,
  type CollectionConfig,
} from 'payload'

import { authenticated } from '@/access/authenticated'
import { hasRole, userHasRole } from '@/access/hasRoles'
import { noOne } from '@/access/noOne'
import { transactions, users } from '@/payload-generated-schema'
import { Order } from '@/payload-types'
import {
  discordWebhook,
  sendOrderCompletedStaffNotification,
  sendOrderUpdateRequiredNotification,
  sendOrderUserUpdatedStaffNotification,
} from '@/services/novu.service'
import ConflictsError from '@/utilities/ConflictsError'
import { managerGroup } from '@/utilities/constants'
import { defaultLexicalEditor } from '@/utilities/defaultLexicalEditor'
import { formatPrice } from '@/utilities/formatPrice'
import { eq, sql } from '@payloadcms/db-postgres/drizzle'
import { after } from 'next/server'
import hasRoleOrOrderBy from './access/hasRoleOrOrderBy'

const orderByOrAdmin: Access = ({ req }) => {
  // allow read to admin and staff or orderedBy
  if (hasRole(['admin', 'staff'])({ req })) return true
  return { orderedBy: { equals: req.user?.id } }
}

// hooks
const trackHandlersHook: CollectionBeforeChangeHook<Order> = ({ data, req, operation }) => {
  const user = req.user
  if (operation !== 'update' || !data || !user) return data
  const userId = typeof user === 'object' ? user.id : user

  if (userHasRole(user, ['admin', 'staff']) && !(data.handlers as number[]).includes(userId)) {
    data.handlers = Array.from(new Set([...(data.handlers as number[]), userId]))
  }
  return data
}

const calculateAnalysisHook: CollectionBeforeChangeHook<Order> = async ({
  data,
  originalDoc,
  req: { payload },
}) => {
  if (!data) return data
  if (!data.supplier) {
    data.revenue = data.totalPrice
    data.cost = 0
    return data
  }
  if (originalDoc?.supplier != data.supplier && data.supplier) {
    const supplierId = typeof data.supplier === 'object' ? data.supplier.id : data.supplier
    const productVariantId =
      typeof data.productVariant === 'object' ? data.productVariant.id : data.productVariant
    const { docs: variantSupplies } = await payload.find({
      collection: 'product-variant-supplies',
      where: {
        supplier: { equals: supplierId },
        productVariant: { equals: productVariantId },
      },
      depth: 0,
      pagination: false,
      overrideAccess: true,
    })
    const variantSupply = variantSupplies[0]
    if (!variantSupply) throw new ConflictsError('Product not found from the supplier')
    if (data.supplierPaid === null) {
      data.supplierPaid = variantSupply.prepaid
    }
    data.cost = variantSupply.cost * Number(data.quantity)
    data.revenue = Number(data.totalPrice) - data.cost
    return data
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
  if (operation !== 'update' || !previousValue || !data || previousValue === value) return value
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
    beforeChange: [trackHandlersHook, calculateAnalysisHook] as CollectionBeforeChangeHook<Order>[],
    afterChange: [notificationUpdateHook] as CollectionAfterChangeHook<Order>[],
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
    {
      name: 'supplier',
      type: 'relationship',
      relationTo: 'suppliers',
      access: {
        create: hasRole(['admin']),
        update: hasRole(['admin']),
      },
    },
    {
      name: 'supplierPaid',
      type: 'checkbox',
      access: {
        create: hasRole(['admin']),
        update: hasRole(['admin']),
      },
    },
    {
      name: 'cost',
      type: 'number',
      access: {
        create: hasRole(['admin']),
        update: hasRole(['admin']),
      },
    },
    {
      name: 'revenue',
      type: 'number',
      access: {
        create: hasRole(['admin']),
        update: hasRole(['admin']),
      },
    },
    {
      name: 'voucher',
      type: 'relationship',
      relationTo: 'vouchers',
      admin: {
        readOnly: true,
      },
      access: {
        create: noOne,
        update: noOne,
      },
    },
    {
      name: 'voucherDiscount',
      type: 'number',
      admin: {
        readOnly: true,
        description: 'Số tiền giảm từ voucher',
      },
      access: {
        create: noOne,
        update: noOne,
      },
    },
    // --- Affiliate Tracking ---
    {
      name: 'affiliateUser',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        readOnly: true,
        description: 'Người sáng tạo nội dung nhận hoa hồng',
      },
      access: {
        create: noOne,
        update: noOne,
      },
    },
    {
      name: 'affiliateCommission',
      type: 'number',
      admin: {
        readOnly: true,
        description: 'Số tiền hoa hồng affiliate (VND)',
      },
      access: {
        create: noOne,
        update: noOne,
      },
    },
    {
      name: 'affiliatePaid',
      type: 'checkbox',
      defaultValue: false,
      access: {
        create: hasRole(['admin']),
        update: hasRole(['admin']),
      },
      admin: {
        description: 'Đánh dấu đã thanh toán hoa hồng cho affiliate',
      },
    },
  ],
  timestamps: true,
}
