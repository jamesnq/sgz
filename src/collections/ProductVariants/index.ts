import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionConfig,
  Payload,
} from 'payload'
import { anyone } from '@/access/anyone'
import { hasRole } from '@/access/hasRoles'
import { ProductVariant } from '@/payload-types'
import { defaultLexicalEditor } from '@/utilities/defaultLexicalEditor'
import { revalidatePath } from 'next/cache'

const revalidateProductPath = async (payload: Payload, productId: number) => {
  const product = await payload.findByID({
    collection: 'products',
    id: productId,
    overrideAccess: true,
  })

  if (!product || !product.slug) {
    payload.logger.error(`Product not found or missing slug for id: ${productId}`)
    return null
  }

  const path = `/products/${product.slug}`
  payload.logger.info(`Revalidating product at path: ${path}`)
  revalidatePath(path)
  return path
}

const revalidateProduct: CollectionAfterChangeHook<ProductVariant> = async ({
  doc,
  req: { payload },
}) => {
  if (typeof doc.product === 'number') {
    await revalidateProductPath(payload, doc.product)
  }
  return doc
}

const revalidateDelete: CollectionAfterDeleteHook<ProductVariant> = async ({
  doc,
  req: { payload, context },
}) => {
  if (typeof doc.product === 'number' && !context.disableRevalidate) {
    await revalidateProductPath(payload, doc.product)
  }
  return doc
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
    {
      name: 'metadata',
      type: 'json',
    },
  ],
  hooks: {
    afterChange: [revalidateProduct],
    afterDelete: [revalidateDelete],
  },
}
