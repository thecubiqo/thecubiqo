/**
 * Tests for the social army accounts API route.
 * Validates auth guard, input validation, and response shapes
 * without making real Supabase or network calls.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ─── Mock dependencies ────────────────────────────────────────────────────────

vi.mock('@/lib/auth/admin', () => ({
  requireAdmin: vi.fn(),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}))

import { requireAdmin } from '@/lib/auth/admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { GET, POST, PATCH, DELETE } from '@/app/api/admin/social-army/accounts/route'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeRequest(
  method: string,
  body?: unknown,
  searchParams?: Record<string, string>
): NextRequest {
  const url = new URL(
    'http://localhost/api/admin/social-army/accounts' +
      (searchParams ? '?' + new URLSearchParams(searchParams).toString() : '')
  )
  return new NextRequest(url, {
    method,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
  })
}

function mockAdminAuthorised(userId = 'admin-user-1') {
  vi.mocked(requireAdmin).mockResolvedValue({ authorized: true, user: { id: userId } })
}

function mockAdminUnauthorised() {
  vi.mocked(requireAdmin).mockResolvedValue({
    authorized: false,
    response: new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
  } as any)
}

// ─── GET ─────────────────────────────────────────────────────────────────────

describe('GET /api/admin/social-army/accounts', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authorised', async () => {
    mockAdminUnauthorised()
    const res = await GET(makeRequest('GET'))
    expect(res.status).toBe(401)
  })

  it('returns accounts list when authorised', async () => {
    mockAdminAuthorised()

    const mockAccounts = [
      { id: 'acc-1', platform: 'twitter', username: 'cubiqo_builder1', persona_type: 'builder', status: 'active', last_posted_at: null, created_at: new Date().toISOString() },
      { id: 'acc-2', platform: 'linkedin', username: 'cubiqo-dev@cubiqo.ai', persona_type: 'guru', status: 'active', last_posted_at: null, created_at: new Date().toISOString() },
    ]

    const supabaseMock: any = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      // accounts route chains .order('platform').order('username') — two calls
      order: vi.fn().mockReturnThis(),
      then: (resolve: (v: unknown) => unknown) =>
        Promise.resolve({ data: mockAccounts, error: null }).then(resolve),
    }
    vi.mocked(createAdminClient).mockReturnValue(supabaseMock)

    const res = await GET(makeRequest('GET'))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toHaveProperty('accounts')
    expect(json.accounts).toHaveLength(2)
    expect(json.accounts[0]).toHaveProperty('platform', 'twitter')
    // password must never be returned
    expect(json.accounts[0]).not.toHaveProperty('password')
    expect(json.accounts[0]).not.toHaveProperty('password_encrypted')
  })

  it('returns empty list when no accounts exist', async () => {
    mockAdminAuthorised()

    const supabaseMock: any = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      then: (resolve: (v: unknown) => unknown) =>
        Promise.resolve({ data: [], error: null }).then(resolve),
    }
    vi.mocked(createAdminClient).mockReturnValue(supabaseMock)

    const res = await GET(makeRequest('GET'))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.accounts).toHaveLength(0)
  })
})

// ─── POST ─────────────────────────────────────────────────────────────────────

describe('POST /api/admin/social-army/accounts', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authorised', async () => {
    mockAdminUnauthorised()
    const res = await POST(makeRequest('POST', { platform: 'twitter', username: 'test', persona_type: 'builder' }))
    expect(res.status).toBe(401)
  })

  it('returns 400 when platform is missing', async () => {
    mockAdminAuthorised()
    const res = await POST(makeRequest('POST', { username: 'test', persona_type: 'builder' }))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/platform/i)
  })

  it('returns 400 when platform is invalid', async () => {
    mockAdminAuthorised()
    const res = await POST(makeRequest('POST', { platform: 'myspace', username: 'test', persona_type: 'builder' }))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/platform/i)
  })

  it('returns 400 when username is missing', async () => {
    mockAdminAuthorised()
    const res = await POST(makeRequest('POST', { platform: 'twitter', persona_type: 'builder' }))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/username/i)
  })

  it('returns 400 when username is blank', async () => {
    mockAdminAuthorised()
    const res = await POST(makeRequest('POST', { platform: 'twitter', username: '   ', persona_type: 'builder' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when persona_type is invalid', async () => {
    mockAdminAuthorised()
    const res = await POST(makeRequest('POST', { platform: 'twitter', username: 'test', persona_type: 'invalid' }))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/persona_type/i)
  })

  it('creates account and returns 201', async () => {
    mockAdminAuthorised()

    const created = {
      id: 'acc-new',
      platform: 'twitter',
      username: 'cubiqo_builder1',
      persona_type: 'builder',
      status: 'active',
      created_at: new Date().toISOString(),
    }

    const supabaseMock: any = {
      from: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: created, error: null }),
    }
    vi.mocked(createAdminClient).mockReturnValue(supabaseMock)

    const res = await POST(makeRequest('POST', {
      platform: 'twitter',
      username: 'cubiqo_builder1',
      persona_type: 'builder',
    }))
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.account).toMatchObject({ platform: 'twitter', username: 'cubiqo_builder1' })
    expect(json.account).not.toHaveProperty('password_encrypted')
  })

  it('accepts all 10 valid platforms', async () => {
    mockAdminAuthorised()

    const platforms = ['twitter', 'tiktok', 'linkedin', 'instagram', 'youtube', 'reddit', 'pinterest', 'threads', 'facebook', 'discord']

    for (const platform of platforms) {
      const created = { id: `acc-${platform}`, platform, username: 'test', persona_type: 'builder', status: 'active', created_at: new Date().toISOString() }
      const supabaseMock: any = {
        from: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: created, error: null }),
      }
      vi.mocked(createAdminClient).mockReturnValue(supabaseMock)

      const res = await POST(makeRequest('POST', { platform, username: 'test', persona_type: 'builder' }))
      expect(res.status).toBe(201)
    }
  })
})

// ─── PATCH ───────────────────────────────────────────────────────────────────

describe('PATCH /api/admin/social-army/accounts', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authorised', async () => {
    mockAdminUnauthorised()
    const res = await PATCH(makeRequest('PATCH', { status: 'active' }, { id: 'acc-1' }))
    expect(res.status).toBe(401)
  })

  it('returns 400 when id is missing', async () => {
    mockAdminAuthorised()
    const res = await PATCH(makeRequest('PATCH', { status: 'active' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when status is invalid', async () => {
    mockAdminAuthorised()
    const res = await PATCH(makeRequest('PATCH', { status: 'unknown' }, { id: 'acc-1' }))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/status/i)
  })

  it('returns 400 when no valid fields to update', async () => {
    mockAdminAuthorised()
    const res = await PATCH(makeRequest('PATCH', {}, { id: 'acc-1' }))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/no valid fields/i)
  })

  it('updates account status and returns 200', async () => {
    mockAdminAuthorised()

    const updated = { id: 'acc-1', platform: 'twitter', username: 'test', persona_type: 'builder', status: 'offline', last_posted_at: null }
    const supabaseMock: any = {
      from: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: updated, error: null }),
    }
    vi.mocked(createAdminClient).mockReturnValue(supabaseMock)

    const res = await PATCH(makeRequest('PATCH', { status: 'offline' }, { id: 'acc-1' }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.account).toMatchObject({ status: 'offline' })
  })

  it('accepts all valid statuses', async () => {
    mockAdminAuthorised()

    for (const status of ['active', 'limited', 'banned', 'offline']) {
      const updated = { id: 'acc-1', status }
      const supabaseMock: any = {
        from: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: updated, error: null }),
      }
      vi.mocked(createAdminClient).mockReturnValue(supabaseMock)

      const res = await PATCH(makeRequest('PATCH', { status }, { id: 'acc-1' }))
      expect(res.status).toBe(200)
    }
  })
})

// ─── DELETE ──────────────────────────────────────────────────────────────────

describe('DELETE /api/admin/social-army/accounts', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authorised', async () => {
    mockAdminUnauthorised()
    const res = await DELETE(makeRequest('DELETE', undefined, { id: 'acc-1' }))
    expect(res.status).toBe(401)
  })

  it('returns 400 when id is missing', async () => {
    mockAdminAuthorised()
    const res = await DELETE(makeRequest('DELETE'))
    expect(res.status).toBe(400)
  })

  it('deletes account and returns 200', async () => {
    mockAdminAuthorised()

    const supabaseMock: any = {
      from: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    }
    vi.mocked(createAdminClient).mockReturnValue(supabaseMock)

    const res = await DELETE(makeRequest('DELETE', undefined, { id: 'acc-1' }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.deleted).toBe(true)
  })
})
