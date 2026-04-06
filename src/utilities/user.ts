import { getPayload } from 'payload'
import configPromise from '@/payload.config'

/**
 * Checks if a user is an affiliate by searching for vouchers where they are assigned as the affiliateUser
 * @param userId - The ID of the user to check
 * @returns Boolean indicating if the user has affiliate status
 */
export async function checkIsAffiliate(userId: number | string | undefined): Promise<boolean> {
  if (!userId) return false

  const payload = await getPayload({ config: configPromise })
  const { totalDocs } = await payload.count({
    collection: 'vouchers',
    where: {
      affiliateUser: {
        equals: userId,
      },
    },
  })

  return totalDocs > 0
}
