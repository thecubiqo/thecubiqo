/**
 * Next.js Middleware
 * 
 * Handles authentication and authorization for protected routes.
 * Specifically enforces admin-only access for /api/admin/* routes.
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
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
    "media-src 'self' blob: data:",
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
    'camera=(self)',
    'microphone=(self)',
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

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
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
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )
  
  // Admin route protection
  if (request.nextUrl.pathname.startsWith('/api/admin/')) {
    // Get authenticated user (this also refreshes the session)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Authentication required' },
        { status: 401 }
      )
    }
    
    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()
    
    if (profileError || !profile?.is_admin) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }
    
    // Add admin status to response headers for downstream routes
    response.headers.set('x-user-id', user.id)
    response.headers.set('x-user-email', user.email || '')
    response.headers.set('x-is-admin', 'true')
    
    return response
  }
  
  return response
}

export const config = {
  matcher: [
    '/api/admin/:path*',
    // Add other protected routes here as needed
  ],
}
