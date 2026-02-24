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

const FOUNDER_EMAILS = ['aditya@cubiqo.ai', 'av.loy07@gmail.com']

// Country code to region path mapping
const COUNTRY_TO_REGION: Record<string, string> = {
  'GB': '/uk',
}

// Countries that should stay on main by default
const MAIN_COUNTRIES = new Set(['US'])

/**
 * Apply security headers to response
 * Implements OWASP security best practices
 */
function applySecurityHeaders(response: NextResponse): NextResponse {
  const headers = response.headers

  // Content Security Policy - Prevent XSS attacks
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.supabase.co https://*.vercel.app https://vercel.live https://va.vercel-scripts.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' blob: data: https://*.supabase.co https://*.vercel.app",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self' https://*.supabase.co https://vercel.live wss://*.supabase.co",
    "frame-src 'self' https://vercel.live",
    "worker-src 'self' blob:",
    "media-src 'self' blob: data:",
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

  // Permissions policy for camera and microphone (Enabled for 'self')
  headers.set('Permissions-Policy', 'camera=(self), microphone=(self), geolocation=(), interest-cohort=()')

  if (process.env.NODE_ENV === 'production') {
    headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  }

  headers.set('X-XSS-Protection', '1; mode=block')
  headers.delete('X-Powered-By')

  return response
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const url = request.nextUrl.clone()
  const path = url.pathname.toLowerCase()

  // 1. Path Normalization
  if (path.startsWith('/found') && path !== '/founderspass' && !path.startsWith('/founderspass/')) {
    if (path === '/founder' || path === '/founders' || path === '/found') {
      url.pathname = '/founderspass'
      return NextResponse.redirect(url)
    }
  }

  // 2. Initialize Response
  let response = NextResponse.next({
    request,
  })

  // 3. Supabase Client for Session & Auth Check
  // Prioritize URL1/ANON_KEY1 if set, else fallback to standard env vars
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL1 || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY1 || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return applySecurityHeaders(response)
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value)
          response.cookies.set(name, value, options)
        })
      },
    },
  })

  // Refresh session
  const { data: { user } } = await supabase.auth.getUser()

  if (process.env.NODE_ENV === 'development') {
    console.log(`[Proxy] ${pathname} - User: ${user ? user.id : 'guest'}`)
  }

  // 4. Apply Security Headers
  response = applySecurityHeaders(response)

  // 5. Founder Gate
  if (path.startsWith('/admin') || path.startsWith('/founderspass')) {
    const userEmail = user?.email?.toLowerCase() || ''
    const isFounder = FOUNDER_EMAILS.some(f => f.toLowerCase() === userEmail)

    if (!isFounder && path !== '/founderspass') {
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  // 6. Geo-Routing
  const country = request.headers.get('x-vercel-ip-country') || 'US'
  response.headers.set('x-user-country', country)

  if (pathname === '/') {
    const preferMain = request.cookies.get('prefer-main')?.value === 'true'
    const queryPreferMain = request.nextUrl.searchParams.get('main') === 'true'

    if (!preferMain && !queryPreferMain) {
      const regionalPath = COUNTRY_TO_REGION[country]
      if (regionalPath && !MAIN_COUNTRIES.has(country)) {
        url.pathname = regionalPath
        const redirectResponse = NextResponse.redirect(url, { status: 307 })
        redirectResponse.headers.set('x-user-country', country)
        return redirectResponse
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (handled separately)
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, icons, manifest
     * - public files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
