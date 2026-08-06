import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const AUTH_COOKIE = 'payload-token'

/**
 * Fast route gate. This only checks that the HttpOnly Payload cookie exists; protected layouts
 * still validate the signed token and roles on the server before returning any private data.
 */
export function middleware(request: NextRequest) {
  if (!request.cookies.get(AUTH_COOKIE)?.value) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/'
    loginUrl.search = ''
    loginUrl.searchParams.set('authRequired', '1')
    loginUrl.searchParams.set('redirect', `${request.nextUrl.pathname}${request.nextUrl.search}`)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/user/:path*', '/workspace/:path*', '/stocks/:path*'],
}
