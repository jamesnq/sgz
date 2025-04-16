import { anyone } from '@/access/anyone'
import { hasRole, userHasRole } from '@/access/hasRoles'
import { ProductVariant } from '@/payload-types'
import { mediaGroup } from '@/utilities/constants'
import { defaultLexicalEditor } from '@/utilities/defaultLexicalEditor'
import { FieldHook, type CollectionAfterChangeHook, type CollectionConfig } from 'payload'
import { revalidateProductPath, updateProductPriceRange } from '../Products/hooks/revalidateProduct'

const revalidateProduct: CollectionAfterChangeHook<ProductVariant> = async ({
  doc,
  req: { payload },
}) => {
  const productId = typeof doc.product === 'number' ? doc.product : doc.product.id
  await revalidateProductPath(payload, productId)
}

// export const updateProductPriceRange = async (
//   payload: Payload,
//   productId: number,
//   productVariant?: ProductVariant,
// ) => {
//   const product = await payload.findByID({
//     collection: 'products',
//     id: productId,
//     overrideAccess: true,
//     depth: 1,
//     select: { variants: true, minPrice: true, maxPrice: true },
//   })
//   if (!product || !product.variants) return
//   if (productVariant) {
//     product.variants = product.variants.filter((v: any) => v.id !== productVariant.id)
//     product.variants.push(productVariant)
//   }
//   const prices = product.variants.map((v: any) => v.price).filter((p) => typeof p === 'number')
//   const minPrice = Math.min(...prices)
//   const maxPrice = Math.max(...prices)
//   if (prices.length > 0 && (product.minPrice !== minPrice || product.maxPrice !== maxPrice)) {
//     // use drizzle to avoid update loop
//     const db = payload.db.drizzle
//     await db
//       .update(products)
//       .set({
//         minPrice: minPrice.toString(),
//         maxPrice: maxPrice.toString(),
//       })
//       .where(eq(products.id, productId))
//   }
// }

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
    group: mediaGroup,
  },
  hooks: {
    afterChange: [
      async ({ previousDoc, doc, req: { payload } }) => {
        // update product price range
        if (previousDoc.price == doc.price) {
          console.log('Price not changed, skipping')
          return
        }
        const productId = typeof doc.product === 'number' ? doc.product : doc.product.id
        const product = await payload.findByID({
          collection: 'products',
          id: productId,
          overrideAccess: true,
          depth: 1,
          select: { variants: true },
        })
        if (!product || !product.variants || !product.variants.length) return
        product.variants = product.variants.filter((v: any) => v.id !== doc.id)
        product.variants.push(doc)
        product.variants = product.variants.filter((v: any) => v.status !== 'PRIVATE')
        await updateProductPriceRange(
          payload,
          productId,
          product.variants.map((v: any) => v.price),
        )
      },
      revalidateProduct,
    ] as CollectionAfterChangeHook<ProductVariant>[],
    beforeRead: [
      async ({ req: { user, payload }, doc }) => {
        const hasRole = userHasRole(user, ['admin', 'staff'])
        if (hasRole) return doc
        if (doc.fixedStock) {
          if (!user || typeof user !== 'object') {
            delete doc.fixedStock
            return doc
          }
          const paid = await payload.find({
            collection: 'orders',
            depth: 0,
            limit: 1,
            pagination: false,
            select: {},
            where: {
              productVariant: { equals: doc.id },
              orderedBy: { equals: user.id },
            },
          })
          if (paid.docs.length <= 0) {
            delete doc.fixedStock
          }
        }

        return doc
      },
    ],
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'product',
          type: 'relationship',
          relationTo: 'products',
          required: true,
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
      ],
    },
    {
      name: 'important',
      type: 'richText',
      editor: defaultLexicalEditor,
    },
    {
      type: 'row',
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
        },
      ],
    },
    {
      type: 'row',
      fields: [
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
      ],
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
      name: 'fixedStock',
      type: 'richText',
      editor: defaultLexicalEditor,
      label: 'Fixed Stock',
      access: {
        read: anyone, // handle in before read hook
        update: hasRole(['admin']),
        create: hasRole(['admin']),
      },
    },
    {
      name: 'defaultSupplier',
      type: 'relationship',
      relationTo: 'suppliers',
      hooks: {
        beforeChange: [
          async ({ value, data, req: { payload } }) => {
            if (!data) return value
            if (!value) return value
            const supplies = await payload.find({
              collection: 'product-variant-supplies',
              depth: 0,
              limit: 1,
              pagination: false,
              select: {},
              where: {
                supplier: { equals: value },
                productVariant: { equals: data.id },
              },
            })

            if (supplies.docs.length <= 0) {
              return 'Supplier not support this product variant'
            }
            return value
          },
        ] as FieldHook<ProductVariant>[],
      },
      access: {
        read: hasRole(['admin']),
        update: hasRole(['admin']),
        create: hasRole(['admin']),
      },
    },
    {
      name: 'autoProcess',
      type: 'select',
      options: [
        {
          label: 'Key',
          value: 'key',
        },
      ],
      access: {
        read: hasRole(['admin']),
        update: hasRole(['admin']),
        create: hasRole(['admin']),
      },
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
}
