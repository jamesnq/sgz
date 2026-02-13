import { describe, it, expect } from 'vitest'
import {
  validateVoucher,
  calculateVoucherDiscount,
  VoucherValidationError,
} from '@/utilities/voucher'

// Helper to create a base valid voucher for testing
function makeVoucher(overrides: Record<string, any> = {}) {
  return {
    active: true,
    startDate: null,
    expirationDate: null,
    maxUses: null,
    usedCount: 0,
    minPurchase: null,
    discountType: 'percentage' as const,
    discountValue: 10,
    ...overrides,
  }
}

describe('validateVoucher', () => {
  const now = new Date('2026-02-07T12:00:00Z')

  it('should pass for a valid active voucher', () => {
    const voucher = makeVoucher()
    expect(() => validateVoucher(voucher, 100_000, now)).not.toThrow()
  })

  it('should throw for inactive voucher', () => {
    const voucher = makeVoucher({ active: false })
    expect(() => validateVoucher(voucher, 100_000, now)).toThrow(VoucherValidationError)
    expect(() => validateVoucher(voucher, 100_000, now)).toThrow('Mã voucher đã bị vô hiệu hóa')
  })

  it('should throw for voucher not yet started', () => {
    const voucher = makeVoucher({ startDate: '2026-03-01T00:00:00Z' })
    expect(() => validateVoucher(voucher, 100_000, now)).toThrow('Mã voucher chưa có hiệu lực')
  })

  it('should throw for expired voucher', () => {
    const voucher = makeVoucher({ expirationDate: '2026-01-01T00:00:00Z' })
    expect(() => validateVoucher(voucher, 100_000, now)).toThrow('Mã voucher đã hết hạn')
  })

  it('should throw when max uses reached', () => {
    const voucher = makeVoucher({ maxUses: 5, usedCount: 5 })
    expect(() => validateVoucher(voucher, 100_000, now)).toThrow('Mã voucher đã hết lượt sử dụng')
  })

  it('should pass when usedCount is less than maxUses', () => {
    const voucher = makeVoucher({ maxUses: 5, usedCount: 4 })
    expect(() => validateVoucher(voucher, 100_000, now)).not.toThrow()
  })

  it('should throw when totalPrice is below minPurchase', () => {
    const voucher = makeVoucher({ minPurchase: 200_000 })
    expect(() => validateVoucher(voucher, 100_000, now)).toThrow('Đơn hàng tối thiểu')
  })

  it('should pass when totalPrice meets minPurchase', () => {
    const voucher = makeVoucher({ minPurchase: 100_000 })
    expect(() => validateVoucher(voucher, 100_000, now)).not.toThrow()
  })
})

describe('calculateVoucherDiscount', () => {
  it('should calculate percentage discount correctly', () => {
    const voucher = makeVoucher({ discountType: 'percentage', discountValue: 10 })
    expect(calculateVoucherDiscount(voucher, 100_000)).toBe(10_000)
  })

  it('should round percentage discount', () => {
    const voucher = makeVoucher({ discountType: 'percentage', discountValue: 33 })
    // 33% of 100,000 = 33,000
    expect(calculateVoucherDiscount(voucher, 100_000)).toBe(33_000)
  })

  it('should calculate fixed discount correctly', () => {
    const voucher = makeVoucher({ discountType: 'fixed', discountValue: 20_000 })
    expect(calculateVoucherDiscount(voucher, 100_000)).toBe(20_000)
  })

  it('should cap fixed discount at totalPrice', () => {
    const voucher = makeVoucher({ discountType: 'fixed', discountValue: 200_000 })
    expect(calculateVoucherDiscount(voucher, 100_000)).toBe(100_000)
  })

  it('should cap percentage discount at totalPrice', () => {
    const voucher = makeVoucher({ discountType: 'percentage', discountValue: 150 })
    // 150% of 100,000 = 150,000 → capped at 100,000
    expect(calculateVoucherDiscount(voucher, 100_000)).toBe(100_000)
  })

  it('should return 0 discount for 0 totalPrice', () => {
    const voucher = makeVoucher({ discountType: 'percentage', discountValue: 10 })
    expect(calculateVoucherDiscount(voucher, 0)).toBe(0)
  })
})
