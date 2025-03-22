'use client'
import { Order } from '@/payload-types'
import payloadClient from '@/utilities/payloadClient'
import { useQuery } from '@tanstack/react-query'

export interface OrderQuery {
  where?: Record<string, any>
  limit?: number
}

export const useOrders = (queries: OrderQuery[]) => {
  const { data, refetch } = useQuery({
    queryKey: ['orders', queries],
    refetchInterval: 10000,
    queryFn: async () => {
      const res = await Promise.all(
        queries.map(({ where, limit }) =>
          payloadClient.find({
            collection: 'orders',
            where,
            sort: '-updatedAt',
            depth: 2,
            limit: limit ?? -1,
          }),
        ),
      )
      return res
    },
    select: (data: any[]) => data.map((doc: any) => doc.docs).flat() as Order[],
  })
  return { data, refetch }
}
