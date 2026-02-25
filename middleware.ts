/**
 * CubiQo Middleware — Domain-Based Routing
 *
 * Routes requests based on the incoming hostname so that each
 * sub-product can be served from its own domain while living
 * in the same monorepo / Next.js deployment.
 *
 * Domain mapping:
 *   cubiqo.dev       → /coder   (independent coding panel)
 *   cubiqo.marketing → /marketing (social army dashboard)
 *   cubiqo.ai        → / (main app — default)
 *
 * All sub-products remain functional even if the main cubiqo.ai
 * app has issues, because they are isolated route segments with
 * independent layouts and no shared server state.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

// Domain → path prefix mapping
const DOMAIN_ROUTES: Record<string, string> = {
  'cubiqo.dev': '/coder',
  'www.cubiqo.dev': '/coder',
  'cubiqo.marketing': '/marketing',
  'www.cubiqo.marketing': '/marketing',
};

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  // Strip port for local development
  const host = hostname.split(':')[0];

  // Check if the request is for a mapped domain
  const targetPrefix = DOMAIN_ROUTES[host];

  if (targetPrefix) {
    const { pathname, search } = request.nextUrl;

    // If already on the correct prefix, pass through
    if (pathname.startsWith(targetPrefix)) {
      return updateSession(request);
    }

    // API routes and static assets pass through unchanged
    if (pathname.startsWith('/api/') || pathname.startsWith('/_next/') || pathname.startsWith('/favicon')) {
      return updateSession(request);
    }

    // Rewrite root and other paths to the sub-product prefix
    const url = request.nextUrl.clone();
    url.pathname = `${targetPrefix}${pathname === '/' ? '' : pathname}`;
    if (search) url.search = search;

    return NextResponse.rewrite(url);
  }

  // Wildcard *.cubiqo.dev → project preview routing
  if (host.endsWith('.cubiqo.dev') && !DOMAIN_ROUTES[host]) {
    const subdomain = host.replace('.cubiqo.dev', '');
    const { pathname, search } = request.nextUrl;

    // API routes and static assets pass through unchanged
    if (pathname.startsWith('/api/') || pathname.startsWith('/_next/') || pathname.startsWith('/favicon')) {
      return updateSession(request);
    }

    const url = request.nextUrl.clone();
    url.pathname = `/coder/preview/${subdomain}${pathname === '/' ? '' : pathname}`;
    if (search) url.search = search;

    return NextResponse.rewrite(url);
  }

  // Default: pass through with Supabase session refresh
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
