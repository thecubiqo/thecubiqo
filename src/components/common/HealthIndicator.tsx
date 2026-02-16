/**
 * Health Indicator Component
 * Displays system health status from /api/health endpoint
 */

'use client'

import { useState, useEffect } from 'react'

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'error'
  timestamp: string
  uptime: number
  responseTime: string
  checks: {
    server: string
    supabase: string
    ai_apis: string
  }
}

export function HealthIndicator() {
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchHealth = async () => {
    try {
      const res = await fetch('/api/health', { cache: 'no-store' })
      if (!res.ok) throw new Error('Health check failed')
      const data = await res.json()
      setHealth(data)
      setError(null)
    } catch (err) {
      setError('Unable to fetch health status')
      console.error('Health check error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHealth()
    // Refresh every 30 seconds
    const interval = setInterval(fetchHealth, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-900/50 border border-gray-800 rounded-lg">
        <div className="w-2 h-2 rounded-full bg-gray-500 animate-pulse" />
        <span className="text-xs text-gray-400">Checking...</span>
      </div>
    )
  }

  if (error || !health) {
    return (
      <button
        onClick={fetchHealth}
        className="flex items-center gap-2 px-3 py-2 bg-gray-900/50 border border-red-800 rounded-lg hover:bg-red-900/20 transition-colors"
      >
        <div className="w-2 h-2 rounded-full bg-red-500" />
        <span className="text-xs text-red-400">Health check failed</span>
        <span className="text-xs text-gray-500">↻</span>
      </button>
    )
  }

  const statusColor = 
    health.status === 'healthy' ? 'bg-green-500' :
    health.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'

  const statusText = 
    health.status === 'healthy' ? 'All Systems Operational' :
    health.status === 'degraded' ? 'Degraded Performance' : 'System Error'

  const statusTextColor = 
    health.status === 'healthy' ? 'text-green-400' :
    health.status === 'degraded' ? 'text-yellow-400' : 'text-red-400'

  return (
    <div className="group relative">
      <button
        onClick={fetchHealth}
        className="flex items-center gap-2 px-3 py-2 bg-gray-900/50 border border-gray-800 rounded-lg hover:bg-gray-800/50 transition-colors"
      >
        <div className={`w-2 h-2 rounded-full ${statusColor} ${health.status === 'healthy' ? 'animate-pulse' : ''}`} />
        <span className={`text-xs ${statusTextColor}`}>{statusText}</span>
        <span className="text-xs text-gray-500">↻</span>
      </button>

      {/* Tooltip with detailed info */}
      <div className="absolute right-0 top-full mt-2 w-64 p-3 bg-gray-900 border border-gray-800 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Response Time:</span>
            <span className="text-white">{health.responseTime}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Uptime:</span>
            <span className="text-white">{Math.floor(health.uptime / 60)}m</span>
          </div>
          
          <div className="border-t border-gray-800 pt-2 mt-2">
            <div className="text-xs font-semibold text-gray-300 mb-1">System Checks:</div>
            
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Server:</span>
              <span className={health.checks.server === 'ok' ? 'text-green-400' : 'text-red-400'}>
                {health.checks.server === 'ok' ? '✓ OK' : '✗ Error'}
              </span>
            </div>
            
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Supabase:</span>
              <span className={
                health.checks.supabase === 'ok' ? 'text-green-400' :
                health.checks.supabase === 'degraded' ? 'text-yellow-400' : 'text-red-400'
              }>
                {health.checks.supabase === 'ok' ? '✓ OK' : 
                 health.checks.supabase === 'degraded' ? '⚠ Slow' : '✗ Error'}
              </span>
            </div>
            
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">AI APIs:</span>
              <span className={
                health.checks.ai_apis === 'ok' ? 'text-green-400' : 'text-gray-500'
              }>
                {health.checks.ai_apis === 'ok' ? '✓ OK' : '○ Not Configured'}
              </span>
            </div>
          </div>

          <div className="text-[10px] text-gray-500 text-center pt-1 border-t border-gray-800">
            Click to refresh
          </div>
        </div>
      </div>
    </div>
  )
}
