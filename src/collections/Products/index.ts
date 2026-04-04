import type {
  CollectionAfterChangeHook,
  CollectionBeforeChangeHook,
  CollectionConfig,
} from 'payload'

import { hasRole, userHasRole } from '@/access/hasRoles'
import { slugField } from '@/fields/slug'
import { Product } from '@/payload-types'
import calculateDiscountPercentage from '@/utilities/calculateDiscountPercentage'
import { mediaGroup } from '@/utilities/constants'
import { defaultLexicalEditor } from '@/utilities/defaultLexicalEditor'
import { revalidateDelete, revalidateProduct } from './hooks/revalidateProduct'

export const Products: CollectionConfig = {
  slug: 'products',
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
    defaultColumns: ['name', 'status', 'image', 'slug', 'sold', 'updatedAt'],
    useAsTitle: 'name',
    group: mediaGroup,
  },
  hooks: {
    beforeChange: [
      async ({ data, req: { payload } }) => {
        // update product price range
        if (typeof data === 'number' || !data.variants || !data.variants.length) return
        let prices: number[] = []
        let discounts: number[] = []
        if (typeof data.variants[0] === 'number') {
          const { docs: variants } = await payload.find({
            collection: 'product-variants',
            where: { id: { in: data.variants }, status: { not_equals: 'PRIVATE' } },
            overrideAccess: true,
            depth: 0,
            select: { price: true, originalPrice: true, status: true },
          })

          prices = variants.map((v) => v.price)
          discounts = variants
            .filter((v) => v.status !== 'STOPPED')
            .map((v) => calculateDiscountPercentage(v.originalPrice, v.price))
        } else {
          prices = data.variants.map((v: any) => v.price)
          discounts = data.variants
            .filter((v: any) => v.status !== 'STOPPED')
            .map((v: any) => calculateDiscountPercentage(v.originalPrice, v.price))
        }
        const minPrice = Math.min(...prices)
        const maxPrice = Math.max(...prices)
        const maxDiscount = Math.max(...discounts)
        data.minPrice = minPrice
        data.maxPrice = maxPrice
        data.maxDiscount = maxDiscount
        return data
      },
    ] as CollectionBeforeChangeHook<Product>[],
    afterChange: [revalidateProduct] as CollectionAfterChangeHook<Product>[],

    beforeDelete: [revalidateDelete],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      type: 'row',
      fields: [
        {
          name: 'status',
          type: 'select',
          // defaultValue: 'STOPPED',
          options: [
            {
              label: 'Private',
              value: 'PRIVATE',
            },
            {
              label: 'Public',
              value: 'PUBLIC',
            },
            {
              label: 'Stopped',
              value: 'STOPPED',
            },
          ],
          required: true,
        },
        {
          name: 'sold',
          type: 'number',
          defaultValue: 0,
          required: true,
          access: {
            update: hasRole(['admin']),
          },
        },
      ],
    },
    {
      name: 'variants',
      type: 'relationship',
      relationTo: 'product-variants',
      hasMany: true,
      unique: true,
      // admin: { defaultColumns: ['name', 'updatedAt'] },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'minPrice',
          type: 'number',
          defaultValue: 0,
          required: true,
          admin: { readOnly: true },
          access: {
            update: hasRole(['admin']),
          },
        },
        {
          name: 'maxPrice',
          type: 'number',
          defaultValue: 0,
          required: true,
          admin: { readOnly: true },
          access: {
            update: hasRole(['admin']),
          },
        },
        {
          name: 'maxDiscount',
          type: 'number',
          defaultValue: 0,
          required: true,
          admin: { readOnly: true },
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
      label: false,
    },
    {
      name: 'relatedProducts',
      type: 'relationship',
      admin: {
        position: 'sidebar',
      },
      filterOptions: ({ id }) => {
        return {
          id: {
            not_in: [id],
          },
        }
      },
      hasMany: true,
      relationTo: 'products',
    },
    {
      name: 'categories',
      type: 'relationship',
      admin: {
        position: 'sidebar',
      },
      hasMany: true,
      relationTo: 'categories',
    },
    // {
    //   type: 'tabs',
    //   tabs: [
    //     {
    //       fields: [],
    //       label: 'Content',
    //     },
    //     {
    //       fields: [],
    //       label: 'Meta',
    //     },
    //   ],
    // },
    ...slugField(),
  ],
}
