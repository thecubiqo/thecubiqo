/**
 * TFR-013: Social Army Content Approval API
 * POST /api/social/approve — Human approves or rejects pending content
 * GET  /api/social/approve — List content awaiting approval
 *
 * This is the MANDATORY human-in-the-loop gate before any content is published.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { ENV } from '@/lib/config/env'

export const dynamic = 'force-dynamic'

async function getUserOrFail(req: NextRequest) {
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

// GET — list content awaiting approval
export async function GET(req: NextRequest) {
    const { data: { user }, error } = await getUserOrFail(req)
    if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminSupabase = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    )

    // Check user is admin
    const { data: profile } = await adminSupabase
        .from('profiles')
        .select('is_admin, role')
        .eq('id', user.id)
        .single()

    if (!profile?.is_admin && profile?.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 })
    }

    const { data: items, error: qErr } = await adminSupabase
        .from('content_queue')
        .select('id, caption, content_type, asset_url, created_at, social_accounts(username, platform)')
        .eq('generation_status', 'awaiting_approval')
        .order('created_at', { ascending: true })
        .limit(50)

    if (qErr) return NextResponse.json({ error: 'DB error' }, { status: 500 })

    return NextResponse.json({ success: true, items: items || [], count: items?.length || 0 })
}

// POST — approve or reject a content item
export async function POST(req: NextRequest) {
    const { data: { user }, error } = await getUserOrFail(req)
    if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { contentId, action } = body // action: 'approve' | 'reject'

    if (!contentId || !['approve', 'reject'].includes(action)) {
        return NextResponse.json({ error: 'Missing contentId or invalid action (approve|reject)' }, { status: 400 })
    }

    const adminSupabase = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    )

    // Verify admin
    const { data: profile } = await adminSupabase
        .from('profiles')
        .select('is_admin, role')
        .eq('id', user.id)
        .single()

    if (!profile?.is_admin && profile?.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 })
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected'
    const { error: updateErr } = await adminSupabase
        .from('content_queue')
        .update({
            generation_status: newStatus,
            approved_by: user.id,
            approved_at: new Date().toISOString()
        } as any)
        .eq('id', contentId)
        .eq('generation_status', 'awaiting_approval') // Safety: only update if still pending

    if (updateErr) return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })

    console.log(`[Social/Approve] ${action.toUpperCase()} on ${contentId} by admin ${user.id}`)
    return NextResponse.json({ success: true, contentId, status: newStatus })
}
