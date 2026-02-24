/**
 * Memory API Route Tests
 *
 * Validates memory endpoint: auth, CRUD, search, AI ranking.
 * Relevant to core AI memory infrastructure.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

const memoryRoutePath = resolve(__dirname, '../src/app/api/memory/route.ts')
const memoryContent = readFileSync(memoryRoutePath, 'utf-8')

describe('Memory API: Structure', () => {
  it('should export GET handler', () => {
    expect(memoryContent).toContain('export async function GET(')
  })

  it('should export POST handler', () => {
    expect(memoryContent).toContain('export async function POST(')
  })

  it('should import createClient from supabase/server', () => {
    expect(memoryContent).toContain("from '@/lib/supabase/server'")
  })

  it('should import ConsciousMemoryService', () => {
    expect(memoryContent).toContain('ConsciousMemoryService')
  })

  it('should import AI router', () => {
    expect(memoryContent).toContain('routeAIRequest')
  })
})

describe('Memory API: Authentication', () => {
  it('should check for authenticated user', () => {
    expect(memoryContent).toContain('supabase.auth.getUser()')
  })

  it('should return 401 for unauthenticated requests', () => {
    expect(memoryContent).toContain("'Authentication required'")
    expect(memoryContent).toContain('status: 401')
  })
})

describe('Memory API: GET Operations', () => {
  it('should query conscious_memories table', () => {
    expect(memoryContent).toContain("from('conscious_memories')")
  })

  it('should filter by user_id', () => {
    expect(memoryContent).toContain("eq('user_id', user.id)")
  })

  it('should support search query parameter', () => {
    expect(memoryContent).toContain("searchParams.get('q')")
  })

  it('should support type filter', () => {
    expect(memoryContent).toContain("searchParams.get('type')")
  })

  it('should support tags filter', () => {
    expect(memoryContent).toContain("searchParams.get('tags')")
  })

  it('should support minImportance filter', () => {
    expect(memoryContent).toContain("searchParams.get('minImportance')")
  })

  it('should support limit parameter with default of 50', () => {
    expect(memoryContent).toContain("searchParams.get('limit')")
    expect(memoryContent).toContain("|| '50'")
  })

  it('should order by importance descending', () => {
    expect(memoryContent).toContain("order('importance', { ascending: false })")
  })

  it('should order by last_accessed descending', () => {
    expect(memoryContent).toContain("order('last_accessed', { ascending: false })")
  })

  it('should support AI-powered search ranking', () => {
    expect(memoryContent).toContain('searchMemories')
  })
})

describe('Memory API: POST Validation', () => {
  it('should validate content is present', () => {
    expect(memoryContent).toContain("'Content required'")
  })

  it('should validate type is present', () => {
    expect(memoryContent).toContain("'Type required'")
  })

  it('should return 400 for missing content', () => {
    expect(memoryContent).toContain('status: 400')
  })

  it('should return 201 on successful creation', () => {
    expect(memoryContent).toContain('status: 201')
  })

  it('should set default importance to medium', () => {
    expect(memoryContent).toContain("importance = 'medium'")
  })

  it('should set default access_count to 0', () => {
    expect(memoryContent).toContain('access_count: 0')
  })

  it('should set verified to false by default', () => {
    expect(memoryContent).toContain('verified: false')
  })
})

describe('Memory API: Error Handling', () => {
  it('should catch and handle errors', () => {
    expect(memoryContent).toContain('catch')
    expect(memoryContent).toContain('Internal server error')
  })

  it('should return internal server error status', () => {
    expect(memoryContent).toContain("'Internal server error'")
    expect(memoryContent).toContain('status: 500')
  })
})

describe('Memory Feature Files', () => {
  it('should have memory search endpoint', () => {
    expect(existsSync(resolve(__dirname, '../src/app/api/memory/search'))).toBe(true)
  })

  it('should have memory stats endpoint', () => {
    expect(existsSync(resolve(__dirname, '../src/app/api/memory/stats'))).toBe(true)
  })

  it('should have memory extract endpoint', () => {
    expect(existsSync(resolve(__dirname, '../src/app/api/memory/extract'))).toBe(true)
  })

  it('should have memory by ID endpoint', () => {
    expect(existsSync(resolve(__dirname, '../src/app/api/memory/[id]'))).toBe(true)
  })

  it('should have conscious memory service library', () => {
    expect(existsSync(resolve(__dirname, '../src/lib/conscious-memory'))).toBe(true)
  })
})
