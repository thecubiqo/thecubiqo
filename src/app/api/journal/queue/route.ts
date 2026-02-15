/**
 * Journal Email Queue API
 * Queue journal summary emails for delivery
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Support both old and new env var names (fallback pattern)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL1 || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY1 || process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('Missing Supabase environment variables - using build defaults')
}

const supabaseAdmin = createClient(
  supabaseUrl || 'http://localhost:54321',
  supabaseServiceKey || 'fake-key-for-build'
)

export const dynamic = 'force-dynamic'

/**
 * POST /api/journal/queue
 * Queue a journal summary email
 */
export async function POST(request: NextRequest) {
  try {
    // Check for required environment variables at runtime
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Server configuration error: Missing database credentials' },
        { status: 500 }
      )
    }
    const body = await request.json()
    const { entryId, recipientEmail, userId } = body

    if (!entryId || !recipientEmail) {
      return NextResponse.json(
        { error: 'entryId and recipientEmail are required' },
        { status: 400 }
      )
    }

    // Verify entry exists
    const { data: entry, error: entryError } = await supabaseAdmin
      .from('journal_entries')
      .select('*')
      .eq('id', entryId)
      .single()

    if (entryError || !entry) {
      return NextResponse.json(
        { error: 'Journal entry not found' },
        { status: 404 }
      )
    }

    // Check if email already queued for this entry
    const { data: existing } = await supabaseAdmin
      .from('email_queue')
      .select('id')
      .eq('type', 'journal_summary')
      .eq('payload->entryId', entryId)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({
        success: true,
        message: 'Email already queued for this entry',
        queueId: existing.id
      })
    }

    // Format entry date
    const entryDate = new Date(entry.created_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    // Queue the email
    const { data: queueItem, error: queueError } = await supabaseAdmin
      .from('email_queue')
      .insert({
        type: 'journal_summary',
        recipient_email: recipientEmail,
        subject: `Your CubiQo Journal - ${entryDate}`,
        payload: {
          entryId,
          userId,
          content: entry.content,
          mood: entry.mood,
          wordCount: entry.word_count,
          durationSeconds: entry.duration_seconds,
          createdAt: entry.created_at
        },
        status: 'pending'
      })
      .select()
      .single()

    if (queueError) {
      console.error('[Queue API] Error queuing email:', queueError)
      return NextResponse.json(
        { error: 'Failed to queue email' },
        { status: 500 }
      )
    }

    // Mark entry as email queued
    await supabaseAdmin
      .from('journal_entries')
      .update({ email_queued: true })
      .eq('id', entryId)

    return NextResponse.json({
      success: true,
      message: 'Email queued successfully',
      queueId: queueItem.id
    })
  } catch (error) {
    console.error('[Queue API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
