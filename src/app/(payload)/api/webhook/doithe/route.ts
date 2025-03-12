import doiThe from '@/services/doithe.service'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const result = await doiThe.webhookHandle(await request.json())
  return NextResponse.json(result)
}
