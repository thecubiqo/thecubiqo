/**
 * Tests for Code Agent
 *
 * Validates bulk-write, bulk-edit, view-files, and deploy tool handling.
 * Uses a real temporary filesystem so we verify actual I/O behaviour.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mkdtemp, rm, writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import { executeCodeAgent } from '../subagents/code-agent'
import type { SubAgentRequest } from '../agent-types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let testWorkspaceRoot: string

// Intercept ensureWorkspace so it returns a path inside our temp root
vi.mock('@/lib/code-execution/sandbox', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/code-execution/sandbox')>()
  return {
    ...actual,
    ensureWorkspace: vi.fn(async (id: string) => {
      const ws = join(testWorkspaceRoot, id)
      await mkdir(ws, { recursive: true })
      return ws
    }),
    // Keep validatePath from the real module (pure function, no I/O)
  }
})

function makeRequest(tool: string, params: Record<string, unknown>): SubAgentRequest {
  return {
    type: 'code',
    projectId: 'proj_test',
    params: { ...params, __tool: tool },
  }
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(async () => {
  testWorkspaceRoot = await mkdtemp(join(tmpdir(), 'cubiqo-test-'))
})

afterEach(async () => {
  await rm(testWorkspaceRoot, { recursive: true, force: true })
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Code Agent', () => {
  // ── bulk-write ────────────────────────────────────────────────────────────
  describe('bulk-write', () => {
    it('writes files to the workspace and returns success', async () => {
      const res = await executeCodeAgent(
        makeRequest('bulk-write', {
          files: [
            { path: 'src/index.ts', content: 'export default 42' },
            { path: 'README.md', content: '# Hello' },
          ],
        })
      )

      expect(res.success).toBe(true)
      expect(res.data).toMatchObject({
        written: ['src/index.ts', 'README.md'],
        errors: [],
      })
      expect(res.metadata?.filesWritten).toBe(2)
      expect(res.metadata?.filesFailed).toBe(0)
    })

    it('rejects empty files array', async () => {
      const res = await executeCodeAgent(makeRequest('bulk-write', { files: [] }))
      expect(res.success).toBe(false)
      expect(res.error).toMatch(/at least one file/)
    })

    it('blocks path traversal', async () => {
      const res = await executeCodeAgent(
        makeRequest('bulk-write', {
          files: [{ path: '../../etc/passwd', content: 'hacked' }],
        })
      )
      expect(res.success).toBe(false)
      expect((res.data as any).errors[0].path).toBe('../../etc/passwd')
    })
  })

  // ── bulk-edit ─────────────────────────────────────────────────────────────
  describe('bulk-edit', () => {
    it('applies a find-and-replace edit to an existing file', async () => {
      // Pre-create the file in the workspace
      const ws = join(testWorkspaceRoot, 'proj_test')
      await mkdir(join(ws, 'src'), { recursive: true })
      await writeFile(join(ws, 'src', 'app.ts'), 'const foo = 1', 'utf-8')

      const res = await executeCodeAgent(
        makeRequest('bulk-edit', {
          edits: [
            {
              path: 'src/app.ts',
              oldContent: 'const foo = 1',
              newContent: 'const foo = 2',
            },
          ],
        })
      )

      expect(res.success).toBe(true)
      expect(res.data).toMatchObject({ applied: ['src/app.ts'], errors: [] })
    })

    it('returns error when oldContent is not found', async () => {
      const ws = join(testWorkspaceRoot, 'proj_test')
      await mkdir(ws, { recursive: true })
      await writeFile(join(ws, 'app.ts'), 'const foo = 1', 'utf-8')

      const res = await executeCodeAgent(
        makeRequest('bulk-edit', {
          edits: [
            {
              path: 'app.ts',
              oldContent: 'THIS DOES NOT EXIST',
              newContent: 'replaced',
            },
          ],
        })
      )

      expect(res.success).toBe(false)
      expect((res.data as any).errors[0].path).toBe('app.ts')
    })

    it('returns error when file does not exist', async () => {
      const res = await executeCodeAgent(
        makeRequest('bulk-edit', {
          edits: [{ path: 'nonexistent.ts', oldContent: 'x', newContent: 'y' }],
        })
      )

      expect(res.success).toBe(false)
      expect((res.data as any).errors[0].path).toBe('nonexistent.ts')
    })

    it('rejects empty edits array', async () => {
      const res = await executeCodeAgent(makeRequest('bulk-edit', { edits: [] }))
      expect(res.success).toBe(false)
      expect(res.error).toMatch(/at least one edit/)
    })
  })

  // ── view-files ────────────────────────────────────────────────────────────
  describe('view-files', () => {
    it('reads multiple files and returns their contents', async () => {
      const ws = join(testWorkspaceRoot, 'proj_test')
      await mkdir(join(ws, 'src'), { recursive: true })
      await writeFile(join(ws, 'src', 'index.ts'), 'export default 42', 'utf-8')
      await writeFile(join(ws, 'README.md'), '# Hello', 'utf-8')

      const res = await executeCodeAgent(
        makeRequest('view-files', { paths: ['src/index.ts', 'README.md'] })
      )

      expect(res.success).toBe(true)
      expect((res.data as any).files['src/index.ts']).toBe('export default 42')
      expect((res.data as any).files['README.md']).toBe('# Hello')
      expect((res.data as any).errors).toHaveLength(0)
    })

    it('returns partial success when some files are missing', async () => {
      const ws = join(testWorkspaceRoot, 'proj_test')
      await mkdir(ws, { recursive: true })
      await writeFile(join(ws, 'exists.ts'), 'found', 'utf-8')

      const res = await executeCodeAgent(
        makeRequest('view-files', { paths: ['exists.ts', 'missing.ts'] })
      )

      expect((res.data as any).files['exists.ts']).toBe('found')
      expect((res.data as any).errors).toHaveLength(1)
      expect((res.data as any).errors[0].path).toBe('missing.ts')
    })

    it('rejects empty paths array', async () => {
      const res = await executeCodeAgent(makeRequest('view-files', { paths: [] }))
      expect(res.success).toBe(false)
      expect(res.error).toMatch(/at least one path/)
    })
  })

  // ── deploy ────────────────────────────────────────────────────────────────
  describe('deploy', () => {
    it('returns a meaningful error when VERCEL_TOKEN is not set', async () => {
      const original = process.env.VERCEL_TOKEN
      delete process.env.VERCEL_TOKEN

      const res = await executeCodeAgent(
        makeRequest('deploy', { environment: 'production' })
      )

      expect(res.success).toBe(false)
      expect(res.error).toMatch(/VERCEL_TOKEN/)

      if (original !== undefined) process.env.VERCEL_TOKEN = original
    })
  })

  // ── unknown tool ──────────────────────────────────────────────────────────
  describe('unknown tool', () => {
    it('returns a meaningful error for unrecognised tools', async () => {
      const res = await executeCodeAgent({
        type: 'code',
        projectId: 'proj_test',
        params: { __tool: 'does-not-exist' },
      })

      expect(res.success).toBe(false)
      expect(res.error).toMatch(/does-not-exist/)
    })
  })
})
