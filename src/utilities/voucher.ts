import type { Voucher } from '@/payload-types'

export class VoucherValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'VoucherValidationError'
  }
}

/**
 * Validate a voucher against current conditions.
 * Throws VoucherValidationError with a user-facing message if invalid.
 */
export function validateVoucher(
  voucher: Pick<
    Voucher,
    'active' | 'startDate' | 'expirationDate' | 'maxUses' | 'usedCount' | 'minPurchase'
  >,
  totalPrice: number,
  now: Date = new Date(),
): void {
  if (!voucher.active) {
    throw new VoucherValidationError('Mã voucher đã bị vô hiệu hóa')
  }
  if (voucher.startDate && new Date(voucher.startDate) > now) {
    throw new VoucherValidationError('Mã voucher chưa có hiệu lực')
  }
  if (voucher.expirationDate && new Date(voucher.expirationDate) < now) {
    throw new VoucherValidationError('Mã voucher đã hết hạn')
  }
  if (voucher.maxUses && (voucher.usedCount ?? 0) >= voucher.maxUses) {
    throw new VoucherValidationError('Mã voucher đã hết lượt sử dụng')
  }
  if (voucher.minPurchase && totalPrice < voucher.minPurchase) {
    throw new VoucherValidationError(
      `Đơn hàng tối thiểu ${voucher.minPurchase.toLocaleString('vi-VN')}đ để sử dụng voucher này`,
    )
  }
}

/**
 * Calculate the discount amount for a voucher, capped so totalPrice never goes below 0.
 */
export function calculateVoucherDiscount(
  voucher: Pick<Voucher, 'discountType' | 'discountValue'>,
  totalPrice: number,
): number {
  let discountAmount = 0
  if (voucher.discountType === 'percentage') {
    discountAmount = Math.round((totalPrice * voucher.discountValue) / 100)
  } else {
    discountAmount = voucher.discountValue
  }
  return Math.min(discountAmount, totalPrice)
}
