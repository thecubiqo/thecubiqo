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
    const { action, userId, email, sessionId, deviceInfo, conversationId } = body

    // Get or create conversation for a session
    if (action === 'ensure_conversation') {
      if (!sessionId) {
        return NextResponse.json({ error: 'sessionId required' }, { status: 400 })
      }

      // Check for existing conversation
      const { data: existingConv } = await supabaseAdmin
        .from('conversations')
        .select('id, color_state')
        .eq('session_id', sessionId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (existingConv) {
        return NextResponse.json({ conversation: existingConv })
      }

      // Create new conversation
      const { data: newConv, error: convError } = await supabaseAdmin
        .from('conversations')
        .insert({ session_id: sessionId, color_state: 'ORANGE' })
        .select('id, color_state')
        .single()

      if (convError) {
        console.error('[API/session] Conversation creation error:', convError)
        return NextResponse.json({ error: convError.message }, { status: 500 })
      }

      return NextResponse.json({ conversation: newConv })
    }

    // Get messages for a conversation
    if (action === 'get_messages') {
      if (!conversationId) {
        return NextResponse.json({ error: 'conversationId required' }, { status: 400 })
      }

      const { data: messages } = await supabaseAdmin
        .from('messages')
        .select('role, content, color, created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      return NextResponse.json({ messages: messages || [] })
    }

    // Save a message
    if (action === 'save_message') {
      const { role, content, color } = body
      if (!conversationId || !role || !content) {
        return NextResponse.json({ error: 'conversationId, role, content required' }, { status: 400 })
      }

      const { error: msgError } = await supabaseAdmin
        .from('messages')
        .insert({ conversation_id: conversationId, role, content, color })

      if (msgError) {
        console.error('[API/session] Message save error:', msgError)
        return NextResponse.json({ error: msgError.message }, { status: 500 })
      }

      // Update conversation
      await supabaseAdmin
        .from('conversations')
        .update({ color_state: color || 'ORANGE', updated_at: new Date().toISOString() })
        .eq('id', conversationId)

      return NextResponse.json({ success: true })
    }

    // ============ MEMORY ACTIONS ============

    // Get all memories for a session
    if (action === 'get_memories') {
      if (!sessionId) {
        return NextResponse.json({ error: 'sessionId required' }, { status: 400 })
      }

      const { data: memories, error: memError } = await supabaseAdmin
        .from('memory')
        .select('key, value, zone, created_at')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })

      if (memError) {
        return NextResponse.json({ error: memError.message }, { status: 500 })
      }

      return NextResponse.json({ memories: memories || [] })
    }

    // Upsert a memory (save or update by key)
    if (action === 'upsert_memory') {
      const { key, value, zone } = body
      if (!sessionId || !key || !value) {
        return NextResponse.json({ error: 'sessionId, key, value required' }, { status: 400 })
      }

      // Check if memory with this key exists
      const { data: existing } = await supabaseAdmin
        .from('memory')
        .select('id')
        .eq('session_id', sessionId)
        .eq('key', key)
        .maybeSingle()

      if (existing) {
        // Update existing
        const { error: updateError } = await supabaseAdmin
          .from('memory')
          .update({ value, zone: zone || 'green' })
          .eq('id', existing.id)

        if (updateError) {
          return NextResponse.json({ error: updateError.message }, { status: 500 })
        }
      } else {
        // Insert new
        const { error: insertError } = await supabaseAdmin
          .from('memory')
          .insert({ session_id: sessionId, key, value, zone: zone || 'green' })

        if (insertError) {
          return NextResponse.json({ error: insertError.message }, { status: 500 })
        }
      }

      return NextResponse.json({ success: true })
    }

    // Bulk upsert memories (for extraction results)
    if (action === 'upsert_memories') {
      const { memories } = body
      if (!sessionId || !memories || !Array.isArray(memories)) {
        return NextResponse.json({ error: 'sessionId and memories array required' }, { status: 400 })
      }

      for (const mem of memories) {
        if (!mem.key || !mem.value) continue

        const { data: existing } = await supabaseAdmin
          .from('memory')
          .select('id')
          .eq('session_id', sessionId)
          .eq('key', mem.key)
          .maybeSingle()

        if (existing) {
          await supabaseAdmin
            .from('memory')
            .update({ value: mem.value, zone: mem.zone || 'green' })
            .eq('id', existing.id)
        } else {
          await supabaseAdmin
            .from('memory')
            .insert({
              session_id: sessionId,
              key: mem.key,
              value: mem.value,
              zone: mem.zone || 'green'
            })
        }
      }

      return NextResponse.json({ success: true, count: memories.length })
    }

    // ============ END MEMORY ACTIONS ============

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

      // 2. Try to convert existing guest session
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
        // Check if user already has a session
        const { data: existingSession } = await supabaseAdmin
          .from('sessions')
          .select('id')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        let newSessionId: string

        if (existingSession) {
          newSessionId = existingSession.id
        } else {
          // Create new session for user
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

          newSessionId = newSession!.id
        }

        // Migrate conversations from old session to new session
        const { data: migratedConvs, error: migrateError } = await supabaseAdmin
          .from('conversations')
          .update({ session_id: newSessionId })
          .eq('session_id', sessionId)
          .select('id')

        if (migrateError) {
          console.error('[API/session] Conversation migration error:', migrateError)
        }

        const { data: finalSession } = await supabaseAdmin
          .from('sessions')
          .select('*')
          .eq('id', newSessionId)
          .single()

        return NextResponse.json({ session: finalSession })
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
