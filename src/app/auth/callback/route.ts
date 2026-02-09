/**
 * Auth Callback Route
 * Handles magic link verification and session creation
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()

    // Exchange code for session
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Ensure profile exists after successful auth
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // Check if profile exists
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single()

        if (!existingProfile) {
          // Create profile with auto-generated handle
          await supabase
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email,
            })
        }
      }

      // Redirect to requested page or home
      // Use the origin from the request to ensure we stay on the same domain
      // This prevents cross-domain cookie loss (e.g. callback on vercel.app -> redirect to cubiqo.ai)
      const redirectUrl = `${origin}${next}`

      // Create response with redirect
      const response = NextResponse.redirect(redirectUrl)

      // IMPORTANT: Copy session cookies to response
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        response.cookies.set('sb-access-token', session.access_token, {
          path: '/',
          httpOnly: true,
          secure: true,
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7 // 7 days
        })
        response.cookies.set('sb-refresh-token', session.refresh_token, {
          path: '/',
          httpOnly: true,
          secure: true,
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 30 // 30 days
        })
      }

      return response
    }
  }

  // Auth failed - redirect to error page
  return NextResponse.redirect(`${origin}/auth/error?error=auth_callback_failed`)
}
