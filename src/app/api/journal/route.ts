/**
 * Journal API Route Handler
 * Manages daily journal entries with once-per-day enforcement
 * 
 * Features:
 * - Check if user can journal today (GET)
 * - Create new journal entry (POST)
 * - Update today's entry (PATCH)
 * - 24-hour gating enforcement
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Server-side Supabase client with service role (bypasses RLS)
// Allow build to succeed without env vars, but runtime will fail appropriately
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'fake-key-for-build'
)

export const dynamic = 'force-dynamic'

/**
 * GET /api/journal
 * Check if user can journal today and get today's entry if exists
 */
export async function GET(request: NextRequest) {
  try {
    // Check for required environment variables at runtime
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Server configuration error: Missing database credentials' },
        { status: 500 }
      )
    }
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    const userId = searchParams.get('userId')

    if (!sessionId && !userId) {
      return NextResponse.json(
        { error: 'sessionId or userId required' },
        { status: 400 }
      )
    }

    // Get today's start (UTC)
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)
    const todayISO = today.toISOString()

    // Check if entry exists for today
    let query = supabaseAdmin
      .from('journal_entries')
      .select('*')
      .gte('created_at', todayISO)

    if (userId) {
      query = query.eq('user_id', userId)
    } else {
      query = query.eq('session_id', sessionId)
    }

    const { data: entries, error } = await query.maybeSingle()

    if (error) {
      console.error('[Journal API] Error checking entry:', error)
      return NextResponse.json(
        { error: 'Failed to check journal status' },
        { status: 500 }
      )
    }

    // If entry exists, return it with canJournal=false
    if (entries) {
      const nextAvailable = new Date(entries.created_at)
      nextAvailable.setDate(nextAvailable.getDate() + 1)
      nextAvailable.setUTCHours(0, 0, 0, 0)

      return NextResponse.json({
        canJournal: false,
        todayEntry: entries,
        nextAvailableAt: nextAvailable.toISOString(),
        message: 'You have already journaled today. Come back tomorrow!'
      })
    }

    // No entry today, user can journal
    return NextResponse.json({
      canJournal: true,
      todayEntry: null,
      message: 'Ready to journal!'
    })
  } catch (error) {
    console.error('[Journal API] GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/journal
 * Create a new journal entry
 */
export async function POST(request: NextRequest) {
  try {
    // Check for required environment variables at runtime
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Server configuration error: Missing database credentials' },
        { status: 500 }
      )
    }
    const body = await request.json()
    const {
      sessionId,
      userId,
      content,
      mood = 'neutral',
      colorState = 'ORANGE',
      durationSeconds = 0
    } = body

    if (!sessionId && !userId) {
      return NextResponse.json(
        { error: 'sessionId or userId required' },
        { status: 400 }
      )
    }

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Journal content is required' },
        { status: 400 }
      )
    }

    // Check if user already journaled today
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)
    const todayISO = today.toISOString()

    let checkQuery = supabaseAdmin
      .from('journal_entries')
      .select('id')
      .gte('created_at', todayISO)

    if (userId) {
      checkQuery = checkQuery.eq('user_id', userId)
    } else {
      checkQuery = checkQuery.eq('session_id', sessionId)
    }

    const { data: existing } = await checkQuery.maybeSingle()

    if (existing) {
      return NextResponse.json(
        { error: 'You have already journaled today. Come back tomorrow!' },
        { status: 409 } // Conflict
      )
    }

    // Create journal entry
    const { data: entry, error } = await supabaseAdmin
      .from('journal_entries')
      .insert({
        session_id: sessionId,
        user_id: userId || null,
        content,
        mood,
        color_state: colorState,
        duration_seconds: durationSeconds,
        email_queued: false
      })
      .select()
      .single()

    if (error) {
      console.error('[Journal API] Error creating entry:', error)
      return NextResponse.json(
        { error: 'Failed to save journal entry' },
        { status: 500 }
      )
    }

    // Create analytics record
    await supabaseAdmin
      .from('journal_analytics')
      .insert({
        entry_id: entry.id,
        started_at: new Date(Date.now() - durationSeconds * 1000).toISOString(),
        completed_at: new Date().toISOString(),
        prompts_completed: 0, // Will be updated by frontend
        completion_rate: 100.0,
        device_info: {}
      })

    return NextResponse.json({
      success: true,
      entry,
      message: 'Journal entry saved successfully!'
    })
  } catch (error) {
    console.error('[Journal API] POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/journal
 * Update today's journal entry (only allowed on same day)
 */
export async function PATCH(request: NextRequest) {
  try {
    // Check for required environment variables at runtime
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Server configuration error: Missing database credentials' },
        { status: 500 }
      )
    }
    const body = await request.json()
    const {
      entryId,
      content,
      mood,
      durationSeconds
    } = body

    if (!entryId) {
      return NextResponse.json(
        { error: 'entryId is required' },
        { status: 400 }
      )
    }

    // Get the entry to verify it's from today
    const { data: entry, error: fetchError } = await supabaseAdmin
      .from('journal_entries')
      .select('*')
      .eq('id', entryId)
      .single()

    if (fetchError || !entry) {
      return NextResponse.json(
        { error: 'Journal entry not found' },
        { status: 404 }
      )
    }

    // Check if entry is from today
    const entryDate = new Date(entry.created_at)
    const today = new Date()
    
    if (
      entryDate.getUTCFullYear() !== today.getUTCFullYear() ||
      entryDate.getUTCMonth() !== today.getUTCMonth() ||
      entryDate.getUTCDate() !== today.getUTCDate()
    ) {
      return NextResponse.json(
        { error: 'Can only edit today\'s journal entry' },
        { status: 403 }
      )
    }

    // Update the entry
    const updates: Record<string, any> = {}
    if (content !== undefined) updates.content = content
    if (mood !== undefined) updates.mood = mood
    if (durationSeconds !== undefined) updates.duration_seconds = durationSeconds

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('journal_entries')
      .update(updates)
      .eq('id', entryId)
      .select()
      .single()

    if (updateError) {
      console.error('[Journal API] Error updating entry:', updateError)
      return NextResponse.json(
        { error: 'Failed to update journal entry' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      entry: updated,
      message: 'Journal entry updated successfully!'
    })
  } catch (error) {
    console.error('[Journal API] PATCH error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
