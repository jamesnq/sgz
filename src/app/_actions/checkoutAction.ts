'use server'

import { checkoutWithUser } from '@/services/checkout.service'
import { authActionClient } from '@/utilities/safe-action'
import { CheckoutSchema } from './schema'

export const checkoutAction = authActionClient
  .schema(CheckoutSchema)
  .action(async ({ parsedInput, ctx }) => checkoutWithUser({ parsedInput, user: ctx.user }))
