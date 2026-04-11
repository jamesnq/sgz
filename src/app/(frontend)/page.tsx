import { CategoryGroup, Post, Product } from '@/payload-types'
import { defaultMetadata } from '@/utilities/generateMeta'
import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'
import HomePageClient from './home-page.client'
import { WebSiteSchema } from '@/components/Schema/WebSiteSchema'

export const metadata = defaultMetadata()

// ─── Data types ───

export interface HomepageSection {
  group: CategoryGroup
  products: Product[]
}

// ─── Data fetching ───

const getPosts = unstable_cache(
  async () => {
    const payload = await getPayload({ config: configPromise })
    const { docs } = await payload.find({
      collection: 'posts',
      depth: 1,
      limit: 6,
      overrideAccess: false,
      where: { _status: { equals: 'published' } },
      sort: '-publishedAt',
    })
    return docs as Post[]
  },
  ['homepage-posts'],
  { tags: ['posts-list'], revalidate: 60 },
)

const getHomepageSections = unstable_cache(
  async (): Promise<HomepageSection[]> => {
    const payload = await getPayload({ config: configPromise })

    const { docs: groups } = await payload.find({
      collection: 'category-groups',
      where: { showOnHomepage: { equals: true } },
      sort: 'sortOrder',
      depth: 1,
      overrideAccess: false,
    })

    const sections = await Promise.all(
      groups.map(async (group) => {
        const categoryIds = (group.categories || [])
          .map((c: any) => (typeof c === 'object' ? c.id : c))
          .filter(Boolean)

        if (categoryIds.length === 0) return { group, products: [] }

        const { docs } = await payload.find({
          collection: 'products',
          depth: 1,
          limit: group.homepageLimit || 12,
          overrideAccess: false,
          where: {
            status: { equals: 'PUBLIC' },
            categories: { in: categoryIds },
          },
          sort: group.sortProducts || '-sold',
        })

        return { group, products: docs as Product[] }
      }),
    )

    return sections.filter((s) => s.products.length > 0)
  },
  ['homepage-sections-v2'],
  { tags: ['products-list', 'homepage-sections'], revalidate: 60 },
)

const getFeaturedProducts = unstable_cache(
  async () => {
    const payload = await getPayload({ config: configPromise })
    const { docs } = await payload.find({
      collection: 'products',
      depth: 1,
      limit: 15,
      overrideAccess: false,
      where: {
        status: { equals: 'PUBLIC' },
        featured: { equals: true },
      },
      sort: '-sold',
    })
    return docs as Product[]
  },
  ['homepage-featured-products'],
  { tags: ['products-list'], revalidate: 60 },
)

const getStats = unstable_cache(
  async () => {
    const payload = await getPayload({ config: configPromise })
    const [ordersCount, usersCount, productsCount] = await Promise.all([
      payload.count({ collection: 'orders', overrideAccess: true }),
      payload.count({ collection: 'users', overrideAccess: true }),
      payload.count({ collection: 'products', overrideAccess: true }),
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

// ─── Page component ───

export default async function Home() {
  const [posts, stats, sections, featuredProducts] = await Promise.all([
    getPosts(),
    getStats(),
    getHomepageSections(),
    getFeaturedProducts(),
  ])

  return (
    <>
      <WebSiteSchema />
      <HomePageClient
        posts={posts}
        stats={stats}
        sections={sections}
        featuredProducts={featuredProducts}
      />
    </>
  )
}
