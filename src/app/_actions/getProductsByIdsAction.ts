'use server'

import type { Product } from '@/payload-types'
import { getProductWhereClause } from '@/utilities/productFilters'
import { actionClient } from '@/utilities/safe-action'
import payloadConfig from '@payload-config'
import { getPayload } from 'payload'
import { GetProductsByIdsSchema } from './schema'

/**
 * Public lookup used by "Đã xem gần đây": returns fresh card data (price, image, sold)
 * for the product ids the browser remembers, preserving the requested order.
 */
export const getProductsByIdsAction = actionClient
  .schema(GetProductsByIdsSchema)
  .action(async ({ parsedInput: { ids } }) => {
    if (ids.length === 0) return { products: [] as Product[] }

    const payload = await getPayload({ config: payloadConfig })
    const { docs } = await payload.find({
      collection: 'products',
      depth: 1,
      limit: ids.length,
      overrideAccess: true,
      pagination: false,
      where: getProductWhereClause({ id: { in: ids } }),
      select: {
        id: true,
        slug: true,
        name: true,
        image: true,
        minPrice: true,
        maxPrice: true,
        maxDiscount: true,
        sold: true,
      },
    })

    const byId = new Map(docs.map((doc) => [doc.id, doc]))
    const products = ids.map((id) => byId.get(id)).filter(Boolean) as Product[]
    return { products }
  })
