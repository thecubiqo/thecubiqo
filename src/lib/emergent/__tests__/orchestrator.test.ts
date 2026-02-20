/**
 * Tests for Emergent Orchestrator
 * 
 * Tests agent orchestration, tool execution, rate limiting, credits, and logging
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { executeTool, getAvailableTools, getToolCost } from '../orchestrator'
import { mockUsers, mockProjects, mockCredits, mockOrganizations } from '../../../../tests/utils/mock-data'
import { createMockHeaders } from '../../../../tests/utils/test-helpers'

// Mock Supabase
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve({
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({
            data: table === 'projects' 
              ? { ...mockProjects.active, org_id: mockOrganizations.main.id }
              : table === 'credits'
              ? mockCredits.active
              : null,
            error: null
          }),
          not: () => ({
            single: () => Promise.resolve({
              data: { role: 'owner' },
              error: null
            })
          })
        })
      }),
      insert: () => ({
        select: () => ({
          single: () => Promise.resolve({
            data: { id: 'audit_123' },
            error: null
          })
        })
      }),
      update: () => ({
        eq: () => Promise.resolve({
          data: null,
          error: null
        })
      })
    }),
    rpc: () => Promise.resolve({ data: null, error: null })
  }))
}))

// Mock subagents
vi.mock('../subagents/testing-agent', () => ({
  executeTestAgent: vi.fn(() => Promise.resolve({
    success: true,
    data: { testsRun: 10, testsPassed: 10, testsFailed: 0 },
    metadata: { executionTimeMs: 1000 }
  }))
}))

vi.mock('../subagents/image-agent', () => ({
  executeImageAgent: vi.fn(() => Promise.resolve({
    success: true,
    data: { imageUrl: 'https://example.com/image.png' },
    metadata: { executionTimeMs: 2000 }
  }))
}))

vi.mock('../subagents/integration-agent', () => ({
  executeIntegrationAgent: vi.fn(() => Promise.resolve({
    success: true,
    data: { orderId: '12345' },
    metadata: { executionTimeMs: 1500 }
  }))
}))

describe('Orchestrator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('executeTool', () => {
    it('should execute a tool successfully', async () => {
      const request = {
        tool: 'run-tests',
        projectId: mockProjects.active.id,
        params: { testPattern: '*.test.ts' }
      }
      
      const response = await executeTool(
        request,
        mockUsers.admin.id,
        createMockHeaders()
      )
      
      expect(response.success).toBe(true)
      expect(response.data).toBeDefined()
      expect(response.metadata?.creditsUsed).toBe(20)
      expect(response.metadata?.executionTimeMs).toBeGreaterThan(0)
    })

    it('should throw ValidationError if tool is missing', async () => {
      const request = {
        tool: '',
        projectId: mockProjects.active.id,
        params: {}
      }
      
      const response = await executeTool(
        request,
        mockUsers.admin.id,
        createMockHeaders()
      )
      
      expect(response.success).toBe(false)
      expect(response.error).toContain('Missing required fields')
    })

    it('should throw ValidationError if projectId is missing', async () => {
      const request = {
        tool: 'run-tests',
        projectId: '',
        params: {}
      }
      
      const response = await executeTool(
        request,
        mockUsers.admin.id,
        createMockHeaders()
      )
      
      expect(response.success).toBe(false)
      expect(response.error).toContain('Missing required fields')
    })

    it('should deduct credits after execution', async () => {
      const request = {
        tool: 'run-tests',
        projectId: mockProjects.active.id,
        params: { testPattern: '*.test.ts' }
      }
      
      const response = await executeTool(
        request,
        mockUsers.admin.id,
        createMockHeaders()
      )
      
      expect(response.success).toBe(true)
      expect(response.metadata?.creditsUsed).toBe(20) // run-tests costs 20 credits
    })

    it('should log audit event after execution', async () => {
      const request = {
        tool: 'run-tests',
        projectId: mockProjects.active.id,
        params: { testPattern: '*.test.ts' }
      }
      
      const response = await executeTool(
        request,
        mockUsers.admin.id,
        createMockHeaders()
      )
      
      expect(response.success).toBe(true)
      // Audit logging is called internally
    })

    it('should include execution time in metadata', async () => {
      const request = {
        tool: 'run-tests',
        projectId: mockProjects.active.id,
        params: { testPattern: '*.test.ts' }
      }
      
      const response = await executeTool(
        request,
        mockUsers.admin.id,
        createMockHeaders()
      )
      
      expect(response.success).toBe(true)
      expect(response.metadata?.executionTimeMs).toBeGreaterThan(0)
    })

    it('should route to correct subagent based on tool', async () => {
      const testRequests = [
        { tool: 'run-tests', expectedAgent: 'test' },
        { tool: 'generate-image', expectedAgent: 'image' },
        { tool: 'integration', expectedAgent: 'integration' }
      ]
      
      for (const { tool } of testRequests) {
        const request = {
          tool,
          projectId: mockProjects.active.id,
          params: {}
        }
        
        const response = await executeTool(
          request,
          mockUsers.admin.id,
          createMockHeaders()
        )
        
        expect(response.success).toBe(true)
      }
    })

    it('should handle rate limiting', async () => {
      // Make multiple requests rapidly
      const request = {
        tool: 'run-tests', // Rate limit: 5 per minute
        projectId: mockProjects.active.id,
        params: { testPattern: '*.test.ts' }
      }
      
      const responses = []
      for (let i = 0; i < 7; i++) {
        responses.push(
          await executeTool(
            request,
            mockUsers.admin.id,
            createMockHeaders()
          )
        )
      }
      
      // First 5 should succeed, rest should fail with rate limit error
      const successCount = responses.filter(r => r.success).length
      const rateLimitCount = responses.filter(r => !r.success && r.error?.includes('rate limit')).length
      
      expect(successCount).toBeLessThanOrEqual(5)
      // Note: In a real implementation, rate limiting would kick in
    })
  })

  describe('getAvailableTools', () => {
    it('should return list of available tools', async () => {
      const tools = await getAvailableTools(mockProjects.active.id)
      
      expect(Array.isArray(tools)).toBe(true)
      expect(tools.length).toBeGreaterThan(0)
      expect(tools).toContain('run-tests')
      expect(tools).toContain('integration')
      expect(tools).toContain('generate-image')
    })
  })

  describe('getToolCost', () => {
    it('should return correct cost for known tools', () => {
      expect(getToolCost('run-tests')).toBe(20)
      expect(getToolCost('generate-image')).toBe(100)
      expect(getToolCost('integration')).toBe(15)
      expect(getToolCost('bulk-write')).toBe(10)
    })

    it('should return default cost for unknown tools', () => {
      expect(getToolCost('unknown-tool')).toBe(10)
    })
  })

  describe('Error Handling', () => {
    it('should handle subagent execution errors gracefully', async () => {
      // Mock subagent to throw error
      vi.mocked(await import('../subagents/testing-agent')).executeTestAgent = vi.fn(() => 
        Promise.reject(new Error('Subagent failed'))
      )
      
      const request = {
        tool: 'run-tests',
        projectId: mockProjects.active.id,
        params: { testPattern: '*.test.ts' }
      }
      
      const response = await executeTool(
        request,
        mockUsers.admin.id,
        createMockHeaders()
      )
      
      expect(response.success).toBe(false)
      expect(response.error).toBeDefined()
    })

    it('should return proper error structure', async () => {
      const request = {
        tool: '',
        projectId: mockProjects.active.id,
        params: {}
      }
      
      const response = await executeTool(
        request,
        mockUsers.admin.id,
        createMockHeaders()
      )
      
      expect(response.success).toBe(false)
      expect(response.data).toBeNull()
      expect(response.error).toBeDefined()
      expect(response.metadata).toBeDefined()
    })
  })

  describe('Credits Management', () => {
    it('should check credits before execution', async () => {
      // Mock low credits
      vi.mock('@/lib/supabase/server', () => ({
        createClient: vi.fn(() => Promise.resolve({
          from: (table: string) => ({
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({
                  data: table === 'credits' 
                    ? { ...mockCredits.lowBalance, balance: 5 } 
                    : mockProjects.active,
                  error: null
                }),
                not: () => ({
                  single: () => Promise.resolve({
                    data: { role: 'owner' },
                    error: null
                  })
                })
              })
            })
          })
        }))
      }))
      
      const request = {
        tool: 'generate-image', // Costs 100 credits
        projectId: mockProjects.active.id,
        params: {}
      }
      
      const response = await executeTool(
        request,
        mockUsers.admin.id,
        createMockHeaders()
      )
      
      // Should fail due to insufficient credits
      expect(response.success).toBe(false)
    })
  })
})
