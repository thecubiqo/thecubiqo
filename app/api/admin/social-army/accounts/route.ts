/**
 * Admin: Social Army Accounts API
 *
 * CRUD for social_accounts — the 100 soldiers of the fleet.
 *
 * GET    /api/admin/social-army/accounts          — list all accounts
 * POST   /api/admin/social-army/accounts          — create account
 * PATCH  /api/admin/social-army/accounts?id=…     — update account (status, credential, etc.)
 * DELETE /api/admin/social-army/accounts?id=…     — remove account
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

const PLATFORMS = [
  'twitter', 'tiktok', 'linkedin', 'instagram',
  'youtube', 'reddit', 'pinterest', 'threads', 'facebook', 'discord',
] as const

const PERSONAS = ['builder', 'guru', 'philosopher', 'artist', 'memer'] as const
const STATUSES = ['active', 'limited', 'banned', 'offline'] as const

// ─── GET ──────────────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request)
  if (!authResult.authorized) return authResult.response!

  try {
    const supabase = createAdminClient()
    const { data, error } = await (supabase as any)
      .from('social_accounts')
      .select('id, platform, username, persona_type, status, last_posted_at, created_at')
      .order('platform')
      .order('username')

    if (error) throw new Error(error.message)

    // Redact password_encrypted — never send to browser
    return NextResponse.json({ accounts: data ?? [] })
  } catch (error) {
    console.error('[Social Army Accounts] GET error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// ─── POST ─────────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request)
  if (!authResult.authorized) return authResult.response!

  try {
    const body = await request.json()
    const { platform, username, password, persona_type, status = 'active' } = body

    if (!platform || !PLATFORMS.includes(platform)) {
      return NextResponse.json({ error: `platform must be one of: ${PLATFORMS.join(', ')}` }, { status: 400 })
    }
    if (!username || typeof username !== 'string' || !username.trim()) {
      return NextResponse.json({ error: 'username is required' }, { status: 400 })
    }
    if (!persona_type || !PERSONAS.includes(persona_type)) {
      return NextResponse.json({ error: `persona_type must be one of: ${PERSONAS.join(', ')}` }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { data, error } = await (supabase as any)
      .from('social_accounts')
      .insert({
        platform,
        username: username.trim(),
        password_encrypted: password || null,
        persona_type,
        status,
      })
      .select('id, platform, username, persona_type, status, created_at')
      .single()

    if (error) throw new Error(error.message)

    return NextResponse.json({ account: data }, { status: 201 })
  } catch (error) {
    console.error('[Social Army Accounts] POST error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// ─── PATCH ────────────────────────────────────────────────────────────────────
export async function PATCH(request: NextRequest) {
  const authResult = await requireAdmin(request)
  if (!authResult.authorized) return authResult.response!

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    const body = await request.json()
    const updates: Record<string, string> = {}

    if (body.status) {
      if (!STATUSES.includes(body.status)) {
        return NextResponse.json({ error: `status must be one of: ${STATUSES.join(', ')}` }, { status: 400 })
      }
      updates.status = body.status
    }
    if (body.password !== undefined) updates.password_encrypted = body.password
    if (body.persona_type) {
      if (!PERSONAS.includes(body.persona_type)) {
        return NextResponse.json({ error: `persona_type must be one of: ${PERSONAS.join(', ')}` }, { status: 400 })
      }
      updates.persona_type = body.persona_type
    }
    if (body.username) updates.username = body.username.trim()

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { data, error } = await (supabase as any)
      .from('social_accounts')
      .update(updates)
      .eq('id', id)
      .select('id, platform, username, persona_type, status, last_posted_at')
      .single()

    if (error) throw new Error(error.message)

    return NextResponse.json({ account: data })
  } catch (error) {
    console.error('[Social Army Accounts] PATCH error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// ─── DELETE ───────────────────────────────────────────────────────────────────
export async function DELETE(request: NextRequest) {
  const authResult = await requireAdmin(request)
  if (!authResult.authorized) return authResult.response!

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    const supabase = createAdminClient()
    const { error } = await (supabase as any)
      .from('social_accounts')
      .delete()
      .eq('id', id)

    if (error) throw new Error(error.message)

    return NextResponse.json({ deleted: true })
  } catch (error) {
    console.error('[Social Army Accounts] DELETE error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
