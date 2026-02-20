'use client'

/**
 * AutopilotStatus - Shows background agent work happening while user chats
 * 
 * This is the sci-fi feature: CubiQo autonomously performs tasks
 * (like filling profile, researching, organizing) while chatting naturally.
 * The status indicator shows what agents are doing in real-time.
 */

import { useState, useEffect, useCallback } from 'react'

interface AutopilotTask {
  id: string
  type: 'profile_fill' | 'research' | 'summarize' | 'organize'
  description: string
  status: 'queued' | 'running' | 'done' | 'failed'
  result?: string
}

interface AutopilotStatusProps {
  sessionId: string | null
  enabled?: boolean
}

const TASK_LABELS: Record<string, string> = {
  profile_fill: '📝 Updating your profile',
  research: '🔍 Researching',
  summarize: '📋 Summarizing',
  organize: '🗂️ Organizing',
}

const TASK_DONE_LABELS: Record<string, string> = {
  profile_fill: '✅ Profile updated',
  research: '✅ Research complete',
  summarize: '✅ Summary ready',
  organize: '✅ Organized',
}

export function AutopilotStatus({ sessionId, enabled = true }: AutopilotStatusProps) {
  const [tasks, setTasks] = useState<AutopilotTask[]>([])
  const [showCompleted, setShowCompleted] = useState(false)

  const fetchTasks = useCallback(async () => {
    if (!sessionId || !enabled) return

    try {
      const response = await fetch(`/api/autopilot/tasks?sessionId=${sessionId}`)
      if (response.ok) {
        const data = await response.json()
        setTasks(data.tasks || [])
        
        // Show completed tasks briefly
        if (data.completed > 0) {
          setShowCompleted(true)
          setTimeout(() => setShowCompleted(false), 3000)
        }
      }
    } catch {
      // Silent fail - autopilot status is non-critical
    }
  }, [sessionId, enabled])

  // Poll for task updates every 3 seconds when there are active tasks
  useEffect(() => {
    if (!enabled || !sessionId) return

    const interval = setInterval(fetchTasks, 3000)
    return () => clearInterval(interval)
  }, [fetchTasks, enabled, sessionId])

  const activeTasks = tasks.filter(t => t.status === 'running' || t.status === 'queued')
  const completedTasks = tasks.filter(t => t.status === 'done')

  if (!enabled || (activeTasks.length === 0 && (!showCompleted || completedTasks.length === 0))) {
    return null
  }

  return (
    <div className="px-4 py-1.5 border-t border-white/5 bg-white/[0.02]">
      <div className="flex items-center gap-2 text-xs">
        {/* Autopilot indicator */}
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            {activeTasks.length > 0 && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            )}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${
              activeTasks.length > 0 ? 'bg-cyan-400' : 'bg-emerald-400'
            }`} />
          </span>
          <span className="text-white/40 font-medium tracking-wide uppercase" style={{ fontSize: '10px' }}>
            Autopilot
          </span>
        </div>

        {/* Active task labels */}
        <div className="flex items-center gap-2 text-white/50">
          {activeTasks.map(task => (
            <span key={task.id} className="flex items-center gap-1">
              {TASK_LABELS[task.type] || task.description}
              <span className="inline-flex">
                <span className="animate-pulse">...</span>
              </span>
            </span>
          ))}

          {/* Completed task flash */}
          {showCompleted && activeTasks.length === 0 && completedTasks.slice(-1).map(task => (
            <span key={task.id} className="text-emerald-400/70 transition-opacity duration-500">
              {TASK_DONE_LABELS[task.type] || '✅ Done'}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
