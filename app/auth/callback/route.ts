/**
 * Auth Callback Route
 * Handles magic link verification and session creation
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const error_description = searchParams.get('error_description')
  const next = searchParams.get('next') ?? '/chat'

  // Handle error from URL params (e.g., rate limit errors)
  if (error) {
    console.error('[Auth Callback] URL param error:', error, error_description)
    const errorMessage = error_description || error
    
    // Check if it's a rate limit error
    if (errorMessage.toLowerCase().includes('rate limit') || errorMessage.toLowerCase().includes('too many')) {
      return NextResponse.redirect(
        `${origin}/auth/error?error=rate_limit_exceeded&description=${encodeURIComponent(errorMessage)}`
      )
    }
    
    return NextResponse.redirect(
      `${origin}/auth/error?error=${encodeURIComponent(error)}&description=${encodeURIComponent(errorMessage)}`
    )
  }

  // No code provided
  if (!code) {
    console.error('[Auth Callback] No code provided')
    return NextResponse.redirect(`${origin}/auth/error?error=invalid_code`)
  }

  try {
    const supabase = await createClient()

    // Exchange code for session
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error('[Auth Callback] Exchange error:', exchangeError.message)
      
      // Check if it's a rate limit error
      if (exchangeError.message.toLowerCase().includes('rate limit') || exchangeError.message.toLowerCase().includes('too many')) {
        return NextResponse.redirect(
          `${origin}/auth/error?error=rate_limit_exceeded&description=${encodeURIComponent(exchangeError.message)}`
        )
      }
      
      return NextResponse.redirect(`${origin}/auth/error?error=auth_callback_failed`)
    }

    // Get user after successful exchange
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error('[Auth Callback] User fetch error:', userError?.message)
      return NextResponse.redirect(`${origin}/auth/error?error=session_error`)
    }

    // Ensure profile exists after successful auth
    try {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (!existingProfile) {
        console.log('[Auth Callback] Creating new profile for user:', user.id)
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
          })
        
        if (insertError) {
          console.error('[Auth Callback] Profile creation error:', insertError.message)
          // Continue anyway - profile might be created by trigger
        }
      }
    } catch (profileError) {
      console.error('[Auth Callback] Profile check/creation error:', profileError)
      // Continue anyway - don't fail auth just because profile creation failed
    }

    // Successful auth - redirect to requested page
    console.log('[Auth Callback] Auth successful, redirecting to:', next)
    
    const forwardedHost = request.headers.get('x-forwarded-host')
    const isLocalEnv = process.env.NODE_ENV === 'development'

    if (isLocalEnv) {
      return NextResponse.redirect(`${origin}${next}`)
    } else if (forwardedHost) {
      return NextResponse.redirect(`https://${forwardedHost}${next}`)
    } else {
      return NextResponse.redirect(`${origin}${next}`)
    }
  } catch (error) {
    console.error('[Auth Callback] Unexpected error:', error)
    return NextResponse.redirect(`${origin}/auth/error?error=auth_callback_failed`)
  }
}
