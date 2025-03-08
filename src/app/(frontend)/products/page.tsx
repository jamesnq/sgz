import { Shell } from '@/components/shell'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import configPromise from '@payload-config'
import { Search } from 'lucide-react'
import { getPayload } from 'payload'
import { Suspense } from 'react'
import PageClient from './page.client'

export const revalidate = 3600

type Args = {
  params: Promise<{
    slug?: string
  }>
  searchParams: Promise<{
    name?: string
    page?: string
  }>
}

// Loading component that only shows skeletons for products
function ProductsLoading() {
  return (
    <Shell>
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-8">Sản phẩm</h1>

        <div className="mb-8">
          <form className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Tìm kiếm sản phẩm..." className="pl-8" disabled />
            </div>
            <Button type="submit" disabled>
              Tìm kiếm
            </Button>
          </form>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="w-full h-[131px] overflow-hidden !p-0">
              <div className="w-full">
                <div className="text-[14px] flex items-start p-0">
                  <Skeleton className="h-[131px] w-[98px]" />
                  <div className="flex w-full h-[131px] flex-1 flex-col items-start justify-between gap-[8px] p-2">
                    <div>
                      <Skeleton className="h-4 w-3/4 mb-2" />
                      <Skeleton className="h-3 w-full mb-1" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                    <div className="flex w-full items-center justify-end">
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </Shell>
  )
}

// Component to fetch and display products data
async function ProductsData({
  searchParams,
}: {
  searchParams: Promise<{ name?: string; page?: string }>
}) {
  // Await the searchParams promise
  const resolvedParams = await searchParams
  const name = resolvedParams.name || ''
  const page = resolvedParams.page || '1'

  const currentPage = parseInt(page, 10) || 1
  const limit = 12

  const payload = await getPayload({ config: configPromise })

  const where: any = {
    status: {
      equals: 'PUBLIC',
    },
  }

  if (name) {
    where.name = {
      like: name,
    }
  }

  const productsData = await payload.find({
    collection: 'products',
    limit,
    page: currentPage,
    where,
    depth: 1,
  })

  return <PageClient data={productsData} searchQuery={name} />
}

export default function Page({ searchParams: searchParamsPromise }: Args) {
  return (
    <Suspense fallback={<ProductsLoading />}>
      <ProductsData searchParams={searchParamsPromise} />
    </Suspense>
  )
}
