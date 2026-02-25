/**
 * Autopilot Profile Fill API
 * 
 * Endpoint for autonomous profile updates from chat conversations.
 * CubiQo extracts profile info while chatting and updates the user's profile
 * in the background - a sci-fi feature where the AI does real work simultaneously.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { extractProfileFields } from '@/lib/autopilot/profile-extract'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL1 || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY1 || process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key'
)

export async function POST(request: NextRequest) {
  try {
    const { sessionId, userMessage, aiResponse } = await request.json()

    if (!sessionId || !userMessage || !aiResponse) {
      return NextResponse.json(
        { error: 'Missing required fields: sessionId, userMessage, aiResponse' },
        { status: 400 }
      )
    }

    // Get BYO API key if provided
    const byoClaudeKey = request.headers.get('x-byo-claude-key')

    // Load existing profile data for this session's user
    let existingProfile: Record<string, string> = {}
    try {
      const { data: session } = await supabaseAdmin
        .from('sessions')
        .select('user_id')
        .eq('id', sessionId)
        .maybeSingle()

      if (session?.user_id) {
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('display_name, preferences')
          .eq('id', session.user_id)
          .maybeSingle()

        if (profile) {
          if (profile.display_name) existingProfile.display_name = profile.display_name
          if (profile.preferences && typeof profile.preferences === 'object') {
            const prefs = profile.preferences as Record<string, unknown>
            for (const [key, value] of Object.entries(prefs)) {
              if (typeof value === 'string') {
                existingProfile[key] = value
              }
            }
          }
        }
      }
    } catch {
      // Continue with empty profile context
    }

    // Extract profile fields from conversation
    const result = await extractProfileFields(
      userMessage,
      aiResponse,
      existingProfile,
      byoClaudeKey || undefined
    )

    if (!result.hasUpdates) {
      return NextResponse.json({
        updated: false,
        fields: [],
        message: 'No profile-relevant information found'
      })
    }

    // Apply profile updates
    let appliedUpdates: Array<{ field: string; value: string }> = []
    try {
      const { data: session } = await supabaseAdmin
        .from('sessions')
        .select('user_id')
        .eq('id', sessionId)
        .maybeSingle()

      if (session?.user_id) {
        const updateData: Record<string, unknown> = {}
        const prefsUpdate: Record<string, string> = {}

        for (const field of result.fields) {
          if (field.field === 'display_name') {
            updateData.display_name = field.value
          } else {
            prefsUpdate[field.field] = field.value
          }
          appliedUpdates.push({ field: field.field, value: field.value })
        }

        // Update display_name if extracted
        if (updateData.display_name) {
          await supabaseAdmin
            .from('profiles')
            .update({ display_name: updateData.display_name })
            .eq('id', session.user_id)
        }

        // Update preferences JSONB with new fields
        if (Object.keys(prefsUpdate).length > 0) {
          // Get current preferences first
          const { data: current } = await supabaseAdmin
            .from('profiles')
            .select('preferences')
            .eq('id', session.user_id)
            .maybeSingle()

          const currentPrefs = (current?.preferences as Record<string, unknown>) || {}
          const mergedPrefs = { ...currentPrefs, ...prefsUpdate }

          await supabaseAdmin
            .from('profiles')
            .update({ preferences: mergedPrefs })
            .eq('id', session.user_id)
        }
      }
    } catch (error) {
      console.error('[Autopilot] Profile update error:', error)
      // Return extracted fields even if save failed
    }

    return NextResponse.json({
      updated: appliedUpdates.length > 0,
      fields: appliedUpdates,
      message: appliedUpdates.length > 0
        ? `Updated ${appliedUpdates.length} profile field(s)`
        : 'Profile fields extracted but not saved (no authenticated user)'
    })

  } catch (error) {
    console.error('[Autopilot] Profile API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
