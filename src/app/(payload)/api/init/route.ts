import paymentService from '@/services/payment.service'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(_req: NextRequest) {
  await paymentService.init()
  return NextResponse.json({ message: 'ok' })
}
