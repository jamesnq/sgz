import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionConfig,
} from 'payload'

import { anyone } from '@/access/anyone'

import { hasRole } from '@/access/hasRoles'
import { ProductVariant } from '@/payload-types'
import { defaultLexicalEditor } from '@/utilities/defaultLexicalEditor'
import { revalidatePath } from 'next/cache'

const revalidateProduct: CollectionAfterChangeHook<ProductVariant> = async ({
  doc,
  req: { payload },
}) => {
  if (!doc.product || typeof doc.product !== 'number') return

  const product = await payload.findByID({
    collection: 'products',
    id: doc.product,
    overrideAccess: true,
  })

  if (!product || !product.slug) {
    payload.logger.error(`Product not found or missing slug for id: ${doc.product}`)
    return doc
  }

  const path = `/products/${product.slug}`

  payload.logger.info(`Revalidating product at path: ${path}`)
  revalidatePath(path)
}
const revalidateDelete: CollectionAfterDeleteHook<ProductVariant> = async ({
  doc,
  req: { payload, context },
}) => {
  if (!doc.product || typeof doc.product !== 'number') return

  const product = await payload.findByID({
    collection: 'products',
    id: doc.product,
    overrideAccess: true,
  })

  if (!product || !product.slug) {
    payload.logger.error(`Product not found or missing slug for id: ${doc.product}`)
    return doc
  }

  if (!context.disableRevalidate) {
    const path = `/products/${product.slug}`
    payload.logger.info(`Revalidating product at path: ${path}`)
    revalidatePath(path)
  }
}

export const ProductVariants: CollectionConfig = {
  slug: 'product-variants',
  access: {
    read: anyone,
    update: hasRole(['admin', 'staff']),
    create: hasRole(['admin']),
    delete: hasRole(['admin']),
  },
  admin: {
    defaultColumns: ['product', 'name', 'sold', 'updatedAt'],
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
          label: 'Đặt hàng',
          value: 'ORDER',
        },
        {
          label: 'Giao ngay',
          value: 'AVAILABLE',
        },
        {
          label: 'Ngừng bán',
          value: 'STOPPED',
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
  ],
  hooks: {
    afterChange: [revalidateProduct],
    afterDelete: [revalidateDelete],
  },
}
