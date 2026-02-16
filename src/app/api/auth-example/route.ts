/**
 * Auth Example API Endpoint
 * 
 * Demonstrates proper session persistence using the server client.
 * Related PR: #35 (Session persistence on API routes)
 * 
 * This endpoint shows:
 * 1. How to use the server client for API routes
 * 2. Session validation
 * 3. Protected resource access
 * 4. Proper error handling
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/auth-example
 * 
 * Returns current user information if authenticated.
 * Returns 401 if not authenticated.
 */
export async function GET() {
  try {
    // Create server client with proper cookie handling
    const supabase = await createClient()
    
    // Get current user - session is automatically maintained
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return NextResponse.json(
        { 
          error: 'Unauthorized',
          message: 'Please sign in to access this endpoint' 
        },
        { status: 401 }
      )
    }
    
    // User is authenticated - return user info
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        email_confirmed_at: user.email_confirmed_at,
        last_sign_in_at: user.last_sign_in_at,
        created_at: user.created_at,
      },
      message: 'Session is valid and persistent',
    })
    
  } catch (error) {
    console.error('[auth-example] Error:', error)
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'An error occurred while processing your request' 
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/auth-example
 * 
 * Example of a protected mutation endpoint.
 * Could be used for creating/updating resources.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Parse request body
    const body = await request.json().catch(() => ({}))
    
    // Perform protected operation (example)
    // In real usage, you'd interact with your database here
    return NextResponse.json({
      success: true,
      message: 'Protected operation completed',
      user_id: user.id,
      data: body,
    })
    
  } catch (error) {
    console.error('[auth-example] POST Error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
