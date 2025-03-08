import { getPayload } from 'payload'
import configPromise from '@payload-config'
import RelatedProducts from './RelatedProducts'

interface RelatedProductsSectionProps {
  categoryIds: string[]
  title?: string
  maxDisplay?: number
}

export const RelatedProductsSection = async ({
  categoryIds,
  title = 'Sản phẩm tương tự',
  maxDisplay = 4,
}: RelatedProductsSectionProps) => {
  // Skip if no category IDs provided
  if (!categoryIds || categoryIds.length === 0) {
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
      {
        categories: {
          in: categoryIds,
        },
      },
    ],
  }
  
  // Find related products that match the provided categories
  const relatedProductsData = await payload.find({
    collection: 'products',
    where: whereClause,
    limit: 8, // Fetch a few more than we need in case some are filtered out
    depth: 1,
  })
  
  if (relatedProductsData.docs.length === 0) {
    return null
  }
  
  // Get category name from the first product's categories if available
  let sectionTitle = title
  if (!sectionTitle && relatedProductsData.docs.length > 0) {
    const firstProduct = relatedProductsData.docs[0]
    if (firstProduct?.categories && firstProduct.categories.length > 0) {
      const firstCategory = firstProduct.categories[0]
      if (firstProduct && firstCategory && typeof firstCategory !== 'number' && firstCategory?.title) {
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
    />
  )
}

export default RelatedProductsSection
