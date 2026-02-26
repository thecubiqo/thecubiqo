/**
 * Testing Agent - Test Runner Subagent
 * 
 * Executes test suites, generates coverage reports,
 * and validates code quality.
 * 
 * @module emergent/subagents/testing-agent
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import { join } from 'path'
import { access } from 'fs/promises'

import type { SubAgentRequest, ToolResponse, RunTestsParams } from '../agent-types'
import { ValidationError } from '../agent-types'

const execAsync = promisify(exec)

/**
 * Execute test agent
 * 
 * @param request - Subagent request
 * @returns Tool response with test results
 */
export async function executeTestAgent(
  request: SubAgentRequest
): Promise<ToolResponse> {
  const params = request.params as RunTestsParams
  
  try {
    // Validate params
    if (params.timeout && (params.timeout < 0 || params.timeout > 600000)) {
      throw new ValidationError('Timeout must be between 0 and 600000ms')
    }
    
    const workspaceRoot = process.env.WORKSPACE_ROOT || '/tmp/cubiqo-workspace'
    const projectDir = join(workspaceRoot, request.projectId)

    // Check if project workspace exists — graceful fallback to mock if not
    let workspaceExists = false
    try {
      await access(projectDir)
      workspaceExists = true
    } catch {
      // Workspace not found — return mock results as fallback
    }

    if (!workspaceExists) {
      // Graceful fallback: return mock results when workspace doesn't exist
      const testResults = {
        passed: 0,
        failed: 0,
        skipped: 0,
        total: 0,
        duration: 0,
        output: 'Workspace not found — no tests executed. Deploy code to the workspace first.',
      }

      return {
        success: true,
        data: testResults,
        error: null,
        metadata: {
          testPattern: params.testPattern || '**/*.test.{ts,tsx,js,jsx}',
          coverage: params.coverage || false,
          note: `Workspace not found at ${projectDir}`,
        }
      }
    }

    // Build test command
    const parts = ['npx', 'vitest', 'run', '--reporter=verbose']
    if (params.testPattern) {
      parts.push(params.testPattern)
    }
    if (params.coverage) {
      parts.push('--coverage')
    }
    const testCommand = parts.join(' ')

    const timeout = params.timeout || 60000

    try {
      const { stdout, stderr } = await execAsync(testCommand, {
        cwd: projectDir,
        timeout,
        maxBuffer: 5 * 1024 * 1024, // 5MB
        env: { ...process.env, CI: 'true', NODE_ENV: 'test' },
      })

      // Parse test output for pass/fail counts
      const output = stdout + stderr
      const passMatch = output.match(/(\d+)\s+pass/i)
      const failMatch = output.match(/(\d+)\s+fail/i)
      const skipMatch = output.match(/(\d+)\s+skip/i)
      const durationMatch = output.match(/Duration\s+([\d.]+)/i)

      const passed = passMatch ? parseInt(passMatch[1], 10) : 0
      const failed = failMatch ? parseInt(failMatch[1], 10) : 0
      const skipped = skipMatch ? parseInt(skipMatch[1], 10) : 0
      const duration = durationMatch ? parseFloat(durationMatch[1]) * 1000 : 0

      return {
        success: failed === 0,
        data: {
          passed,
          failed,
          skipped,
          total: passed + failed + skipped,
          duration,
          output: output.slice(-5000), // Last 5000 chars
        },
        error: failed > 0 ? `${failed} test(s) failed` : null,
        metadata: {
          testPattern: params.testPattern || '**/*.test.{ts,tsx,js,jsx}',
          coverage: params.coverage || false,
          command: testCommand,
        }
      }
    } catch (execError: unknown) {
      const err = execError as { stdout?: string; stderr?: string; code?: number; killed?: boolean }

      if (err.killed) {
        return {
          success: false,
          data: { passed: 0, failed: 0, skipped: 0, total: 0, duration: timeout, output: 'Test execution timed out' },
          error: `Test execution timed out after ${timeout}ms`,
          metadata: { testPattern: params.testPattern || '**/*.test.{ts,tsx,js,jsx}' }
        }
      }

      // Tests ran but had failures (non-zero exit code)
      const output = (err.stdout || '') + (err.stderr || '')
      const passMatch = output.match(/(\d+)\s+pass/i)
      const failMatch = output.match(/(\d+)\s+fail/i)
      const skipMatch = output.match(/(\d+)\s+skip/i)

      const passed = passMatch ? parseInt(passMatch[1], 10) : 0
      const failed = failMatch ? parseInt(failMatch[1], 10) : 0
      const skipped = skipMatch ? parseInt(skipMatch[1], 10) : 0

      return {
        success: false,
        data: {
          passed,
          failed,
          skipped,
          total: passed + failed + skipped,
          duration: 0,
          output: output.slice(-5000),
        },
        error: `Tests failed with exit code ${err.code}`,
        metadata: {
          testPattern: params.testPattern || '**/*.test.{ts,tsx,js,jsx}',
          coverage: params.coverage || false,
          command: testCommand,
          exitCode: err.code,
        }
      }
    }
  } catch (error) {
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Test execution failed'
    }
  }
}
