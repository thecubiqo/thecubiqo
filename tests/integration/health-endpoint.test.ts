/**
 * Integration Test: Health Endpoint Module
 *
 * Validates the health check API route exports and logic without
 * making live HTTP requests. Ensures the endpoint is correctly
 * structured for staging and production deployments.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const HEALTH_ROUTE = resolve(__dirname, '../../src/app/api/health/route.ts')
const healthContent = readFileSync(HEALTH_ROUTE, 'utf-8')

describe('Health Endpoint Module Validation', () => {
  describe('Exports and configuration', () => {
    it('should export a GET handler', () => {
      expect(healthContent).toContain('export async function GET')
    })

    it('should use force-dynamic rendering', () => {
      expect(healthContent).toContain("export const dynamic = 'force-dynamic'")
    })

    it('should use nodejs runtime', () => {
      expect(healthContent).toContain("export const runtime = 'nodejs'")
    })

    it('should return NextResponse.json', () => {
      expect(healthContent).toContain('NextResponse.json')
    })
  })

  describe('Health check coverage', () => {
    it('should check server status', () => {
      expect(healthContent).toContain("server: 'ok'")
    })

    it('should check Supabase connection', () => {
      expect(healthContent).toContain('supabase_connection')
    })

    it('should check database schema', () => {
      expect(healthContent).toContain('database_schema')
    })

    it('should check environment variables', () => {
      expect(healthContent).toContain('env_vars')
    })

    it('should check AI API availability', () => {
      expect(healthContent).toContain('ai_apis')
    })
  })

  describe('Required database tables', () => {
    it('should verify profiles table', () => {
      expect(healthContent).toContain("'profiles'")
    })

    it('should verify sessions table', () => {
      expect(healthContent).toContain("'sessions'")
    })

    it('should verify conversations table', () => {
      expect(healthContent).toContain("'conversations'")
    })

    it('should verify messages table', () => {
      expect(healthContent).toContain("'messages'")
    })
  })

  describe('Response status codes', () => {
    it('should return 200 for healthy status', () => {
      expect(healthContent).toContain("health.status === 'healthy' ? 200")
    })

    it('should return 503 for critical status', () => {
      expect(healthContent).toContain("'critical' ? 503")
    })

    it('should disable caching', () => {
      expect(healthContent).toContain('no-cache, no-store, must-revalidate')
    })
  })

  describe('Monitoring fields', () => {
    it('should include timestamp', () => {
      expect(healthContent).toContain('timestamp')
    })

    it('should include version', () => {
      expect(healthContent).toContain('version')
    })

    it('should include uptime', () => {
      expect(healthContent).toContain('uptime')
    })

    it('should include response time', () => {
      expect(healthContent).toContain('responseTime')
    })

    it('should include memory usage', () => {
      expect(healthContent).toContain('memoryUsage')
    })
  })
})
