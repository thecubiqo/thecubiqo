import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifySessionToken } from './lib/auth'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value
  const path = request.nextUrl.pathname

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/api/auth/login']
  if (publicRoutes.some(route => path.startsWith(route))) {
    return NextResponse.next()
  }

  // API routes - check auth for protected endpoints
  if (path.startsWith('/api/') && !path.startsWith('/api/auth/')) {
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const session = verifySessionToken(token)
    if (!session || !session.authenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
  }

  // Dashboard routes - redirect to login if not authenticated
  if (path.startsWith('/') && !path.startsWith('/api/') && path !== '/login') {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const session = verifySessionToken(token)
    if (!session || !session.authenticated) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}

