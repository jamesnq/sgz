'use client'

import { Media } from '@/components/Media'
import { Shell } from '@/components/shell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { getProductCardStyles } from '@/lib/product-card-styles'
import { cn } from '@/lib/utils'
import { Post, PostTag, Product } from '@/payload-types'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import { formatPrice } from '@/utilities/formatPrice'
import { formatSold } from '@/utilities/formatSold'
import { instantSearchClient } from '@/utilities/meiliSearchClient'
import { Routes } from '@/utilities/routes'
import { productIndex } from '@/utilities/searchIndexes'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useEffect } from 'react'
import { Configure, InstantSearch, useHits } from 'react-instantsearch'
import { ProductPageHeader } from './products/components/ProductPageHeader'

const ProductCard = ({ product }: { product: Product }) => {
  const styles = getProductCardStyles()
  return (
    <div className={styles.wrapper}>
      <Link
        className={cn('block h-full w-full cursor-pointer', styles.link)}
        href={product.slug ? Routes.product(product.slug) : '#'}
      >
        <Card className={cn('w-full h-[131px] !p-0', styles.card)}>
          <div className="w-full">
            <div className="text-[14px] flex items-start p-0">
              <div
                className={cn(
                  'h-[131px] w-[98px] flex items-center justify-center',
                  styles.mediaContainer,
                )}
              >
                <Media
                  resource={product.image}
                  className={cn('w-full h-full', styles.media)}
                  imgClassName="absolute inset-0 h-[131px] w-[98px] object-cover"
                />
              </div>
              <div className="flex w-full h-[131px] flex-1 flex-col items-start justify-between gap-[8px] p-2">
                <div>
                  <div className="flex items-center gap-1 justify-between">
                    <p
                      className={cn(
                        'line-clamp-1 h-auto text-[14px] font-bold leading-[17px]',
                        styles.name,
                      )}
                    >
                      {product.name}
                    </p>
                    {product.maxDiscount > 0 && (
                      <Badge className={styles.badge}>-{product.maxDiscount.toFixed(0)}%</Badge>
                    )}
                  </div>
                  {product.description && (
                    <p className="text-[12px] text-muted-foreground mt-2 line-clamp-2 overflow-hidden">
                      {product.description as unknown as string}
                    </p>
                  )}
                </div>
                <div className="flex w-full items-center justify-between">
                  <div className="flex">
                    <span className={cn('text-xs text-muted-foreground', styles.price)}>
                      {product.minPrice === product.maxPrice
                        ? formatPrice(product.minPrice)
                        : `${formatPrice(product.minPrice)} ~ ${formatPrice(product.maxPrice)}`}
                    </span>
                  </div>
                  {product.sold > 0 && (
                    <span className="text-[12px] leading-none text-muted-foreground">
                      Đã bán {formatSold(product.sold)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </Link>
    </div>
  )
}

const PostCard = ({ post }: { post: Post }) => {
  const styles = getProductCardStyles()
  const tags = post.tags as PostTag[] | undefined

  return (
    <div className={styles.wrapper}>
      <Link
        className={cn('block h-full w-full cursor-pointer', styles.link)}
        href={post.slug ? Routes.post(post.slug) : '#'}
      >
        <Card className={cn('w-full h-[131px] !p-0', styles.card)}>
          <div className="w-full">
            <div className="text-[14px] flex items-start p-0">
              <div
                className={cn(
                  'h-[131px] w-[98px] flex items-center justify-center',
                  styles.mediaContainer,
                )}
              >
                <Media
                  resource={post.image}
                  className={cn('w-full h-full', styles.media)}
                  imgClassName="absolute inset-0 h-[131px] w-[98px] object-cover"
                />
              </div>
              <div className="flex w-full h-[131px] flex-1 flex-col items-start justify-between gap-[8px] p-2">
                <div>
                  <p
                    className={cn(
                      'line-clamp-1 h-auto text-[14px] font-bold leading-[17px]',
                      styles.name,
                    )}
                  >
                    {post.title}
                  </p>
                  {post.excerpt && (
                    <p className="text-[12px] text-muted-foreground mt-2 line-clamp-2 overflow-hidden">
                      {post.excerpt}
                    </p>
                  )}
                </div>
                <div className="flex w-full items-center justify-between">
                  {tags && tags.length > 0 && (
                    <div className="flex gap-1">
                      {tags.slice(0, 2).map((tag) => (
                        <Badge key={tag.id} variant="secondary" className="text-[10px] px-1.5 py-0">
                          {tag.title}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {post.publishedAt && (
                    <span className="text-[12px] leading-none text-muted-foreground">
                      {format(new Date(post.publishedAt), 'dd/MM/yyyy', { locale: vi })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </Link>
    </div>
  )
}

const ProductSection = () => {
  const { hits } = useHits()

  return (
    <div className="mb-8">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Sản phẩm</h2>
        <Button asChild variant="ghost" className="gap-2">
          <Link href={Routes.PRODUCTS}>
            Xem tất cả
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
        {hits.slice(0, 12).map((hit) => {
          return <ProductCard key={hit.id} product={hit as unknown as Product} />
        })}
      </div>
    </div>
  )
}

const PostsSection = ({ posts }: { posts: Post[] }) => {
  if (!posts || posts.length === 0) return null

  return (
    <div className="mb-8">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Bài viết</h2>
        <Button asChild variant="ghost" className="gap-2">
          <Link href={Routes.POSTS}>
            Xem tất cả
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      {/* Posts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
        {posts.slice(0, 6).map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  )
}

interface HomePageClientProps {
  posts: Post[]
}

const HomePageClient = ({ posts }: HomePageClientProps) => {
  const { setHeaderTheme } = useHeaderTheme()

  useEffect(() => {
    setHeaderTheme('dark')
  }, [setHeaderTheme])

  return (
    <InstantSearch
      indexName={productIndex}
      searchClient={instantSearchClient.searchClient as any}
      future={{ preserveSharedStateOnUnmount: true }}
      initialUiState={{
        [productIndex]: {
          sortBy: `${productIndex}:sold:desc`,
        },
      }}
    >
      <Configure analytics={false} hitsPerPage={12} />
      <Shell>
        <ProductPageHeader />

        <div className="mt-4">
          <ProductSection />
          <PostsSection posts={posts} />
        </div>
      </Shell>
    </InstantSearch>
  )
}

export default HomePageClient
