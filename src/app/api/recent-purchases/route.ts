import { getRecentPurchases } from '@/services/recentPurchases'
import { unstable_cache } from 'next/cache'
import { NextResponse } from 'next/server'

const getCachedRecentPurchases = unstable_cache(() => getRecentPurchases(), ['recent-purchases'], {
  revalidate: 60,
})

export async function GET() {
  try {
    const items = await getCachedRecentPurchases()
    return NextResponse.json(
      { items },
      { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' } },
    )
  } catch (error) {
    console.error('[recent-purchases] Failed to load recent purchases:', error)
    return NextResponse.json({ items: [] })
  }
}
