import type { CollectionSlug, File, GlobalSlug, Payload, PayloadRequest } from 'payload'

import * as fs from 'fs/promises'
import * as path from 'path'

import { brawlhallaForm as brawlhallaFormData } from './brawlhalla-form'
import { createAppleIdForm as appleIdFormData } from './create-apple-id-form'

import { createSubscriberHash, resetAndCreateSubscribers } from '@/services/novu.service'
import { novuChannels } from '@/utilities/constants'
import { productAppleId as productAppleIdData } from './product-appleid'
import { productBrawlhallaCoins as productBrawlhallaCoinsData } from './product-brawlhalla-coins'
import { novu_channels } from '@/payload-generated-schema'
const isDev = process.env.NODE_ENV === 'development'
const collections: CollectionSlug[] = [
  'orders',
  'product-variants',
  'products',
  'form-submissions',
  'forms',
  'categories',
  'media',
  'novu-channels',
]
const _globals: GlobalSlug[] = ['header', 'footer']

const brawlhallaVariants = [
  { coins: 140, originalPrice: 149000, price: 40000 },
  { coins: 340, originalPrice: 349000, price: 90000 },
  { coins: 540, originalPrice: 499000, price: 140000 },
  { coins: 1000, originalPrice: 999000, price: 170000 },
  { coins: 1600, originalPrice: 1299000, price: 200000 },
  { coins: 3200, originalPrice: 2598000, price: 300000 },
  { coins: 4800, originalPrice: 3897000, price: 400000 },
  { name: 'Battlepass Gold', originalPrice: 249000, price: 180000 },
  { name: 'Battlepass Gold + 3200 coins', originalPrice: 2847000, price: 350000 },
  { name: 'Battlepass Deluxe', originalPrice: 699000, price: 350000 },
]

// Next.js revalidation errors are normal when seeding the database without a server running
// i.e. running `yarn seed` locally instead of using the admin UI within an active app
// The app is not running to revalidate the pages and so the API routes are not available
// These error messages can be ignored: `Error hitting revalidate route for...`
export const seed = async ({
  payload,
  req,
}: {
  payload: Payload
  req: PayloadRequest
}): Promise<void> => {
  payload.logger.info('Seeding database...')

  // we need to clear the media directory before seeding
  // as well as the collections and globals
  // this is because while `yarn seed` drops the database
  // the custom `/api/seed` endpoint does not
  // payload.logger.info(`— Clearing collections and globals...`)

  if (isDev) {
    payload.logger.info(`— Clearing collections and globals...`)
    // clear the database
    // await Promise.all(
    //   globals.map((global) =>
    //     payload.updateGlobal({
    //       slug: global,
    //       data: {
    //         navItems: [],
    //       },
    //       depth: 0,
    //       context: {
    //         disableRevalidate: true,
    //       },
    //     }),
    //   ),
    // )
    for (const collection of collections) {
      await payload.db.deleteMany({ collection, req, where: {} })
    }

    await Promise.all(
      collections
        .filter((collection) => Boolean(payload.collections[collection].config.versions))
        .map((collection) => payload.db.deleteVersions({ collection, req, where: {} })),
    )

    payload.logger.info(`— Seeding form...`)

    const brawlhallaForm = await payload.create({
      collection: 'forms',
      overrideAccess: true,
      depth: 0,
      data: JSON.parse(JSON.stringify(brawlhallaFormData)),
    })

    const appleIdForm = await payload.create({
      collection: 'forms',
      overrideAccess: true,
      depth: 0,
      data: JSON.parse(JSON.stringify(appleIdFormData)),
    })

    let _brawlhallaFormID: number | string = brawlhallaForm.id
    let _appleIdFormID: number | string = appleIdForm.id

    if (payload.db.defaultIDType === 'text') {
      _brawlhallaFormID = `"${_brawlhallaFormID}"`
      _appleIdFormID = `"${_appleIdFormID}"`
    }

    payload.logger.info(`— Seeding media...`)

    const [mmcBuffer, appleIdBuffer] = await Promise.all([
      fetchFileFromDirectory('./src/endpoints/seed/MammothCoinStack.webp'),
      fetchFileFromDirectory('./src/endpoints/seed/appleid.webp'),
    ])
    if (isDev) {
      payload.logger.info(`— Seeding demo author and user...`)
      await payload.delete({
        collection: 'users',
        depth: 0,
        overrideAccess: true,
        where: {
          email: {
            equals: 'nhonhoem0123@gmail.com',
          },
        },
      })
    }
    const [_exampleUser, mmcMedia, appleIdMedia] = await Promise.all([
      payload.create({
        collection: 'users',
        overrideAccess: true,
        data: {
          email: 'nhonhoem0123@gmail.com',
          password: '123123',
          roles: ['user'],
          _verified: true,
        },
      }),
      payload.create({
        collection: 'media',
        overrideAccess: true,
        data: { alt: 'Brawlhalla Mammoth Coin Stack', caption: null },
        file: mmcBuffer,
      }),
      payload.create({
        collection: 'media',
        overrideAccess: true,
        data: { alt: 'Apple ID', caption: null },
        file: appleIdBuffer,
      }),
      payload.create({
        collection: 'categories',
        overrideAccess: true,
        data: {
          title: 'Game',
        },
      }),
      payload.create({
        collection: 'categories',
        overrideAccess: true,
        data: {
          title: 'Account',
        },
      }),
      payload.create({
        collection: 'categories',
        overrideAccess: true,
        data: {
          title: 'Design',
        },
      }),
      payload.create({
        collection: 'categories',
        overrideAccess: true,
        data: {
          title: 'Software',
        },
      }),
    ])

    let mmcMediaId: number | string = mmcMedia.id
    let appleIdIDMediaId: number | string = appleIdMedia.id

    if (payload.db.defaultIDType === 'text') {
      mmcMediaId = `"${mmcMedia.id}"`
      appleIdIDMediaId = `"${appleIdMedia.id}"`
    }

    payload.logger.info(`— Seeding products...`)

    // Do not create posts with `Promise.all` because we want the posts to be created in order
    // This way we can sort them by `createdAt` or `publishedAt` and they will be in the expected order
    const productAppleId = await payload.create({
      collection: 'products',
      depth: 0,
      overrideAccess: true,
      context: {
        disableRevalidate: true,
      },
      data: JSON.parse(
        JSON.stringify({ ...productAppleIdData }).replace(
          /"\{\{IMAGE\}\}"/g,
          String(appleIdIDMediaId),
        ),
      ),
    })

    const productAppleIdVariant1 = await payload.create({
      collection: 'product-variants',
      depth: 0,
      data: {
        product: productAppleId.id,
        name: 'Tạo Tài Khoản Apple ID',
        image: null,
        status: 'ORDER',
        form: appleIdForm.id,
        sold: 0,
        originalPrice: 10000,
        price: 10000,
        min: 1,
        max: 1,
        note: null,
        description: null,
      },
    })
    await payload.update({
      collection: 'products',
      overrideAccess: true,
      data: {
        variants: [productAppleIdVariant1.id],
      },
      where: {
        id: { equals: productAppleId.id },
      },
    })

    await Promise.all(
      ['Android', 'PC'].map((platform) =>
        payload.create({
          collection: 'products',
          overrideAccess: true,
          depth: 0,
          context: {
            disableRevalidate: true,
          },
          data: JSON.parse(
            JSON.stringify({
              ...productBrawlhallaCoinsData,
              name: `Brawlhalla Mammoth Coin ${platform}`,
              slug: `brawlhalla-coins-${platform}`,
            }).replace(/"\{\{IMAGE\}\}"/g, String(mmcMediaId)),
          ),
        }),
      ),
    )

    const productBrawlhallaCoins = await payload.create({
      collection: 'products',
      depth: 0,
      overrideAccess: true,
      context: {
        disableRevalidate: true,
      },
      data: JSON.parse(
        JSON.stringify({ ...productBrawlhallaCoinsData }).replace(
          /"\{\{IMAGE\}\}"/g,
          String(mmcMediaId),
        ),
      ),
    })

    const variants = []
    for (const variant of brawlhallaVariants) {
      const createdVariant = await payload.create({
        collection: 'product-variants',
        depth: 0,
        overrideAccess: true,
        data: {
          product: productBrawlhallaCoins.id,
          name: `${variant.name || `${variant.coins} coins`} - Brawlhalla`,
          image: null,
          status: 'ORDER',
          form: brawlhallaForm.id,
          sold: 0,
          originalPrice: variant.originalPrice,
          price: variant.price,
          min: 1,
          max: 10,
          note: null,
          description: null,
        },
      })
      variants.push(createdVariant)
    }
    await payload.update({
      collection: 'products',
      overrideAccess: true,
      data: {
        variants: variants.map((variant) => variant.id),
      },
      where: {
        id: { equals: productBrawlhallaCoins.id },
      },
    })
  }

  payload.logger.info(`— Seeding novu channels...`)
  await resetAndCreateSubscribers(novuChannels)

  await payload.db.drizzle.insert(novu_channels).values(
    novuChannels.map((channel) => ({
      hash: createSubscriberHash(channel),
      subscriberId: channel,
    })),
  )

  payload.logger.info('Seeded database successfully!')
}

async function _fetchFileByURL(url: string): Promise<File> {
  const res = await fetch(url, {
    credentials: 'include',
    method: 'GET',
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch file from ${url}, status: ${res.status}`)
  }

  const data = await res.arrayBuffer()

  return {
    name: url.split('/').pop() || `file-${Date.now()}`,
    data: Buffer.from(data),
    mimetype: `image/${url.split('.').pop()}`,
    size: data.byteLength,
  }
}
async function fetchFileFromDirectory(filePath: string): Promise<File> {
  try {
    const data = await fs.readFile(filePath)
    const stats = await fs.stat(filePath)

    return {
      name: path.basename(filePath),
      data: Buffer.from(data),
      mimetype: `image/${path.extname(filePath).slice(1)}`,
      size: stats.size,
    }
  } catch (error: any) {
    throw new Error(`Failed to read file from ${filePath}: ${error.message}`)
  }
}
