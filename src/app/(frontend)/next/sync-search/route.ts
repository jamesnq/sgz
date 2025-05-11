import { userHasRole } from '@/access/hasRoles'
import { textOnly } from '@/components/RichText/textOnly'
import { Product } from '@/payload-types'
import { getInstancePayload } from '@/utilities/getInstancePayload'
import { meiliSearchServer } from '@/utilities/meiliSearchServer'

import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'

export async function productsToSearch(products: Product[]): Promise<Product[]> {
  const payload = await getInstancePayload()

  const data = (
    await Promise.all(
      products.map(async (product) => {
        if (typeof product === 'number') return
        if (product.status === 'PRIVATE') return product

        if (typeof product.image == 'number') {
          const [image, { docs: categories }] = await Promise.all([
            payload.findByID({
              collection: 'media',
              id: product.image,
              depth: 0,
              overrideAccess: true,
              req: {
                transactionID: undefined,
              },
            }),
            payload.find({
              collection: 'categories',
              where: { id: { in: product.categories } },
              overrideAccess: true,
              depth: 0,
              req: {
                transactionID: undefined,
              },
            }),
          ])
          product.image = image
          product.categories = categories
        }
        // @ts-expect-error ignore
        product.categories = product.categories.map((c) => c.title)
        // @ts-expect-error ignore
        product.description = product.description && textOnly(product.description)
        return product
      }),
    )
  ).filter(Boolean) as Product[]

  const updateProducts = products.filter((product) => product.status != 'PRIVATE')
  const deleteProducts = products.filter((product) => product.status == 'PRIVATE')
  await Promise.all([
    updateProducts.length > 0 &&
      meiliSearchServer.index('products').updateDocuments(updateProducts),
    deleteProducts.length > 0 &&
      meiliSearchServer.index('products').deleteDocuments(deleteProducts.map((p) => p.id)),
  ])

  return data
}

export async function POST(): Promise<Response> {
  const payload = await getPayload({ config })
  const requestHeaders = await headers()

  // Authenticate by passing request headers
  const { user } = await payload.auth({ headers: requestHeaders })

  if (!user || !userHasRole(user, ['admin'])) {
    return new Response('Action forbidden.', { status: 403 })
  }

  try {
    const where: any = {
      status: {
        not_equals: 'PRIVATE',
      },
    }
    const productsData = await payload.find({
      collection: 'products',
      limit: 0,
      where,
      pagination: false,
      overrideAccess: true,
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        image: true,
        categories: true,
        sold: true,
        minPrice: true,
        maxPrice: true,
        maxDiscount: true,
        meta: true,
      },
    })

    await meiliSearchServer
      .index('products')
      .updateFilterableAttributes([
        'categories',
        'minPrice',
        'maxPrice',
        'maxDiscount',
        'status',
      ] as (keyof Product)[])
    await meiliSearchServer.index('products').deleteAllDocuments()
    await meiliSearchServer
      .index('products')
      .updateSortableAttributes([
        'minPrice',
        'maxPrice',
        'maxDiscount',
        'sold',
        'status',
      ] as (keyof Product)[])

    await meiliSearchServer
      .index('products')
      .updateSearchableAttributes(['name', 'description', 'categories'] as (keyof Product)[])
    await meiliSearchServer
      .index('products')
      .updateSettings({ pagination: { maxTotalHits: 200000 } })

    await productsToSearch(productsData.docs)

    return Response.json({ success: true })
  } catch (e) {
    payload.logger.error({ err: e, message: 'Error sync search data' })
    return new Response('Error seeding data.', { status: 500 })
  }
}
