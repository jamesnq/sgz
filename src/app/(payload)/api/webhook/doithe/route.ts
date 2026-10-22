import doiThe from '@/services/doithe.service'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = await doiThe.webhookHandle(body)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in DoiThe POST webhook:', error)
    return NextResponse.json({ message: 'Error processing webhook' }, { status: 400 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries())
    const result = await doiThe.webhookHandle(searchParams as any)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in DoiThe GET webhook:', error)
    return NextResponse.json({ message: 'Error processing webhook' }, { status: 400 })
  }
}

