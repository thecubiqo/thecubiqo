/**
 * Common Test Utilities
 * 
 * Shared helpers, mocks, and utilities for tests
 */

import { vi } from 'vitest'

/**
 * Mock user for testing
 */
export const mockUser = {
  id: 'user_test_123',
  email: 'test@cubiqo.com',
  name: 'Test User'
}

/**
 * Mock organization for testing
 */
export const mockOrg = {
  id: 'org_test_123',
  name: 'Test Organization',
  slug: 'test-org',
  createdAt: '2024-01-01T00:00:00Z'
}

/**
 * Mock project for testing
 */
export const mockProject = {
  id: 'proj_test_123',
  name: 'Test Project',
  orgId: mockOrg.id,
  stack: 'nextjs',
  createdAt: '2024-01-01T00:00:00Z'
}

/**
 * Mock credits for testing
 */
export const mockCredits = {
  id: 'cred_test_123',
  orgId: mockOrg.id,
  balance: 1000,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z'
}

/**
 * Mock request headers
 */
export function createMockHeaders(overrides?: Record<string, string>): Headers {
  const headers = new Headers({
    'content-type': 'application/json',
    'user-agent': 'Mozilla/5.0 (Test)',
    'x-forwarded-for': '127.0.0.1',
    ...overrides
  })
  return headers
}

/**
 * Mock NextRequest for API route testing
 */
export function createMockRequest(
  method: string = 'GET',
  body?: unknown,
  headers?: Record<string, string>
): Request {
  const url = 'http://localhost:3000/api/test'
  const options: RequestInit = {
    method,
    headers: createMockHeaders(headers)
  }
  
  if (body) {
    options.body = JSON.stringify(body)
  }
  
  return new Request(url, options)
}

/**
 * Wait for async operations
 */
export function waitFor(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Assert error is thrown
 */
export async function assertThrows(
  fn: () => Promise<unknown> | unknown,
  errorMatch?: string | RegExp
): Promise<void> {
  let thrown = false
  try {
    await fn()
  } catch (error) {
    thrown = true
    if (errorMatch) {
      const message = error instanceof Error ? error.message : String(error)
      if (typeof errorMatch === 'string') {
        if (!message.includes(errorMatch)) {
          throw new Error(`Expected error message to include "${errorMatch}", got "${message}"`)
        }
      } else {
        if (!errorMatch.test(message)) {
          throw new Error(`Expected error message to match ${errorMatch}, got "${message}"`)
        }
      }
    }
  }
  
  if (!thrown) {
    throw new Error('Expected function to throw, but it did not')
  }
}

/**
 * Mock console methods to suppress output in tests
 */
export function mockConsole() {
  const originalConsole = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info
  }
  
  console.log = vi.fn()
  console.error = vi.fn()
  console.warn = vi.fn()
  console.info = vi.fn()
  
  return {
    restore: () => {
      console.log = originalConsole.log
      console.error = originalConsole.error
      console.warn = originalConsole.warn
      console.info = originalConsole.info
    }
  }
}

/**
 * Generate random test ID
 */
export function generateTestId(prefix: string = 'test'): string {
  return `${prefix}_${Math.random().toString(36).substring(2, 15)}`
}

/**
 * Create mock Date for consistent testing
 */
export function mockDate(isoString: string = '2024-01-01T00:00:00Z') {
  const mockNow = new Date(isoString).getTime()
  vi.useFakeTimers()
  vi.setSystemTime(mockNow)
  
  return {
    restore: () => {
      vi.useRealTimers()
    }
  }
}

/**
 * Mock environment variables
 */
export function mockEnv(overrides: Record<string, string>) {
  const original = { ...process.env }
  
  Object.assign(process.env, overrides)
  
  return {
    restore: () => {
      process.env = original
    }
  }
}

/**
 * Assert response shape
 */
export function assertResponseShape<T>(
  data: unknown,
  shape: Partial<Record<keyof T, unknown>>
): asserts data is T {
  if (typeof data !== 'object' || data === null) {
    throw new Error('Expected data to be an object')
  }
  
  for (const key in shape) {
    if (!(key in data)) {
      throw new Error(`Expected data to have property "${key}"`)
    }
  }
}

/**
 * Create a mock function with call tracking
 */
export function createMockFn<T extends (...args: any[]) => any>() {
  const calls: Parameters<T>[] = []
  const fn = vi.fn((...args: Parameters<T>) => {
    calls.push(args)
  })
  
  return {
    fn,
    calls,
    reset: () => {
      calls.length = 0
      fn.mockClear()
    }
  }
}
