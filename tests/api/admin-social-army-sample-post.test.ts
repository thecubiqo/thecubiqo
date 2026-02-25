/**
 * Tests for the social army sample-post and status API routes.
 * Validates auth guard, input validation, and response shapes.
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
import { POST as samplePost } from '@/app/api/admin/social-army/sample-post/route'
import { GET as getStatus } from '@/app/api/admin/social-army/status/route'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeRequest(
  method: string,
  body?: unknown,
  searchParams?: Record<string, string>
): NextRequest {
  const url = new URL(
    'http://localhost/api/admin/social-army/sample-post' +
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

// ─── POST /api/admin/social-army/sample-post ─────────────────────────────────

describe('POST /api/admin/social-army/sample-post', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authorised', async () => {
    mockAdminUnauthorised()
    const res = await samplePost(makeRequest('POST', {}))
    expect(res.status).toBe(401)
  })

  it('creates a campaign and generates sample posts', async () => {
    mockAdminAuthorised()

    // Build a supabase mock that handles all tables used in sample-post
    const insertedCampaign = {
      id: 'campaign-sample-1',
      name: 'Sample Post — test',
    }

    const mockAccounts = [
      { id: 'acc-1', platform: 'twitter', username: 'cubiqo_dev1', persona_type: 'builder' },
      { id: 'acc-2', platform: 'tiktok', username: 'cubiqo_dev1', persona_type: 'builder' },
      { id: 'acc-3', platform: 'linkedin', username: 'cubiqo-dev1@cubiqo.ai', persona_type: 'builder' },
      { id: 'acc-4', platform: 'instagram', username: 'cubiqo.dev1', persona_type: 'builder' },
      { id: 'acc-5', platform: 'youtube', username: 'cubiqo.dev1@gmail.com', persona_type: 'builder' },
      { id: 'acc-6', platform: 'reddit', username: 'cubiqo_dev1', persona_type: 'builder' },
      { id: 'acc-7', platform: 'pinterest', username: 'cubiqo.dev1@cubiqo.ai', persona_type: 'builder' },
      { id: 'acc-8', platform: 'threads', username: 'cubiqo.dev1', persona_type: 'builder' },
      { id: 'acc-9', platform: 'facebook', username: 'cubiqo.dev1@cubiqo.ai', persona_type: 'builder' },
      { id: 'acc-10', platform: 'discord', username: 'cubiqo-builders-1', persona_type: 'builder' },
    ]

    let queueInsertCount = 0

    const supabaseMock: any = {
      from: vi.fn((table: string) => {
        if (table === 'social_campaigns') {
          return {
            insert: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: insertedCampaign, error: null }),
          }
        }
        if (table === 'social_accounts') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: mockAccounts, error: null }),
          }
        }
        if (table === 'content_queue') {
          queueInsertCount++
          return {
            insert: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { id: `queue-item-${queueInsertCount}` },
              error: null,
            }),
          }
        }
        return { select: vi.fn().mockReturnThis() }
      }),
    }

    vi.mocked(createAdminClient).mockReturnValue(supabaseMock)

    const res = await samplePost(makeRequest('POST', {}))
    expect(res.status).toBe(201)

    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.platforms).toBe(10)
    expect(json.generated).toBe(10)
    expect(json.skipped).toBe(0)
    expect(json.posts).toHaveLength(10)
    expect(json.campaign).toHaveProperty('id')
    expect(json.campaign).toHaveProperty('name')
    expect(json.message).toMatch(/10/)

    // Every post should have a platform-specific caption
    for (const post of json.posts) {
      expect(post).toHaveProperty('platform')
      expect(post).toHaveProperty('username')
      expect(post).toHaveProperty('caption')
      expect(post).toHaveProperty('status', 'ready')
      expect(post.caption.length).toBeGreaterThan(10)
    }
  })

  it('handles missing accounts gracefully', async () => {
    mockAdminAuthorised()

    const insertedCampaign = { id: 'c-empty', name: 'Empty Sample' }

    const supabaseMock: any = {
      from: vi.fn((table: string) => {
        if (table === 'social_campaigns') {
          return {
            insert: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: insertedCampaign, error: null }),
          }
        }
        if (table === 'social_accounts') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
          }
        }
        return { select: vi.fn().mockReturnThis() }
      }),
    }

    vi.mocked(createAdminClient).mockReturnValue(supabaseMock)

    const res = await samplePost(makeRequest('POST', {}))
    expect(res.status).toBe(201)

    const json = await res.json()
    expect(json.generated).toBe(0)
    expect(json.skipped).toBe(10)

    for (const post of json.posts) {
      expect(post.status).toMatch(/skipped/)
    }
  })

  it('accepts a custom topic', async () => {
    mockAdminAuthorised()

    const insertedCampaign = { id: 'c-topic', name: 'Custom topic' }

    const supabaseMock: any = {
      from: vi.fn((table: string) => {
        if (table === 'social_campaigns') {
          return {
            insert: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: insertedCampaign, error: null }),
          }
        }
        if (table === 'social_accounts') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({
              data: [{ id: 'acc-tw', platform: 'twitter', username: 'test', persona_type: 'builder' }],
              error: null,
            }),
          }
        }
        if (table === 'content_queue') {
          return {
            insert: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { id: 'q1' }, error: null }),
          }
        }
        return { select: vi.fn().mockReturnThis() }
      }),
    }

    vi.mocked(createAdminClient).mockReturnValue(supabaseMock)

    const res = await samplePost(makeRequest('POST', { topic: 'CubiQo v3 is here' }))
    expect(res.status).toBe(201)

    const json = await res.json()
    // The twitter post should contain the custom topic
    const twitterPost = json.posts.find((p: any) => p.platform === 'twitter')
    expect(twitterPost).toBeDefined()
    if (twitterPost?.status === 'ready') {
      expect(twitterPost.caption).toContain('CubiQo')
    }
  })
})

// ─── GET /api/admin/social-army/status ───────────────────────────────────────

describe('GET /api/admin/social-army/status', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authorised', async () => {
    mockAdminUnauthorised()
    const req = new NextRequest('http://localhost/api/admin/social-army/status', { method: 'GET' })
    const res = await getStatus(req)
    expect(res.status).toBe(401)
  })

  it('returns full system status', async () => {
    mockAdminAuthorised()

    const mockAccounts = [
      { platform: 'twitter', status: 'active' },
      { platform: 'twitter', status: 'active' },
      { platform: 'tiktok', status: 'active' },
      { platform: 'linkedin', status: 'offline' },
    ]

    const supabaseMock: any = {
      from: vi.fn((table: string) => {
        if (table === 'social_accounts') {
          return {
            select: vi.fn().mockResolvedValue({ data: mockAccounts, error: null }),
          }
        }
        if (table === 'social_campaigns') {
          return {
            select: vi.fn().mockResolvedValue({
              data: [{ status: 'running' }, { status: 'paused' }],
              error: null,
            }),
          }
        }
        if (table === 'content_queue') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ count: 0 }),
          }
        }
        return { select: vi.fn().mockReturnThis() }
      }),
    }

    vi.mocked(createAdminClient).mockReturnValue(supabaseMock)

    const req = new NextRequest('http://localhost/api/admin/social-army/status', { method: 'GET' })
    const res = await getStatus(req)
    expect(res.status).toBe(200)

    const json = await res.json()

    // System
    expect(json.system).toHaveProperty('platforms', 10)
    expect(json.system).toHaveProperty('platformsWithAccounts')
    expect(json.system).toHaveProperty('allPlatformsCovered')

    // Accounts
    expect(json.accounts).toHaveProperty('total')
    expect(json.accounts).toHaveProperty('active')
    expect(json.accounts).toHaveProperty('byPlatform')
    expect(json.accounts.byPlatform).toHaveProperty('twitter')
    expect(json.accounts.byPlatform).toHaveProperty('discord')

    // Content Engine
    expect(json.contentEngine).toHaveProperty('status')
    expect(json.contentEngine.gfxtoolz).toHaveProperty('connected')
    expect(json.contentEngine.fallbacks).toHaveProperty('template', true)

    // Readiness
    expect(json.readiness).toHaveProperty('canCreateAccounts', true)
    expect(json.readiness).toHaveProperty('canGenerateContent', true)
    expect(json.readiness).toHaveProperty('canPost')
    expect(json.readiness).toHaveProperty('message')

    // Timestamp
    expect(json).toHaveProperty('timestamp')
  })
})
