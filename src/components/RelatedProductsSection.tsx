import { getPayload } from 'payload'
import configPromise from '@payload-config'
import RelatedProducts from './RelatedProducts'

// Define base props without required fields
interface BaseRelatedProductsSectionProps {
  title?: string
  maxDisplay?: number
}

// Define props with categoryIds required
interface CategoryRelatedProductsSectionProps extends BaseRelatedProductsSectionProps {
  categoryIds: string[]
  searchQuery?: string
}

// Define props with searchQuery required
interface SearchRelatedProductsSectionProps extends BaseRelatedProductsSectionProps {
  categoryIds?: string[]
  searchQuery: string
}

// Union type that requires either categoryIds or searchQuery (or both)
type RelatedProductsSectionProps =
  | CategoryRelatedProductsSectionProps
  | SearchRelatedProductsSectionProps

export const RelatedProductsSection = async ({
  categoryIds,
  searchQuery = '',
  title = 'Sản phẩm tương tự',
  maxDisplay = 4,
}: RelatedProductsSectionProps) => {
  // Skip if neither categoryIds nor searchQuery is provided
  if ((!categoryIds || categoryIds.length === 0) && !searchQuery) {
    return null
  }

  const payload = await getPayload({ config: configPromise })

  // Build the where clause
  const whereClause: any = {
    and: [
      {
        status: {
          equals: 'PUBLIC',
        },
      },
    ],
  }

  // Add category filter if provided
  if (categoryIds && categoryIds.length > 0) {
    whereClause.and.push({
      categories: {
        in: categoryIds,
      },
    })
  }

  // Add search filter if provided
  if (searchQuery) {
    whereClause.and.push({
      name: {
        like: searchQuery,
      },
    })
  }

  // Find related products that match the provided filters
  const relatedProductsData = await payload.find({
    collection: 'products',
    where: whereClause,
    limit: maxDisplay, // Fetch a few more than we need in case some are filtered out
    depth: 1,
    req: {
      transactionID: undefined,
    },
  })

  if (relatedProductsData.docs.length === 0) {
    return null
  }

  // Get category name from the first product's categories if available
  let sectionTitle = title
  if (
    !sectionTitle &&
    relatedProductsData.docs.length > 0 &&
    categoryIds &&
    categoryIds.length > 0
  ) {
    const firstProduct = relatedProductsData.docs[0]
    if (firstProduct?.categories && firstProduct.categories.length > 0) {
      const firstCategory = firstProduct.categories[0]
      if (
        firstProduct &&
        firstCategory &&
        typeof firstCategory !== 'number' &&
        firstCategory?.title
      ) {
        sectionTitle = `Sản phẩm ${firstCategory.title} khác`
      }
    }
  }

  return (
    <RelatedProducts
      title={sectionTitle || 'Sản phẩm tương tự'}
      products={relatedProductsData.docs}
      categoryIds={categoryIds}
      maxDisplay={maxDisplay}
      searchQuery={searchQuery}
    />
  )
}

export default RelatedProductsSection
