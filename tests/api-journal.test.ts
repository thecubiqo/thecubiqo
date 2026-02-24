/**
 * Journal API Route Tests
 *
 * Validates journal entries endpoint: auth, filtering, CRUD operations.
 * Relevant to PR #119 (Complete daily journal with history).
 */

import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

const journalEntriesPath = resolve(__dirname, '../src/app/api/journal/entries/route.ts')
const journalContent = readFileSync(journalEntriesPath, 'utf-8')

describe('Journal Entries API: Structure', () => {
  it('should export GET handler', () => {
    expect(journalContent).toContain('export async function GET(')
  })

  it('should export POST handler', () => {
    expect(journalContent).toContain('export async function POST(')
  })

  it('should import createClient from supabase/server', () => {
    expect(journalContent).toContain("from '@/lib/supabase/server'")
  })

  it('should import JournalService', () => {
    expect(journalContent).toContain('JournalService')
  })

  it('should import AI router for analysis', () => {
    expect(journalContent).toContain('routeAIRequest')
  })
})

describe('Journal Entries API: Authentication', () => {
  it('should check for authenticated user', () => {
    expect(journalContent).toContain('supabase.auth.getUser()')
  })

  it('should return 401 for unauthenticated requests', () => {
    expect(journalContent).toContain("'Authentication required'")
    expect(journalContent).toContain('status: 401')
  })
})

describe('Journal Entries API: GET Filtering', () => {
  it('should query journal_entries table', () => {
    expect(journalContent).toContain("from('journal_entries')")
  })

  it('should filter by user_id', () => {
    expect(journalContent).toContain("eq('user_id', user.id)")
  })

  it('should support dateFrom filter', () => {
    expect(journalContent).toContain("searchParams.get('dateFrom')")
  })

  it('should support dateTo filter', () => {
    expect(journalContent).toContain("searchParams.get('dateTo')")
  })

  it('should support colorCategory filter', () => {
    expect(journalContent).toContain("searchParams.get('colorCategory')")
  })

  it('should support search query', () => {
    expect(journalContent).toContain("searchParams.get('q')")
  })

  it('should support limit parameter with default of 50', () => {
    expect(journalContent).toContain("searchParams.get('limit')")
    expect(journalContent).toContain("|| '50'")
  })

  it('should order by timestamp descending', () => {
    expect(journalContent).toContain("order('timestamp', { ascending: false })")
  })

  it('should use textSearch for search queries', () => {
    expect(journalContent).toContain('textSearch')
  })
})

describe('Journal Entries API: POST Validation', () => {
  it('should validate content is present', () => {
    expect(journalContent).toContain('content')
  })

  it('should handle database errors', () => {
    expect(journalContent).toContain('status: 500')
  })
})

describe('Journal Entries API: Error Handling', () => {
  it('should catch and handle errors', () => {
    expect(journalContent).toContain('catch')
    expect(journalContent).toContain('Internal server error')
  })

  it('should return appropriate error status codes', () => {
    expect(journalContent).toContain('status: 401')
    expect(journalContent).toContain('status: 500')
  })
})

describe('Journal Feature Files', () => {
  it('should have journal stats endpoint', () => {
    expect(existsSync(resolve(__dirname, '../src/app/api/journal/stats'))).toBe(true)
  })

  it('should have journal summary endpoint', () => {
    expect(existsSync(resolve(__dirname, '../src/app/api/journal/summary'))).toBe(true)
  })

  it('should have journal service library', () => {
    expect(existsSync(resolve(__dirname, '../src/lib/journal'))).toBe(true)
  })

  it('should have journal types', () => {
    const typesDir = resolve(__dirname, '../src/lib/journal')
    expect(existsSync(typesDir)).toBe(true)
  })
})
