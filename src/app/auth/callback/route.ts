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
      const isLocalEnv = process.env.NODE_ENV === 'development'
      const productionUrl = 'https://www.cubiqo.ai'

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`)
      } else {
        // Always redirect to cubiqo.ai in production
        return NextResponse.redirect(`${productionUrl}${next}`)
      }
    }
  }

  // Auth failed - redirect to error page
  return NextResponse.redirect(`${origin}/auth/error?error=auth_callback_failed`)
}
