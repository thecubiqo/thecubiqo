/**
 * Database Schema & Migration Validation Tests
 *
 * Ensures migration files follow naming conventions, contain valid SQL,
 * and define the required tables. Runs as part of staging merge checks.
 */

import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync, readdirSync } from 'fs'
import { resolve } from 'path'

const MIGRATIONS_DIR = resolve(__dirname, '../supabase/migrations')
const SUPABASE_DIR = resolve(__dirname, '../supabase')

/** Tables required for the app to function (must appear in at least one migration) */
const REQUIRED_TABLES = ['profiles', 'sessions', 'conversations', 'messages']

/** Collect all .sql files in the migrations directory */
function getMigrationFiles(): string[] {
  if (!existsSync(MIGRATIONS_DIR)) return []
  return readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort()
}

/** Read the combined SQL of all migration files */
function getAllMigrationSQL(): string {
  return getMigrationFiles()
    .map((f) => readFileSync(resolve(MIGRATIONS_DIR, f), 'utf-8'))
    .join('\n')
}

describe('Database Schema Validation', () => {
  describe('Migration directory structure', () => {
    it('should have a supabase directory', () => {
      expect(existsSync(SUPABASE_DIR)).toBe(true)
    })

    it('should have a migrations directory', () => {
      expect(existsSync(MIGRATIONS_DIR)).toBe(true)
    })

    it('should contain at least one migration file', () => {
      const files = getMigrationFiles()
      expect(files.length).toBeGreaterThan(0)
    })
  })

  describe('Migration file naming conventions', () => {
    const files = getMigrationFiles()

    files.forEach((file) => {
      it(`${file} should follow timestamp naming pattern`, () => {
        // Expected format: YYYYMMDDHHMMSS_description.sql or YYYYMMDD_description.sql
        expect(file).toMatch(/^\d{8,14}[_].*\.sql$/)
      })
    })

    it('migration files should be in chronological order', () => {
      const timestamps = files.map((f) => f.replace(/^(\d+)_.*/, '$1'))
      const sorted = [...timestamps].sort()
      expect(timestamps).toEqual(sorted)
    })
  })

  describe('Migration files contain valid SQL', () => {
    const files = getMigrationFiles()

    files.forEach((file) => {
      it(`${file} should not be empty`, () => {
        const content = readFileSync(resolve(MIGRATIONS_DIR, file), 'utf-8')
        expect(content.trim().length).toBeGreaterThan(0)
      })

      it(`${file} should contain SQL statements`, () => {
        const content = readFileSync(resolve(MIGRATIONS_DIR, file), 'utf-8').toUpperCase()
        const hasSql =
          content.includes('CREATE') ||
          content.includes('ALTER') ||
          content.includes('INSERT') ||
          content.includes('DROP') ||
          content.includes('SELECT') ||
          content.includes('GRANT') ||
          content.includes('REVOKE') ||
          content.includes('BEGIN') ||
          content.includes('DO $$')
        expect(hasSql).toBe(true)
      })
    })
  })

  describe('Required tables are defined in migrations', () => {
    const allSQL = getAllMigrationSQL().toLowerCase()

    REQUIRED_TABLES.forEach((table) => {
      it(`should define the "${table}" table`, () => {
        const hasCreate = allSQL.includes(`create table ${table}`) ||
          allSQL.includes(`create table if not exists ${table}`) ||
          allSQL.includes(`create table public.${table}`) ||
          allSQL.includes(`create table if not exists public.${table}`)
        expect(hasCreate).toBe(true)
      })
    })
  })

  describe('Schema consistency', () => {
    const allSQL = getAllMigrationSQL()

    it('should enable uuid-ossp or pgcrypto extension', () => {
      const lower = allSQL.toLowerCase()
      const hasUuidExt =
        lower.includes('uuid-ossp') || lower.includes('pgcrypto')
      expect(hasUuidExt).toBe(true)
    })

    it('should define Row Level Security policies', () => {
      const lower = allSQL.toLowerCase()
      expect(lower).toContain('row level security')
    })

    it('profiles table should have an id column', () => {
      // Find the migration containing profiles table creation
      const files = getMigrationFiles()
      let found = false
      for (const file of files) {
        const content = readFileSync(resolve(MIGRATIONS_DIR, file), 'utf-8').toLowerCase()
        if (content.includes('create table') && content.includes('profiles')) {
          expect(content).toContain('id')
          found = true
          break
        }
      }
      expect(found).toBe(true)
    })
  })

  describe('Supporting SQL files', () => {
    it('should have a verify_schema.sql file', () => {
      expect(existsSync(resolve(SUPABASE_DIR, 'verify_schema.sql'))).toBe(true)
    })
  })
})
