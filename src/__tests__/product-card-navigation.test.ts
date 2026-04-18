import { describe, expect, test } from 'vitest'
import { Product } from '@/payload-types'
import { Routes } from '@/utilities/routes'

function getProductHref(product: Pick<Product, 'slug'>) {
  return product.slug ? Routes.product(product.slug) : '#'
}

describe('ProductCard navigation href', () => {
  test('uses the PDP route when the product has a slug', () => {
    expect(getProductHref({ slug: 'steam-wallet' } as Pick<Product, 'slug'>)).toBe(
      Routes.product('steam-wallet'),
    )
  })

  test('falls back to # when the product has no slug', () => {
    expect(getProductHref({ slug: null } as Pick<Product, 'slug'>)).toBe('#')
  })
})
