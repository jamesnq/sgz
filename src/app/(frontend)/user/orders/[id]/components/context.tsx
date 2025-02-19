'use client'
import { Product, ProductVariant } from '@/payload-types'
import React from 'react'

type ProductPageContextType = {
  product: Product | null
  currentVariant?: ProductVariant | null
  setCurrentVariant?: (variant: ProductVariant | null) => void
}
const ProductPageContext = React.createContext<ProductPageContextType | null>(null)

export function useProductPageContext() {
  const context = React.useContext(ProductPageContext)
  if (context === undefined) {
    throw new Error('useProductPageContext must be used within a ProductPageProvider')
  }
  return context
}

export function ProductPageProvider({
  children,
  product,
}: {
  children: React.ReactNode
  product: Product
}) {
  const [currentVariant, setCurrentVariant] = React.useState<ProductVariant | null>(
    product?.variants?.length ? (product.variants[0] as ProductVariant) : null,
  )
  return (
    <ProductPageContext.Provider value={{ product, currentVariant, setCurrentVariant }}>
      {children}
    </ProductPageContext.Provider>
  )
}
// export async function generateStaticParams() {
//   const payload = await getPayload({ config: configPromise })
//   const products = await payload.find({
//     collection: 'products',
//     draft: false,
//     limit: 1000,
//     overrideAccess: false,
//     pagination: false,
//     select: {
//       slug: true,
//     },
//   })

//   const params = products.docs.map(({ slug }) => {
//     return { slug }
//   })

//   return params
// }
