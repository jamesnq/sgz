'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Clock } from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { Media } from '@/components/Media'
import { Post, PostTag } from '@/payload-types'
import { Routes } from '@/utilities/routes'

export const PostCard = ({ post }: { post: Post }) => {
  const tags = post.tags as PostTag[] | undefined
  const category = tags && tags.length > 0 && typeof tags[0] === 'object' ? tags[0]?.title : null

  return (
    <article
      className="rounded-2xl overflow-hidden group hover:bg-secondary transition-colors flex flex-col h-full bg-card/70 backdrop-blur-md border-t border-border"
    >
      <div className="h-48 overflow-hidden relative shrink-0">
        <Media
          resource={post.image}
          className="w-full h-full"
          imgClassName="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          size="(max-width: 768px) 100vw, 33vw"
        />
      </div>
      <div className="p-6 space-y-4 flex flex-col flex-1">
        <div>
          {category && (
            <span className="bg-sgz-primary/10 text-sgz-primary text-[10px] font-bold px-2 py-0.5 rounded tracking-widest uppercase">
              {category}
            </span>
          )}
        </div>
        <Link href={post.slug ? Routes.post(post.slug) : '#'} className="flex-1">
          <h3 className="font-bold text-white text-xl leading-snug line-clamp-2 group-hover:text-sgz-primary transition-colors">
            {post.title}
          </h3>
        </Link>
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

export const PostsSection = ({ posts }: { posts: Post[] }) => {
  if (!posts || posts.length === 0) return null

  return (
    <motion.section
      id="posts-section"
      className="mb-16"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, margin: '-100px' }}
      transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
    >
      <div className="flex flex-col sm:flex-row justify-between sm:items-end mb-8 gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-4">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white">Bài Viết</h2>
            <div className="h-px flex-1 bg-sgz-border/30 hidden sm:block"></div>
          </div>
          <p className="text-sgz-textMuted">Cập nhật tin tức và thủ thuật mới nhất.</p>
        </div>
        <Link
          href={Routes.POSTS || '#'}
          className="text-sgz-primary font-bold flex items-center gap-1 hover:underline shrink-0 sm:ml-6"
        >
          Xem tất cả
          <ChevronRight className="w-5 h-5" />
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {posts.slice(0, 3).map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </motion.section>
  )
}

// ChevronRight is used but not imported in the original clip I saw, 
// let me check its imports in home-page.client.tsx
import { ChevronRight } from 'lucide-react'
