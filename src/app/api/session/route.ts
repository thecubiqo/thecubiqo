import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Server-side Supabase client with service role (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, userId, email, sessionId, deviceInfo } = body

    console.log('[API/session] Action:', action, 'userId:', userId)

    if (action === 'ensure_authenticated_session') {
      if (!userId) {
        return NextResponse.json({ error: 'userId required' }, { status: 400 })
      }

      // 1. Ensure profile exists
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert(
          { id: userId, email: email || null },
          { onConflict: 'id', ignoreDuplicates: true }
        )

      if (profileError) {
        console.error('[API/session] Profile error:', profileError)
        // Continue - might already exist
      }

      // 2. Check for existing session
      const { data: existingSession } = await supabaseAdmin
        .from('sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (existingSession) {
        console.log('[API/session] Found existing session:', existingSession.id)
        return NextResponse.json({ session: existingSession })
      }

      // 3. Create new session
      const { data: newSession, error: sessionError } = await supabaseAdmin
        .from('sessions')
        .insert({
          user_id: userId,
          is_guest: false,
          geo_location: 'US',
          device_info: deviceInfo || {},
          expires_at: null
        })
        .select()
        .single()

      if (sessionError) {
        console.error('[API/session] Session creation error:', sessionError)
        return NextResponse.json({ error: sessionError.message }, { status: 500 })
      }

      console.log('[API/session] Created session:', newSession.id)
      return NextResponse.json({ session: newSession })
    }

    if (action === 'convert_guest_session') {
      if (!userId || !sessionId) {
        return NextResponse.json({ error: 'userId and sessionId required' }, { status: 400 })
      }

      // 1. Ensure profile exists
      await supabaseAdmin
        .from('profiles')
        .upsert(
          { id: userId, email: email || null },
          { onConflict: 'id', ignoreDuplicates: true }
        )

      // 2. Convert session
      const { data: converted, error: convertError } = await supabaseAdmin
        .from('sessions')
        .update({
          user_id: userId,
          is_guest: false,
          expires_at: null
        })
        .eq('id', sessionId)
        .eq('is_guest', true)
        .select()
        .single()

      if (convertError || !converted) {
        console.log('[API/session] Convert failed, creating new session')
        // Fallback: create new session
        const { data: newSession } = await supabaseAdmin
          .from('sessions')
          .insert({
            user_id: userId,
            is_guest: false,
            geo_location: 'US',
            device_info: deviceInfo || {},
            expires_at: null
          })
          .select()
          .single()

        return NextResponse.json({ session: newSession })
      }

      return NextResponse.json({ session: converted })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('[API/session] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
