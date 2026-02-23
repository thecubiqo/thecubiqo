/**
 * Proxy - Session Refresh, Route Protection, and Security Headers
 * (Renamed from middleware.ts for Next 16 Turbopack compatibility)
 * 
 * This proxy ensures:
 * 1. Session is refreshed on every request (critical for magic-link redirects)
 * 2. Auth cookies stay up-to-date
 * 3. UI never shows stale auth state
 * 4. Security headers are applied to all responses
 */

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Apply security headers to response
 * Implements OWASP security best practices
 */
function applySecurityHeaders(response: NextResponse): NextResponse {
  const headers = response.headers

  // Content Security Policy - Prevent XSS attacks
  // Note: Adjust directives based on your app's needs
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://va.vercel-scripts.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co https://vercel.live wss://*.supabase.co",
    "frame-src 'self' https://vercel.live",
    "worker-src 'self' blob:",
    "media-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join('; ')

  headers.set('Content-Security-Policy', cspDirectives)
  headers.set('X-Frame-Options', 'DENY')
  headers.set('X-Content-Type-Options', 'nosniff')
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  headers.set('Permissions-Policy', [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'interest-cohort=()'
  ].join(', '))

  if (process.env.NODE_ENV === 'production') {
    headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  }

  headers.set('X-XSS-Protection', '1; mode=block')
  headers.delete('X-Powered-By')

  return response
}

export default async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Prioritize URL1/ANON_KEY1 if set, else fallback to standard env vars
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL1 || process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY1 || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
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
  })

  const { data: { user } } = await supabase.auth.getUser()

  if (process.env.NODE_ENV === 'development') {
    const pathname = request.nextUrl.pathname
    console.log(`[Proxy] ${pathname} - User: ${user ? user.id : 'guest'}`)
  }

  supabaseResponse = applySecurityHeaders(supabaseResponse)
  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
