/**
 * Admin Authentication Middleware
 * 
 * Provides authentication and authorization helpers for admin-only endpoints.
 * 
 * SECURITY CRITICAL:
 * - All /api/admin/* endpoints MUST use requireAdmin()
 * - Never bypass these checks
 * - Logs all admin access attempts
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Admin user IDs - can be extended with database-driven roles
const ADMIN_USER_IDS = new Set(
  (process.env.ADMIN_USER_IDS || '').split(',').filter(Boolean)
)

// Admin emails - alternative to user IDs
const ADMIN_EMAILS = new Set(
  (process.env.ADMIN_EMAILS || '').split(',').filter(Boolean)
)

/**
 * Check if a user ID has admin privileges
 * 
 * Priority order:
 * 1. Check ADMIN_USER_IDS environment variable
 * 2. Check ADMIN_EMAILS environment variable
 * 3. Check profiles.is_admin column in database (future)
 * 
 * @param userId - User ID to check
 * @param email - User email to check
 * @returns true if user is an admin
 */
export async function isAdmin(userId: string, email?: string): Promise<boolean> {
  // Check environment variable lists first (fastest)
  if (ADMIN_USER_IDS.has(userId)) {
    return true
  }

  if (email && ADMIN_EMAILS.has(email)) {
    return true
  }

  // Future: Check database for is_admin flag
  // This would query the profiles table:
  // const { data } = await supabase.from('profiles').select('is_admin').eq('id', userId).single()
  // return data?.is_admin === true

  return false
}

/**
 * Require admin authentication for an API route
 * 
 * Usage in API routes:
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   const authResult = await requireAdmin(request)
 *   if (!authResult.authorized) {
 *     return authResult.response
 *   }
 * 
 *   const { user } = authResult
 *   // ... admin logic here
 * }
 * ```
 * 
 * @param request - Next.js request object
 * @returns Authorization result with user data or error response
 */
export async function requireAdmin(request: NextRequest): Promise<{
  authorized: boolean
  response?: NextResponse
  user?: {
    id: string
    email?: string
  }
}> {
  try {
    // Extract auth token from request
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      console.warn('[Admin Auth] No authorization token provided', {
        path: request.nextUrl.pathname,
        timestamp: new Date().toISOString()
      })

      return {
        authorized: false,
        response: NextResponse.json(
          {
            success: false,
            error: 'Unauthorized: No authentication token provided'
          },
          { status: 401 }
        )
      }
    }

    // Create Supabase client to verify token
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL1 || process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY1 || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('[Admin Auth] Missing Supabase configuration')
      return {
        authorized: false,
        response: NextResponse.json(
          {
            success: false,
            error: 'Server configuration error'
          },
          { status: 500 }
        )
      }
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    })

    // Verify user is authenticated
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      console.warn('[Admin Auth] Invalid or expired token', {
        path: request.nextUrl.pathname,
        error: error?.message,
        timestamp: new Date().toISOString()
      })

      return {
        authorized: false,
        response: NextResponse.json(
          {
            success: false,
            error: 'Unauthorized: Invalid or expired token'
          },
          { status: 401 }
        )
      }
    }

    // Check if user is an admin
    const hasAdminAccess = await isAdmin(user.id, user.email)

    if (!hasAdminAccess) {
      console.warn('[Admin Auth] User attempted admin access without privileges', {
        userId: user.id,
        email: user.email,
        path: request.nextUrl.pathname,
        timestamp: new Date().toISOString()
      })

      return {
        authorized: false,
        response: NextResponse.json(
          {
            success: false,
            error: 'Forbidden: Admin access required'
          },
          { status: 403 }
        )
      }
    }

    // Log successful admin access
    console.info('[Admin Auth] Admin access granted', {
      userId: user.id,
      email: user.email,
      path: request.nextUrl.pathname,
      timestamp: new Date().toISOString()
    })

    return {
      authorized: true,
      user: {
        id: user.id,
        email: user.email
      }
    }
  } catch (error) {
    console.error('[Admin Auth] Unexpected error during authentication', {
      error,
      path: request.nextUrl.pathname,
      timestamp: new Date().toISOString()
    })

    return {
      authorized: false,
      response: NextResponse.json(
        {
          success: false,
          error: 'Internal server error during authentication'
        },
        { status: 500 }
      )
    }
  }
}

/**
 * Alternative: Simple middleware function for routes that just need yes/no
 * 
 * Usage:
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   const errorResponse = await checkAdminAuth(request)
 *   if (errorResponse) return errorResponse
 *   
 *   // Continue with admin logic
 * }
 * ```
 */
export async function checkAdminAuth(request: NextRequest): Promise<NextResponse | null> {
  const result = await requireAdmin(request)
  return result.authorized ? null : result.response!
}
