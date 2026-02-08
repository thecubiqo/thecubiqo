/**
 * Code Execution Hook
 * React hook for executing code and managing file operations
 */

import { useState, useCallback } from 'react'
import {
  executeCode,
  readFile,
  writeFile,
  deleteFile,
  listFiles,
  createDirectory,
  executeTerminalCommand,
  type CodeExecutionResult,
  type FileOperationResult,
  type TerminalResult
} from '@/lib/code-execution'

interface CodeExecutionState {
  isExecuting: boolean
  result: CodeExecutionResult | null
  error: string | null
}

interface FileOperationState {
  isLoading: boolean
  result: FileOperationResult | null
  error: string | null
}

interface TerminalState {
  isExecuting: boolean
  result: TerminalResult | null
  error: string | null
}

export function useCodeExecution(sessionId?: string) {
  const [codeState, setCodeState] = useState<CodeExecutionState>({
    isExecuting: false,
    result: null,
    error: null
  })

  const [fileState, setFileState] = useState<FileOperationState>({
    isLoading: false,
    result: null,
    error: null
  })

  const [terminalState, setTerminalState] = useState<TerminalState>({
    isExecuting: false,
    result: null,
    error: null
  })

  // Execute code
  const execute = useCallback(
    async (
      language: 'python' | 'javascript' | 'typescript' | 'bash',
      code: string,
      options?: { timeout?: number; env?: Record<string, string> }
    ) => {
      setCodeState({ isExecuting: true, result: null, error: null })

      try {
        const result = await executeCode(language, code, {
          sessionId,
          ...options
        })

        setCodeState({
          isExecuting: false,
          result,
          error: result.success ? null : result.error || 'Execution failed'
        })

        return result
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        setCodeState({
          isExecuting: false,
          result: null,
          error: errorMessage
        })
        throw error
      }
    },
    [sessionId]
  )

  // Read file
  const read = useCallback(
    async (path: string) => {
      setFileState({ isLoading: true, result: null, error: null })

      try {
        const result = await readFile(path, sessionId)

        setFileState({
          isLoading: false,
          result,
          error: result.success ? null : result.error || 'Read failed'
        })

        return result
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        setFileState({
          isLoading: false,
          result: null,
          error: errorMessage
        })
        throw error
      }
    },
    [sessionId]
  )

  // Write file
  const write = useCallback(
    async (path: string, content: string) => {
      setFileState({ isLoading: true, result: null, error: null })

      try {
        const result = await writeFile(path, content, sessionId)

        setFileState({
          isLoading: false,
          result,
          error: result.success ? null : result.error || 'Write failed'
        })

        return result
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        setFileState({
          isLoading: false,
          result: null,
          error: errorMessage
        })
        throw error
      }
    },
    [sessionId]
  )

  // Delete file
  const deleteF = useCallback(
    async (path: string) => {
      setFileState({ isLoading: true, result: null, error: null })

      try {
        const result = await deleteFile(path, sessionId)

        setFileState({
          isLoading: false,
          result,
          error: result.success ? null : result.error || 'Delete failed'
        })

        return result
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        setFileState({
          isLoading: false,
          result: null,
          error: errorMessage
        })
        throw error
      }
    },
    [sessionId]
  )

  // List files
  const list = useCallback(
    async (path: string = '.') => {
      setFileState({ isLoading: true, result: null, error: null })

      try {
        const result = await listFiles(path, sessionId)

        setFileState({
          isLoading: false,
          result,
          error: result.success ? null : result.error || 'List failed'
        })

        return result
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        setFileState({
          isLoading: false,
          result: null,
          error: errorMessage
        })
        throw error
      }
    },
    [sessionId]
  )

  // Create directory
  const mkdir = useCallback(
    async (path: string) => {
      setFileState({ isLoading: true, result: null, error: null })

      try {
        const result = await createDirectory(path, sessionId)

        setFileState({
          isLoading: false,
          result,
          error: result.success ? null : result.error || 'Mkdir failed'
        })

        return result
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        setFileState({
          isLoading: false,
          result: null,
          error: errorMessage
        })
        throw error
      }
    },
    [sessionId]
  )

  // Execute terminal command
  const terminal = useCallback(
    async (
      command: string,
      options?: { timeout?: number; background?: boolean; env?: Record<string, string> }
    ) => {
      setTerminalState({ isExecuting: true, result: null, error: null })

      try {
        const result = await executeTerminalCommand(command, {
          sessionId,
          ...options
        })

        setTerminalState({
          isExecuting: false,
          result,
          error: result.success ? null : result.stderr || 'Command failed'
        })

        return result
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        setTerminalState({
          isExecuting: false,
          result: null,
          error: errorMessage
        })
        throw error
      }
    },
    [sessionId]
  )

  return {
    // Code execution
    execute,
    isExecuting: codeState.isExecuting,
    executionResult: codeState.result,
    executionError: codeState.error,

    // File operations
    read,
    write,
    delete: deleteF,
    list,
    mkdir,
    isFileLoading: fileState.isLoading,
    fileResult: fileState.result,
    fileError: fileState.error,

    // Terminal
    terminal,
    isTerminalExecuting: terminalState.isExecuting,
    terminalResult: terminalState.result,
    terminalError: terminalState.error
  }
}
