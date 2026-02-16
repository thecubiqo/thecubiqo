/**
 * HealthIndicator Component Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { HealthIndicator } from '@/components/common/HealthIndicator'

// Mock fetch
global.fetch = vi.fn()

describe('HealthIndicator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('shows loading state initially', () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: 3600,
        responseTime: '15ms',
        checks: {
          server: 'ok',
          supabase: 'ok',
          ai_apis: 'ok'
        }
      })
    })

    render(<HealthIndicator />)
    expect(screen.getByText('Checking...')).toBeDefined()
  })

  it('shows healthy status when all systems operational', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: 3600,
        responseTime: '15ms',
        checks: {
          server: 'ok',
          supabase: 'ok',
          ai_apis: 'ok'
        }
      })
    })

    render(<HealthIndicator />)

    await waitFor(() => {
      expect(screen.getByText('All Systems Operational')).toBeDefined()
    })
  })

  it('shows degraded status when systems are slow', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 'degraded',
        timestamp: new Date().toISOString(),
        uptime: 3600,
        responseTime: '500ms',
        checks: {
          server: 'ok',
          supabase: 'degraded',
          ai_apis: 'ok'
        }
      })
    })

    render(<HealthIndicator />)

    await waitFor(() => {
      expect(screen.getByText('Degraded Performance')).toBeDefined()
    })
  })

  it('shows error state when fetch fails', async () => {
    ;(global.fetch as any).mockRejectedValueOnce(new Error('Network error'))

    render(<HealthIndicator />)

    await waitFor(() => {
      expect(screen.getByText('Health check failed')).toBeDefined()
    })
  })

  it('refetches health on button click', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: 3600,
        responseTime: '15ms',
        checks: {
          server: 'ok',
          supabase: 'ok',
          ai_apis: 'ok'
        }
      })
    })

    render(<HealthIndicator />)

    await waitFor(() => {
      expect(screen.getByText('All Systems Operational')).toBeDefined()
    })

    // Clear previous calls
    ;(global.fetch as any).mockClear()
    
    // Mock second fetch
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: 3700,
        responseTime: '12ms',
        checks: {
          server: 'ok',
          supabase: 'ok',
          ai_apis: 'ok'
        }
      })
    })

    const button = screen.getByText('All Systems Operational').closest('button')
    fireEvent.click(button!)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/health', { cache: 'no-store' })
    })
  })

  it('displays correct response time format', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: 3600,
        responseTime: '25ms',
        checks: {
          server: 'ok',
          supabase: 'ok',
          ai_apis: 'ok'
        }
      })
    })

    render(<HealthIndicator />)

    await waitFor(() => {
      const button = screen.getByText('All Systems Operational').closest('button')
      // Hover to show tooltip
      fireEvent.mouseEnter(button!)
    })

    // The tooltip should show response time
    await waitFor(() => {
      expect(screen.getByText('25ms')).toBeDefined()
    })
  })
})
