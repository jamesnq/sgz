'use client'

import { Media } from '@/components/Media'
import { cn } from '@/lib/utils'
import { Post, PostTag } from '@/payload-types'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import { Routes } from '@/utilities/routes'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { Check, ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

const POSTS_PER_PAGE = 12

interface PostsPageClientProps {
  posts: Post[]
  tags: PostTag[]
}

const PostCard = ({ post }: { post: Post }) => {
  const tags = post.tags as PostTag[] | undefined
  const category = tags && tags.length > 0 && typeof tags[0] === 'object' ? tags[0]?.title : null

  return (
    <article
      className="rounded-2xl overflow-hidden group hover:bg-[#1f1f24] transition-colors flex flex-col h-full"
      style={{
        background: 'rgba(25, 25, 30, 0.7)',
        backdropFilter: 'blur(12px)',
        borderTop: '1px solid rgba(72, 71, 76, 0.2)',
      }}
    >
      <div className="h-48 overflow-hidden relative shrink-0">
        <Media
          resource={post.image}
          className="w-full h-full"
          imgClassName="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
      </div>
      <div className="p-6 space-y-4 flex flex-col flex-1">
        <div className="flex flex-wrap gap-1.5">
          {tags && tags.length > 0 && tags.map((tag: any) => (
            <span key={tag.id || tag} className="bg-sgz-primary/10 border border-sgz-primary/20 text-sgz-primary text-[10px] font-bold px-2 py-0.5 rounded tracking-widest uppercase">
              {tag.title || tag}
            </span>
          ))}
        </div>
        <Link href={post.slug ? Routes.post(post.slug) : '#'} className="flex-1">
          <h3 className="font-bold text-white text-xl leading-snug line-clamp-2 group-hover:text-sgz-primary transition-colors">
            {post.title}
          </h3>
        </Link>
        {post.excerpt && (
          <p className="text-[#acaab0] text-sm line-clamp-2 mt-2 font-medium">{post.excerpt}</p>
        )}
        <div className="pt-2 flex items-center gap-2 text-xs text-sgz-textMuted mt-auto">
          <Clock className="w-4 h-4" />
          {post.publishedAt
            ? format(new Date(post.publishedAt), 'dd/MM/yyyy', { locale: vi })
            : 'Mới đây'}
        </div>
      </div>
    </article>
  )
}

function Sidebar({
  tags,
  appliedTags,
  toggleTag,
  clearFilter,
}: {
  tags: PostTag[]
  appliedTags: number[]
  toggleTag: (tagId: number) => void
  clearFilter: () => void
}) {
  return (
    <div className="hidden lg:block w-64 shrink-0">
      <div className="sticky top-24 pt-2 space-y-6">
        <div className="space-y-4">
          <div className="sticky top-24 rounded-2xl bg-[#16161e] border border-[#2b2b36] p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">Chủ đề</h2>
              {appliedTags.length > 0 && (
                <button
                  onClick={clearFilter}
                  className="text-xs text-sgz-primary hover:underline font-bold"
                >
                  Xoá tất cả
                </button>
              )}
            </div>

            <div className="space-y-2">
              {tags.length === 0 ? (
                <p className="text-sm text-[#acaab0] italic">Chưa có chủ đề nào.</p>
              ) : (
                tags.map((tag) => {
                  const isSelected = appliedTags.includes(tag.id)
                  return (
                    <label
                      key={tag.id}
                      className="flex items-center gap-3 cursor-pointer group"
                      onClick={() => toggleTag(tag.id)}
                    >
                      <div
                        className={cn(
                          'w-5 h-5 rounded flex items-center justify-center transition-colors border',
                          isSelected
                            ? 'bg-[#ba9eff] border-[#ba9eff] text-[#16161e]'
                            : 'bg-transparent border-[#48474c] group-hover:border-[#ba9eff]',
                        )}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                      </div>
                      <span
                        className={cn(
                          'text-sm font-medium transition-colors',
                          isSelected ? 'text-white' : 'text-[#acaab0] group-hover:text-white',
                        )}
                      >
                        {tag.title}
                      </span>
                    </label>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PostsPageClient({ posts, tags }: PostsPageClientProps) {
  const { setHeaderTheme } = useHeaderTheme()
  const [appliedTags, setAppliedTags] = useState<number[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOrder, setSortOrder] = useState('newest')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    setHeaderTheme('dark')
  }, [setHeaderTheme])

  // Filter and sort posts
  const filteredPosts = useMemo(() => {
    let result = posts

    // Filter by tags
    if (appliedTags.length > 0) {
      result = result.filter((post) => {
        const postTags = post.tags as PostTag[] | undefined
        if (!postTags) return false
        return appliedTags.some((tagId) => postTags.some((tag) => tag.id === tagId))
      })
    }

    // Filter by search query
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase()
      result = result.filter((post) => post.title.toLowerCase().includes(q))
    }

    // Sort by date
    result = [...result].sort((a, b) => {
      const dateA = new Date(a.publishedAt || a.createdAt).getTime()
      const dateB = new Date(b.publishedAt || b.createdAt).getTime()
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB
    })

    return result
  }, [posts, appliedTags, searchQuery, sortOrder])

  // Calculate pagination
  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE)
  const paginatedPosts = useMemo(() => {
    const startIndex = (currentPage - 1) * POSTS_PER_PAGE
    return filteredPosts.slice(startIndex, startIndex + POSTS_PER_PAGE)
  }, [filteredPosts, currentPage])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [appliedTags, searchQuery, sortOrder])

  const toggleTag = (tagId: number) => {
    setAppliedTags((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId],
    )
  }

  const clearFilter = () => {
    setAppliedTags([])
  }

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="mb-16">
      <div className="w-full px-6 lg:px-12 max-w-[1440px] mx-auto py-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          <div className="space-y-2">
            <h1 className="font-headline text-4xl font-bold tracking-tight text-white">Bài viết</h1>
            <p className="text-[#acaab0]">Tin tức cộng đồng và thủ thuật game mới nhất.</p>
          </div>

          {/* Search and Sort */}
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Tìm kiếm bài viết..."
                className="w-full h-11 bg-[#16161e] border border-[#2b2b36] rounded-xl px-4 text-white focus:outline-none focus:border-[#ba9eff] transition-colors"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="w-full sm:w-48 relative">
              <select
                className="w-full h-11 bg-[#16161e] border border-[#2b2b36] rounded-xl px-4 text-white focus:outline-none focus:border-[#ba9eff] transition-colors appearance-none cursor-pointer"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              >
                <option value="newest">Ngày đăng: Mới nhất</option>
                <option value="oldest">Ngày đăng: Cũ nhất</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#acaab0]">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M2.5 4.5L6 8L9.5 4.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:gap-12 mt-4 mb-[120px] lg:mb-0">
          <Sidebar
            tags={tags}
            appliedTags={appliedTags}
            toggleTag={toggleTag}
            clearFilter={clearFilter}
          />

          <div className="flex-1 flex flex-col gap-2">
            {/* Mobile Tag Filter */}
            {tags.length > 0 && (
              <div className="lg:hidden mb-6 flex flex-wrap gap-2">
                {tags.map((tag) => {
                  const isSelected = appliedTags.includes(tag.id)
                  return (
                    <button
                      key={tag.id}
                      onClick={() => toggleTag(tag.id)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-sm font-bold transition-colors border',
                        isSelected
                          ? 'bg-[#ba9eff] text-[#16161e] border-[#ba9eff]'
                          : 'bg-transparent text-[#acaab0] border-[#48474c] hover:border-[#ba9eff] hover:text-white',
                      )}
                    >
                      {tag.title}
                    </button>
                  )
                })}
              </div>
            )}

            {/* Posts Grid */}
            {paginatedPosts.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {paginatedPosts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-12 mb-8">
                    <button
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="w-10 h-10 flex items-center justify-center rounded-xl border border-sgz-border bg-[#16161e] text-white hover:border-[#ba9eff] hover:text-[#ba9eff] transition-colors disabled:opacity-50 disabled:pointer-events-none"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>

                    <div className="flex gap-1">
                      {(() => {
                        const pages: (number | string)[] = []

                        if (totalPages <= 7) {
                          for (let i = 1; i <= totalPages; i++) pages.push(i)
                        } else {
                          pages.push(1)
                          if (currentPage > 3) pages.push('...')
                          const start = Math.max(2, currentPage - 1)
                          const end = Math.min(totalPages - 1, currentPage + 1)
                          for (let i = start; i <= end; i++) {
                            if (!pages.includes(i)) pages.push(i)
                          }
                          if (currentPage < totalPages - 2) pages.push('...')
                          if (!pages.includes(totalPages)) pages.push(totalPages)
                        }

                        return pages.map((page, idx) =>
                          page === '...' ? (
                            <span
                              key={`ellipsis-${idx}`}
                              className="px-2 text-sgz-textMuted flex items-center"
                            >
                              ...
                            </span>
                          ) : (
                            <button
                              key={page}
                              onClick={() => goToPage(page as number)}
                              className={cn(
                                'w-10 h-10 font-bold rounded-xl transition-colors border',
                                currentPage === page
                                  ? 'bg-[#ba9eff] text-[#16161e] border-[#ba9eff]'
                                  : 'bg-[#16161e] text-white border-sgz-border hover:border-[#ba9eff] hover:text-[#ba9eff]',
                              )}
                            >
                              {page}
                            </button>
                          ),
                        )
                      })()}
                    </div>

                    <button
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="w-10 h-10 flex items-center justify-center rounded-xl border border-sgz-border bg-[#16161e] text-white hover:border-[#ba9eff] hover:text-[#ba9eff] transition-colors disabled:opacity-50 disabled:pointer-events-none"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-20 bg-[#16161e] rounded-2xl border border-sgz-border">
                <p className="text-[#acaab0] font-medium">
                  {appliedTags.length > 0
                    ? 'Không có bài viết nào với các chủ đề này.'
                    : 'Chưa có bài viết nào.'}
                </p>
                {appliedTags.length > 0 && (
                  <button
                    onClick={clearFilter}
                    className="mt-6 text-sgz-primary font-bold hover:underline"
                  >
                    Xem tất cả bài viết
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
