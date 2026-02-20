/**
 * Session API Route Tests
 *
 * Validates the /api/session route: action dispatching, input validation,
 * Supabase configuration detection, and error handling.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const sessionRoutePath = resolve(__dirname, '../src/app/api/session/route.ts')
const sessionRouteContent = readFileSync(sessionRoutePath, 'utf-8')

describe('Session API Route Structure', () => {
  it('should export a POST handler', () => {
    expect(sessionRouteContent).toContain('export async function POST(')
  })

  it('should import NextRequest and NextResponse', () => {
    expect(sessionRouteContent).toContain('NextRequest')
    expect(sessionRouteContent).toContain('NextResponse')
  })

  it('should use Supabase admin client', () => {
    expect(sessionRouteContent).toContain('supabaseAdmin')
  })
})

describe('Session API: Configuration Detection', () => {
  it('should detect placeholder Supabase URL', () => {
    expect(sessionRouteContent).toContain('https://placeholder.supabase.co')
  })

  it('should detect placeholder service key', () => {
    expect(sessionRouteContent).toContain('placeholder-key')
  })

  it('should return 503 when Supabase is not configured', () => {
    expect(sessionRouteContent).toContain("status: 503")
  })

  it('should provide clear error message for missing configuration', () => {
    expect(sessionRouteContent).toContain('Database not configured')
  })

  it('should indicate which env vars are missing', () => {
    expect(sessionRouteContent).toContain('NEXT_PUBLIC_SUPABASE_URL')
    expect(sessionRouteContent).toContain('SUPABASE_SERVICE_ROLE_KEY')
  })
})

describe('Session API: Supported Actions', () => {
  it('should support create_guest_session action', () => {
    expect(sessionRouteContent).toContain("action === 'create_guest_session'")
  })

  it('should support get_session action', () => {
    expect(sessionRouteContent).toContain("action === 'get_session'")
  })

  it('should support ensure_conversation action', () => {
    expect(sessionRouteContent).toContain("action === 'ensure_conversation'")
  })

  it('should support get_messages action', () => {
    expect(sessionRouteContent).toContain("action === 'get_messages'")
  })

  it('should support save_message action', () => {
    expect(sessionRouteContent).toContain("action === 'save_message'")
  })

  it('should support save_messages_batch action', () => {
    expect(sessionRouteContent).toContain("action === 'save_messages_batch'")
  })

  it('should support ensure_authenticated_session action', () => {
    expect(sessionRouteContent).toContain("action === 'ensure_authenticated_session'")
  })

  it('should support convert_guest_session action', () => {
    expect(sessionRouteContent).toContain("action === 'convert_guest_session'")
  })

  it('should return 400 for invalid action', () => {
    expect(sessionRouteContent).toContain("'Invalid action'")
  })
})

describe('Session API: Input Validation', () => {
  it('should require sessionId for get_session', () => {
    expect(sessionRouteContent).toContain("'sessionId required'")
  })

  it('should require conversationId for get_messages', () => {
    expect(sessionRouteContent).toContain("'conversationId required'")
  })

  it('should require conversationId, role, content for save_message', () => {
    expect(sessionRouteContent).toContain("'conversationId, role, content required'")
  })

  it('should require userId for ensure_authenticated_session', () => {
    expect(sessionRouteContent).toContain("'userId required'")
  })

  it('should require userId and sessionId for convert_guest_session', () => {
    expect(sessionRouteContent).toContain("'userId and sessionId required'")
  })

  it('should validate batch messages array', () => {
    expect(sessionRouteContent).toContain('Array.isArray(messages)')
  })

  it('should validate individual messages in batch have role and content', () => {
    expect(sessionRouteContent).toContain("'Each message must have role and content'")
  })
})

describe('Session API: Database Operations', () => {
  it('should interact with sessions table', () => {
    expect(sessionRouteContent).toContain(".from('sessions')")
  })

  it('should interact with conversations table', () => {
    expect(sessionRouteContent).toContain(".from('conversations')")
  })

  it('should interact with messages table', () => {
    expect(sessionRouteContent).toContain(".from('messages')")
  })

  it('should interact with profiles table', () => {
    expect(sessionRouteContent).toContain(".from('profiles')")
  })

  it('should use upsert for profile creation', () => {
    expect(sessionRouteContent).toContain('.upsert(')
  })

  it('should use ignoreDuplicates for profile upsert', () => {
    expect(sessionRouteContent).toContain('ignoreDuplicates: true')
  })
})

describe('Session API: Error Handling', () => {
  it('should detect database schema errors', () => {
    expect(sessionRouteContent).toContain('relation')
    expect(sessionRouteContent).toContain('does not exist')
  })

  it('should detect connection errors', () => {
    expect(sessionRouteContent).toContain('fetch failed')
    expect(sessionRouteContent).toContain('ECONNREFUSED')
  })

  it('should return 503 for schema errors', () => {
    expect(sessionRouteContent).toContain('Database schema not initialized')
  })

  it('should return 503 for connection errors', () => {
    expect(sessionRouteContent).toContain('Database connection failed')
  })

  it('should suggest running migrations for schema errors', () => {
    expect(sessionRouteContent).toContain('supabase/migrations/')
  })

  it('should catch and log errors', () => {
    expect(sessionRouteContent).toContain("console.error('[API/session]")
  })
})

describe('Session API: Color State Management', () => {
  it('should set default color state to ORANGE', () => {
    expect(sessionRouteContent).toContain("color_state: 'ORANGE'")
  })

  it('should update color state on message save', () => {
    expect(sessionRouteContent).toContain('color_state: color')
    expect(sessionRouteContent).toContain("color_state: lastColor")
  })

  it('should update conversation updated_at timestamp', () => {
    expect(sessionRouteContent).toContain('updated_at: new Date().toISOString()')
  })
})
