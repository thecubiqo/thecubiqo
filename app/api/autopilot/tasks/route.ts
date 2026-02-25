/**
 * Autopilot Background Tasks API
 * 
 * Manages background agent tasks that run simultaneously while CubiQo
 * chats with the user. This is the "sci-fi" feature - agents do real work
 * in the background while the AI companion converses naturally.
 * 
 * Supports:
 * - Spawning background tasks from chat context
 * - Getting status of active autopilot tasks
 * - Task types: profile_fill, research, summarize, organize
 */

import { NextRequest, NextResponse } from 'next/server'

/**
 * Active autopilot task tracking (in-memory for now)
 * In production, this would be backed by a database table
 */
export interface AutopilotTask {
  id: string
  type: 'profile_fill' | 'research' | 'summarize' | 'organize'
  description: string
  status: 'queued' | 'running' | 'done' | 'failed'
  result?: string
  sessionId: string
  startedAt: string
  completedAt?: string
}

const activeTasks = new Map<string, AutopilotTask[]>()

/**
 * Add a task for tracking
 */
export function trackTask(sessionId: string, task: AutopilotTask): void {
  const tasks = activeTasks.get(sessionId) || []
  tasks.push(task)
  activeTasks.set(sessionId, tasks)
}

/**
 * Update a task status
 */
export function updateTask(
  sessionId: string,
  taskId: string,
  updates: Partial<AutopilotTask>
): void {
  const tasks = activeTasks.get(sessionId) || []
  const task = tasks.find(t => t.id === taskId)
  if (task) {
    Object.assign(task, updates)
  }
}

/**
 * Get tasks for a session
 */
export function getSessionTasks(sessionId: string): AutopilotTask[] {
  return activeTasks.get(sessionId) || []
}

/**
 * Clean up completed tasks older than 5 minutes
 */
function cleanupOldTasks(): void {
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
  for (const [sessionId, tasks] of activeTasks.entries()) {
    const activeTasks_ = tasks.filter(t => {
      if (t.status === 'done' || t.status === 'failed') {
        const completedTime = t.completedAt ? new Date(t.completedAt).getTime() : 0
        return completedTime > fiveMinutesAgo
      }
      return true
    })
    if (activeTasks_.length === 0) {
      activeTasks.delete(sessionId)
    } else {
      activeTasks.set(sessionId, activeTasks_)
    }
  }
}

// GET - Get active autopilot tasks for a session
export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('sessionId')

  if (!sessionId) {
    return NextResponse.json(
      { error: 'Missing sessionId parameter' },
      { status: 400 }
    )
  }

  // Clean up old tasks periodically
  cleanupOldTasks()

  const tasks = getSessionTasks(sessionId)

  return NextResponse.json({
    tasks,
    active: tasks.filter(t => t.status === 'running' || t.status === 'queued').length,
    completed: tasks.filter(t => t.status === 'done').length,
  })
}

// POST - Spawn a new background autopilot task
export async function POST(request: NextRequest) {
  try {
    const { sessionId, type, description } = await request.json()

    if (!sessionId || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: sessionId, type' },
        { status: 400 }
      )
    }

    const validTypes = ['profile_fill', 'research', 'summarize', 'organize']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid task type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    const taskId = `autopilot-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    const task: AutopilotTask = {
      id: taskId,
      type,
      description: description || `Autopilot ${type} task`,
      status: 'queued',
      sessionId,
      startedAt: new Date().toISOString(),
    }

    trackTask(sessionId, task)

    return NextResponse.json({
      taskId,
      status: 'queued',
      message: `Background ${type} task spawned successfully`
    })

  } catch (error) {
    console.error('[Autopilot Tasks] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
