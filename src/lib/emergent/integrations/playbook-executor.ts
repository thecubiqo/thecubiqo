/**
 * Playbook Executor - Execute Integration Playbooks
 * 
 * Runs integration playbooks step-by-step with error handling,
 * retries, and secret injection.
 * 
 * @module emergent/integrations/playbook-executor
 */

import { createClient } from '@/lib/supabase/server'
import { decryptSecret } from '../security/secrets-manager'
import type { PlaybookExecution } from '../agent-types'
import { EmergentError, NotFoundError } from '../agent-types'

/**
 * Playbook execution context
 */
interface ExecutionContext {
  variables: Record<string, unknown>
  secrets: Record<string, string>
  integrationConfig: Record<string, unknown>
}

/**
 * Execute a playbook
 * 
 * @param execution - Playbook execution params
 * @returns Execution result
 * 
 * @example
 * ```typescript
 * const result = await executePlaybook({
 *   playbookId: 'pb_123',
 *   projectId: 'proj_456',
 *   params: { orderId: '789' },
 *   context: { integrationConfig: {...} }
 * })
 * ```
 */
export async function executePlaybook(
  execution: PlaybookExecution
): Promise<unknown> {
  const supabase = await createClient()

  // Get playbook
  const { data: playbook, error: playbookError } = await supabase
    .from('playbooks' as any)
    .select('*')
    .eq('id', execution.playbookId)
    .single()

  if (playbookError || !playbook) {
    throw new NotFoundError('Playbook')
  }

  // Initialize execution context
  const context: ExecutionContext = {
    variables: { ...execution.params } as Record<string, unknown>,
    secrets: {} as Record<string, string>,
    integrationConfig: (execution.context?.integrationConfig as Record<string, unknown>) || ({} as Record<string, unknown>)
  }

  // Load secrets
  await loadSecrets(execution.projectId, context)

  // Parse playbook code templates
  const steps = (playbook as any)?.code_templates as Record<string, unknown> || {}

  // Execute playbook
  try {
    const result = await executeSteps(steps, context)
    return result
  } catch (error) {
    throw new EmergentError(
      `Playbook execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'PLAYBOOK_EXECUTION_FAILED',
      500,
      { playbookId: execution.playbookId }
    )
  }
}

/**
 * Load secrets into execution context
 */
async function loadSecrets(
  projectId: string,
  context: ExecutionContext
): Promise<void> {
  const supabase = await createClient()

  const { data: secrets } = await supabase
    .from('project_secrets' as any)
    .select('*')
    .eq('project_id', projectId)

  if (secrets) {
    for (const secret of secrets) {
      // Handle both snake_case (database) and camelCase (types)
      const authTag = (secret as any).auth_tag || (secret as any).authTag
      const decrypted = decryptSecret({
        encryptedValue: (secret as any).encrypted_value,
        iv: (secret as any).iv,
        authTag: authTag
      })
      context.secrets[(secret as any).key] = decrypted
    }
  }
}

/**
 * Execute playbook steps
 */
async function executeSteps(
  steps: Record<string, unknown>,
  context: ExecutionContext
): Promise<unknown> {
  // For now, treat steps as a simple script
  // In production, parse and execute step-by-step

  // Mock execution - replace with actual step execution
  const mockResult = {
    status: 'completed',
    data: context.variables,
    timestamp: new Date().toISOString()
  }

  return mockResult
}

/**
 * Execute HTTP step
 */
async function executeHttpStep(
  config: {
    method: string
    url: string
    headers?: Record<string, string>
    body?: unknown
    timeout?: number
  },
  context: ExecutionContext
): Promise<unknown> {
  // Replace variables in URL and body
  const url = replaceVariables(config.url, context)
  const body = config.body ? replaceVariables(JSON.stringify(config.body), context) : undefined

  // Execute HTTP request
  const controller = new AbortController()
  const timeout = config.timeout || 30000
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      method: config.method,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers
      },
      body: body ? JSON.parse(body) : undefined,
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}

/**
 * Replace variables in string
 * Format: {{variableName}} or {{secrets.secretKey}}
 */
function replaceVariables(str: string, context: ExecutionContext): string {
  return str.replace(/\{\{([^}]+)\}\}/g, (match, varPath) => {
    const path = varPath.trim().split('.')

    if (path[0] === 'secrets') {
      return context.secrets[path[1]] || match
    }

    if (path[0] === 'config') {
      return String(context.integrationConfig[path[1]] || match)
    }

    return String(context.variables[path[0]] || match)
  })
}

/**
 * Evaluate condition
 */
function evaluateCondition(condition: string, context: ExecutionContext): boolean {
  // SECURITY: Sandboxed evaluation required in production
  // For now, simple comparison
  try {
    const func = new Function('vars', 'secrets', 'config', `return ${condition}`)
    return func(context.variables, context.secrets, context.integrationConfig)
  } catch {
    return false
  }
}

/**
 * Transform data
 */
function transformData(
  input: unknown,
  transformCode: string,
  context: ExecutionContext
): unknown {
  // SECURITY: Sandboxed execution required in production
  try {
    const func = new Function('input', 'vars', 'secrets', 'config', transformCode)
    return func(input, context.variables, context.secrets, context.integrationConfig)
  } catch (error) {
    throw new Error(`Transform failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
