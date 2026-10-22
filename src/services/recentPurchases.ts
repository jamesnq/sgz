import type { Media } from '@/payload-types'
import { orders, product_variants, products, users } from '@/payload-generated-schema'
import { maskBuyer } from '@/utilities/maskBuyer'
import { getProductWhereClause } from '@/utilities/productFilters'
import payloadConfig from '@payload-config'
import { and, desc, eq, gte, ne } from '@payloadcms/db-postgres/drizzle'
import { getPayload } from 'payload'

export type RecentPurchase = {
  id: number
  buyer: string
  productName: string
  variantName: string | null
  slug: string
  image: Media | null
  createdAt: string
}

const LOOKBACK_MS = 3 * 24 * 60 * 60 * 1000

/**
 * Real orders only (refunds excluded), newest first, with buyer identity masked.
 * Products hidden from the storefront (PRIVATE / blacklisted) are dropped.
 */
export async function getRecentPurchases(limit = 15): Promise<RecentPurchase[]> {
  const payload = await getPayload({ config: payloadConfig })
  const db = payload.db.drizzle
  const since = new Date(Date.now() - LOOKBACK_MS).toISOString()

  const rows = await db
    .select({
      id: orders.id,
      createdAt: orders.createdAt,
      email: users.email,
      productId: products.id,
      variantName: product_variants.name,
    })
    .from(orders)
    .innerJoin(users, eq(orders.orderedBy, users.id))
    .innerJoin(product_variants, eq(orders.productVariant, product_variants.id))
    .innerJoin(products, eq(product_variants.product, products.id))
    .where(and(ne(orders.status, 'REFUND'), gte(orders.createdAt, since)))
    .orderBy(desc(orders.createdAt))
    .limit(limit)

  if (rows.length === 0) return []

  const productIds = Array.from(new Set(rows.map((r) => r.productId)))
  const { docs } = await payload.find({
    collection: 'products',
    depth: 1,
    limit: productIds.length,
    overrideAccess: true,
    pagination: false,
    where: getProductWhereClause({ id: { in: productIds } }),
    select: { id: true, name: true, slug: true, image: true },
  })
  const productById = new Map(docs.map((doc) => [doc.id, doc]))

  return rows.flatMap((row) => {
    const product = productById.get(row.productId)
    if (!product?.slug) return []
    return [
      {
        id: row.id,
        buyer: maskBuyer(row.email),
        productName: product.name,
        variantName: row.variantName ?? null,
        slug: product.slug,
        image: product.image && typeof product.image === 'object' ? product.image : null,
        // Postgres text ("2026-10-21 17:12:05.673+00") is not parseable by Safari's Date
        createdAt: new Date(row.createdAt).toISOString(),
      },
    ]
  })
}
