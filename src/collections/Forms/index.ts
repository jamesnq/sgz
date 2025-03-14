import type { CollectionAfterChangeHook, CollectionConfig } from 'payload'

import { hasRole } from '@/access/hasRoles'
import { anyone } from '../../access/anyone'
import { fields } from './fields'
import { Form } from '@/payload-types'
import { revalidateProductPath } from '../Products/hooks/revalidateProduct'

const revalidateProduct: CollectionAfterChangeHook<Form> = async ({ doc, req: { payload } }) => {
  const { docs: productVariants } = await payload.find({
    collection: 'product-variants',
    where: { form: { equals: doc.id } },
    select: { product: true },
    overrideAccess: true,
    depth: 0,
  })
  const productIds = [
    ...new Set(
      productVariants.map((v) => (typeof v.product === 'number' ? v.product : v.product.id)),
    ),
  ]
  await Promise.all(productIds.map((productId) => revalidateProductPath(payload, productId)))
}

export const Forms: CollectionConfig = {
  slug: 'forms',
  access: {
    create: hasRole(['admin', 'staff']),
    delete: hasRole(['admin', 'staff']),
    read: anyone,
    update: hasRole(['admin', 'staff']),
  },
  admin: {
    useAsTitle: 'title',
  },
  hooks: {
    afterChange: [revalidateProduct] as CollectionAfterChangeHook<Form>[],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
    },
    {
      name: 'fields',
      type: 'blocks',
      blocks: Object.values(fields),
      validate: (v: any) => {
        if (!v || !v.length) return 'Please add at least one field'
        const fieldNames = new Set<string>()
        for (const [index, field] of (v ?? []).entries()) {
          if (!('name' in field) || !field.name) continue
          if (fieldNames.has(field.name)) {
            return `Duplicate field name '${field.name}' at index ${index}`
          }
          fieldNames.add(field.name)
        }
        return true
      },
    },
  ],
}
