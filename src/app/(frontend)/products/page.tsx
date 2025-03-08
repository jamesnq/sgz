import { Product } from '@/payload-types'
import configPromise from '@payload-config'
import { getPayload, PaginatedDocs } from 'payload'
import { Suspense } from 'react'
import PageClient from './page.client'
import { Skeleton } from '@/components/ui/skeleton'
import { Shell } from '@/components/shell'

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

// Loading component for Suspense
function ProductsLoading() {
  return (
    <Shell>
      <div className="container py-8">
        <Skeleton className="h-10 w-48 mb-8" />
        
        <div className="mb-8">
          <div className="flex gap-2">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="w-full h-[131px]" />
          ))}
        </div>
        
        <div className="flex justify-center mt-8">
          <Skeleton className="h-10 w-64" />
        </div>
      </div>
    </Shell>
  )
}

// Async component to fetch products
async function ProductsData({ searchParams }: { searchParams: { name?: string; page?: string } }) {
  const name = searchParams.name || ''
  const page = searchParams.page || '1'
  
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

export default async function Page({ searchParams: searchParamsPromise }: Args) {
  const searchParams = await searchParamsPromise
  
  return (
    <Suspense fallback={<ProductsLoading />}>
      <ProductsData searchParams={searchParams} />
    </Suspense>
  )
}
