import doiThe from '@/services/doithe.service'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const fees = await doiThe.getFees()
    
    // Return the data directly as the API already formats it correctly
    return NextResponse.json(fees)
  } catch (error) {
    console.error('Error fetching fees:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch fees' },
      { status: 500 }
    )
  }
}
