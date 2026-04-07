import { config } from '@/config'
import { Post } from '@/payload-types'
import { getServerSideURL } from '@/utilities/getURL'
import React from 'react'
import { textOnly } from '../RichText/textOnly'

export const ArticleStructuredData = ({ post }: { post: Post }) => {
  if (!post) return null

  const imageUrl =
    post.image && typeof post.image === 'object' && 'url' in post.image
      ? `${getServerSideURL()}${post.image.url}`
      : `${getServerSideURL()}/logo.png`

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    image: [imageUrl],
    datePublished: post.publishedAt || post.createdAt,
    dateModified: post.updatedAt,
    author: {
      '@type': 'Organization',
      name: config.NEXT_PUBLIC_SITE_NAME,
      url: getServerSideURL(),
    },
    publisher: {
      '@type': 'Organization',
      name: config.NEXT_PUBLIC_SITE_NAME,
      logo: {
        '@type': 'ImageObject',
        url: `${getServerSideURL()}/logo.png`,
      },
    },
    description: post.excerpt || (post.content ? textOnly(post.content).substring(0, 160) : ''),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${getServerSideURL()}/posts/${post.slug}`,
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
