import paymentService from '@/services/payment.service'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const data = await paymentService.webhookHandle(await request.json())
  return NextResponse.json({ message: 'ok' })
}
