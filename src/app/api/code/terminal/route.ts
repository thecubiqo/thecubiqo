/**
 * Terminal Emulation API
 * Execute shell commands with output streaming
 * 
 * Security Features:
 * - Auth guard (Supabase session required)
 * - Command sanitization (blocked patterns, allowed commands)
 * - Workspace isolation (keyed by user ID)
 * - Rate limiting (20 req/min per user)
 * - Timeout protection
 * - Background process management
 */

import { NextRequest, NextResponse } from 'next/server'
import { spawn, ChildProcess } from 'child_process'
import { join } from 'path'
import { createClient } from '@/lib/supabase/server'

interface TerminalRequest {
  command: string
  sessionId?: string
  timeout?: number // in seconds
  background?: boolean
}

interface TerminalResponse {
  stdout: string
  stderr: string
  exitCode: number | null
  pid?: number
  background?: boolean
  executionTime?: number
}

// Workspace base directory
const WORKSPACE_BASE = process.env.CODE_WORKSPACE_BASE || '/tmp/cubiqo-workspaces'

// Store background processes
const backgroundProcesses = new Map<string, { process: ChildProcess; startTime: number }>()

// Simple in-memory rate limiter (20 req/min per user)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_MAX = 20
const RATE_LIMIT_WINDOW_MS = 60_000

function checkRateLimit(userId: string): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const entry = rateLimitMap.get(userId)

  if (!entry || now >= entry.resetAt) {
    const resetAt = now + RATE_LIMIT_WINDOW_MS
    rateLimitMap.set(userId, { count: 1, resetAt })
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1, resetAt }
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count++
  return { allowed: true, remaining: RATE_LIMIT_MAX - entry.count, resetAt: entry.resetAt }
}

// Blocked command patterns (security)
const BLOCKED_PATTERNS = [
  /\brm\s+(-rf?|--recursive)\s+\//i,  // rm -rf /
  /\b(sudo|su)\b/i,                    // privilege escalation
  /\bcurl\b.*\|\s*(ba)?sh/i,           // pipe to shell
  /\bwget\b.*\|\s*(ba)?sh/i,           // pipe to shell
  /\b(mkfs|fdisk|dd)\b/i,             // disk operations
  /\b(shutdown|reboot|halt|poweroff)\b/i, // system control
  /\bchmod\s+[0-7]*777\b/i,           // dangerous permissions
  />\s*\/etc\//,                        // write to /etc
  />\s*\/proc\//,                       // write to /proc
  /\beval\b/,                           // eval injection
  /\$\(.*\)/,                           // command substitution
  /`[^`]+`/,                            // backtick command substitution
]

// Allowed command prefixes
const ALLOWED_COMMANDS = [
  'ls', 'cat', 'echo', 'pwd', 'whoami', 'date', 'head', 'tail',
  'grep', 'find', 'wc', 'sort', 'uniq', 'diff', 'tree',
  'node', 'npm', 'npx', 'tsx', 'tsc',
  'python', 'python3', 'pip',
  'git', 'cd', 'mkdir', 'touch', 'cp', 'mv',
]

function sanitizeCommand(command: string): { safe: boolean; reason?: string } {
  const trimmed = command.trim()

  if (!trimmed) {
    return { safe: false, reason: 'Empty command' }
  }

  // Reject command chains (;, &&, ||, |)
  if (/[;|&]/.test(trimmed)) {
    return { safe: false, reason: 'Command chaining operators are not allowed' }
  }

  // Check blocked patterns
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { safe: false, reason: 'Command contains blocked pattern' }
    }
  }

  // Check command starts with allowed prefix
  const baseCommand = trimmed.split(/\s+/)[0].replace(/^\.\//, '')
  if (!ALLOWED_COMMANDS.includes(baseCommand)) {
    return { safe: false, reason: `Command '${baseCommand}' is not in the allowed list` }
  }

  return { safe: true }
}

// Authenticate request and return user
async function authenticateRequest() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user
}

// Get user workspace (keyed by user ID for isolation)
function getUserWorkspace(userId: string): string {
  return join(WORKSPACE_BASE, userId)
}

// Execute command
async function executeCommand(
  command: string,
  workspaceDir: string,
  timeout: number,
  background: boolean
): Promise<TerminalResponse> {
  const startTime = Date.now()

  return new Promise((resolve) => {
    const child = spawn(command, [], {
      cwd: workspaceDir,
      shell: '/bin/bash',
      env: {
        ...process.env,
        PATH: '/usr/local/bin:/usr/bin:/bin',
        HOME: workspaceDir,
        TERM: 'xterm-256color',
      }
    }) as any

    let stdout = ''
    let stderr = ''
    let killed = false

    // Set timeout
    const timeoutId = setTimeout(() => {
      if (!child.killed) {
        child.kill('SIGTERM')
        killed = true
        stderr += '\n[Process killed: timeout exceeded]'
      }
    }, timeout * 1000)

    // If background, return immediately with PID
    if (background) {
      const pid = child.pid || 0
      backgroundProcesses.set(`${pid}`, { process: child, startTime })

      resolve({
        stdout: '',
        stderr: '',
        exitCode: null,
        pid,
        background: true
      })

      child.on('exit', () => {
        clearTimeout(timeoutId)
        backgroundProcesses.delete(`${pid}`)
      })

      return
    }

    // Capture output
    child.stdout?.on('data', (data: any) => {
      stdout += data.toString()
    })

    child.stderr?.on('data', (data: any) => {
      stderr += data.toString()
    })

    child.on('error', (error: any) => {
      stderr += error.message
    })

    child.on('exit', (code: any) => {
      clearTimeout(timeoutId)

      const executionTime = Date.now() - startTime

      resolve({
        stdout,
        stderr: killed ? stderr : stderr,
        exitCode: killed ? 124 : code, // 124 is standard timeout exit code
        executionTime
      })
    })
  })
}

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const user = await authenticateRequest()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limit check
    const rateLimit = checkRateLimit(user.id)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)),
            'X-RateLimit-Remaining': '0',
          }
        }
      )
    }

    const body: TerminalRequest = await request.json()
    const {
      command,
      timeout = 30,
      background = false,
    } = body

    if (!command) {
      return NextResponse.json(
        { error: 'Missing required field: command' },
        { status: 400 }
      )
    }

    // Sanitize command
    const sanitized = sanitizeCommand(command)
    if (!sanitized.safe) {
      return NextResponse.json(
        { error: `Command rejected: ${sanitized.reason}` },
        { status: 403 }
      )
    }

    const workspaceDir = getUserWorkspace(user.id)

    const result = await executeCommand(
      command,
      workspaceDir,
      Math.min(timeout, 60), // Cap timeout at 60s
      background
    )

    return NextResponse.json(result, {
      headers: {
        'X-RateLimit-Remaining': String(rateLimit.remaining),
      }
    })

  } catch (error) {
    console.error('Terminal execution error:', error)

    return NextResponse.json(
      {
        stdout: '',
        stderr: error instanceof Error ? error.message : 'Internal server error',
        exitCode: 1
      } as TerminalResponse,
      { status: 500 }
    )
  }
}

// GET endpoint to check background process status
export async function GET(request: NextRequest) {
  // Auth check
  const user = await authenticateRequest()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const pid = searchParams.get('pid')

  if (!pid) {
    // Return all background processes
    const processes = Array.from(backgroundProcesses.entries()).map(([pid, info]) => ({
      pid: parseInt(pid),
      running: !info.process.killed,
      uptime: Date.now() - info.startTime
    }))

    return NextResponse.json({ processes })
  }

  // Check specific process
  const processInfo = backgroundProcesses.get(pid)

  if (!processInfo) {
    return NextResponse.json(
      { error: 'Process not found' },
      { status: 404 }
    )
  }

  return NextResponse.json({
    pid: parseInt(pid),
    running: !processInfo.process.killed,
    uptime: Date.now() - processInfo.startTime
  })
}

// DELETE endpoint to kill background process
export async function DELETE(request: NextRequest) {
  // Auth check
  const user = await authenticateRequest()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const pid = searchParams.get('pid')

  if (!pid) {
    return NextResponse.json(
      { error: 'Missing required parameter: pid' },
      { status: 400 }
    )
  }

  const processInfo = backgroundProcesses.get(pid)

  if (!processInfo) {
    return NextResponse.json(
      { error: 'Process not found' },
      { status: 404 }
    )
  }

  try {
    processInfo.process.kill('SIGTERM')
    backgroundProcesses.delete(pid)

    return NextResponse.json({
      success: true,
      pid: parseInt(pid),
      message: 'Process terminated'
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to kill process'
      },
      { status: 500 }
    )
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  })
}
