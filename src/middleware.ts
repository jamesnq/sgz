import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Middleware is intentionally a no-op pass-through.
 * The adminAuthPlugin handles cookie setting (payload-token) natively via PayloadSession.
 * No session sync middleware is needed.
 */
export function middleware(_request: NextRequest) {
  return NextResponse.next()
}

// Only match a path that will never exist to effectively disable middleware
export const config = {
  matcher: [],
}
