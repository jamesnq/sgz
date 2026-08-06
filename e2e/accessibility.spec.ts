import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test.describe('accessibility quality gate', () => {
  test('product listing has no serious or critical axe violations', async ({ page }) => {
    await page.goto('/products')
    await expect(page.getByRole('heading', { name: 'Khám phá Sản phẩm' })).toBeVisible()

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()

    const blockingViolations = results.violations.filter(
      ({ impact }) => impact === 'critical' || impact === 'serious',
    )
    expect(blockingViolations).toEqual([])
  })

  test('checkout supports keyboard focus and axe scan', async ({ page }) => {
    const productSlug = process.env.E2E_PRODUCT_SLUG
    test.skip(!productSlug, 'Set E2E_PRODUCT_SLUG to a public product for checkout audit')

    await page.goto(`/products/${productSlug}`)
    const checkout = page.getByRole('button', { name: /thanh toán/i }).last()
    await checkout.focus()
    await expect(checkout).toBeFocused()

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()
    expect(results.violations.filter(({ impact }) => impact === 'critical')).toEqual([])
  })
})
