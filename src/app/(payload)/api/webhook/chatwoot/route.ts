// import { discordWebhook } from '@/services/novu.service'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  // const body = await request.json()
  // await discordWebhook({ subject: 'Need Support', message: JSON.stringify(body, null, 2) })
  return NextResponse.json({ message: 'ok' })
}
