import { anyone } from '@/access/anyone'
import { hasRole, userHasRole } from '@/access/hasRoles'
import { ProductVariant } from '@/payload-types'
import { mediaGroup } from '@/utilities/constants'
import { defaultLexicalEditor } from '@/utilities/defaultLexicalEditor'
import { FieldHook, type CollectionAfterChangeHook, type CollectionAfterDeleteHook, type CollectionConfig } from 'payload'
import { revalidateProductPath, updateProductPriceRange } from '../Products/hooks/revalidateProduct'

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
    group: mediaGroup,
  },
  hooks: {
    afterChange: [
      async ({ previousDoc, doc, req }) => {
        const payload = req.payload
        const oldProductId = previousDoc.product ? (typeof previousDoc.product === 'object' ? previousDoc.product.id : previousDoc.product) : null
        const newProductId = typeof doc.product === 'object' ? doc.product.id : doc.product
        const productChanged = oldProductId !== newProductId

        // update product price range
        if (
          !productChanged &&
          previousDoc.price == doc.price &&
          previousDoc.originalPrice == doc.originalPrice &&
          previousDoc.status == doc.status
        ) {
          return
        }

        // Detach from previous product if transferred
        if (productChanged && oldProductId) {
          const oldProduct = await payload.findByID({
            collection: 'products',
            id: oldProductId,
            overrideAccess: true,
            depth: 1,
            select: { variants: true },
            req,
          })
          if (oldProduct) {
            const oldVariantIds = (oldProduct.variants || []).map((v: any) => v.id)
            if (oldVariantIds.includes(doc.id)) {
              await payload.update({
                collection: 'products',
                id: oldProductId,
                data: {
                  variants: oldVariantIds.filter((id: number) => id !== doc.id),
                },
                req,
              })
            }
          }
        }

        const productId = newProductId
        const product = await payload.findByID({
          collection: 'products',
          id: productId,
          overrideAccess: true,
          depth: 1,
          select: { variants: true },
          req,
        })
        if (!product) return
        
        const currentVariants = product.variants || []
        const existingVariantIds = currentVariants.map((v: any) => v.id)
        
        // Ensure variant relationship is officially bound to the Product array!
        if (!existingVariantIds.includes(doc.id)) {
          await payload.update({
            collection: 'products',
            id: productId,
            data: {
              variants: [...existingVariantIds, doc.id],
            },
            req,
          })
          return // payload.update implicitly triggers Products.beforeChange which fully calculates the price.
        }

        let newVariants = currentVariants.filter((v: any) => v.id !== doc.id)
        newVariants.push(doc)
        newVariants = newVariants.filter((v: any) => v.status !== 'PRIVATE')
        await updateProductPriceRange(
          payload,
          productId,
          newVariants as { price: number; originalPrice: number; status: string }[],
          req,
        )
      },
      revalidateProduct,
    ] as CollectionAfterChangeHook<ProductVariant>[],
    afterDelete: [
      async ({ doc, req }) => {
        if (req.context?.isProductDeleting) return
        const payload = req.payload
        const productId = typeof doc.product === 'number' ? doc.product : doc.product.id
        const product = await payload.findByID({
          collection: 'products',
          id: productId,
          overrideAccess: true,
          depth: 1,
          select: { variants: true },
          req,
        })
        if (!product || !product.variants) return
        
        product.variants = product.variants.filter((v: any) => v.id !== doc.id)
        product.variants = product.variants.filter((v: any) => v.status !== 'PRIVATE')
        
        await updateProductPriceRange(
          payload,
          productId,
          product.variants as { price: number; originalPrice: number; status: string }[],
          req,
        )
      },
      async ({ doc, req }) => {
        if (req.context?.isProductDeleting) return
        const productId = typeof doc.product === 'number' ? doc.product : doc.product.id
        await revalidateProductPath(req.payload, productId as number)
      },
    ] as CollectionAfterDeleteHook<ProductVariant>[],
    beforeRead: [
      async ({ req: { user, payload }, doc }) => {
        const hasRole = userHasRole(user, ['admin', 'staff'])
        if (hasRole) return doc

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
        read: async ({ req: { user, payload }, id, doc }) => {
          if (userHasRole(user, ['admin', 'staff'])) return true
          if (!user || typeof user !== 'object') return false
          const docId = id || doc?.id
          if (!docId) return false
          const paid = await payload.find({
            collection: 'orders',
            depth: 0,
            limit: 1,
            pagination: false,
            where: {
              productVariant: { equals: docId },
              orderedBy: { equals: user.id },
              status: { equals: 'COMPLETED' },
            },
          })
          return paid.docs.length > 0
        },
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
          async ({ previousValue, value, data, req: { payload } }) => {
            if (!data) return value
            if (!value) return value
            if (value === previousValue) return value
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
        {
          label: 'Direct (Hoàn thành ngay)',
          value: 'direct',
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
    {
      name: 'aiGeneratorButton',
      type: 'ui',
      admin: {
        components: {
          Field: '@/components/AI/AiGenerateButton#AiGenerateButton',
        },
        position: 'sidebar',
      },
    },
  ],
}
