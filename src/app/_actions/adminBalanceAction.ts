'use server'
import { userHasRole } from '@/access/hasRoles'
import { config } from '@/config'
import { transactions, users } from '@/payload-generated-schema'
import { authActionClient } from '@/utilities/safe-action'
import payloadConfig from '@payload-config'
import { eq, sql } from '@payloadcms/db-postgres/drizzle'
import { getPayload } from 'payload'
import { adminBalanceSchema } from './schema'

import { discordWebhook } from '@/services/novu.service'
import { after } from 'next/server'
import { formatPrice } from '@/utilities/formatPrice'
export const adminBalanceAction = authActionClient
  .schema(adminBalanceSchema)
  .action(async ({ parsedInput: { userId, amount, note }, ctx }) => {
    const { user } = ctx

    if (!userHasRole(user, ['admin'])) {
      return
    }
    const payload = await getPayload({ config: payloadConfig })
    const db = payload.db.drizzle
    const { newUser } = await db.transaction(async () => {
      const [newUser] = await db
        .update(users)
        .set({ balance: sql`${users.balance} + ${amount}` })
        .where(eq(users.id, userId))
        .returning({ balance: users.balance, email: users.email })
      if (!newUser || !newUser.balance) throw new Error('Không tìm thấy người dùng')
      await db.insert(transactions).values({
        user: userId,
        amount: amount.toString(),
        description: `${config.NEXT_PUBLIC_SITE_NAME} ${amount > 0 ? 'nạp' : 'trừ'} tiền ${note || ''}`,
        balance: newUser.balance.toString(),
      })
      return { newUser }
    })
    after(async () => {
      await discordWebhook({
        subject: `Admin ${amount > 0 ? 'Nạp' : 'Trừ'} tiền`,
        message: `${newUser.email} \nSố tiền: **${formatPrice(amount)}** ${note ? `\nLý do: **${note}**` : ''}`,
        color: amount > 0 ? '#00FF00' : '#FF0000',
        channel: 'activities',
      })
    })
  })
