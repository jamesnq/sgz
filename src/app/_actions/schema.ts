import { z } from 'zod'

export const RechargeSchema = z.object({
  amount: z.coerce.number().min(2000),
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
