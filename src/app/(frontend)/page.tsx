import { Post } from '@/payload-types'
import { defaultMetadata } from '@/utilities/generateMeta'
import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'
import HomePageClient from './home-page.client'

export const dynamic = 'force-static'
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

export default async function Home() {
  const posts = await getPosts()
  return <HomePageClient posts={posts} />
}
