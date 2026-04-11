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

  const { docs: categoryGroups } = await payload.find({
    collection: 'category-groups',
    limit: 0,
    depth: 0,
    overrideAccess: true,
    req: { transactionID: undefined },
  })

  const data = (
    await Promise.all(
      products.map(async (doc) => {
        if (typeof doc === 'number') return
        const product = { ...doc } as any // clone to prevent payload mutation
        if (product.status === 'PRIVATE') return product

        if (typeof product.image === 'number' && !Number.isNaN(product.image)) {
          const [image, { docs: categories }] = await Promise.all([
            payload.findByID({
              collection: 'media',
              id: product.image,
              depth: 0,
              overrideAccess: true,
              req: {
                transactionID: undefined,
              },
            }).catch((err) => {
              payload.logger.error({ err, message: `Failed to find media ${product.image}` })
              return null
            }),
            payload.find({
              collection: 'categories',
              where: { id: { in: product.categories } },
              overrideAccess: true,
              depth: 0,
              req: {
                transactionID: undefined,
              },
            }).catch((err) => {
              payload.logger.error({ err, message: `Failed to find categories ${product.categories}` })
              return { docs: [] }
            }),
          ])
          product.image = image
          product.categories = categories
        }
        
        // Map product to category groups based on its original categories
        const originalCategoryIds = (doc as any).categories?.map((c: any) => typeof c === 'object' ? c.id : c) || []
        const matchedGroups = categoryGroups.filter(g => 
          (g.categories || []).some(gc => originalCategoryIds.includes(typeof gc === 'object' ? gc.id : gc))
        )
        // Store slugs of category groups for filtering in search
        product.categoryGroups = matchedGroups.map(g => g.slug).filter(Boolean)

        // Ensure product.categories only maps valid objects with titles
        product.categories = (product.categories || [])
          .filter(Boolean)
          .map((c: any) => c?.title || c)
          .filter((c: any) => typeof c === 'string' && c.trim().length > 0)
          
        product.description = product.description && textOnly(product.description)
        return product
      }),
    )
  ).filter(Boolean) as Product[]

  const updateProducts = data.filter((product) => product.status != 'PRIVATE')
  const deleteProducts = data.filter((product) => product.status == 'PRIVATE')
  
  try {
    if (updateProducts.length > 0) {
      await meiliSearchServer.index('products').updateDocuments(updateProducts).catch((error) => {
        payload.logger.error({ msg: "Meilisearch updateDocuments failed", error })
      })
    }
  } catch (error) {
    payload.logger.error({ msg: "Failed to run updateProducts in Meilisearch", error })
  }

  try {
    if (deleteProducts.length > 0) {
      await meiliSearchServer.index('products').deleteDocuments(deleteProducts.map((p) => p.id)).catch((error) => {
        payload.logger.error({ msg: "Meilisearch deleteDocuments failed", error })
      })
    }
  } catch (error) {
    payload.logger.error({ msg: "Failed to run deleteProducts in Meilisearch", error })
  }

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
        status: true,
        meta: true,
        createdAt: true,
      },
    })
    
    // Self-diagnostic pre-check to trace connection issues inside Docker container
    const diagnosticUrl = `${process.env.NEXT_PUBLIC_MEILI_HOST}/health`;
    try {
      const diagRes = await fetch(diagnosticUrl, { method: 'GET' });
      const textResponse = await diagRes.text();
      if (!textResponse.startsWith('{')) {
        payload.logger.error({
          msg: "Diagnostic fetch to Meilisearch failed JSON validation",
          url: diagnosticUrl,
          status: diagRes.status,
          responseText: textResponse.slice(0, 100) // Log first 100 chars to see "404 page not found"
        });
        return new Response(`Meilisearch connection error: Received non-JSON response from ${diagnosticUrl}. Content: ${textResponse.slice(0, 50)}`, { status: 502 });
      }
    } catch (fetchErr: any) {
       payload.logger.error({
          msg: "Diagnostic fetch to Meilisearch failed entirely",
          url: diagnosticUrl,
          err: fetchErr
        });
        return new Response(`Meilisearch connection error: Unable to reach ${diagnosticUrl} (${fetchErr.message})`, { status: 502 });
    }

    await meiliSearchServer
      .index('products')
      .updateFilterableAttributes([
        'categories',
        'categoryGroups',
        'minPrice',
        'maxPrice',
        'maxDiscount',
        'status',
      ])
    await meiliSearchServer.index('products').deleteAllDocuments()
    await meiliSearchServer
      .index('products')
      .updateSortableAttributes([
        'minPrice',
        'maxPrice',
        'maxDiscount',
        'sold',
        'status',
        'createdAt',
        'name',
      ] as (keyof Product)[])

    await meiliSearchServer
      .index('products')
      .updateSearchableAttributes(['name', 'description', 'categories'] as (keyof Product)[])
    await meiliSearchServer
      .index('products')
      .updateSettings({ pagination: { maxTotalHits: 200000 } })

    await productsToSearch(productsData.docs)

    return Response.json({ success: true })
  } catch (e: any) {
    payload.logger.error({ 
      err: e, 
      message: 'Error sync search data', 
      meiliHost: process.env.NEXT_PUBLIC_MEILI_HOST,
      meiliKeyHash: (process.env.MEILI_MASTER_KEY || '').substring(0, 4) + '...'
    })
    return new Response('Error seeding data. ' + (e?.message || ''), { status: 500 })
  }
}
