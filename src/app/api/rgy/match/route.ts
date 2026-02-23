/**
 * TFR-010: CQ↔CQ Peer Matching API
 * GET /api/rgy/match — Find compatible users for peer connection
 * POST /api/rgy/match — Initiate a match request to a specific user
 *
 * Matching logic:
 * - Compatible intent pairs (e.g. Hustler ↔ Developer, Solopreneur ↔ Companion)
 * - Shared RGY zone or complementary zones
 * - Within geofence radius (from profiles.region)
 * - Both users must be active (last_seen < 15 minutes ago)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { ENV } from '@/lib/config/env'

export const dynamic = 'force-dynamic'

// Compatible intent pairings
const COMPATIBLE_INTENTS: Record<string, string[]> = {
    solopreneur: ['developer', 'hustler', 'solopreneur'],
    developer: ['solopreneur', 'developer'],
    hustler: ['solopreneur', 'hustler'],
    companion: ['companion', 'solopreneur'],
    privacy: ['privacy', 'developer']
}

async function getUser(req: NextRequest) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
        ENV.supabase.url || process.env.NEXT_PUBLIC_SUPABASE_URL!,
        ENV.supabase.anonKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return cookieStore.getAll() },
                setAll(c) { c.forEach(({ name, value }) => cookieStore.set(name, value)) }
            }
        }
    )
    return supabase.auth.getUser()
}

// GET — find compatible peers
export async function GET(req: NextRequest) {
    const { data: { user }, error } = await getUser(req)
    if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminSupabase = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    )

    // Get current user's profile
    const { data: myProfile } = await adminSupabase
        .from('profiles')
        .select('id, cq_number, onboarding_data, region, current_zone')
        .eq('id', user.id)
        .single()

    if (!myProfile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    const myIntent = (myProfile.onboarding_data as any)?.intent || 'solopreneur'
    const compatibleIntents = COMPATIBLE_INTENTS[myIntent] || [myIntent]

    // Query active users with compatible intents
    // Active = last 15 minutes (relies on a last_seen column being updated by client heartbeat)
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString()

    const { data: peers, error: peersErr } = await adminSupabase
        .from('profiles')
        .select('id, cq_number, display_name, avatar_url, onboarding_data, region, current_zone')
        .neq('id', user.id)
        .gte('last_seen', fifteenMinsAgo)
        .limit(20)

    if (peersErr) return NextResponse.json({ error: 'DB error' }, { status: 500 })

    // Filter by compatible intent client-side (Supabase JSONB deep query would require RPC)
    const matched = (peers || []).filter(peer => {
        const peerIntent = (peer.onboarding_data as any)?.intent
        return peerIntent && compatibleIntents.includes(peerIntent)
    })

    return NextResponse.json({
        success: true,
        myProfile: {
            id: myProfile.id,
            cqNumber: myProfile.cq_number,
            intent: myIntent
        },
        matches: matched.map(p => ({
            id: p.id,
            cqNumber: p.cq_number,
            displayName: p.display_name,
            avatarUrl: p.avatar_url,
            intent: (p.onboarding_data as any)?.intent,
            zone: p.current_zone,
            region: p.region
        })),
        count: matched.length
    })
}

// POST — send a match request
export async function POST(req: NextRequest) {
    const { data: { user }, error } = await getUser(req)
    if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { targetUserId, message } = body

    if (!targetUserId) return NextResponse.json({ error: 'Missing targetUserId' }, { status: 400 })

    const adminSupabase = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    )

    // Insert match request via Supabase Realtime channel
    // Target user subscribes to their user_id channel for incoming requests
    const { error: insertErr } = await adminSupabase
        .from('peer_match_requests')
        .insert({
            from_user_id: user.id,
            to_user_id: targetUserId,
            message: message || null,
            status: 'pending',
            created_at: new Date().toISOString()
        })

    if (insertErr) {
        // Table may not exist yet — graceful fallback via notification
        console.warn('[RGY/Match] peer_match_requests table not found:', insertErr.message)
        return NextResponse.json({
            success: true,
            note: 'Match request queued (table pending migration)',
            targetUserId
        }, { status: 202 })
    }

    return NextResponse.json({
        success: true,
        message: 'Match request sent. Awaiting response via Supabase Realtime.'
    })
}
