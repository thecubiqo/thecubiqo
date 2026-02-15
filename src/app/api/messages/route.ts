/**
 * Messages API Route
 * Handles direct messaging operations: list, send, mark as read
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Get messages with a specific friend
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const friendId = searchParams.get('friend_id')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!friendId) {
      return NextResponse.json(
        { error: 'Friend ID is required' },
        { status: 400 }
      )
    }

    // Get messages between current user and friend
    const { data, error } = await supabase
      .from('direct_messages')
      .select(`
        *,
        sender_profile:profiles!direct_messages_sender_id_fkey(handle, display_name, avatar_url)
      `)
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1)

    if (error) throw error

    return NextResponse.json({ messages: data })
  } catch (error) {
    console.error('[Messages API] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

// POST - Send a message
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { receiver_id, content } = body

    if (!receiver_id || !content) {
      return NextResponse.json(
        { error: 'Receiver ID and content are required' },
        { status: 400 }
      )
    }

    // Verify friendship exists and is accepted
    const { data: friendship } = await supabase
      .from('friends')
      .select('*')
      .or(`and(user_id.eq.${user.id},friend_id.eq.${receiver_id}),and(user_id.eq.${receiver_id},friend_id.eq.${user.id})`)
      .eq('status', 'accepted')
      .single()

    if (!friendship) {
      return NextResponse.json(
        { error: 'You must be friends to send messages' },
        { status: 403 }
      )
    }

    // Send message
    const { data, error } = await supabase
      .from('direct_messages')
      .insert({
        sender_id: user.id,
        receiver_id,
        content,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, message: data })
  } catch (error) {
    console.error('[Messages API] POST error:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}

// PATCH - Mark messages as read or voice delivered
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { message_id, friend_id, action } = body

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      )
    }

    if (action === 'mark_read') {
      if (!friend_id) {
        return NextResponse.json(
          { error: 'Friend ID is required for mark_read' },
          { status: 400 }
        )
      }

      // Mark all unread messages from friend as read
      const { error } = await supabase
        .from('direct_messages')
        .update({ is_read: true })
        .eq('receiver_id', user.id)
        .eq('sender_id', friend_id)
        .eq('is_read', false)

      if (error) throw error

      return NextResponse.json({ success: true })
    } else if (action === 'mark_voice_delivered') {
      if (!message_id) {
        return NextResponse.json(
          { error: 'Message ID is required for mark_voice_delivered' },
          { status: 400 }
        )
      }

      // Mark specific message as voice delivered
      const { error } = await supabase
        .from('direct_messages')
        .update({ is_voice_delivered: true })
        .eq('id', message_id)
        .eq('receiver_id', user.id) // Only receiver can mark

      if (error) throw error

      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('[Messages API] PATCH error:', error)
    return NextResponse.json(
      { error: 'Failed to update message' },
      { status: 500 }
    )
  }
}
