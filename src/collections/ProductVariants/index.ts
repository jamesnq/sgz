import { hasRole, userHasRole } from '@/access/hasRoles'
import { ProductVariant } from '@/payload-types'
import { defaultLexicalEditor } from '@/utilities/defaultLexicalEditor'
import type { CollectionAfterChangeHook, CollectionConfig } from 'payload'
import { revalidateProductPath } from '../Products/hooks/revalidateProduct'

const revalidateProduct: CollectionAfterChangeHook<ProductVariant> = async ({
  doc,
  req: { payload },
}) => {
  const productId = typeof doc.product === 'number' ? doc.product : doc.product.id
  await revalidateProductPath(payload, productId)
}

export const ProductVariants: CollectionConfig = {
  slug: 'product-variants',
  access: {
    read: ({ req: { user } }) => {
      const test = userHasRole(user, ['admin', 'staff'])
      if (test) return true
      return { status: { not_equals: 'PRIVATE' } }
    },
    update: hasRole(['admin', 'staff']),
    create: hasRole(['admin']),
    delete: hasRole(['admin']),
  },
  admin: {
    defaultColumns: ['name', 'product', 'sold', 'updatedAt'],
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'product',
      type: 'relationship',
      relationTo: 'products',
      required: true,
    },
    {
      name: 'important',
      type: 'richText',
      editor: defaultLexicalEditor,
    },
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'status',
      type: 'select',
      // defaultValue: 'ORDER',
      options: [
        {
          label: 'Order',
          value: 'ORDER',
        },
        {
          label: 'Available',
          value: 'AVAILABLE',
        },
        {
          label: 'Stopped',
          value: 'STOPPED',
        },
        {
          label: 'Private',
          value: 'PRIVATE',
        },
      ],
      required: true,
    },
    {
      name: 'form',
      type: 'relationship',
      relationTo: 'forms',
    },
    {
      name: 'sold',
      type: 'number',
      defaultValue: 0,
      required: true,
      access: {
        read: hasRole(['admin']),
        update: hasRole(['admin']),
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'originalPrice',
          type: 'number',
          required: true,
          access: {
            update: hasRole(['admin']),
          },
        },
        {
          name: 'price',
          type: 'number',
          required: true,
          access: {
            update: hasRole(['admin']),
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'min',
          type: 'number',
          defaultValue: 1,
          required: true,
          access: {
            update: hasRole(['admin']),
          },
        },
        {
          name: 'max',
          type: 'number',
          defaultValue: 1,
          required: true,
          access: {
            update: hasRole(['admin']),
          },
        },
      ],
    },

    {
      name: 'note',
      type: 'textarea',
      access: {
        read: hasRole(['admin', 'staff']),
        update: hasRole(['admin', 'staff']),
      },
    },
    {
      name: 'description',
      type: 'richText',
      editor: defaultLexicalEditor,
      label: 'Description',
    },
    {
      name: 'metadata',
      type: 'json',
      access: {
        read: hasRole(['admin']),
        update: hasRole(['admin']),
        create: hasRole(['admin']),
      },
    },
  ],
  hooks: {
    afterChange: [revalidateProduct],
  },
}
