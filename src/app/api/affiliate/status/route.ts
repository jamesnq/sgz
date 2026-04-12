import { getServerSession } from '@/hooks/getServerSession'
import { checkIsAffiliate } from '@/utilities/user'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const { user } = await getServerSession()
    if (!user) {
      return NextResponse.json({ isAffiliate: false })
    }
    const isAffiliate = await checkIsAffiliate(user.id)
    return NextResponse.json({ isAffiliate })
  } catch {
    return NextResponse.json({ isAffiliate: false })
  }
}
