import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Server-side Supabase client with service role (bypasses RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL1 || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY1 || process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key'

// DEBUG: Check for valid config
const isConfigured = supabaseUrl !== 'https://placeholder.supabase.co' && supabaseServiceKey !== 'placeholder-key' && supabaseServiceKey.length > 20

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(req: NextRequest) {
  if (!isConfigured) {
    console.error('[API/session] Critical Error: SUPABASE_SERVICE_ROLE_KEY is missing or invalid in Environment Variables.')
    return NextResponse.json({
      error: 'Server Configuration Error: Missing SUPABASE_SERVICE_ROLE_KEY. Please verify Vercel Environment Variables.'
    }, { status: 500 })
  }

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

    // Batch save messages (performance optimization)
    if (action === 'save_messages_batch') {
      const { messages } = body
      if (!conversationId || !Array.isArray(messages) || messages.length === 0) {
        return NextResponse.json({ error: 'conversationId and messages array required' }, { status: 400 })
      }

      // Type definition for batch message
      interface BatchMessage {
        role: string
        content: string
        color?: string
      }

      // Validate all messages have required fields
      for (const msg of messages as BatchMessage[]) {
        if (!msg.role || !msg.content) {
          return NextResponse.json({ error: 'Each message must have role and content' }, { status: 400 })
        }
      }

      // Batch insert all messages
      const messagesToInsert = (messages as BatchMessage[]).map((msg) => ({
        conversation_id: conversationId,
        role: msg.role,
        content: msg.content,
        color: msg.color
      }))

      const { error: msgError } = await supabaseAdmin
        .from('messages')
        .insert(messagesToInsert)

      if (msgError) {
        console.error('[API/session] Batch message save error:', msgError)
        return NextResponse.json({ error: msgError.message }, { status: 500 })
      }

      // Update conversation with the last message's color
      const lastColor = (messages as BatchMessage[])[messages.length - 1].color || 'ORANGE'
      await supabaseAdmin
        .from('conversations')
        .update({ color_state: lastColor, updated_at: new Date().toISOString() })
        .eq('id', conversationId)

      return NextResponse.json({ success: true })
    }

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
