import { Media } from '@/components/Media'
import RichText from '@/components/RichText'
import { config } from '@/config'
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

const getRelatedPosts = async (currentPostId: string | number, tagIds: number[]) => {
  const getCachedRelated = unstable_cache(
    async () => {
      const payload = await getPayload({ config: configPromise })
      const { docs } = await payload.find({
        collection: 'posts',
        depth: 1,
        limit: 20, // Load more to sort by relevance in memory
        overrideAccess: false,
        where: {
          and: [
            {
              id: { not_equals: currentPostId },
            },
            ...(tagIds.length > 0
              ? [
                  {
                    tags: { in: tagIds },
                  },
                ]
              : []),
            {
              _status: { equals: 'published' },
            },
          ],
        },
        sort: '-publishedAt',
      })

      // Sort by the number of matching tags (relevance level), then by date
      const sortedDocs = [...docs].sort((a: any, b: any) => {
        const tagsA = (a.tags || []).map((t: any) => (typeof t === 'number' ? t : t.id))
        const tagsB = (b.tags || []).map((t: any) => (typeof t === 'number' ? t : t.id))

        const matchA = tagsA.filter((id: number) => tagIds.includes(id)).length
        const matchB = tagsB.filter((id: number) => tagIds.includes(id)).length

        if (matchA !== matchB) {
          return matchB - matchA // Descending: Higher exact matches first
        }

        // If same relevance, use publishedAt
        const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0
        const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0
        return dateB - dateA
      })

      return sortedDocs.slice(0, 4)
    },
    [`related-posts-${currentPostId}`],
    { tags: ['posts-list'], revalidate: 60 },
  )
  return getCachedRelated()
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

const RelatedPostCard = ({ post }: { post: any }) => {
  const tags = post.tags as PostTag[] | undefined
  return (
    <Link href={`/posts/${post.slug}`} className="group block bg-secondary border border-border rounded-xl overflow-hidden hover:border-sgz-primary/50 transition-colors">
      <div className="flex flex-col">
        <div className="h-32 relative overflow-hidden shrink-0">
          <Media
            resource={post.image}
            className="w-full h-full"
            imgClassName="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
        <div className="p-4 flex flex-col gap-2">
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.slice(0, 2).map((tag: any) => (
                <span key={tag.id || tag} className="text-[10px] font-bold tracking-wider text-sgz-primary uppercase">
                  {tag.title || tag}
                </span>
              ))}
            </div>
          )}
          <h3 className="font-bold text-white text-sm line-clamp-2 leading-snug group-hover:text-sgz-primary transition-colors">
            {post.title}
          </h3>
          {post.publishedAt && (
            <div className="text-[11px] text-muted-foreground">
              {format(new Date(post.publishedAt), 'dd/MM/yyyy')}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

export default async function PostDetailPage({ params }: Args) {
  const { slug } = await params
  const post = await getPost(slug)

  if (!post) {
    notFound()
  }

  const tags = post.tags as PostTag[] | undefined
  // For Payload, tags could be an array of numbers (if IDs) or objects.
  const tagIds = tags?.map((t: any) => typeof t === 'number' ? t : t.id) || []
  const relatedPosts = await getRelatedPosts(post.id, tagIds)

  return (
    <div className="min-h-[calc(100vh-10rem)] bg-transparent text-white pt-8 mb-20 lg:mb-[120px]">
      <div className="w-full px-6 lg:px-12 mx-auto max-w-[1440px]">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 relative items-start">
          
          {/* Main Article (Left Column) */}
          <article className="flex-1 w-full bg-card border border-border rounded-2xl p-6 lg:p-12 shadow-2xl relative overflow-hidden">
            
            {/* subtle background glow */}
            <div className="absolute top-0 right-0 -mr-32 -mt-32 w-96 h-96 bg-sgz-primary/5 rounded-full blur-[100px] pointer-events-none" />

            {/* Back link */}
            <div className="mb-10 relative z-10 flex items-center justify-between">
              <Link
                href="/posts"
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-sgz-primary transition-colors font-medium border border-border bg-secondary hover:border-sgz-primary/50 px-4 py-2 rounded-xl"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">Quay lại danh sách</span>
              </Link>
            </div>

            {/* Header */}
            <header className="mb-10 relative z-10">
              {/* Tags */}
              {tags && tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {tags.map((tag: any) => (
                    <span
                      key={tag.id || tag}
                      className="bg-sgz-primary/10 border border-sgz-primary/20 text-sgz-primary text-xs font-bold px-3 py-1.5 rounded-lg tracking-wider uppercase"
                    >
                      {tag.title || tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Title */}
              <h1 className="text-3xl lg:text-5xl font-bold mb-6 text-white leading-[1.2] font-headline">{post.title}</h1>

              {/* Meta */}
              {post.publishedAt && (
                <div className="flex items-center gap-3 text-sm text-muted-foreground font-medium border-t border-border pt-6 mt-6">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center border border-border">
                    <span className="text-sgz-primary font-bold text-xs">{config.NEXT_PUBLIC_SITE_NAME?.charAt(0) || 'S'}</span>
                  </div>
                  <div>
                    <div className="text-white">Đăng bởi {config.NEXT_PUBLIC_SITE_NAME}</div>
                    <div>{format(new Date(post.publishedAt), "EEEE, dd MMMM yyyy 'lúc' HH:mm", { locale: vi })}</div>
                  </div>
                </div>
              )}
            </header>

            {/* Featured Image */}
            <div className="relative aspect-[16/9] rounded-xl overflow-hidden mb-12 shadow-lg ring-1 ring-white/10 group z-10">
              <Media
                resource={post.image}
                className="w-full h-full"
                imgClassName="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
            </div>

            <div className="relative z-10">
              {/* Excerpt */}
              {post.excerpt && (
                <div className="mb-12">
                  <p className="text-xl text-muted-foreground italic font-medium leading-relaxed border-l-4 border-sgz-primary pl-6 py-2 bg-sgz-primary/5 rounded-r-2xl">
                    {post.excerpt}
                  </p>
                </div>
              )}

              {/* Content */}
              <div className="prose prose-lg max-w-none dark:prose-invert prose-headings:text-white prose-headings:font-bold prose-h2:text-3xl prose-h3:text-2xl prose-p:text-muted-foreground prose-p:leading-relaxed prose-a:text-sgz-primary prose-a:no-underline hover:prose-a:underline prose-strong:text-white prose-ul:text-muted-foreground prose-ol:text-muted-foreground marker:text-sgz-primary prose-blockquote:border-sgz-primary prose-blockquote:text-muted-foreground prose-blockquote:bg-secondary prose-blockquote:px-6 prose-blockquote:py-2 prose-blockquote:rounded-r-2xl prose-blockquote:not-italic prose-img:rounded-xl prose-img:border prose-img:border-border w-full">
                <RichText data={post.content} />
              </div>
            </div>
          </article>

          {/* Sidebar (Right Column) */}
          <aside className="w-full lg:w-[380px] shrink-0 sticky top-32 z-10">
            <div className="bg-card border border-border rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col max-h-[calc(100vh-10rem)]">
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-sgz-primary/5 rounded-full blur-[60px] pointer-events-none" />
              <h2 className="text-xl font-bold text-white mb-6 font-headline relative z-10 border-b border-border pb-4 shrink-0">
                Bài viết liên quan
              </h2>
              
              <div className="flex flex-col gap-4 relative z-10 overflow-y-auto pr-2 -mr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-secondary [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-secondary/80 transition-all">
                {relatedPosts.length > 0 ? (
                  relatedPosts.map(rp => (
                    <RelatedPostCard key={rp.id} post={rp} />
                  ))
                ) : (
                  <div className="py-6 text-center">
                    <p className="text-sm text-muted-foreground">Chưa có bài viết liên quan.</p>
                  </div>
                )}
              </div>
            </div>
          </aside>

        </div>
      </div>
    </div>
  )
}
