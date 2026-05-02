import { userHasRole } from '@/access/hasRoles'
import { textOnly } from '@/components/RichText/textOnly'
import { config } from '@/config'
import { Media, Product, ProductVariant, User } from '@/payload-types'
import calculateDiscountPercentage from '@/utilities/calculateDiscountPercentage'
import { formatPrice } from '@/utilities/formatPrice'
import configPromise from '@payload-config'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

const DESCRIPTION_LIMIT = 155

const cleanText = (value: string) => value.replace(/\s+/g, ' ').trim()

const truncate = (value: string, limit = DESCRIPTION_LIMIT) => {
  const text = cleanText(value)
  return text.length > limit ? `${text.slice(0, limit - 3).trim()}...` : text
}

const safeTextOnly = (value: unknown) => {
  if (!value || typeof value !== 'object') return ''

  try {
    return cleanText(textOnly(value as any))
  } catch {
    return ''
  }
}

const getMediaID = (media: number | Media | null | undefined) => {
  if (!media) return undefined
  return typeof media === 'number' ? media : media.id
}

const productTitle = (product: Pick<Product, 'name'>) =>
  `${product.name} - Tài khoản Offline / Key Steam | ${config.NEXT_PUBLIC_SITE_NAME}`

const productDescription = (product: Pick<Product, 'name' | 'description'>) => {
  const body = safeTextOnly(product.description)
  const prefix = `Mua ${product.name} giá rẻ, uy tín, giao dịch tự động tại ${config.NEXT_PUBLIC_SITE_NAME}.`

  return truncate(body ? `${prefix} ${body}` : prefix)
}

const variantTitle = (
  variant: Pick<ProductVariant, 'name'> & { product?: number | Pick<Product, 'name'> | null },
) => {
  const productName =
    variant.product && typeof variant.product === 'object' ? variant.product.name : ''
  const title =
    productName && !variant.name.toLowerCase().includes(productName.toLowerCase())
      ? `${variant.name} - ${productName}`
      : variant.name

  return `${title} | ${config.NEXT_PUBLIC_SITE_NAME}`
}

const variantDescription = (
  variant: Pick<ProductVariant, 'name' | 'description' | 'originalPrice' | 'price'> & {
    product?: number | Pick<Product, 'name' | 'description'> | null
  },
) => {
  const product = variant.product && typeof variant.product === 'object' ? variant.product : null
  const baseDescription = safeTextOnly(variant.description) || safeTextOnly(product?.description)
  const discount = calculateDiscountPercentage(variant.originalPrice, variant.price)
  const productName = product?.name ? ` ${product.name}` : ''
  const discountText =
    discount > 0
      ? ` Giá gốc ${formatPrice(variant.originalPrice)}, giảm ${Math.round(discount)}%.`
      : ''

  return truncate(
    `${variant.name}${productName} tại ${config.NEXT_PUBLIC_SITE_NAME}. Giá ${formatPrice(variant.price)}.${discountText} ${baseDescription}`,
  )
}

const variantImage = (
  variant: Pick<ProductVariant, 'image'> & {
    product?: number | Pick<Product, 'image'> | null
  },
) => {
  const product = variant.product && typeof variant.product === 'object' ? variant.product : null
  return getMediaID(variant.image) || getMediaID(product?.image)
}

export async function POST() {
  try {
    const payload = await getPayload({ config: configPromise })
    const reqHeaders = await headers()
    const { user } = await payload.auth({ headers: reqHeaders })

    if (!user || !userHasRole(user as User, ['admin'])) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let updatedProducts = 0
    let updatedVariants = 0
    let productPage = 1
    let variantPage = 1

    while (true) {
      const products = await payload.find({
        collection: 'products',
        depth: 0,
        limit: 100,
        page: productPage,
        overrideAccess: true,
        select: {
          name: true,
          image: true,
          description: true,
          meta: true,
        },
      })

      for (const product of products.docs) {
        await payload.update({
          collection: 'products',
          id: product.id,
          overrideAccess: true,
          data: {
            meta: {
              ...(product.meta || {}),
              title: productTitle(product),
              description: productDescription(product),
              image: getMediaID(product.image),
            },
          },
        })
        updatedProducts += 1
      }

      if (!products.hasNextPage) break
      productPage += 1
    }

    while (true) {
      const variants = await payload.find({
        collection: 'product-variants',
        depth: 1,
        limit: 100,
        page: variantPage,
        overrideAccess: true,
        select: {
          name: true,
          image: true,
          description: true,
          originalPrice: true,
          price: true,
          product: true,
          meta: true,
        },
      })

      for (const variant of variants.docs) {
        await payload.update({
          collection: 'product-variants',
          id: variant.id,
          overrideAccess: true,
          data: {
            meta: {
              ...(variant.meta || {}),
              title: variantTitle(variant),
              description: variantDescription(variant),
              image: variantImage(variant),
            },
          },
        })
        updatedVariants += 1
      }

      if (!variants.hasNextPage) break
      variantPage += 1
    }

    return NextResponse.json({
      message: 'Generated product metadata',
      updatedProducts,
      updatedVariants,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[Generate Product Metadata] Failed:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
