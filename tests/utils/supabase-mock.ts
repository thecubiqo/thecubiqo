/**
 * Mock Supabase Client for Testing
 * 
 * Provides a mock Supabase client that doesn't make real API calls
 */

import { vi } from 'vitest'
import { 
  mockUsers,
  mockOrganizations,
  mockOrgMembers,
  mockProjects,
  mockCredits,
  mockSecrets,
  mockAuditLogs
} from './mock-data'

/**
 * In-memory data store for tests
 */
const mockDataStore = {
  users: [mockUsers.admin, mockUsers.member, mockUsers.viewer],
  organizations: [mockOrganizations.main, mockOrganizations.secondary],
  org_members: [...mockOrgMembers],
  projects: [mockProjects.active, mockProjects.inactive],
  credits: [mockCredits.active, mockCredits.lowBalance],
  project_secrets: [mockSecrets.apiKey, mockSecrets.dbPassword],
  audit_logs: [...mockAuditLogs],
  credit_transactions: [],
  secret_access_logs: []
}

/**
 * Mock query builder
 */
class MockQueryBuilder {
  private table: string
  private filters: Record<string, unknown>[] = []
  private selectFields: string = '*'
  private singleResult: boolean = false
  private orderField?: string
  private orderAsc: boolean = true
  private limitValue?: number
  private rangeStart?: number
  private rangeEnd?: number

  constructor(table: string) {
    this.table = table
  }

  select(fields: string = '*', options?: { count?: string }) {
    this.selectFields = fields
    return this
  }

  eq(field: string, value: unknown) {
    this.filters.push({ field, op: 'eq', value })
    return this
  }

  neq(field: string, value: unknown) {
    this.filters.push({ field, op: 'neq', value })
    return this
  }

  not(field: string, op: string, value: unknown) {
    this.filters.push({ field, op: 'not', value })
    return this
  }

  in(field: string, values: unknown[]) {
    this.filters.push({ field, op: 'in', value: values })
    return this
  }

  gte(field: string, value: unknown) {
    this.filters.push({ field, op: 'gte', value })
    return this
  }

  lte(field: string, value: unknown) {
    this.filters.push({ field, op: 'lte', value })
    return this
  }

  single() {
    this.singleResult = true
    return this
  }

  order(field: string, options?: { ascending?: boolean }) {
    this.orderField = field
    this.orderAsc = options?.ascending ?? true
    return this
  }

  limit(count: number) {
    this.limitValue = count
    return this
  }

  range(start: number, end: number) {
    this.rangeStart = start
    this.rangeEnd = end
    return this
  }

  async execute() {
    // Get data from mock store
    let data = (mockDataStore as any)[this.table] || []
    
    // Apply filters
    for (const filter of this.filters) {
      const { field, op, value } = filter
      
      data = data.filter((item: any) => {
        const itemValue = item[field]
        
        switch (op) {
          case 'eq':
            return itemValue === value
          case 'neq':
            return itemValue !== value
          case 'not':
            return itemValue !== null
          case 'in':
            return (value as unknown[]).includes(itemValue)
          case 'gte':
            return itemValue >= value
          case 'lte':
            return itemValue <= value
          default:
            return true
        }
      })
    }
    
    // Apply ordering
    if (this.orderField) {
      data = data.sort((a: any, b: any) => {
        const aVal = a[this.orderField!]
        const bVal = b[this.orderField!]
        const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
        return this.orderAsc ? comparison : -comparison
      })
    }
    
    // Apply range/limit
    if (this.rangeStart !== undefined && this.rangeEnd !== undefined) {
      data = data.slice(this.rangeStart, this.rangeEnd + 1)
    } else if (this.limitValue !== undefined) {
      data = data.slice(0, this.limitValue)
    }
    
    // Return single or array
    if (this.singleResult) {
      if (data.length === 0) {
        return { data: null, error: { message: 'No rows found' }, count: 0 }
      }
      return { data: data[0], error: null, count: 1 }
    }
    
    return { data, error: null, count: data.length }
  }

  // Alias for execute
  then(onResolve: (result: any) => any) {
    return this.execute().then(onResolve)
  }
}

/**
 * Mock insert builder
 */
class MockInsertBuilder {
  private table: string
  private values: unknown

  constructor(table: string, values: unknown) {
    this.table = table
    this.values = values
  }

  select(fields: string = '*') {
    return this
  }

  single() {
    return this
  }

  async execute() {
    const data = Array.isArray(this.values) ? this.values : [this.values]
    
    // Add to mock store
    (mockDataStore as any)[this.table].push(...data)
    
    return { 
      data: Array.isArray(this.values) ? data : data[0], 
      error: null 
    }
  }

  then(onResolve: (result: any) => any) {
    return this.execute().then(onResolve)
  }
}

/**
 * Mock update builder
 */
class MockUpdateBuilder {
  private table: string
  private values: unknown
  private filters: Record<string, unknown>[] = []

  constructor(table: string, values: unknown) {
    this.table = table
    this.values = values
  }

  eq(field: string, value: unknown) {
    this.filters.push({ field, op: 'eq', value })
    return this
  }

  async execute() {
    const data = (mockDataStore as any)[this.table] || []
    
    // Find and update matching records
    const updated: unknown[] = []
    for (const item of data) {
      let matches = true
      for (const filter of this.filters) {
        if ((item as any)[filter.field] !== filter.value) {
          matches = false
          break
        }
      }
      
      if (matches) {
        Object.assign(item, this.values)
        updated.push(item)
      }
    }
    
    return { data: updated.length > 0 ? updated : null, error: null }
  }

  then(onResolve: (result: any) => any) {
    return this.execute().then(onResolve)
  }
}

/**
 * Mock Supabase client
 */
export function createMockSupabaseClient() {
  return {
    from(table: string) {
      return {
        select: (fields?: string, options?: any) => new MockQueryBuilder(table).select(fields, options),
        insert: (values: unknown) => new MockInsertBuilder(table, values),
        update: (values: unknown) => new MockUpdateBuilder(table, values),
        delete: () => new MockQueryBuilder(table),
        upsert: (values: unknown) => new MockInsertBuilder(table, values)
      }
    },
    rpc: vi.fn((name: string, params: unknown) => {
      // Mock RPC functions
      if (name === 'decrement_balance') {
        return Promise.resolve({ data: null, error: null })
      }
      return Promise.resolve({ data: null, error: null })
    }),
    auth: {
      getUser: vi.fn(() => 
        Promise.resolve({ 
          data: { user: mockUsers.admin }, 
          error: null 
        })
      ),
      signIn: vi.fn(),
      signOut: vi.fn(),
      signUp: vi.fn()
    }
  }
}

/**
 * Mock createClient from @/lib/supabase/server
 */
export function mockSupabaseServer() {
  const mockClient = createMockSupabaseClient()
  vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn(() => Promise.resolve(mockClient))
  }))
  return mockClient
}

/**
 * Reset mock data store to initial state
 */
export function resetMockDataStore() {
  mockDataStore.org_members = [...mockOrgMembers]
  mockDataStore.audit_logs = [...mockAuditLogs]
  mockDataStore.credit_transactions = []
  mockDataStore.secret_access_logs = []
}

/**
 * Add data to mock store
 */
export function addMockData(table: string, data: unknown) {
  if (!(mockDataStore as any)[table]) {
    (mockDataStore as any)[table] = []
  }
  (mockDataStore as any)[table].push(data)
}

/**
 * Get data from mock store
 */
export function getMockData(table: string): unknown[] {
  return (mockDataStore as any)[table] || []
}

/**
 * Clear all data from mock store
 */
export function clearMockDataStore() {
  mockDataStore.users = []
  mockDataStore.organizations = []
  mockDataStore.org_members = []
  mockDataStore.projects = []
  mockDataStore.credits = []
  mockDataStore.project_secrets = []
  mockDataStore.audit_logs = []
  mockDataStore.credit_transactions = []
  mockDataStore.secret_access_logs = []
}
