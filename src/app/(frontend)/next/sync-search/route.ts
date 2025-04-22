import { userHasRole } from '@/access/hasRoles'
import { Product } from '@/payload-types'
import { meiliSearchServer } from '@/utilities/meiliSearchServer'

import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'

async function productsToSearch(products: Product[]): Promise<Product[]> {
  const data = products
    .map((product) => {
      if (typeof product === 'number' || product.status === 'PRIVATE') return
      // @ts-expect-error ignore
      product.categories = product.categories.map((c) => c.title)
      return product
    })
    .filter(Boolean) as Product[]
  await meiliSearchServer.index('products').updateDocuments(data)
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

    await meiliSearchServer.index('products').deleteAllDocuments()
    await productsToSearch(productsData.docs)

    return Response.json({ success: true })
  } catch (e) {
    payload.logger.error({ err: e, message: 'Error sync search data' })
    return new Response('Error seeding data.', { status: 500 })
  }
}
