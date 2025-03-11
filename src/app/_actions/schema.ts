import { z } from 'zod'

export const RechargePayosSchema = z.object({
  amount: z.coerce.number().min(2000),
})
export const RechargeDoiTheSchema = z.object({
  telco: z.string(),
  code: z.string(),
  serial: z.string(),
  amount: z.coerce.number(),
})
export const CheckoutSchema = z.object({
  productVariantId: z.coerce.number(),
  quantity: z.coerce.number(),
  shippingFields: z.any(),
})
export const UpdateFormSubmissionSchema = z.object({
  id: z.coerce.number(),
  shippingFields: z.any(),
})

export const autoProcessOrderSchema = z.object({
  orderId: z.number(),
})
