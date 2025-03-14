'use server'
import { userHasRole } from '@/access/hasRoles'
import { env } from '@/config'
import { transactions, users } from '@/payload-generated-schema'
import { authActionClient } from '@/utilities/safe-action'
import payloadConfig from '@payload-config'
import { eq, sql } from '@payloadcms/db-postgres/drizzle'
import { getPayload } from 'payload'
import { adminBalanceSchema } from './schema'
export const adminBalanceAction = authActionClient
  .schema(adminBalanceSchema)
  .action(async ({ parsedInput: { userId, amount, note }, ctx }) => {
    const { user } = ctx

    if (!userHasRole(user, ['admin'])) {
      return
    }
    const payload = await getPayload({ config: payloadConfig })
    const db = payload.db.drizzle
    await db.transaction(async () => {
      const [newUser] = await db
        .update(users)
        .set({ balance: sql`${users.balance} + ${amount}` })
        .where(eq(users.id, userId))
        .returning({ balance: users.balance })
      if (!newUser || !newUser.balance) throw new Error('Không tìm thấy người dùng')
      await db.insert(transactions).values({
        user: userId,
        amount: amount.toString(),
        description: `${env.NEXT_PUBLIC_SITE_NAME} ${amount > 0 ? 'nạp' : 'trừ'} tiền ${note || ''}`,
        balance: newUser.balance.toString(),
      })
    })
  })
