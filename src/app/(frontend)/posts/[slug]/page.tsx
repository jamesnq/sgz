import { Media } from '@/components/Media'
import RichText from '@/components/RichText'
import { Shell } from '@/components/shell'
import { Badge } from '@/components/ui/badge'
import { PostTag } from '@/payload-types'
import configPromise from '@payload-config'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'
import { unstable_cache } from 'next/cache'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'

type Args = {
  params: Promise<{
    slug: string
  }>
}

const getPost = async (slug: string) => {
  const getCachedPost = unstable_cache(
    async () => {
      const payload = await getPayload({ config: configPromise })
      const { docs } = await payload.find({
        collection: 'posts',
        depth: 1,
        limit: 1,
        overrideAccess: false,
        where: {
          slug: { equals: slug },
          _status: { equals: 'published' },
        },
      })
      return docs[0] || null
    },
    [`post-${slug}`],
    { tags: [`post-${slug}`, 'posts-list'], revalidate: 60 },
  )
  return getCachedPost()
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)

  if (!post) {
    return {
      title: 'Bài viết không tồn tại | Sub Game Zone',
    }
  }

  return {
    title: `${post.title} | Sub Game Zone`,
    description: post.excerpt || undefined,
  }
}

export default async function PostDetailPage({ params }: Args) {
  const { slug } = await params
  const post = await getPost(slug)

  if (!post) {
    notFound()
  }

  const tags = post.tags as PostTag[] | undefined

  return (
    <Shell>
      <article className="py-8 max-w-4xl mx-auto">
        {/* Back link */}
        <Link
          href="/posts"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại danh sách</span>
        </Link>

        {/* Header */}
        <header className="mb-8">
          {/* Tags */}
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {tags.map((tag) => (
                <Badge key={tag.id} variant="secondary">
                  {tag.title}
                </Badge>
              ))}
            </div>
          )}

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{post.title}</h1>

          {/* Meta */}
          {post.publishedAt && (
            <p className="text-muted-foreground">
              {format(new Date(post.publishedAt), "EEEE, dd MMMM yyyy 'lúc' HH:mm", { locale: vi })}
            </p>
          )}
        </header>

        {/* Featured Image */}
        <div className="relative aspect-video rounded-lg overflow-hidden mb-8">
          <Media
            resource={post.image}
            className="w-full h-full"
            imgClassName="absolute inset-0 w-full h-full object-cover"
          />
        </div>

        {/* Excerpt */}
        {post.excerpt && (
          <p className="text-lg text-muted-foreground italic border-l-4 border-primary pl-4 mb-8">
            {post.excerpt}
          </p>
        )}

        {/* Content */}
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <RichText data={post.content} />
        </div>
      </article>
    </Shell>
  )
}
