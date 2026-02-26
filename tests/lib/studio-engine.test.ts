/**
 * Studio Engine Tests
 *
 * Validates the real implementations that replaced placeholder code:
 * - Testing Agent (real execution with graceful fallback)
 * - Image Agent (DALL-E with graceful fallback)
 * - Workspace persistence (AgentInstance)
 * - ensureWorkspace utility
 *
 * @module tests/lib/studio-engine
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { join } from 'path'

// ════════════════════════════════════════════════════════════════════
// Testing Agent
// ════════════════════════════════════════════════════════════════════

describe('Testing Agent — executeTestAgent', () => {
  let executeTestAgent: typeof import('@/lib/emergent/subagents/testing-agent').executeTestAgent

  beforeEach(async () => {
    vi.resetModules()
    const mod = await import('@/lib/emergent/subagents/testing-agent')
    executeTestAgent = mod.executeTestAgent
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ── Graceful fallback ──────────────────────────────────────────

  it('returns graceful fallback when workspace does not exist', async () => {
    const result = await executeTestAgent({
      type: 'test',
      projectId: 'nonexistent-project-id-12345',
      params: {},
    })

    // Should succeed (graceful, not a crash)
    expect(result.success).toBe(true)

    // Data should contain zeroed-out test results
    expect(result.data).toBeDefined()
    const data = result.data as Record<string, unknown>
    expect(data.passed).toBe(0)
    expect(data.failed).toBe(0)
    expect(data.skipped).toBe(0)
    expect(data.total).toBe(0)
    expect(data.duration).toBe(0)
    expect(data.output).toContain('Workspace not found')
  })

  it('includes "Workspace not found" in metadata.note', async () => {
    const result = await executeTestAgent({
      type: 'test',
      projectId: 'phantom-project',
      params: {},
    })

    expect(result.metadata).toBeDefined()
    expect(result.metadata!.note).toContain('Workspace not found')
  })

  it('does NOT fabricate fake pass counts for missing workspaces', async () => {
    const result = await executeTestAgent({
      type: 'test',
      projectId: 'ghost-workspace',
      params: {},
    })

    // Old placeholder returned "42 passed" — new code must return 0
    const data = result.data as Record<string, unknown>
    expect(data.passed).toBe(0)
    expect(data.total).toBe(0)
  })

  // ── Timeout validation ─────────────────────────────────────────

  it('rejects timeout > 600000ms', async () => {
    const result = await executeTestAgent({
      type: 'test',
      projectId: 'test-proj',
      params: { timeout: 700000 },
    })

    expect(result.success).toBe(false)
    expect(result.data).toBeNull()
    expect(result.error).toContain('Timeout must be between')
  })

  it('rejects negative timeout', async () => {
    const result = await executeTestAgent({
      type: 'test',
      projectId: 'test-proj',
      params: { timeout: -1 },
    })

    expect(result.success).toBe(false)
    expect(result.data).toBeNull()
    expect(result.error).toContain('Timeout must be between')
  })

  it('accepts timeout at lower boundary (0 is falsy, skipped by validation)', async () => {
    // Note: `params.timeout = 0` is falsy, so the `if (params.timeout && ...)` guard
    // doesn't fire — the agent falls through to workspace check, returning graceful fallback.
    const result = await executeTestAgent({
      type: 'test',
      projectId: 'nonexistent',
      params: { timeout: 0 },
    })

    // No validation error — graceful fallback instead
    expect(result.success).toBe(true)
  })

  it('accepts timeout at upper boundary (600000)', async () => {
    const result = await executeTestAgent({
      type: 'test',
      projectId: 'nonexistent',
      params: { timeout: 600000 },
    })

    // Should not fail on validation; returns graceful fallback (no workspace)
    expect(result.success).toBe(true)
    expect(result.error).toBeNull()
  })

  // ── ToolResponse shape ─────────────────────────────────────────

  it('returns ToolResponse shape with all required fields', async () => {
    const result = await executeTestAgent({
      type: 'test',
      projectId: 'shape-check',
      params: {},
    })

    expect(result).toHaveProperty('success')
    expect(result).toHaveProperty('data')
    expect(result).toHaveProperty('error')
    // metadata is optional per ToolResponse but present for graceful fallback
    expect(result).toHaveProperty('metadata')
    expect(typeof result.success).toBe('boolean')
  })

  it('includes default testPattern and coverage in metadata', async () => {
    const result = await executeTestAgent({
      type: 'test',
      projectId: 'defaults-check',
      params: {},
    })

    expect(result.metadata).toBeDefined()
    expect(result.metadata!.testPattern).toBe('**/*.test.{ts,tsx,js,jsx}')
    expect(result.metadata!.coverage).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════════════
// Image Agent
// ════════════════════════════════════════════════════════════════════

describe('Image Agent — executeImageAgent', () => {
  let executeImageAgent: typeof import('@/lib/emergent/subagents/image-agent').executeImageAgent
  const savedApiKey = process.env.OPENAI_API_KEY

  beforeEach(async () => {
    vi.resetModules()
    // Clear API key so tests run in placeholder mode
    delete process.env.OPENAI_API_KEY
    const mod = await import('@/lib/emergent/subagents/image-agent')
    executeImageAgent = mod.executeImageAgent
  })

  afterEach(() => {
    vi.restoreAllMocks()
    // Restore original env
    if (savedApiKey !== undefined) {
      process.env.OPENAI_API_KEY = savedApiKey
    } else {
      delete process.env.OPENAI_API_KEY
    }
  })

  // ── Placeholder / graceful fallback ────────────────────────────

  it('returns placeholder image when OPENAI_API_KEY is not set', async () => {
    const result = await executeImageAgent({
      type: 'image',
      projectId: 'test-proj',
      params: { prompt: 'A cute cat' },
    })

    expect(result.success).toBe(true)
    const data = result.data as Record<string, unknown>
    expect(data.url).toContain('placehold.co')
  })

  it('placeholder response has metadata.model = "placeholder"', async () => {
    const result = await executeImageAgent({
      type: 'image',
      projectId: 'test-proj',
      params: { prompt: 'A sunset over mountains' },
    })

    expect(result.metadata).toBeDefined()
    expect(result.metadata!.model).toBe('placeholder')
  })

  it('placeholder response includes note about missing API key', async () => {
    const result = await executeImageAgent({
      type: 'image',
      projectId: 'test-proj',
      params: { prompt: 'Abstract art' },
    })

    expect(result.metadata!.note).toContain('OPENAI_API_KEY not configured')
  })

  // ── Prompt validation ──────────────────────────────────────────

  it('validates empty prompt (empty string)', async () => {
    const result = await executeImageAgent({
      type: 'image',
      projectId: 'test-proj',
      params: { prompt: '' },
    })

    expect(result.success).toBe(false)
    expect(result.data).toBeNull()
    expect(result.error).toContain('Prompt is required')
  })

  it('validates empty prompt (whitespace only)', async () => {
    const result = await executeImageAgent({
      type: 'image',
      projectId: 'test-proj',
      params: { prompt: '   ' },
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('Prompt is required')
  })

  it('validates missing prompt (undefined)', async () => {
    const result = await executeImageAgent({
      type: 'image',
      projectId: 'test-proj',
      params: {},
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('Prompt is required')
  })

  it('validates prompt > 1000 chars', async () => {
    const longPrompt = 'x'.repeat(1001)
    const result = await executeImageAgent({
      type: 'image',
      projectId: 'test-proj',
      params: { prompt: longPrompt },
    })

    expect(result.success).toBe(false)
    expect(result.data).toBeNull()
    expect(result.error).toContain('less than 1000')
  })

  it('accepts prompt of exactly 1000 chars', async () => {
    const borderlinePrompt = 'a'.repeat(1000)
    const result = await executeImageAgent({
      type: 'image',
      projectId: 'test-proj',
      params: { prompt: borderlinePrompt },
    })

    // Should pass validation (boundary: length === 1000 is allowed, > 1000 is not)
    expect(result.success).toBe(true)
  })

  // ── Size validation ────────────────────────────────────────────

  it('validates invalid size', async () => {
    const result = await executeImageAgent({
      type: 'image',
      projectId: 'test-proj',
      params: { prompt: 'A cat', size: '999x999' },
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('Size must be one of')
  })

  it('accepts valid size "256x256"', async () => {
    const result = await executeImageAgent({
      type: 'image',
      projectId: 'test-proj',
      params: { prompt: 'A cat', size: '256x256' },
    })

    expect(result.success).toBe(true)
    const data = result.data as Record<string, unknown>
    expect(data.size).toBe('256x256')
  })

  it('accepts valid size "1024x1024"', async () => {
    const result = await executeImageAgent({
      type: 'image',
      projectId: 'test-proj',
      params: { prompt: 'A cat', size: '1024x1024' },
    })

    expect(result.success).toBe(true)
    const data = result.data as Record<string, unknown>
    expect(data.size).toBe('1024x1024')
  })

  it('defaults size to "512x512" when omitted', async () => {
    const result = await executeImageAgent({
      type: 'image',
      projectId: 'test-proj',
      params: { prompt: 'A landscape' },
    })

    expect(result.success).toBe(true)
    const data = result.data as Record<string, unknown>
    expect(data.size).toBe('512x512')
  })

  // ── Style validation ───────────────────────────────────────────

  it('validates invalid style', async () => {
    const result = await executeImageAgent({
      type: 'image',
      projectId: 'test-proj',
      params: { prompt: 'A cat', style: 'abstract' },
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('Style must be one of')
  })

  it('accepts valid style "vivid"', async () => {
    const result = await executeImageAgent({
      type: 'image',
      projectId: 'test-proj',
      params: { prompt: 'A cat', style: 'vivid' },
    })

    expect(result.success).toBe(true)
    const data = result.data as Record<string, unknown>
    expect(data.style).toBe('vivid')
  })

  it('accepts valid style "natural"', async () => {
    const result = await executeImageAgent({
      type: 'image',
      projectId: 'test-proj',
      params: { prompt: 'A cat', style: 'natural' },
    })

    expect(result.success).toBe(true)
    const data = result.data as Record<string, unknown>
    expect(data.style).toBe('natural')
  })

  it('defaults style to "natural" when omitted', async () => {
    const result = await executeImageAgent({
      type: 'image',
      projectId: 'test-proj',
      params: { prompt: 'A forest scene' },
    })

    expect(result.success).toBe(true)
    const data = result.data as Record<string, unknown>
    expect(data.style).toBe('natural')
  })

  // ── Response shape ─────────────────────────────────────────────

  it('returns correct data shape in placeholder mode', async () => {
    const result = await executeImageAgent({
      type: 'image',
      projectId: 'test-proj',
      params: { prompt: 'A landscape', size: '512x512', style: 'vivid' },
    })

    expect(result.success).toBe(true)
    expect(result.error).toBeNull()

    const data = result.data as Record<string, unknown>
    expect(data).toHaveProperty('url')
    expect(data).toHaveProperty('prompt', 'A landscape')
    expect(data).toHaveProperty('size', '512x512')
    expect(data).toHaveProperty('style', 'vivid')
    expect(typeof data.url).toBe('string')
  })

  it('returns ToolResponse shape with all required fields', async () => {
    const result = await executeImageAgent({
      type: 'image',
      projectId: 'test-proj',
      params: { prompt: 'Shape check' },
    })

    expect(result).toHaveProperty('success')
    expect(result).toHaveProperty('data')
    expect(result).toHaveProperty('error')
    expect(result).toHaveProperty('metadata')
    expect(typeof result.success).toBe('boolean')
  })

  it('encodes prompt text in placeholder URL', async () => {
    const result = await executeImageAgent({
      type: 'image',
      projectId: 'test-proj',
      params: { prompt: 'Hello World' },
    })

    const data = result.data as Record<string, unknown>
    const url = data.url as string
    // Placeholder URL should contain the prompt text (URL-encoded)
    expect(url).toContain('placehold.co')
    expect(url).toContain(encodeURIComponent('Hello World'))
  })
})

// ════════════════════════════════════════════════════════════════════
// ensureWorkspace (sandbox utility)
// ════════════════════════════════════════════════════════════════════

describe('ensureWorkspace — sandbox utility', () => {
  const testSessionIds: string[] = []

  afterEach(async () => {
    const { cleanupWorkspace } = await import('@/lib/code-execution/sandbox')
    // Clean up all test workspaces
    for (const sid of testSessionIds) {
      await cleanupWorkspace(sid)
    }
    testSessionIds.length = 0
  })

  it('creates a workspace directory and returns its path', async () => {
    const { ensureWorkspace } = await import('@/lib/code-execution/sandbox')
    const { stat } = await import('fs/promises')

    const testSessionId = `test-studio-${Date.now()}-${Math.random().toString(36).slice(2)}`
    testSessionIds.push(testSessionId)

    const dir = await ensureWorkspace(testSessionId)

    // Path should contain the session ID
    expect(dir).toContain(testSessionId)

    // Directory should actually exist on disk
    const stats = await stat(dir)
    expect(stats.isDirectory()).toBe(true)
  })

  it('returns a deterministic path for the same sessionId', async () => {
    const { ensureWorkspace } = await import('@/lib/code-execution/sandbox')

    const testSessionId = `test-deterministic-${Date.now()}`
    testSessionIds.push(testSessionId)

    const dir1 = await ensureWorkspace(testSessionId)
    const dir2 = await ensureWorkspace(testSessionId)

    expect(dir1).toBe(dir2)
  })

  it('getWorkspaceDir returns consistent path without creating directory', async () => {
    const { getWorkspaceDir } = await import('@/lib/code-execution/sandbox')
    const { access } = await import('fs/promises')

    const testSessionId = `test-no-create-${Date.now()}`
    const dir = getWorkspaceDir(testSessionId)

    expect(dir).toContain(testSessionId)

    // getWorkspaceDir should NOT create the directory
    await expect(access(dir)).rejects.toThrow()
  })

  it('cleanupWorkspace removes the directory', async () => {
    const { ensureWorkspace, cleanupWorkspace, getWorkspaceDir } = await import('@/lib/code-execution/sandbox')
    const { access } = await import('fs/promises')

    const testSessionId = `test-cleanup-${Date.now()}`
    // Don't push to testSessionIds — we clean manually here

    const dir = await ensureWorkspace(testSessionId)
    await cleanupWorkspace(testSessionId)

    // Directory should no longer exist
    const expectedPath = getWorkspaceDir(testSessionId)
    await expect(access(expectedPath)).rejects.toThrow()
  })
})

// ════════════════════════════════════════════════════════════════════
// Agent workspace persistence (AgentInstance)
// ════════════════════════════════════════════════════════════════════

describe('AgentInstance — workspace persistence', () => {
  const originalEnv = { ...process.env }

  // Mock heavy dependencies that AgentInstance imports so we can test
  // workspace path calculation without connecting to Supabase, registering
  // tools, or calling LLMs.
  beforeEach(() => {
    vi.resetModules()

    // Mock SessionStore (needs Supabase — can't construct in test env)
    vi.mock('@/lib/engine/session', () => {
      return {
        SessionStore: class MockSessionStore {
          create = vi.fn()
          get = vi.fn()
          getHistory = vi.fn().mockResolvedValue([])
          addMessage = vi.fn()
          delete = vi.fn()
          list = vi.fn().mockResolvedValue([])
          needsCompaction = vi.fn().mockResolvedValue(false)
          compactSession = vi.fn()
          constructor() {}
        },
      }
    })

    // Mock ToolRegistry (registers complex tools on construction)
    vi.mock('@/lib/engine/tools', () => {
      return {
        ToolRegistry: class MockToolRegistry {
          getTools = vi.fn().mockResolvedValue([])
          execute = vi.fn()
          register = vi.fn()
          constructor() {}
        },
      }
    })

    // Mock LLM router
    vi.mock('@/lib/ai/llm-router', () => ({
      callLLM: vi.fn().mockResolvedValue({ content: 'mock', toolCalls: [] }),
    }))

    // Mock WorkspaceManager (lightweight, but mock for isolation)
    vi.mock('@/lib/engine/workspace', () => {
      return {
        WorkspaceManager: class MockWorkspaceManager {
          agentRoot: string
          getAgentRoot = vi.fn()
          createTaskWorkspace = vi.fn()
          cleanupTaskWorkspace = vi.fn()
          constructor(root: string) {
            this.agentRoot = root
            this.getAgentRoot = vi.fn().mockReturnValue(root)
          }
        },
      }
    })
  })

  afterEach(() => {
    // Restore original env vars
    process.env = { ...originalEnv }
    vi.restoreAllMocks()
  })

  it('uses WORKSPACE_ROOT env var when set', async () => {
    process.env.WORKSPACE_ROOT = '/mnt/persistent'

    const { AgentInstance } = await import('@/lib/engine/agent')
    const agent = new AgentInstance({
      id: 'ws-test-agent',
      name: 'Test Agent',
      model: { provider: 'openai', model: 'gpt-4', maxTokens: 100, temperature: 0 },
    })

    expect(agent.workspace).toBe(join('/mnt/persistent', 'workspaces', 'ws-test-agent'))
  })

  it('falls back to cwd/data in development', async () => {
    delete process.env.WORKSPACE_ROOT
    process.env.NODE_ENV = 'development'

    const { AgentInstance } = await import('@/lib/engine/agent')
    const agent = new AgentInstance({
      id: 'dev-agent',
      name: 'Dev Agent',
      model: { provider: 'openai', model: 'gpt-4', maxTokens: 100, temperature: 0 },
    })

    const expected = join(process.cwd(), 'data', 'workspaces', 'dev-agent')
    expect(agent.workspace).toBe(expected)
  })

  it('falls back to /tmp/cubiqo-workspaces in production', async () => {
    delete process.env.WORKSPACE_ROOT
    process.env.NODE_ENV = 'production'

    const { AgentInstance } = await import('@/lib/engine/agent')
    const agent = new AgentInstance({
      id: 'prod-agent',
      name: 'Prod Agent',
      model: { provider: 'openai', model: 'gpt-4', maxTokens: 100, temperature: 0 },
    })

    expect(agent.workspace).toBe(join('/tmp/cubiqo-workspaces', 'workspaces', 'prod-agent'))
  })

  it('workspace path always includes /workspaces/ segment', async () => {
    process.env.WORKSPACE_ROOT = '/data'

    const { AgentInstance } = await import('@/lib/engine/agent')
    const agent = new AgentInstance({
      id: 'path-check',
      name: 'Path Check',
      model: { provider: 'openai', model: 'gpt-4', maxTokens: 100, temperature: 0 },
    })

    expect(agent.workspace).toContain('/workspaces/')
  })

  it('workspace uses the agent id as the final directory name', async () => {
    process.env.WORKSPACE_ROOT = '/vol'

    const { AgentInstance } = await import('@/lib/engine/agent')
    const agent = new AgentInstance({
      id: 'unique-agent-id-123',
      name: 'Named Agent',
      model: { provider: 'anthropic', model: 'claude-3', maxTokens: 200, temperature: 0.5 },
    })

    expect(agent.workspace).toBe('/vol/workspaces/unique-agent-id-123')
  })

  it('sets default maxConcurrent to 2', async () => {
    process.env.WORKSPACE_ROOT = '/tmp'

    const { AgentInstance } = await import('@/lib/engine/agent')
    const agent = new AgentInstance({
      id: 'defaults-agent',
      name: 'Defaults',
      model: { provider: 'openai', model: 'gpt-4', maxTokens: 100, temperature: 0 },
    })

    expect(agent.maxConcurrent).toBe(2)
  })

  it('starts with "idle" status', async () => {
    process.env.WORKSPACE_ROOT = '/tmp'

    const { AgentInstance } = await import('@/lib/engine/agent')
    const agent = new AgentInstance({
      id: 'status-agent',
      name: 'Status',
      model: { provider: 'openai', model: 'gpt-4', maxTokens: 100, temperature: 0 },
    })

    expect(agent.status).toBe('idle')
    expect(agent.currentTasks).toEqual([])
  })
})
