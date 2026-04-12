import { getServerSession } from '@/hooks/getServerSession'
import { orders } from '@/payload-generated-schema'
import { and, eq, gte, lte, sql, sum, count } from '@payloadcms/db-postgres/drizzle'
import payloadConfig from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'

export async function GET(req: NextRequest) {
  const { user } = await getServerSession()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const searchParams = req.nextUrl.searchParams
  const fromDate = searchParams.get('from')
  const toDate = searchParams.get('to')

  const payload = await getPayload({ config: payloadConfig })
  const db = payload.db.drizzle

  // Build date filter conditions
  const conditions = [eq(orders.affiliateUser, user.id)]
  if (fromDate) {
    conditions.push(gte(orders.createdAt, fromDate))
  }
  if (toDate) {
    // Add 1 day to include the entire end date
    const endDate = new Date(toDate)
    endDate.setDate(endDate.getDate() + 1)
    conditions.push(lte(orders.createdAt, endDate.toISOString()))
  }

  // Get summary stats
  const [stats] = await db
    .select({
      totalCommission: sum(orders.affiliateCommission),
      paidCommission: sql<string>`COALESCE(SUM(CASE WHEN ${orders.affiliatePaid} = true THEN ${orders.affiliateCommission} ELSE 0 END), 0)`,
      unpaidCommission: sql<string>`COALESCE(SUM(CASE WHEN ${orders.affiliatePaid} = false OR ${orders.affiliatePaid} IS NULL THEN ${orders.affiliateCommission} ELSE 0 END), 0)`,
      totalOrders: count(),
    })
    .from(orders)
    .where(and(...conditions))

  // Get order list with pagination
  const page = Math.max(parseInt(searchParams.get('page') || '1'), 1)
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20'), 1), 100)
  const offset = (page - 1) * limit

  const orderList = await db
    .select({
      id: orders.id,
      totalPrice: orders.totalPrice,
      subTotal: orders.subTotal,
      affiliateCommission: orders.affiliateCommission,
      affiliatePaid: orders.affiliatePaid,
      createdAt: orders.createdAt,
      status: orders.status,
    })
    .from(orders)
    .where(and(...conditions))
    .orderBy(sql`${orders.createdAt} DESC`)
    .limit(limit)
    .offset(offset)

  return NextResponse.json({
    stats: {
      totalCommission: parseFloat(stats?.totalCommission || '0'),
      paidCommission: parseFloat(stats?.paidCommission || '0'),
      unpaidCommission: parseFloat(stats?.unpaidCommission || '0'),
      totalOrders: stats?.totalOrders || 0,
    },
    orders: orderList.map((o) => ({
      ...o,
      totalPrice: parseFloat(String(o.totalPrice || '0')),
      subTotal: parseFloat(String(o.subTotal || '0')),
      affiliateCommission: parseFloat(String(o.affiliateCommission || '0')),
    })),
    pagination: {
      page,
      limit,
    },
  })
}
