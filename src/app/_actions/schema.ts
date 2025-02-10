import { z } from 'zod'

export const RechargeSchema = z.object({
  amount: z.coerce.number().min(2000),
})
