/**
 * Friends API Route
 * Handles friend operations: list, send request, accept/decline, block, remove
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - List friends
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
    const status = searchParams.get('status') || 'accepted'

    // Get friends with profile data
    const { data, error } = await supabase
      .from('friends')
      .select(`
        *,
        friend_profile:profiles!friends_friend_id_fkey(handle, display_name, avatar_url)
      `)
      .eq('user_id', user.id)
      .eq('status', status)

    if (error) throw error

    return NextResponse.json({ friends: data })
  } catch (error) {
    console.error('[Friends API] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch friends' },
      { status: 500 }
    )
  }
}

// POST - Send friend request
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
    const { cq_number } = body

    if (!cq_number) {
      return NextResponse.json(
        { error: 'CQ number is required' },
        { status: 400 }
      )
    }

    // Lookup user by CQ number
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('handle', cq_number)
      .single()

    if (profileError || !profileData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Can't friend yourself
    if (profileData.id === user.id) {
      return NextResponse.json(
        { error: 'Cannot send friend request to yourself' },
        { status: 400 }
      )
    }

    // Check if relationship already exists
    const { data: existingFriend } = await supabase
      .from('friends')
      .select('*')
      .or(`and(user_id.eq.${user.id},friend_id.eq.${profileData.id}),and(user_id.eq.${profileData.id},friend_id.eq.${user.id})`)
      .single()

    if (existingFriend) {
      return NextResponse.json(
        { error: 'Friend request already exists or you are already friends' },
        { status: 400 }
      )
    }

    // Send friend request
    const { data, error } = await supabase
      .from('friends')
      .insert({
        user_id: user.id,
        friend_id: profileData.id,
        status: 'pending',
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, friendship: data })
  } catch (error) {
    console.error('[Friends API] POST error:', error)
    return NextResponse.json(
      { error: 'Failed to send friend request' },
      { status: 500 }
    )
  }
}

// PATCH - Accept/decline/block friend request
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
    const { friendship_id, action } = body

    if (!friendship_id || !action) {
      return NextResponse.json(
        { error: 'Friendship ID and action are required' },
        { status: 400 }
      )
    }

    if (action === 'accept') {
      const { error } = await supabase
        .from('friends')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('id', friendship_id)
        .eq('friend_id', user.id) // Only the receiver can accept

      if (error) throw error

      return NextResponse.json({ success: true })
    } else if (action === 'decline') {
      const { error } = await supabase
        .from('friends')
        .delete()
        .eq('id', friendship_id)
        .eq('friend_id', user.id) // Only the receiver can decline

      if (error) throw error

      return NextResponse.json({ success: true })
    } else if (action === 'block') {
      const { error } = await supabase
        .from('friends')
        .update({ status: 'blocked', updated_at: new Date().toISOString() })
        .eq('id', friendship_id)

      if (error) throw error

      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('[Friends API] PATCH error:', error)
    return NextResponse.json(
      { error: 'Failed to update friendship' },
      { status: 500 }
    )
  }
}

// DELETE - Remove friend
export async function DELETE(request: NextRequest) {
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
    const friendshipId = searchParams.get('friendship_id')

    if (!friendshipId) {
      return NextResponse.json(
        { error: 'Friendship ID is required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('friends')
      .delete()
      .eq('id', friendshipId)
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`) // Either party can remove

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Friends API] DELETE error:', error)
    return NextResponse.json(
      { error: 'Failed to remove friend' },
      { status: 500 }
    )
  }
}
