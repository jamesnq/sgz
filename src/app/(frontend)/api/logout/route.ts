import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST() {
  const cookieStore = await cookies()

  // Clear the Payload session cookie
  cookieStore.delete('payload-token')

  return NextResponse.json({ success: true, message: 'Logged out successfully' })
}
