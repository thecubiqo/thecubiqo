/**
 * Tests for Audit Logger
 * 
 * Tests audit logging, secret access logging, and log querying
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  logAudit,
  logSecretAccess,
  queryAuditLogs,
  getUserActivity,
  getOrgActivity,
  getSecretAccessHistory,
  getIpAddress,
  getUserAgent
} from '../security/audit-logger'
import { mockUsers, mockOrganizations, mockProjects, mockSecrets, mockAuditLogs } from '../../../../tests/utils/mock-data'
import { createMockHeaders } from '../../../../tests/utils/test-helpers'

// Mock Supabase
const mockInsert = vi.fn(() => ({
  select: vi.fn(() => ({
    single: vi.fn(() => Promise.resolve({
      data: { id: 'audit_log_123' },
      error: null
    }))
  }))
}))

const mockSelect = vi.fn(() => ({
  eq: vi.fn(function(this: any) {
    this.filters = this.filters || []
    return this
  }),
  order: vi.fn(function(this: any) { return this }),
  limit: vi.fn(function(this: any) { return this }),
  gte: vi.fn(function(this: any) { return this }),
  lte: vi.fn(function(this: any) { return this }),
  range: vi.fn(function(this: any) { return this }),
  then: vi.fn((resolve: any) => resolve({ data: mockAuditLogs, error: null, count: mockAuditLogs.length }))
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve({
    from: (table: string) => ({
      insert: mockInsert,
      select: mockSelect
    })
  }))
}))

describe('Audit Logger', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('logAudit', () => {
    it('should log audit event successfully', async () => {
      const logId = await logAudit({
        userId: mockUsers.admin.id,
        orgId: mockOrganizations.main.id,
        action: 'create',
        resourceType: 'project',
        resourceId: mockProjects.active.id,
        metadata: { name: 'Test Project' },
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0'
      })
      
      expect(logId).toBeDefined()
      expect(mockInsert).toHaveBeenCalled()
    })

    it('should handle missing optional fields', async () => {
      const logId = await logAudit({
        userId: mockUsers.admin.id,
        orgId: mockOrganizations.main.id,
        action: 'read',
        resourceType: 'project',
        resourceId: mockProjects.active.id
      })
      
      expect(logId).toBeDefined()
    })

    it('should return null on error', async () => {
      mockInsert.mockImplementationOnce(() => ({
        select: () => ({
          single: () => Promise.resolve({ data: null, error: { message: 'Error' } })
        })
      }))
      
      const logId = await logAudit({
        userId: mockUsers.admin.id,
        orgId: mockOrganizations.main.id,
        action: 'create',
        resourceType: 'project',
        resourceId: mockProjects.active.id
      })
      
      expect(logId).toBeNull()
    })
  })

  describe('logSecretAccess', () => {
    it('should log secret access successfully', async () => {
      const logId = await logSecretAccess({
        secretId: mockSecrets.apiKey.id,
        userId: mockUsers.admin.id,
        action: 'read',
        ipAddress: '127.0.0.1'
      })
      
      expect(logId).toBeDefined()
      expect(mockInsert).toHaveBeenCalled()
    })

    it('should log different access types', async () => {
      const actions: Array<'read' | 'write' | 'rotate' | 'delete'> = ['read', 'write', 'rotate', 'delete']
      
      for (const action of actions) {
        const logId = await logSecretAccess({
          secretId: mockSecrets.apiKey.id,
          userId: mockUsers.admin.id,
          action,
          ipAddress: '127.0.0.1'
        })
        
        expect(logId).toBeDefined()
      }
    })
  })

  describe('queryAuditLogs', () => {
    it('should query audit logs with filters', async () => {
      const result = await queryAuditLogs({
        orgId: mockOrganizations.main.id,
        limit: 10
      })
      
      expect(result.logs).toBeDefined()
      expect(Array.isArray(result.logs)).toBe(true)
      expect(result.total).toBeGreaterThanOrEqual(0)
    })

    it('should filter by user ID', async () => {
      const result = await queryAuditLogs({
        userId: mockUsers.admin.id,
        limit: 10
      })
      
      expect(result.logs).toBeDefined()
    })

    it('should filter by resource type', async () => {
      const result = await queryAuditLogs({
        resourceType: 'project',
        limit: 10
      })
      
      expect(result.logs).toBeDefined()
    })

    it('should filter by date range', async () => {
      const result = await queryAuditLogs({
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        limit: 10
      })
      
      expect(result.logs).toBeDefined()
    })

    it('should support pagination', async () => {
      const page1 = await queryAuditLogs({
        orgId: mockOrganizations.main.id,
        limit: 5,
        offset: 0
      })
      
      const page2 = await queryAuditLogs({
        orgId: mockOrganizations.main.id,
        limit: 5,
        offset: 5
      })
      
      expect(page1.offset).toBe(0)
      expect(page2.offset).toBe(5)
    })
  })

  describe('getUserActivity', () => {
    it('should get user activity', async () => {
      const result = await getUserActivity(mockUsers.admin.id, 20)
      
      expect(result.logs).toBeDefined()
      expect(result.limit).toBe(20)
    })
  })

  describe('getOrgActivity', () => {
    it('should get organization activity', async () => {
      const result = await getOrgActivity(mockOrganizations.main.id, 50)
      
      expect(result.logs).toBeDefined()
      expect(result.limit).toBe(50)
    })
  })

  describe('getSecretAccessHistory', () => {
    it('should get secret access history', async () => {
      const history = await getSecretAccessHistory(mockSecrets.apiKey.id, 100)
      
      expect(Array.isArray(history)).toBe(true)
    })
  })

  describe('getIpAddress', () => {
    it('should extract IP from x-forwarded-for', () => {
      const headers = createMockHeaders({
        'x-forwarded-for': '1.2.3.4, 5.6.7.8'
      })
      
      expect(getIpAddress(headers)).toBe('1.2.3.4')
    })

    it('should extract IP from x-real-ip', () => {
      const headers = createMockHeaders({
        'x-real-ip': '9.10.11.12'
      })
      
      expect(getIpAddress(headers)).toBe('9.10.11.12')
    })

    it('should return null if no IP found', () => {
      const headers = createMockHeaders()
      headers.delete('x-forwarded-for')
      headers.delete('x-real-ip')
      
      expect(getIpAddress(headers)).toBeNull()
    })
  })

  describe('getUserAgent', () => {
    it('should extract user agent from headers', () => {
      const headers = createMockHeaders({
        'user-agent': 'Mozilla/5.0 (Test Browser)'
      })
      
      expect(getUserAgent(headers)).toBe('Mozilla/5.0 (Test Browser)')
    })

    it('should return null if user agent not found', () => {
      const headers = createMockHeaders()
      headers.delete('user-agent')
      
      expect(getUserAgent(headers)).toBeNull()
    })
  })
})
