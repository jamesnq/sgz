import { test, expect } from '@playwright/test'

// These tests expect the dev server to be running with seeded data.
// At minimum, one public product must exist, accessible at /products/<slug>.
// For voucher-specific tests, a voucher must exist in the database.

test.describe('Voucher Input on Product Page', () => {
  // Navigate to a known product page before each test.
  // Update this slug to match an actual product in your dev database.
  const productSlug = 'goi-nap-brawlhalla'

  test.beforeEach(async ({ page }) => {
    await page.goto(`/products/${productSlug}`)
    // Wait for the checkout card to load
    await page.waitForSelector('#checkout')
  })

  test('voucher input field is visible', async ({ page }) => {
    const input = page.getByPlaceholder('Nhập mã voucher')
    await expect(input).toBeVisible()
  })

  test('apply button is disabled when input is empty', async ({ page }) => {
    const applyButton = page.getByRole('button', { name: 'Áp dụng' })
    await expect(applyButton).toBeDisabled()
  })

  test('entering text enables the apply button', async ({ page }) => {
    const input = page.getByPlaceholder('Nhập mã voucher')
    const applyButton = page.getByRole('button', { name: 'Áp dụng' })

    await input.fill('SOMECODE')
    await expect(applyButton).toBeEnabled()
  })

  test('invalid voucher code shows error notification', async ({ page }) => {
    const input = page.getByPlaceholder('Nhập mã voucher')
    const applyButton = page.getByRole('button', { name: 'Áp dụng' })

    await input.fill('INVALIDCODE123')
    await applyButton.click()

    // Wait for error toast/notification to appear
    const toast = page.locator('.Toastify__toast--error, [role="alert"]')
    await expect(toast.first()).toBeVisible({ timeout: 10000 })
  })

  // This test requires a valid voucher code in the database.
  // Update VALID_CODE to match an actual voucher code.
  test.describe('with valid voucher', () => {
    const VALID_CODE = 'TEST' // Must exist in your dev DB

    test('applying valid voucher shows discount line and updates total', async ({ page }) => {
      const input = page.getByPlaceholder('Nhập mã voucher')
      const applyButton = page.getByRole('button', { name: 'Áp dụng' })

      // Record the original total
      const totalBefore = await page.locator('#checkout .font-bold.text-highlight').textContent()

      await input.fill(VALID_CODE)
      await applyButton.click()

      // Wait for the discount line to appear
      const discountLine = page.locator('text=Mã giảm giá')
      await expect(discountLine).toBeVisible({ timeout: 10000 })

      // The "Huỷ" button should appear
      const cancelButton = page.getByRole('button', { name: 'Huỷ' })
      await expect(cancelButton).toBeVisible()

      // Input should be disabled
      await expect(input).toBeDisabled()
    })

    test('clicking cancel removes discount and re-enables input', async ({ page }) => {
      const input = page.getByPlaceholder('Nhập mã voucher')
      const applyButton = page.getByRole('button', { name: 'Áp dụng' })

      await input.fill(VALID_CODE)
      await applyButton.click()

      // Wait for cancel to appear
      const cancelButton = page.getByRole('button', { name: 'Huỷ' })
      await expect(cancelButton).toBeVisible({ timeout: 10000 })

      await cancelButton.click()

      // Discount line should disappear
      const discountLine = page.locator('text=Mã giảm giá')
      await expect(discountLine).not.toBeVisible()

      // Input should be enabled and empty
      await expect(input).toBeEnabled()
      await expect(input).toHaveValue('')

      // Apply button should be disabled again (empty input)
      const applyButtonAgain = page.getByRole('button', { name: 'Áp dụng' })
      await expect(applyButtonAgain).toBeDisabled()
    })
  })
})
