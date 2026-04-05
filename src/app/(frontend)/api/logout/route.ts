import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST() {
  const cookieStore = await cookies()

  // Clear the OAuth plugin session cookie
  cookieStore.delete('__app-session-token')
  cookieStore.delete('payload-token')

  return NextResponse.json({ success: true, message: 'Logged out successfully' })
}
