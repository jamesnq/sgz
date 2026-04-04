import { Shell } from '@/components/shell'
import { Post, PostTag } from '@/payload-types'
import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'
import PostsPageClient from './page.client'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Bài viết | Sub Game Zone',
  description: 'Tin tức và hướng dẫn game mới nhất từ Sub Game Zone',
}

const getPosts = unstable_cache(
  async () => {
    const payload = await getPayload({ config: configPromise })
    const { docs } = await payload.find({
      collection: 'posts',
      depth: 1,
      limit: 100,
      overrideAccess: false,
      where: {
        _status: { equals: 'published' },
      },
      sort: '-publishedAt',
    })
    return docs as Post[]
  },
  ['posts-list'],
  { tags: ['posts-list'], revalidate: 60 },
)

const getTags = unstable_cache(
  async () => {
    const payload = await getPayload({ config: configPromise })
    const { docs } = await payload.find({
      collection: 'post-tags',
      limit: 50,
      overrideAccess: false,
      sort: 'title',
    })
    return docs as PostTag[]
  },
  ['post-tags-list'],
  { tags: ['post-tags-list'], revalidate: 60 },
)

export default async function PostsPage() {
  const [posts, tags] = await Promise.all([getPosts(), getTags()])

  return (
    <Shell>
      <PostsPageClient posts={posts} tags={tags} />
    </Shell>
  )
}
