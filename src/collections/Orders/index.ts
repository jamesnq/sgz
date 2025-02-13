import { APIError, type Access, type CollectionConfig } from 'payload'

import { authenticated } from '@/access/authenticated'
import { hasRole } from '@/access/hasRoles'
import { noOne } from '@/access/noOne'
import { Banner } from '@/blocks/Banner/config'
import { Code } from '@/blocks/Code/config'
import { MediaBlock } from '@/blocks/MediaBlock/config'
import { sql } from '@payloadcms/db-postgres'
import { eq } from '@payloadcms/db-postgres/drizzle'
import {
  BlocksFeature,
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import hasRoleOrOrderBy from './access/hasRoleOrOrderBy'

class ConflictsError extends APIError {
  constructor(message: string) {
    super(message, 400, undefined, true)
  }
}
const orderByOrAdmin: Access = ({ req }) => {
  // allow read to admin and staff or orderedBy
  if (!hasRole(['admin', 'staff'])({ req })) return false
  return { orderedBy: { equals: req.user?.id } }
}

export const Orders: CollectionConfig = {
  slug: 'orders',
  access: {
    read: orderByOrAdmin,
    update: hasRoleOrOrderBy(['admin', 'staff']),
    create: authenticated,
    delete: hasRole(['admin']),
  },
  hooks: {
    beforeChange: [
      ({ originalDoc, data, req }) => {
        const user = req.user
        if (!user) throw new ConflictsError('Not authenticated')
        if (originalDoc.status == 'REFUND') {
        }
        if (!data.handlers.includes(user.id)) {
          data.handlers.push(user.id)
        }
        return data
      },
    ],
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
  },
  fields: [
    {
      name: 'note',
      type: 'richText',
      admin: {
        description: 'Internal note only admin and staff can see',
      },
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
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [
            ...rootFeatures,
            HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
            BlocksFeature({ blocks: [Banner, Code, MediaBlock] }),
            FixedToolbarFeature(),
            InlineToolbarFeature(),
            HorizontalRuleFeature(),
          ]
        },
      }),
      access: {
        create: hasRole(['admin', 'staff']),
        read: hasRole(['admin', 'staff']),
        update: hasRole(['admin', 'staff']),
      },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'PENDING',
      access: {
        create: hasRole(['admin', 'staff']),
        update: hasRole(['admin', 'staff']),
      },
      hooks: {
        beforeChange: [
          async ({ data, value, previousValue, operation, req: { payload, user } }) => {
            if (!user) throw new ConflictsError('Not authenticated')
            if (operation !== 'update' || !previousValue || !data) return data
            if (previousValue === 'REFUND' && value !== 'REFUND')
              throw new ConflictsError('Không thể cập nhật trạng thái đơn hàng đã hoàn trả')
            if (previousValue !== 'REFUND' && value === 'REFUND') {
              const { users, transactions } = payload.db.tables
              await payload.db.drizzle.transaction(async (tx) => {
                const [newUser] = await tx
                  .update(users)
                  .set({ balance: sql`${users.balance} + ${data.totalPrice}` })
                  .where(eq(users.id, user.id))
                  .returning({ balance: users.balance })
                if (!newUser) throw new ConflictsError('Không tìm thấy người dùng')

                await tx.insert(transactions).values({
                  amount: data.totalPrice,
                  user: user.id,
                  description: `Hoàn trả đơn hàng #${data.id}`,
                  balance: newUser.balance,
                })
              })
            }

            return value
          },
        ],
      },
      options: [
        { value: 'PENDING', label: 'Pending' },
        { value: 'IN_QUEUE', label: 'In Queue' },
        { value: 'IN_PROCESS', label: 'In Process' },
        { value: 'COMPLETED', label: 'Completed' },
        { value: 'CANCELLED', label: 'Cancelled' },
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
