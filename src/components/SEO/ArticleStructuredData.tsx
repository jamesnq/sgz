import { Post } from '@/payload-types'
import { config } from '@/config'
import React from 'react'

interface ArticleStructuredDataProps {
  post: Post
}

export const ArticleStructuredData: React.FC<ArticleStructuredDataProps> = ({ post }) => {
  if (!post) return null

  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://subgamezone.com'

  let imageUrl =
    post.image && typeof post.image === 'object' && 'url' in post.image && post.image.url
      ? post.image.url
      : ''

  if (imageUrl && imageUrl.startsWith('/')) {
    imageUrl = `${serverUrl}${imageUrl}`
  }

  const url = `${serverUrl}/posts/${post.slug}`

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    headline: post.title,
    description: post.excerpt || post.title,
    image: imageUrl ? [imageUrl] : undefined,
    datePublished: post.publishedAt || post.createdAt,
    dateModified: post.updatedAt,
    author: {
      '@type': 'Organization',
      name: config.NEXT_PUBLIC_SITE_NAME,
      url: serverUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: config.NEXT_PUBLIC_SITE_NAME,
      logo: {
        '@type': 'ImageObject',
        url: `${serverUrl}/favicon-96x96.png`,
      },
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }}
    />
  )
}

