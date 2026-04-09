import { NextRequest, NextResponse } from 'next/server'

/**
 * Intercepts requests to /admin when the user has a valid OAuth session
 * (__app-session-token) but no Payload admin token (payload-token).
 * Redirects to the session sync endpoint which issues a payload-token,
 * allowing Google-authenticated users to access /admin without a separate login.
 */
export function middleware(request: NextRequest) {
  const appSessionToken = request.cookies.get('__app-session-token')?.value
  const payloadToken = request.cookies.get('payload-token')?.value

  if (appSessionToken && !payloadToken) {
    const syncUrl = new URL('/api/auth/sync-admin-session', request.url)
    syncUrl.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(syncUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin', '/admin/(.*)'],
}
