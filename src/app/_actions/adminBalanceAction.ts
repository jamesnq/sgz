'use server'

import { userHasRole } from '@/access/hasRoles'
import { config } from '@/config'
import { transactions, users } from '@/payload-generated-schema'
import type { User } from '@/payload-types'
import { discordWebhook } from '@/services/novu.service'
import { formatPrice } from '@/utilities/formatPrice'
import { checkRateLimit, RATE_LIMITS } from '@/utilities/rateLimit'
import { authActionClient, ServerNotification } from '@/utilities/safe-action'
import payloadConfig from '@payload-config'
import { eq, sql } from '@payloadcms/db-postgres/drizzle'
import { after } from 'next/server'
import { getPayload } from 'payload'
import { adminBalanceSchema } from './schema'

type AdminBalanceInput = {
  userId: number
  amount: number
  note?: string
}

type AdminBalanceUser = Pick<User, 'id' | 'email' | 'roles'>

export const adminBalanceWithUser = async ({
  parsedInput: { userId, amount, note },
  user,
}: {
  parsedInput: AdminBalanceInput
  user: AdminBalanceUser
}) => {
  if (!userHasRole(user as User, ['admin'])) {
    return
  }

  const rl = checkRateLimit(user.id, RATE_LIMITS.adminBalance)
  if (!rl.allowed) {
    throw new ServerNotification(
      `Bạn thao tác quá nhanh, vui lòng thử lại sau ${Math.ceil(rl.retryAfterMs / 1000)}s`,
    )
  }

  const payload = await getPayload({ config: payloadConfig })
  const db = payload.db.drizzle
  const { newUser } = await db.transaction(async (tx) => {
    const [newUser] = await tx
      .update(users)
      .set({ balance: sql`${users.balance} + ${amount}` })
      .where(eq(users.id, userId))
      .returning({ balance: users.balance, email: users.email })

    if (!newUser || newUser.balance === null) {
      throw new Error('Không tìm thấy người dùng')
    }

    await tx.insert(transactions).values({
      user: userId,
      amount,
      description: `${config.NEXT_PUBLIC_SITE_NAME} ${amount > 0 ? 'nạp' : 'trừ'} tiền ${note || ''}`,
      balance: newUser.balance,
    })

    return { newUser }
  })

  after(async () => {
    try {
      await discordWebhook({
        subject: `Admin ${amount > 0 ? 'Nạp' : 'Trừ'} tiền`,
        message: `${newUser.email} \nSố tiền: **${formatPrice(amount)}** ${note ? `\nLý do: **${note}**` : ''}`,
        color: amount > 0 ? '#00FF00' : '#FF0000',
        channel: 'activities',
      })
    } catch (e) {
      console.error('[adminBalanceAction] Discord webhook failed:', e)
    }
  })

  return {
    balance: newUser.balance,
  }
}

export const adminBalanceAction = authActionClient
  .schema(adminBalanceSchema)
  .action(async ({ parsedInput, ctx }) =>
    adminBalanceWithUser({ parsedInput, user: ctx.user as AdminBalanceUser }),
  )
