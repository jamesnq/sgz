import type { CollectionConfig } from 'payload'

import { hasRole } from '@/access/hasRoles'
import { mediaGroup } from '@/utilities/constants'
import { anyone } from '../access/anyone'

export const Categories: CollectionConfig = {
  slug: 'categories',
  access: {
    create: hasRole(['admin', 'staff']),
    delete: hasRole(['admin', 'staff']),
    read: anyone,
    update: hasRole(['admin', 'staff']),
  },
  hooks: {
    afterChange: [
      async ({ doc, previousDoc, req: { payload } }: any) => {
        // Only trigger if title changed to update search index
        if (previousDoc && doc.title !== previousDoc.title) {
          const { docs: productsData } = await payload.find({
            collection: 'products',
            where: { categories: { in: [doc.id] } },
            limit: 0,
            overrideAccess: true,
            depth: 1,
          })

          if (productsData.length > 0) {
            const { productsToSearch } = await import(
              '@/app/(frontend)/next/sync-search/route'
            )
            await productsToSearch(productsData as any)
          }
        }
        return doc
      },
    ],
    afterDelete: [
      async ({ id, req: { payload } }: any) => {
        // Find products referencing this category
        const { docs: productsData } = await payload.find({
          collection: 'products',
          where: { categories: { in: [id] } },
          limit: 0,
          overrideAccess: true,
          depth: 0,
        })

        if (productsData.length > 0) {
          // Remove the deleted category from all products that have it
          // This will trigger the product 'afterChange' hook which resyncs to MeiliSearch
          for (const product of productsData as any[]) {
            const newCategories = (product.categories || []).filter(
              (catId: any) => catId !== id,
            )

            await payload.update({
              collection: 'products',
              id: product.id,
              data: {
                categories: newCategories,
              },
              overrideAccess: true,
            })
          }
        }
      },
    ],
  },
  admin: {
    useAsTitle: 'title',
    group: mediaGroup,
    description: 'Categories of products',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'icon',
      type: 'text',
    },
  ],
}
