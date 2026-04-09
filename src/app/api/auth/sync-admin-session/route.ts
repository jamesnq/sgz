import { jwtVerify, SignJWT } from 'jose'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// Matches Users collection auth.tokenExpiration
const TOKEN_EXPIRATION_SECONDS = 60 * 60 * 24 * 30

export async function GET(request: NextRequest) {
  const redirectParam = request.nextUrl.searchParams.get('redirect')
  // Only allow redirecting within /admin to prevent open-redirect attacks
  const safeRedirect = redirectParam?.startsWith('/admin') ? redirectParam : '/admin'

  try {
    const cookieStore = await cookies()
    const appToken = cookieStore.get('__app-session-token')?.value

    if (!appToken) {
      return NextResponse.redirect(new URL(safeRedirect, request.url))
    }

    const secret = process.env.PAYLOAD_SECRET
    if (!secret) {
      return NextResponse.redirect(new URL(safeRedirect, request.url))
    }

    const secretKey = new TextEncoder().encode(secret)

    // Verify the OAuth session token (signed with the same PAYLOAD_SECRET)
    const { payload: sessionData } = await jwtVerify(appToken, secretKey)

    const { id, email, collection } = sessionData as {
      id: string | number
      email: string
      collection: string
    }

    if (!id || !email || collection !== 'users') {
      return NextResponse.redirect(new URL(safeRedirect, request.url))
    }

    // Issue a payload-token with the same user data and Payload's expected format
    const issuedAt = Math.floor(Date.now() / 1000)
    const exp = issuedAt + TOKEN_EXPIRATION_SECONDS

    const payloadToken = await new SignJWT({ id, email, collection })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setIssuedAt(issuedAt)
      .setExpirationTime(exp)
      .sign(secretKey)

    const response = NextResponse.redirect(new URL(safeRedirect, request.url))
    response.cookies.set('payload-token', payloadToken, {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      expires: new Date((issuedAt + TOKEN_EXPIRATION_SECONDS) * 1000),
    })

    return response
  } catch {
    // Invalid/expired OAuth token — let Payload handle authentication normally
    return NextResponse.redirect(new URL(safeRedirect, request.url))
  }
}
