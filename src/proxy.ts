/**
 * Middleware - Session Refresh, Route Protection, and Security Headers
 * 
 * Related PRs: #12 (Magic-link auth state), #28 (Centralized auth)
 * 
 * This middleware ensures:
 * 1. Session is refreshed on every request (critical for magic-link redirects)
 * 2. Auth cookies stay up-to-date
 * 3. UI never shows stale auth state
 * 4. Security headers are applied to all responses
 */

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { ENV } from '@/lib/config/env'

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

  // Prevent clickjacking attacks
  headers.set('X-Frame-Options', 'DENY')

  // Prevent MIME type sniffing
  headers.set('X-Content-Type-Options', 'nosniff')

  // Referrer policy - control information sent to other sites
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Permissions policy - restrict browser features
  headers.set('Permissions-Policy', [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'interest-cohort=()'
  ].join(', '))

  // Strict Transport Security - enforce HTTPS (only in production)
  if (process.env.NODE_ENV === 'production') {
    headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  }

  // X-XSS-Protection (legacy, but still useful for older browsers)
  headers.set('X-XSS-Protection', '1; mode=block')

  // Remove X-Powered-By to avoid information disclosure
  headers.delete('X-Powered-By')

  return response
}

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    ENV.supabase.url,
    ENV.supabase.anonKey,
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

  // Apply security headers to the response
  supabaseResponse = applySecurityHeaders(supabaseResponse)

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
