'use client'

import React from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { Media } from '@/components/Media'
import { PostTag } from '@/payload-types'

interface RelatedPostCardProps {
  post: {
    id: string | number
    slug?: string | null
    title?: string | null
    image?: any
    publishedAt?: string | null
    tags?: (number | PostTag)[] | null
  }
}

export const RelatedPostCard: React.FC<RelatedPostCardProps> = ({ post }) => {
  const tags = post.tags as PostTag[] | undefined
  const href = `/posts/${post.slug}`

  return (
    <Link 
      href={href} 
      className="group flex gap-4 p-3 rounded-2xl bg-secondary/30 border border-border/50 hover:border-sgz-primary/50 hover:bg-secondary/50 transition-all duration-300 backdrop-blur-sm"
    >
      {/* Thumbnail */}
      <div className="relative h-20 w-24 shrink-0 rounded-xl overflow-hidden shadow-inner ring-1 ring-white/5">
        <Media
          resource={post.image}
          className="w-full h-full"
          imgClassName="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Content */}
      <div className="flex flex-col justify-center gap-1.5 min-w-0 flex-1">
        {/* Tags */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 1).map((tag: any) => (
              <span 
                key={tag.id || tag} 
                className="text-[10px] font-extrabold tracking-widest text-sgz-primary uppercase"
              >
                {tag.title || tag}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h3 className="font-bold text-white text-sm line-clamp-2 leading-snug group-hover:text-sgz-primary transition-colors duration-200">
          {post.title}
        </h3>

        {/* Date */}
        {post.publishedAt && (
          <div className="text-[10px] text-muted-foreground/80 font-medium flex items-center gap-1.5 mt-0.5">
            <span className="w-1 h-1 rounded-full bg-sgz-primary/40" />
            {format(new Date(post.publishedAt), 'dd/MM/yyyy', { locale: vi })}
          </div>
        )}
      </div>
    </Link>
  )
}
