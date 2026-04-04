import { Post, Product } from '@/payload-types'
import { defaultMetadata } from '@/utilities/generateMeta'
import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'
import HomePageClient from './home-page.client'

export const dynamic = 'force-dynamic'
export const revalidate = 360000
export const metadata = defaultMetadata()

const getPosts = unstable_cache(
  async () => {
    const payload = await getPayload({ config: configPromise })
    const { docs } = await payload.find({
      collection: 'posts',
      depth: 1,
      limit: 6,
      overrideAccess: false,
      where: {
        _status: { equals: 'published' },
      },
      sort: '-publishedAt',
    })
    return docs as Post[]
  },
  ['homepage-posts'],
  { tags: ['posts-list'], revalidate: 60 },
)

const getLatestProducts = unstable_cache(
  async () => {
    const payload = await getPayload({ config: configPromise })

    const { docs: categories } = await payload.find({
      collection: 'categories',
      limit: 100,
    })

    const targetTitles = ['key steam', 'tài khoản steam offline']
    
    const categoryIds = categories
      .filter((c) => targetTitles.includes(c.title?.toLowerCase() || ''))
      .map((c) => c.id)

    if (categoryIds.length === 0) return []

    const { docs } = await payload.find({
      collection: 'products',
      depth: 1,
      limit: 12,
      overrideAccess: true,
      where: {
        status: { equals: 'PUBLIC' },
        categories: { in: categoryIds },
      },
      sort: '-createdAt',
    })

    return docs as Product[]
  },
  ['homepage-latest-products-v4'],
  { tags: ['products-list'], revalidate: 60 },
)

const getTopUpProducts = unstable_cache(
  async () => {
    const payload = await getPayload({ config: configPromise })

    const { docs: categories } = await payload.find({
      collection: 'categories',
      limit: 100,
    })

    const targetTitles = ['nạp game']
    const matchingCategories = categories.filter((c) => {
      const categoryTitle = c.title?.toLowerCase() || ''
      return targetTitles.some((t) => t.toLowerCase() === categoryTitle)
    })
    const categoryIds = matchingCategories.map((c) => c.id)

    if (categoryIds.length === 0) return []

    const { docs } = await payload.find({
      collection: 'products',
      depth: 1,
      limit: 12,
      overrideAccess: true,
      where: {
        status: { equals: 'PUBLIC' },
        categories: { in: categoryIds },
      },
      sort: '-sold',
    })
    return docs as Product[]
  },
  ['homepage-topup-products'],
  { tags: ['products-list'], revalidate: 60 },
)

const getServiceProducts = unstable_cache(
  async () => {
    const payload = await getPayload({ config: configPromise })

    const { docs: categories } = await payload.find({
      collection: 'categories',
      limit: 100,
    })

    const targetTitles = ['dịch vụ']
    const matchingCategories = categories.filter((c) => {
      const categoryTitle = c.title?.toLowerCase() || ''
      return targetTitles.some((t) => t.toLowerCase() === categoryTitle)
    })
    const categoryIds = matchingCategories.map((c) => c.id)

    if (categoryIds.length === 0) return []

    const { docs } = await payload.find({
      collection: 'products',
      depth: 1,
      limit: 12,
      overrideAccess: true,
      where: {
        status: { equals: 'PUBLIC' },
        categories: { in: categoryIds },
      },
      sort: '-sold',
    })
    return docs as Product[]
  },
  ['homepage-service-products'],
  { tags: ['products-list'], revalidate: 60 },
)

const getStats = unstable_cache(
  async () => {
    const payload = await getPayload({ config: configPromise })
    const [ordersCount, usersCount, productsCount] = await Promise.all([
      payload.count({ collection: 'orders' }),
      payload.count({ collection: 'users' }),
      payload.count({ collection: 'products' }),
    ])
    return {
      orders: ordersCount.totalDocs,
      users: usersCount.totalDocs,
      products: productsCount.totalDocs,
    }
  },
  ['homepage-stats'],
  { tags: ['stats'], revalidate: 3600 },
)

export default async function Home() {
  const posts = await getPosts()
  const stats = await getStats()
  const latestProducts = await getLatestProducts()
  const topUpProducts = await getTopUpProducts()
  const serviceProducts = await getServiceProducts()

  return (
    <HomePageClient
      posts={posts}
      stats={stats}
      latestProducts={latestProducts}
      topUpProducts={topUpProducts}
      serviceProducts={serviceProducts}
    />
  )
}
