import { z } from 'zod'

export const RechargePayosSchema = z.object({
  amount: z.coerce
    .number({
      message: 'Số tiền nạp tối thiểu là 2000 VND',
    })
    .min(2000, 'Số tiền nạp tối thiểu là 2000 VND')
    .max(50_000_000, 'Số tiền nạp tối đa là 50.000.000 VND'),
})
export const RechargeDoiTheSchema = z.object({
  telco: z.string().min(1, 'Nhà mạng không được để trống').max(30).trim(),
  code: z.string().min(1, 'Mã thẻ không được để trống').max(30).trim(),
  serial: z.string().min(1, 'Số serial không được để trống').max(30).trim(),
  amount: z.coerce
    .number()
    .int('Số tiền nạp phải là số nguyên')
    .positive('Số tiền nạp phải lớn hơn 0')
    .max(5_000_000, 'Mệnh giá thẻ tối đa 5.000.000 VND'),
})
export const CheckoutSchema = z.object({
  productVariantId: z.coerce.number().int().positive(),
  quantity: z.coerce
    .number()
    .int('Số lượng phải là số nguyên')
    .positive('Số lượng tối thiểu là 1')
    .max(100, 'Số lượng tối đa là 100'),
  shippingFields: z.any(),
  voucherCode: z.string().max(50).optional(),
})
export const GetProductsByIdsSchema = z.object({
  ids: z.array(z.coerce.number().int().positive()).max(20),
})
export const PayosCheckoutStatusSchema = z.object({
  orderCode: z.coerce.number().int().positive(),
})
export const UpdateFormSubmissionSchema = z.object({
  id: z.coerce.number().int().positive(),
  shippingFields: z.any(),
})

export const autoProcessOrderSchema = z.object({
  orderId: z.number().int().positive(),
})

export const importStocksSchema = z.object({
  productVariantId: z.coerce.number().int().positive(),
  input: z.array(z.record(z.string(), z.unknown())).min(1, 'Cần ít nhất 1 item'),
})

export const adminBalanceSchema = z.object({
  userId: z.number().positive(),
  amount: z.number(),
  note: z.string().optional(),
})
