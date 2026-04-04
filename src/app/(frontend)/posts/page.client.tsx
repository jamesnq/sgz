'use client'

import { Media } from '@/components/Media'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { Post, PostTag } from '@/payload-types'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { Check, ChevronDown, ChevronLeft, ChevronRight, Filter, X } from 'lucide-react'
import Link from 'next/link'
import { useState, useMemo, useEffect } from 'react'

const POSTS_PER_PAGE = 9

interface PostsPageClientProps {
  posts: Post[]
  tags: PostTag[]
}

const PostCard = ({ post }: { post: Post }) => {
  const tags = post.tags as PostTag[] | undefined

  return (
    <Link href={`/posts/${post.slug}`} className="group">
      <Card className="overflow-hidden h-full hover:shadow-lg transition-shadow duration-300">
        <div className="relative aspect-video">
          <Media
            resource={post.image}
            className="w-full h-full"
            imgClassName="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        <div className="p-4">
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {tags.map((tag) => (
                <Badge key={tag.id} variant="secondary" className="text-xs">
                  {tag.title}
                </Badge>
              ))}
            </div>
          )}
          <h3 className="font-bold text-lg line-clamp-2 group-hover:text-primary transition-colors">
            {post.title}
          </h3>
          {post.excerpt && (
            <p className="text-muted-foreground text-sm line-clamp-2 mt-2">{post.excerpt}</p>
          )}
          {post.publishedAt && (
            <p className="text-xs text-muted-foreground mt-3">
              {format(new Date(post.publishedAt), 'dd MMM, yyyy', { locale: vi })}
            </p>
          )}
        </div>
      </Card>
    </Link>
  )
}

export default function PostsPageClient({ posts, tags }: PostsPageClientProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedTags, setSelectedTags] = useState<number[]>([])
  const [appliedTags, setAppliedTags] = useState<number[]>([])
  const [currentPage, setCurrentPage] = useState(1)

  // Filter posts by applied tags
  const filteredPosts = useMemo(() => {
    if (appliedTags.length === 0) return posts

    return posts.filter((post) => {
      const postTags = post.tags as PostTag[] | undefined
      if (!postTags) return false
      return appliedTags.some((tagId) => postTags.some((tag) => tag.id === tagId))
    })
  }, [posts, appliedTags])

  // Calculate pagination
  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE)
  const paginatedPosts = useMemo(() => {
    const startIndex = (currentPage - 1) * POSTS_PER_PAGE
    return filteredPosts.slice(startIndex, startIndex + POSTS_PER_PAGE)
  }, [filteredPosts, currentPage])

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [appliedTags])

  const toggleTag = (tagId: number) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId],
    )
  }

  const applyFilter = () => {
    setAppliedTags(selectedTags)
    setIsOpen(false)
  }

  const clearFilter = () => {
    setSelectedTags([])
    setAppliedTags([])
    setIsOpen(false)
  }

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Bài viết</h1>
        <p className="text-muted-foreground">Tin tức và hướng dẫn game mới nhất</p>
      </div>

      {/* Tag Filter */}
      {tags.length > 0 && (
        <div className="mb-6 flex items-center gap-3 flex-wrap">
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button variant={appliedTags.length > 0 ? 'default' : 'outline'} className="gap-2">
                <Filter className="h-4 w-4" />
                <span>Bộ lọc</span>
                {appliedTags.length > 0 && (
                  <Badge variant="secondary" className="ml-1 bg-background text-foreground">
                    {appliedTags.length}
                  </Badge>
                )}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="start">
              <div className="space-y-4">
                <div className="font-medium text-sm">Chọn tag</div>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => {
                    const isSelected = selectedTags.includes(tag.id)
                    return (
                      <Button
                        key={tag.id}
                        variant={isSelected ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => toggleTag(tag.id)}
                        className={cn(
                          'gap-1.5 transition-all',
                          isSelected && 'ring-2 ring-primary ring-offset-2',
                        )}
                      >
                        {isSelected && <Check className="h-3 w-3" />}
                        {tag.title}
                      </Button>
                    )
                  })}
                </div>
                <div className="flex gap-2 pt-2 border-t">
                  <Button variant="outline" className="flex-1" onClick={clearFilter}>
                    Đóng
                  </Button>
                  <Button className="flex-1" onClick={applyFilter}>
                    Xem kết quả
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {appliedTags.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Đang lọc:</span>
              <div className="flex flex-wrap gap-1">
                {appliedTags.map((tagId) => {
                  const tag = tags.find((t) => t.id === tagId)
                  if (!tag) return null
                  return (
                    <Badge
                      key={tagId}
                      variant="secondary"
                      className="gap-1 cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => {
                        setSelectedTags((prev) => prev.filter((t) => t !== tagId))
                        setAppliedTags((prev) => prev.filter((t) => t !== tagId))
                      }}
                    >
                      {tag.title}
                      <X className="h-3 w-3" />
                    </Badge>
                  )
                })}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilter}
                className="text-destructive h-7"
              >
                Xóa tất cả
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Results count */}
      <p className="text-sm text-muted-foreground mb-4">
        {filteredPosts.length} bài viết
        {totalPages > 1 && ` • Trang ${currentPage}/${totalPages}`}
      </p>

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
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Trước
              </Button>

              <div className="flex gap-1">
                {(() => {
                  const pages: (number | string)[] = []

                  if (totalPages <= 7) {
                    // Show all pages if 7 or fewer
                    for (let i = 1; i <= totalPages; i++) pages.push(i)
                  } else {
                    // Always show first page
                    pages.push(1)

                    if (currentPage > 3) {
                      pages.push('...')
                    }

                    // Pages around current
                    const start = Math.max(2, currentPage - 1)
                    const end = Math.min(totalPages - 1, currentPage + 1)

                    for (let i = start; i <= end; i++) {
                      if (!pages.includes(i)) pages.push(i)
                    }

                    if (currentPage < totalPages - 2) {
                      pages.push('...')
                    }

                    // Always show last page
                    if (!pages.includes(totalPages)) pages.push(totalPages)
                  }

                  return pages.map((page, idx) =>
                    page === '...' ? (
                      <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground">
                        ...
                      </span>
                    ) : (
                      <Button
                        key={page}
                        variant={currentPage === page ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => goToPage(page as number)}
                        className="w-9"
                      >
                        {page}
                      </Button>
                    ),
                  )
                })()}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Sau
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16">
          <p className="text-muted-foreground">
            {appliedTags.length > 0
              ? 'Không có bài viết nào với các tag này'
              : 'Chưa có bài viết nào'}
          </p>
          {appliedTags.length > 0 && (
            <Button variant="outline" className="mt-4" onClick={clearFilter}>
              Xem tất cả bài viết
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
