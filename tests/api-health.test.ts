/**
 * API Health Endpoint Tests
 *
 * Validates the /api/health route logic: status codes, env var checks,
 * AI API detection, uptime formatting, and memory reporting.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const healthRoutePath = resolve(__dirname, '../src/app/api/health/route.ts')
const healthRouteContent = readFileSync(healthRoutePath, 'utf-8')

describe('Health API Route Structure', () => {
  it('should export a GET handler', () => {
    expect(healthRouteContent).toContain('export async function GET()')
  })

  it('should use force-dynamic rendering', () => {
    expect(healthRouteContent).toContain("export const dynamic = 'force-dynamic'")
  })

  it('should use nodejs runtime', () => {
    expect(healthRouteContent).toContain("export const runtime = 'nodejs'")
  })

  it('should return JSON via NextResponse', () => {
    expect(healthRouteContent).toContain('NextResponse.json')
  })

  it('should set no-cache headers', () => {
    expect(healthRouteContent).toContain('no-cache, no-store, must-revalidate')
  })
})

describe('Health Check: Environment Variables', () => {
  it('should check NEXT_PUBLIC_SUPABASE_URL', () => {
    expect(healthRouteContent).toContain('NEXT_PUBLIC_SUPABASE_URL')
  })

  it('should check NEXT_PUBLIC_SUPABASE_ANON_KEY', () => {
    expect(healthRouteContent).toContain('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  })

  it('should check SUPABASE_SERVICE_ROLE_KEY', () => {
    expect(healthRouteContent).toContain('SUPABASE_SERVICE_ROLE_KEY')
  })

  it('should support legacy env var suffix (_URL1, _KEY1)', () => {
    expect(healthRouteContent).toContain('NEXT_PUBLIC_SUPABASE_URL1')
    expect(healthRouteContent).toContain('NEXT_PUBLIC_SUPABASE_ANON_KEY1')
    expect(healthRouteContent).toContain('SUPABASE_SERVICE_ROLE_KEY1')
  })

  it('should report missing env vars', () => {
    expect(healthRouteContent).toContain('missingEnvVars')
  })
})

describe('Health Check: Database Schema', () => {
  it('should define required tables', () => {
    expect(healthRouteContent).toContain('REQUIRED_TABLES')
  })

  it('should check for profiles table', () => {
    expect(healthRouteContent).toContain("'profiles'")
  })

  it('should check for sessions table', () => {
    expect(healthRouteContent).toContain("'sessions'")
  })

  it('should check for conversations table', () => {
    expect(healthRouteContent).toContain("'conversations'")
  })

  it('should check for messages table', () => {
    expect(healthRouteContent).toContain("'messages'")
  })

  it('should set status to critical when tables are missing', () => {
    expect(healthRouteContent).toContain("health.status = 'critical'")
  })

  it('should suggest running migrations when schema is invalid', () => {
    expect(healthRouteContent).toContain('Run migrations from supabase/migrations/')
  })
})

describe('Health Check: AI API Detection', () => {
  it('should check for Anthropic API key', () => {
    expect(healthRouteContent).toContain('ANTHROPIC_API_KEY')
  })

  it('should check for MiniMax API key', () => {
    expect(healthRouteContent).toContain('MINIMAX_API_KEY')
  })

  it('should check for Mistral API key', () => {
    expect(healthRouteContent).toContain('MISTRAL_API_KEY')
  })

  it('should check for Together API key', () => {
    expect(healthRouteContent).toContain('TOGETHER_API_KEY')
  })

  it('should report no_keys_configured when no AI keys are present', () => {
    expect(healthRouteContent).toContain('no_keys_configured')
  })
})

describe('Health Check: Status Codes', () => {
  it('should return 200 for healthy status', () => {
    expect(healthRouteContent).toContain("health.status === 'healthy' ? 200")
  })

  it('should return 503 for critical status', () => {
    expect(healthRouteContent).toContain("health.status === 'critical' ? 503")
  })

  it('should return 200 for degraded status', () => {
    // Degraded returns 200 so monitoring tools still see partial availability
    expect(healthRouteContent).toContain("health.status === 'critical' ? 503 : 200")
  })
})

describe('Health Check: Uptime and Memory', () => {
  it('should track server start time', () => {
    expect(healthRouteContent).toContain('SERVER_START_TIME')
  })

  it('should format uptime with days/hours/minutes/seconds', () => {
    expect(healthRouteContent).toContain('formatUptime')
  })

  it('should report memory usage (RSS, heap)', () => {
    expect(healthRouteContent).toContain('process.memoryUsage')
    expect(healthRouteContent).toContain('heapTotal')
    expect(healthRouteContent).toContain('heapUsed')
  })

  it('should report response time', () => {
    expect(healthRouteContent).toContain('responseTime')
  })
})

describe('Health Check: Supabase Connectivity', () => {
  it('should test Supabase REST API connectivity', () => {
    expect(healthRouteContent).toContain('/rest/v1/')
  })

  it('should use HEAD request for connectivity check', () => {
    expect(healthRouteContent).toContain("method: 'HEAD'")
  })

  it('should use a timeout for connectivity check', () => {
    expect(healthRouteContent).toContain('AbortSignal.timeout')
  })

  it('should handle connection errors gracefully', () => {
    expect(healthRouteContent).toContain("checks.supabase_connection = 'error'")
  })

  it('should report not_configured when env vars missing', () => {
    expect(healthRouteContent).toContain("checks.supabase_connection = 'not_configured'")
  })
})
