/**
 * API Routes Validation Tests
 *
 * Ensures all API route files exist, export valid HTTP handlers,
 * and follow project conventions. Runs as part of staging merge checks.
 */

import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'
import { globSync } from 'fs'

const API_DIR = resolve(__dirname, '../src/app/api')

/** Core API routes that must always be present */
const REQUIRED_ROUTES = [
  'health/route.ts',
  'chat/route.ts',
  'session/route.ts',
  'features/route.ts',
  'messages/route.ts',
  'memory/route.ts',
  'auth-example/route.ts',
]

/** Collect every route.ts under src/app/api */
function getAllRouteFiles(): string[] {
  const results: string[] = []
  function walk(dir: string) {
    const { readdirSync, statSync } = require('fs')
    for (const entry of readdirSync(dir)) {
      const full = resolve(dir, entry)
      if (statSync(full).isDirectory()) {
        walk(full)
      } else if (entry === 'route.ts') {
        results.push(full)
      }
    }
  }
  walk(API_DIR)
  return results
}

describe('API Routes Validation', () => {
  describe('Required routes exist', () => {
    REQUIRED_ROUTES.forEach((route) => {
      it(`should have ${route}`, () => {
        const fullPath = resolve(API_DIR, route)
        expect(existsSync(fullPath)).toBe(true)
      })
    })
  })

  describe('Route files export HTTP handlers', () => {
    const routeFiles = getAllRouteFiles()

    it('should discover at least 20 API route files', () => {
      expect(routeFiles.length).toBeGreaterThanOrEqual(20)
    })

    routeFiles.forEach((filePath) => {
      const relative = filePath.replace(API_DIR + '/', '')

      it(`${relative} should export at least one HTTP method`, () => {
        const content = readFileSync(filePath, 'utf-8')
        // Match both `export async function GET` and `export const GET =`
        const methodPattern = /export\s+(async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE)|export\s+const\s+(GET|POST|PUT|PATCH|DELETE)\s*=/
        expect(methodPattern.test(content)).toBe(true)
      })
    })
  })

  describe('Route conventions', () => {
    it('health route should use force-dynamic', () => {
      const content = readFileSync(resolve(API_DIR, 'health/route.ts'), 'utf-8')
      expect(content).toContain("export const dynamic = 'force-dynamic'")
    })

    it('health route should return JSON with status field', () => {
      const content = readFileSync(resolve(API_DIR, 'health/route.ts'), 'utf-8')
      expect(content).toContain('NextResponse.json')
      expect(content).toContain('status')
    })

    it('health route should check Supabase connectivity', () => {
      const content = readFileSync(resolve(API_DIR, 'health/route.ts'), 'utf-8')
      expect(content).toContain('supabase_connection')
    })

    it('health route should check database schema', () => {
      const content = readFileSync(resolve(API_DIR, 'health/route.ts'), 'utf-8')
      expect(content).toContain('database_schema')
    })

    it('health route should verify required tables', () => {
      const content = readFileSync(resolve(API_DIR, 'health/route.ts'), 'utf-8')
      expect(content).toContain('profiles')
      expect(content).toContain('sessions')
      expect(content).toContain('conversations')
      expect(content).toContain('messages')
    })

    it('session route should import Supabase client', () => {
      const content = readFileSync(resolve(API_DIR, 'session/route.ts'), 'utf-8')
      expect(content).toContain('supabase')
    })

    it('features route should query feature_flags table', () => {
      const content = readFileSync(resolve(API_DIR, 'features/route.ts'), 'utf-8')
      expect(content).toContain('feature_flags')
    })
  })

  describe('No duplicate route paths', () => {
    it('should not have conflicting route files', () => {
      const routeFiles = getAllRouteFiles()
      const routePaths = routeFiles.map((f) =>
        f.replace(API_DIR, '').replace('/route.ts', '')
      )
      const unique = new Set(routePaths)
      expect(unique.size).toBe(routePaths.length)
    })
  })
})
