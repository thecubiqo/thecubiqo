/**
 * Middleware - Session Refresh and Route Protection
 * 
 * Related PRs: #12 (Magic-link auth state), #28 (Centralized auth)
 * 
 * This middleware ensures:
 * 1. Session is refreshed on every request (critical for magic-link redirects)
 * 2. Auth cookies stay up-to-date
 * 3. UI never shows stale auth state
 */

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL1 || process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY1 || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // CRITICAL: Refresh session on every request
  // This ensures magic-link redirects immediately reflect authenticated state
  // getUser() will automatically refresh expired sessions and update cookies
  const { data: { user } } = await supabase.auth.getUser()

  // Optional: Add debug logging in development
  if (process.env.NODE_ENV === 'development') {
    const pathname = request.nextUrl.pathname
    console.log(`[Middleware] ${pathname} - User: ${user ? user.id : 'guest'}`)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
