/**
 * Tests for the social army admin route logic.
 * Validates request validation, input sanitisation, and response shapes
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
import { GET, POST, PATCH } from '@/app/api/admin/social-army/route'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeRequest(
  method: string,
  body?: unknown,
  searchParams?: Record<string, string>
): NextRequest {
  const url = new URL(
    'http://localhost/api/admin/social-army' +
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

/** Build a chainable Supabase mock that resolves to `result` on `.then()` */
function makeSupabaseMock(result: unknown, overrides?: Record<string, unknown>) {
  const chain: any = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(result),
    ...overrides,
  }
  // Make .then() work so `await supabase.from(...).select(...)` resolves
  chain.then = (resolve: (v: unknown) => unknown) => Promise.resolve(result).then(resolve)
  return chain
}

// ─── GET ─────────────────────────────────────────────────────────────────────

describe('GET /api/admin/social-army', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authorised', async () => {
    mockAdminUnauthorised()
    const res = await GET(makeRequest('GET'))
    expect(res.status).toBe(401)
  })

  it('returns overview data when authorised', async () => {
    mockAdminAuthorised()

    const campaignRow = {
      id: 'c1',
      name: 'Test Campaign',
      seed_topic: 'AI',
      status: 'running',
      total_posts_target: 10,
      created_at: new Date().toISOString(),
    }

    // Build a supabase mock that handles different table queries
    const supabaseMock: any = {
      from: vi.fn((table: string) => {
        if (table === 'social_campaigns') {
          return {
            select: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({ data: [campaignRow], error: null }),
          }
        }
        if (table === 'content_queue') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({ data: [], error: null, count: 0 }),
          }
        }
        if (table === 'social_accounts') {
          return {
            select: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
          }
        }
        return { select: vi.fn().mockReturnThis() }
      }),
    }
    vi.mocked(createAdminClient).mockReturnValue(supabaseMock)

    const res = await GET(makeRequest('GET'))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toHaveProperty('campaigns')
    expect(json).toHaveProperty('queue')
    expect(json).toHaveProperty('accounts')
    expect(json).toHaveProperty('timestamp')
  })
})

// ─── POST ─────────────────────────────────────────────────────────────────────

describe('POST /api/admin/social-army', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authorised', async () => {
    mockAdminUnauthorised()
    const res = await POST(makeRequest('POST', { name: 'My Campaign' }))
    expect(res.status).toBe(401)
  })

  it('returns 400 when name is missing', async () => {
    mockAdminAuthorised()
    const res = await POST(makeRequest('POST', { seed_topic: 'AI' }))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/name/i)
  })

  it('returns 400 when name is blank', async () => {
    mockAdminAuthorised()
    const res = await POST(makeRequest('POST', { name: '   ' }))
    expect(res.status).toBe(400)
  })

  it('creates a campaign and returns 201', async () => {
    mockAdminAuthorised()

    const created = { id: 'c2', name: 'My Campaign', status: 'running', seed_topic: 'AI' }
    const supabaseMock: any = {
      from: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: created, error: null }),
    }
    vi.mocked(createAdminClient).mockReturnValue(supabaseMock)

    const res = await POST(makeRequest('POST', { name: 'My Campaign', seed_topic: 'AI' }))
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.campaign).toMatchObject({ name: 'My Campaign' })
  })
})

// ─── PATCH ───────────────────────────────────────────────────────────────────

describe('PATCH /api/admin/social-army', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authorised', async () => {
    mockAdminUnauthorised()
    const res = await PATCH(makeRequest('PATCH', { status: 'paused' }, { id: 'c1' }))
    expect(res.status).toBe(401)
  })

  it('returns 400 when id is missing', async () => {
    mockAdminAuthorised()
    const res = await PATCH(makeRequest('PATCH', { status: 'paused' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when status is invalid', async () => {
    mockAdminAuthorised()
    const res = await PATCH(makeRequest('PATCH', { status: 'deleted' }, { id: 'c1' }))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/running|paused|stopped|draft/)
  })

  it('updates campaign status and returns 200', async () => {
    mockAdminAuthorised()

    const updated = { id: 'c1', status: 'paused' }
    const supabaseMock: any = {
      from: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: updated, error: null }),
    }
    vi.mocked(createAdminClient).mockReturnValue(supabaseMock)

    const res = await PATCH(makeRequest('PATCH', { status: 'paused' }, { id: 'c1' }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.campaign).toMatchObject({ status: 'paused' })
  })
})
