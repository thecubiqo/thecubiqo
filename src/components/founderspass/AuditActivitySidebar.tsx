/**
 * Audit Activity Sidebar Component
 * Displays recent feature toggle changes from audit log
 */

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface AuditEntry {
  id: string
  flag_name: string
  action: string
  changed_by: string
  changes: any
  created_at: string
}

export function AuditActivitySidebar() {
  const [activities, setActivities] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAuditLog = async () => {
    try {
      const supabase = createClient()
      
      const { data, error: fetchError } = await supabase
        .from('feature_flag_audit')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(25)
      
      if (fetchError) throw fetchError
      
      setActivities(data || [])
      setError(null)
    } catch (err: any) {
      console.error('Failed to fetch audit log:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAuditLog()
    
    // Refresh every 10 seconds
    const interval = setInterval(fetchAuditLog, 10000)
    return () => clearInterval(interval)
  }, [])

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSecs = Math.floor(diffMs / 1000)
    const diffMins = Math.floor(diffSecs / 60)
    const diffHours = Math.floor(diffMins / 60)
    
    if (diffSecs < 60) return `${diffSecs}s ago`
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return date.toLocaleDateString()
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'created': return 'text-green-400'
      case 'toggled': return 'text-blue-400'
      case 'updated': return 'text-yellow-400'
      case 'deleted': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'created': return '✨'
      case 'toggled': return '🔄'
      case 'updated': return '✏️'
      case 'deleted': return '🗑️'
      default: return '📝'
    }
  }

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            📋 Audit Activity
          </h2>
          <p className="text-xs text-gray-400 mt-1">Last 25 changes</p>
        </div>
        
        <button
          onClick={fetchAuditLog}
          className="px-2 py-1 text-xs text-gray-400 hover:text-white transition-colors"
          title="Refresh"
        >
          ↻
        </button>
      </div>

      <div className="max-h-[600px] overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-400 mt-2">Loading activity...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-sm text-red-400 mb-2">Failed to load audit log</p>
            <button
              onClick={fetchAuditLog}
              className="text-xs text-gray-400 hover:text-white"
            >
              Retry
            </button>
          </div>
        ) : activities.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            No activity yet
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="p-3 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-start gap-2">
                  <span className="text-lg">{getActionIcon(activity.action)}</span>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-semibold uppercase ${getActionColor(activity.action)}`}>
                        {activity.action}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatTimestamp(activity.created_at)}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-300 truncate" title={activity.flag_name}>
                      {activity.changes?.feature_label || activity.flag_name}
                    </p>
                    
                    {activity.changes?.enabled !== undefined && (
                      <p className="text-xs text-gray-500 mt-1">
                        {activity.changes.user_toggle ? 'User override: ' : 'Global: '}
                        <span className={activity.changes.enabled ? 'text-green-400' : 'text-gray-500'}>
                          {activity.changes.enabled ? 'ON' : 'OFF'}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
