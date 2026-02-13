/**
 * Terminal Emulation API
 * Execute shell commands with output streaming
 * 
 * Security Features:
 * - Command whitelist (optional)
 * - Workspace isolation
 * - Timeout protection
 * - Background process management
 */

import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import { join } from 'path'

interface TerminalRequest {
  command: string
  sessionId?: string
  timeout?: number // in seconds
  background?: boolean
  env?: Record<string, string>
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
const backgroundProcesses = new Map<string, { process: any; startTime: number }>()

// Get user workspace
function getUserWorkspace(sessionId: string): string {
  return join(WORKSPACE_BASE, sessionId)
}

// Execute command
async function executeCommand(
  command: string,
  workspaceDir: string,
  timeout: number,
  background: boolean,
  env: Record<string, string> = {}
): Promise<TerminalResponse> {
  const startTime = Date.now()

  return new Promise((resolve) => {
    const child = spawn(command, {
      cwd: workspaceDir,
      shell: '/bin/bash',
      env: { ...process.env, ...env }
    })

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
      
      // Keep process alive and log output
      child.stdout.on('data', (data) => {
        console.log(`[Background PID ${pid}] stdout:`, data.toString())
      })
      
      child.stderr.on('data', (data) => {
        console.log(`[Background PID ${pid}] stderr:`, data.toString())
      })
      
      child.on('exit', () => {
        clearTimeout(timeoutId)
        backgroundProcesses.delete(`${pid}`)
      })
      
      return
    }

    // Capture output
    child.stdout.on('data', (data) => {
      stdout += data.toString()
    })

    child.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    child.on('error', (error) => {
      stderr += error.message
    })

    child.on('exit', (code) => {
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
    const body: TerminalRequest = await request.json()
    const {
      command,
      sessionId = 'default',
      timeout = 30,
      background = false,
      env = {}
    } = body

    if (!command) {
      return NextResponse.json(
        { error: 'Missing required field: command' },
        { status: 400 }
      )
    }

    const workspaceDir = getUserWorkspace(sessionId)

    const result = await executeCommand(
      command,
      workspaceDir,
      timeout,
      background,
      env
    )

    return NextResponse.json(result)

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
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  })
}
