/**
 * Code Execution Library
 * High-level API for code execution, file operations, and terminal commands
 */

export interface CodeExecutionResult {
  success: boolean
  stdout: string
  stderr: string
  exitCode: number
  executionTime?: number
  error?: string
}

export interface FileOperationResult {
  success: boolean
  data?: any
  error?: string
}

export interface TerminalResult {
  success: boolean
  stdout: string
  stderr: string
  exitCode: number | null
  pid?: number
  background?: boolean
  executionTime?: number
}

/**
 * Execute code in a sandboxed environment
 */
export async function executeCode(
  language: 'python' | 'javascript' | 'typescript' | 'bash',
  code: string,
  options: {
    sessionId?: string
    timeout?: number
    env?: Record<string, string>
  } = {}
): Promise<CodeExecutionResult> {
  try {
    const response = await fetch('/api/code/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language,
        code,
        sessionId: options.sessionId || 'default',
        timeout: options.timeout || 30,
        env: options.env || {}
      })
    })

    const result = await response.json()

    return {
      success: result.exitCode === 0,
      stdout: result.stdout || '',
      stderr: result.stderr || '',
      exitCode: result.exitCode,
      executionTime: result.executionTime,
      error: result.error
    }
  } catch (error) {
    return {
      success: false,
      stdout: '',
      stderr: error instanceof Error ? error.message : 'Failed to execute code',
      exitCode: 1,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Read a file from the workspace
 */
export async function readFile(
  path: string,
  sessionId: string = 'default'
): Promise<FileOperationResult> {
  try {
    const response = await fetch('/api/code/file-ops', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operation: 'read',
        path,
        sessionId
      })
    })

    return await response.json()
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to read file'
    }
  }
}

/**
 * Write a file to the workspace
 */
export async function writeFile(
  path: string,
  content: string,
  sessionId: string = 'default'
): Promise<FileOperationResult> {
  try {
    const response = await fetch('/api/code/file-ops', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operation: 'write',
        path,
        content,
        sessionId
      })
    })

    return await response.json()
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to write file'
    }
  }
}

/**
 * Delete a file from the workspace
 */
export async function deleteFile(
  path: string,
  sessionId: string = 'default'
): Promise<FileOperationResult> {
  try {
    const response = await fetch('/api/code/file-ops', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operation: 'delete',
        path,
        sessionId
      })
    })

    return await response.json()
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete file'
    }
  }
}

/**
 * List files in a directory
 */
export async function listFiles(
  path: string = '.',
  sessionId: string = 'default'
): Promise<FileOperationResult> {
  try {
    const response = await fetch(
      `/api/code/file-ops?sessionId=${sessionId}&path=${encodeURIComponent(path)}`,
      { method: 'GET' }
    )

    return await response.json()
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list files'
    }
  }
}

/**
 * Create a directory
 */
export async function createDirectory(
  path: string,
  sessionId: string = 'default'
): Promise<FileOperationResult> {
  try {
    const response = await fetch('/api/code/file-ops', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operation: 'create-dir',
        path,
        sessionId
      })
    })

    return await response.json()
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create directory'
    }
  }
}

/**
 * Execute a terminal command
 */
export async function executeTerminalCommand(
  command: string,
  options: {
    sessionId?: string
    timeout?: number
    background?: boolean
    env?: Record<string, string>
  } = {}
): Promise<TerminalResult> {
  try {
    const response = await fetch('/api/code/terminal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        command,
        sessionId: options.sessionId || 'default',
        timeout: options.timeout || 30,
        background: options.background || false,
        env: options.env || {}
      })
    })

    const result = await response.json()

    return {
      success: result.exitCode === 0 || result.background === true,
      stdout: result.stdout || '',
      stderr: result.stderr || '',
      exitCode: result.exitCode,
      pid: result.pid,
      background: result.background,
      executionTime: result.executionTime
    }
  } catch (error) {
    return {
      success: false,
      stdout: '',
      stderr: error instanceof Error ? error.message : 'Failed to execute command',
      exitCode: 1
    }
  }
}

/**
 * Check status of a background process
 */
export async function getProcessStatus(pid: number): Promise<{
  running: boolean
  uptime?: number
  error?: string
}> {
  try {
    const response = await fetch(`/api/code/terminal?pid=${pid}`)
    
    if (!response.ok) {
      return { running: false, error: 'Process not found' }
    }

    const result = await response.json()
    return {
      running: result.running,
      uptime: result.uptime
    }
  } catch (error) {
    return {
      running: false,
      error: error instanceof Error ? error.message : 'Failed to get process status'
    }
  }
}

/**
 * Kill a background process
 */
export async function killProcess(pid: number): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const response = await fetch(`/api/code/terminal?pid=${pid}`, {
      method: 'DELETE'
    })

    const result = await response.json()
    return {
      success: result.success,
      error: result.error
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to kill process'
    }
  }
}
