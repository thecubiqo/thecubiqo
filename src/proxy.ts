/**
 * Edge Proxy for Auth & Geo-Routing
 *
 * Handles Supabase session refresh and routes users to regional versions.
 * Runs at the edge for minimal latency.
 */

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Country code to region path mapping
const COUNTRY_TO_REGION: Record<string, string> = {
  'GB': '/uk',
  // 'IN': '/in',  // Enable when India config is ready
  // 'JP': '/jp',  // Enable when Japan config is ready
}

// Countries that should stay on main by default
const MAIN_COUNTRIES = new Set(['US'])

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Get user's country from Vercel geo headers (Next.js 16+ uses headers only)
  const country = request.headers.get('x-vercel-ip-country') || 'US'
  const city = request.headers.get('x-vercel-ip-city') || ''

  // Create base response with geo headers
  let response = NextResponse.next({ request })
  response.headers.set('x-user-country', country)
  response.headers.set('x-user-city', city)

  // Handle Supabase session refresh
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          response.headers.set('x-user-country', country)
          response.headers.set('x-user-city', city)
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if expired (this is important for auth)
  await supabase.auth.getUser()

  // Skip routing for regional paths (already routed)
  if (pathname.match(/^\/(uk|in|jp|us)/)) {
    const region = pathname.split('/')[1]
    response.headers.set('x-user-region', region)
    return response
  }

  // Only redirect on root path
  if (pathname === '/') {
    return handleRootRouting(request, country, response)
  }

  return response
}

function handleRootRouting(
  request: NextRequest,
  country: string,
  fallbackResponse: NextResponse
): NextResponse {
  // Check if user manually wants main (cookie or query param)
  const preferMain = request.cookies.get('prefer-main')?.value === 'true'
  const queryPreferMain = request.nextUrl.searchParams.get('main') === 'true'

  if (preferMain || queryPreferMain) {
    return fallbackResponse
  }

  // Check if country has a regional version
  const regionalPath = COUNTRY_TO_REGION[country]

  if (!regionalPath) {
    // No regional version for this country → stay on main
    return fallbackResponse
  }

  // Countries that prefer main by default
  if (MAIN_COUNTRIES.has(country)) {
    return fallbackResponse
  }

  // Get geo headers from fallback
  const userCountry = fallbackResponse.headers.get('x-user-country') || country
  const userCity = fallbackResponse.headers.get('x-user-city') || ''

  // Redirect to regional version
  const url = request.nextUrl.clone()
  url.pathname = regionalPath

  const redirectResponse = NextResponse.redirect(url, { status: 307 })
  redirectResponse.headers.set('x-user-country', userCountry)
  redirectResponse.headers.set('x-user-region', regionalPath.slice(1))
  if (userCity) {
    redirectResponse.headers.set('x-user-city', userCity)
  }

  return redirectResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (API is region-agnostic, uses headers)
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, icons, manifest
     * - public files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
