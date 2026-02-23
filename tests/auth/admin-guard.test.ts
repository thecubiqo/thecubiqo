/**
 * Admin Auth Guard Tests
 * 
 * Tests the shared withAdminAuth higher-order function
 * that centralizes admin authorization across all admin API routes.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

describe('Admin Auth Guard (withAdminAuth)', () => {
  const guardPath = resolve(__dirname, '../../src/lib/auth/admin-guard.ts')
  const guardContent = readFileSync(guardPath, 'utf-8')

  describe('Module Structure', () => {
    it('should export withAdminAuth function', () => {
      expect(guardContent).toContain('export function withAdminAuth')
    })

    it('should export AdminContext interface', () => {
      expect(guardContent).toContain('export interface AdminContext')
    })

    it('should import createClient from supabase/server', () => {
      expect(guardContent).toContain("import { createClient } from '@/lib/supabase/server'")
    })

    it('should import NextRequest and NextResponse', () => {
      expect(guardContent).toContain('NextRequest')
      expect(guardContent).toContain('NextResponse')
    })
  })

  describe('AdminContext Interface', () => {
    it('should include user with id and email', () => {
      expect(guardContent).toContain('user: { id: string; email?: string }')
    })

    it('should include profile with email and is_admin', () => {
      expect(guardContent).toContain('profile: { email: string; is_admin: boolean }')
    })

    it('should include supabase client', () => {
      expect(guardContent).toContain('supabase: SupabaseClient')
    })
  })

  describe('Authentication Checks', () => {
    it('should call supabase.auth.getUser()', () => {
      expect(guardContent).toContain('supabase.auth.getUser()')
    })

    it('should return 401 for unauthenticated users', () => {
      expect(guardContent).toContain("{ error: 'Unauthorized' }")
      expect(guardContent).toContain('{ status: 401 }')
    })

    it('should query profiles table for admin status', () => {
      expect(guardContent).toContain(".from('profiles')")
      expect(guardContent).toContain("'email, is_admin'")
    })

    it('should return 404 when profile not found', () => {
      expect(guardContent).toContain("{ error: 'Profile not found' }")
      expect(guardContent).toContain('{ status: 404 }')
    })

    it('should return 403 for non-admin users', () => {
      expect(guardContent).toContain("{ error: 'Forbidden: Admin access required' }")
      expect(guardContent).toContain('{ status: 403 }')
    })

    it('should check is_admin field on profile', () => {
      expect(guardContent).toContain('profile.is_admin')
    })
  })

  describe('Error Handling', () => {
    it('should wrap handler in try-catch', () => {
      expect(guardContent).toContain('try {')
      expect(guardContent).toContain('} catch (error)')
    })

    it('should return 500 for unexpected errors', () => {
      expect(guardContent).toContain("{ error: 'Internal server error' }")
      expect(guardContent).toContain('{ status: 500 }')
    })

    it('should log errors to console', () => {
      expect(guardContent).toContain('console.error')
    })
  })

  describe('Handler Invocation', () => {
    it('should return a function that accepts NextRequest', () => {
      expect(guardContent).toContain('return async (request: NextRequest)')
    })

    it('should pass admin context to handler', () => {
      expect(guardContent).toContain('return await handler(request, {')
    })

    it('should pass user, profile, and supabase in context', () => {
      expect(guardContent).toContain('user:')
      expect(guardContent).toContain('profile:')
      expect(guardContent).toContain('supabase,')
    })
  })
})

describe('Admin Routes Using withAdminAuth', () => {
  const adminRoutes = [
    { name: 'audit', path: '../../src/app/api/admin/audit/route.ts' },
    { name: 'designs', path: '../../src/app/api/admin/designs/route.ts' },
    { name: 'events', path: '../../src/app/api/admin/events/route.ts' },
    { name: 'features', path: '../../src/app/api/admin/features/route.ts' },
    { name: 'feature-flags', path: '../../src/app/api/admin/feature-flags/route.ts' },
    { name: 'toggle', path: '../../src/app/api/admin/toggle/route.ts' },
    { name: 'journal', path: '../../src/app/api/admin/journal/route.ts' },
    { name: 'journey/feature-flag', path: '../../src/app/api/admin/journey/feature-flag/route.ts' },
    { name: 'journey/metrics', path: '../../src/app/api/admin/journey/metrics/route.ts' },
    { name: 'experiments/ai', path: '../../src/app/api/admin/experiments/ai/route.ts' },
    { name: 'self-heal', path: '../../src/app/api/admin/self-heal/route.ts' },
  ]

  adminRoutes.forEach(({ name, path }) => {
    it(`admin/${name} should import withAdminAuth or requireAdmin`, () => {
      const content = readFileSync(resolve(__dirname, path), 'utf-8')
      expect(
        content.includes("from '@/lib/auth/admin-guard'") ||
        content.includes("from '@/lib/auth/admin'")
      ).toBe(true)
    })

    it(`admin/${name} should NOT have hardcoded admin email checks`, () => {
      const content = readFileSync(resolve(__dirname, path), 'utf-8')
      expect(content).not.toContain("aditya@cubiqo.ai")
    })
  })
})

describe('Audit Action Types', () => {
  const auditPath = resolve(__dirname, '../../src/lib/audit.ts')
  const auditContent = readFileSync(auditPath, 'utf-8')

  it('should include feature_flag_toggled action type', () => {
    expect(auditContent).toContain("'feature_flag_toggled'")
  })

  it('should include design_toggle_updated action type', () => {
    expect(auditContent).toContain("'design_toggle_updated'")
  })

  it('should include user_updated action type', () => {
    expect(auditContent).toContain("'user_updated'")
  })

  it('should include security_alert_created action type', () => {
    expect(auditContent).toContain("'security_alert_created'")
  })

  it('should include report_generated action type', () => {
    expect(auditContent).toContain("'report_generated'")
  })

  it('should export logAdminAction function', () => {
    expect(auditContent).toContain('export async function logAdminAction')
  })

  it('should export AuditActionType type', () => {
    expect(auditContent).toContain('export type AuditActionType')
  })
})
