import type { CollectionConfig } from 'payload'

import { anyone } from '@/access/anyone'

import { hasRole } from '@/access/hasRoles'
import { defaultLexicalEditor } from '@/utilities/defaultLexicalEditor'

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
  // TODO: add hooks
  // hooks: {
  //   afterChange: [revalidatePost],
  //   afterRead: [populateAuthors],
  //   afterDelete: [revalidateDelete],
  // },
}
