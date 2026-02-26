/**
 * Tests for the social army generate and retry API routes.
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
import { POST as generate } from '@/app/api/admin/social-army/generate/route'
import { POST as retry } from '@/app/api/admin/social-army/retry/route'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeRequest(method: string, body?: unknown): NextRequest {
  return new NextRequest('http://localhost/api/admin/social-army/generate', {
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

// ─── POST /api/admin/social-army/generate ────────────────────────────────────

describe('POST /api/admin/social-army/generate', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authorised', async () => {
    mockAdminUnauthorised()
    const res = await generate(makeRequest('POST', { campaignId: 'c1' }))
    expect(res.status).toBe(401)
  })

  it('returns 400 when campaignId is missing', async () => {
    mockAdminAuthorised()
    const res = await generate(makeRequest('POST', {}))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/campaignId/i)
  })

  it('returns 404 when campaign does not exist', async () => {
    mockAdminAuthorised()

    const supabaseMock: any = {
      from: vi.fn((table: string) => {
        if (table === 'social_campaigns') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
          }
        }
        return { select: vi.fn().mockReturnThis() }
      }),
    }
    vi.mocked(createAdminClient).mockReturnValue(supabaseMock)

    const res = await generate(makeRequest('POST', { campaignId: 'nonexistent' }))
    expect(res.status).toBe(404)
  })

  it('returns 400 when campaign is not running', async () => {
    mockAdminAuthorised()

    const supabaseMock: any = {
      from: vi.fn((table: string) => {
        if (table === 'social_campaigns') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { id: 'c1', name: 'Test', seed_topic: 'AI', status: 'paused', total_posts_target: 100 },
              error: null,
            }),
          }
        }
        return { select: vi.fn().mockReturnThis() }
      }),
    }
    vi.mocked(createAdminClient).mockReturnValue(supabaseMock)

    const res = await generate(makeRequest('POST', { campaignId: 'c1' }))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/paused/)
  })

  it('returns 409 when items are already being generated', async () => {
    mockAdminAuthorised()

    const supabaseMock: any = {
      from: vi.fn((table: string) => {
        if (table === 'social_campaigns') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { id: 'c1', name: 'Running', seed_topic: 'AI', status: 'running', total_posts_target: 100 },
              error: null,
            }),
          }
        }
        if (table === 'content_queue') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            in: vi.fn().mockResolvedValue({ count: 5 }),
          }
        }
        return { select: vi.fn().mockReturnThis() }
      }),
    }
    vi.mocked(createAdminClient).mockReturnValue(supabaseMock)

    const res = await generate(makeRequest('POST', { campaignId: 'c1' }))
    expect(res.status).toBe(409)
    const json = await res.json()
    expect(json.error).toMatch(/already has/)
  })

  it('returns 400 when no active accounts exist', async () => {
    mockAdminAuthorised()

    const supabaseMock: any = {
      from: vi.fn((table: string) => {
        if (table === 'social_campaigns') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { id: 'c1', name: 'Running', seed_topic: 'AI', status: 'running', total_posts_target: 100 },
              error: null,
            }),
          }
        }
        if (table === 'content_queue') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            in: vi.fn().mockResolvedValue({ count: 0 }),
          }
        }
        if (table === 'social_accounts') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          }
        }
        return { select: vi.fn().mockReturnThis() }
      }),
    }
    vi.mocked(createAdminClient).mockReturnValue(supabaseMock)

    const res = await generate(makeRequest('POST', { campaignId: 'c1' }))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/no active social accounts/i)
  })

  it('seeds content queue and returns 201', async () => {
    mockAdminAuthorised()

    const mockAccounts = [
      { id: 'acc-1', platform: 'twitter', persona_type: 'builder' },
      { id: 'acc-2', platform: 'linkedin', persona_type: 'guru' },
    ]

    const supabaseMock: any = {
      from: vi.fn((table: string) => {
        if (table === 'social_campaigns') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { id: 'c1', name: 'My Campaign', seed_topic: 'AI Revolution', status: 'running', total_posts_target: 100 },
              error: null,
            }),
          }
        }
        if (table === 'content_queue') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            in: vi.fn().mockResolvedValue({ count: 0 }),
            insert: vi.fn().mockReturnThis(),
          }
        }
        if (table === 'social_accounts') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: mockAccounts, error: null }),
          }
        }
        return { select: vi.fn().mockReturnThis() }
      }),
    }

    // insert returns the inserted rows
    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'social_campaigns') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { id: 'c1', name: 'My Campaign', seed_topic: 'AI Revolution', status: 'running', total_posts_target: 100 },
              error: null,
            }),
          }
        }
        if (table === 'content_queue') {
          const chain: any = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            in: vi.fn().mockResolvedValue({ count: 0 }),
            insert: vi.fn().mockReturnThis(),
          }
          chain.then = (resolve: any) =>
            Promise.resolve({ data: [{ id: 'q1' }, { id: 'q2' }], error: null }).then(resolve)
          return chain
        }
        if (table === 'social_accounts') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: mockAccounts, error: null }),
          }
        }
        return { select: vi.fn().mockReturnThis() }
      }),
    } as any)

    const res = await generate(makeRequest('POST', { campaignId: 'c1' }))
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.seeded).toBe(2)
    expect(json.message).toMatch(/2/)
  })
})

// ─── POST /api/admin/social-army/retry ───────────────────────────────────────

describe('POST /api/admin/social-army/retry', () => {
  beforeEach(() => vi.clearAllMocks())

  function makeRetryRequest(body?: unknown): NextRequest {
    return new NextRequest('http://localhost/api/admin/social-army/retry', {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    })
  }

  it('returns 401 when not authorised', async () => {
    mockAdminUnauthorised()
    const res = await retry(makeRetryRequest({}))
    expect(res.status).toBe(401)
  })

  it('retries all failed items when no filters provided', async () => {
    mockAdminAuthorised()

    const supabaseMock: any = {
      from: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockResolvedValue({ data: [{ id: 'q1' }, { id: 'q2' }], error: null }),
    }
    vi.mocked(createAdminClient).mockReturnValue(supabaseMock)

    const res = await retry(makeRetryRequest({}))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.retried).toBe(2)
    expect(json.message).toMatch(/2/)
  })

  it('retries items for a specific campaign', async () => {
    mockAdminAuthorised()

    const supabaseMock: any = {
      from: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockResolvedValue({ data: [{ id: 'q1' }], error: null }),
    }
    vi.mocked(createAdminClient).mockReturnValue(supabaseMock)

    const res = await retry(makeRetryRequest({ campaignId: 'c1' }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.retried).toBe(1)
  })

  it('retries specific items by id', async () => {
    mockAdminAuthorised()

    const supabaseMock: any = {
      from: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      select: vi.fn().mockResolvedValue({ data: [{ id: 'q5' }], error: null }),
    }
    vi.mocked(createAdminClient).mockReturnValue(supabaseMock)

    const res = await retry(makeRetryRequest({ itemIds: ['q5'] }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.retried).toBe(1)
  })

  it('returns zero retried when no failed items found', async () => {
    mockAdminAuthorised()

    const supabaseMock: any = {
      from: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
    }
    vi.mocked(createAdminClient).mockReturnValue(supabaseMock)

    const res = await retry(makeRetryRequest({}))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.retried).toBe(0)
    expect(json.message).toMatch(/no failed items/i)
  })
})
