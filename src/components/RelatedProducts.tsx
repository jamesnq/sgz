'use client'

import { Media } from '@/components/Media'
import RichText from '@/components/RichText'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Product } from '@/payload-types'
import { formatSold } from '@/utilities/formatSold'
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface RelatedProductsProps {
  title?: string
  products: Product[]
  categoryIds?: string[]
  maxDisplay?: number
  searchQuery?: string
}

const RelatedProducts = ({
  title = 'Sản phẩm tương tự',
  products,
  categoryIds,
  maxDisplay = 4,
  searchQuery = '',
}: RelatedProductsProps) => {
  const router = useRouter()

  const displayProducts = products.slice(0, maxDisplay)

  const handleViewMore = () => {
    const params = new URLSearchParams()

    if (categoryIds?.length) {
      params.set('categories', categoryIds.join(','))
    }

    if (searchQuery) {
      params.set('name', searchQuery)
    }

    router.push(`/products?${params.toString()}`)
  }

  if (products.length === 0) return null

  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-medium">{title}</h2>
        <Button
          variant="ghost"
          className="text-sm flex items-center gap-1 hover:bg-secondary/20"
          onClick={handleViewMore}
        >
          Xem thêm <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {displayProducts.map((product) => (
          <Link
            key={product.id}
            className="relative block h-full w-full cursor-pointer overflow-hidden transition-all duration-300 hover:border-secondary"
            href={`/products/${product.slug}`}
          >
            <Card className="w-full h-[131px] overflow-hidden p-0!">
              <div className="w-full">
                <div className="text-[14px] flex items-start p-0">
                  <div className="relative h-[131px] w-[98px] overflow-hidden flex items-center justify-center">
                    <Media
                      resource={product.image}
                      className="object-cover w-full h-full"
                      imgClassName="absolute inset-0 h-[131px] w-[98px] object-center object-contain"
                    />
                  </div>
                  <div className="flex w-full h-[131px] flex-1 flex-col items-start justify-between gap-[8px] p-2">
                    <div>
                      <div className="truncate h-auto overflow-hidden text-[14px] font-normal leading-[17px]">
                        {product.name}
                      </div>
                      ks
                      {product.description?.root?.direction && (
                        <RichText
                          className="text-[12px] text-muted-foreground mt-2 line-clamp-2 overflow-hidden"
                          data={product.description}
                          enableGutter={false}
                        />
                      )}
                    </div>
                    {product.sold && (
                      <div className="flex w-full items-center justify-end">
                        <span className="text-[12px] leading-none text-muted-foreground">
                          Đã bán {formatSold(product.sold)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default RelatedProducts
