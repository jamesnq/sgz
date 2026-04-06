import { z } from 'zod'

export const RechargePayosSchema = z.object({
  amount: z.coerce
    .number({
      message: 'Số tiền nạp tối thiểu là 2000 VND',
    })
    .min(2000, 'Số tiền nạp tối thiểu là 2000 VND'),
})
export const RechargeDoiTheSchema = z.object({
  telco: z.string(),
  code: z.string(),
  serial: z.string(),
  amount: z.coerce.number().int('Số tiền nạp phải là số nguyên').positive('Số tiền nạp phải lớn hơn 0'),
})
export const CheckoutSchema = z.object({
  productVariantId: z.coerce.number(),
  quantity: z.coerce.number().int('Số lượng phải là số nguyên').positive('Số lượng tối thiểu là 1'),
  shippingFields: z.any(),
  voucherCode: z.string().optional(),
})
export const UpdateFormSubmissionSchema = z.object({
  id: z.coerce.number(),
  shippingFields: z.any(),
})

export const autoProcessOrderSchema = z.object({
  orderId: z.number(),
})

export const importStocksSchema = z.object({
  productVariantId: z.coerce.number(),
  input: z.array(z.any()),
})

export const adminBalanceSchema = z.object({
  userId: z.number().positive(),
  amount: z.number(),
  note: z.string().optional(),
})
