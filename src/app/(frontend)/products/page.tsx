import { Shell } from '@/components/shell'
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
    categories?: string
  }>
}

// Loading component that only shows skeletons for products
function ProductsLoading() {
  return (
    <Shell>
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-8">Sản phẩm</h1>

        <div className="flex flex-col lg:flex-row lg:gap-6">
          {/* Sidebar skeleton */}
          <div className="w-full lg:w-[280px] lg:min-w-[280px] lg:pr-6 mb-8 lg:mb-0">
            <div className="sticky top-24">
              <h2 className="text-lg font-medium mb-4">Tìm kiếm</h2>
              <div className="relative mb-6">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input type="search" placeholder="Tìm kiếm sản phẩm..." className="pl-8" disabled />
              </div>

              <h2 className="text-lg font-medium mb-4">Danh mục</h2>
              <div className="relative mb-4">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input type="search" placeholder="Tìm kiếm danh mục..." className="pl-8" disabled />
              </div>

              <div className="max-h-[300px] overflow-y-auto pr-2">
                <div className="flex flex-wrap gap-2 lg:flex-col lg:gap-2">
                  <Skeleton className="h-8 w-20 lg:w-full" />
                  <Skeleton className="h-8 w-24 lg:w-full" />
                  <Skeleton className="h-8 w-16 lg:w-full" />
                  <Skeleton className="h-8 w-28 lg:w-full" />
                  <Skeleton className="h-8 w-22 lg:w-full" />
                  <Skeleton className="h-8 w-18 lg:w-full" />
                </div>
              </div>
            </div>
          </div>

          {/* Main content area skeleton */}
          <div className="flex-1">
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
        </div>
      </div>
    </Shell>
  )
}

// Component to fetch and display products data
async function ProductsData({
  searchParams,
}: {
  searchParams: Promise<{ name?: string; page?: string; categories?: string }>
}) {
  // Await the searchParams promise
  const resolvedParams = await searchParams
  const name = resolvedParams.name || ''
  const page = resolvedParams.page || '1'
  const categoriesParam = resolvedParams.categories || ''

  // Parse the categories parameter (comma-separated list of IDs)
  const selectedCategoryIds = categoriesParam ? categoriesParam.split(',') : []

  const currentPage = parseInt(page, 10) || 1
  const limit = 12

  const payload = await getPayload({ config: configPromise })

  // Fetch all categories for the filter UI
  const categoriesData = await payload.find({
    collection: 'categories',
    limit: 100,
    sort: 'title',
  })

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

  // Add category filter if categories are selected
  if (selectedCategoryIds.length > 0) {
    where.categories = {
      in: selectedCategoryIds,
    }
  }

  const productsData = await payload.find({
    collection: 'products',
    limit,
    page: currentPage,
    where,
    depth: 1,
  })

  return (
    <PageClient
      data={productsData}
      searchQuery={name}
      categories={categoriesData.docs}
      selectedCategoryIds={selectedCategoryIds}
    />
  )
}

export default function Page({ searchParams: searchParamsPromise }: Args) {
  return (
    <Suspense fallback={<ProductsLoading />}>
      <ProductsData searchParams={searchParamsPromise} />
    </Suspense>
  )
}
