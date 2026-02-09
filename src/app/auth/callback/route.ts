import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  console.log('[AuthCallback] Origin:', origin, 'Headers:', Object.fromEntries(request.headers.entries()))
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect location
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const isLocalHost = process.env.NODE_ENV === 'development'
      if (isLocalHost) {
        return NextResponse.redirect(`${origin}${next}`)
      }
      return NextResponse.redirect(new URL(next, request.url).toString())
    }

    console.error('Auth callback error:', error)
    return NextResponse.redirect(`${origin}/auth/error?error=${error.message}`)
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/error?error=no_code_present`)
}
