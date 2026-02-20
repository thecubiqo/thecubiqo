/**
 * Agent Orchestrator - Main Agent Loop
 * 
 * Coordinates subagents, manages tool execution, enforces rate limits,
 * tracks credits, and logs all actions.
 * 
 * @module emergent/orchestrator
 */

import { createClient } from '@/lib/supabase/server'
import { requireProjectPermission } from './security/rbac'
import { logAudit, getIpAddress, getUserAgent } from './security/audit-logger'
import type {
  ToolRequest,
  ToolResponse,
  SubAgentType,
  SubAgentRequest,
  SubAgentResponse,
  OrchestratorContext,
  Credits
} from './agent-types'
import {
  EmergentError,
  InsufficientCreditsError,
  RateLimitError,
  UnauthorizedError,
  ValidationError
} from './agent-types'

// Import subagents
import { executeTestAgent } from './subagents/testing-agent'
import { executeImageAgent } from './subagents/image-agent'
import { executeIntegrationAgent } from './subagents/integration-agent'

/**
 * Tool cost configuration (in credits)
 */
const TOOL_COSTS: Record<string, number> = {
  'bulk-write': 10,
  'bulk-edit': 5,
  'view-files': 1,
  'run-tests': 20,
  'integration': 15,
  'generate-image': 100,
  'ask-human': 0,
  'database-migration': 50,
  'deploy': 100,
  'monitoring': 5
}

/**
 * Rate limit configuration (requests per minute)
 */
const RATE_LIMITS: Record<string, number> = {
  'bulk-write': 10,
  'bulk-edit': 20,
  'view-files': 100,
  'run-tests': 5,
  'integration': 30,
  'generate-image': 10,
  'ask-human': 20,
  'database-migration': 2,
  'deploy': 5,
  'monitoring': 50
}

/**
 * Rate limiter (simple in-memory implementation)
 * In production, use Redis or similar distributed cache
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

/**
 * Check rate limit for a tool
 * 
 * @param projectId - Project ID
 * @param tool - Tool name
 * @returns True if within limit
 */
function checkRateLimit(projectId: string, tool: string): boolean {
  const key = `${projectId}:${tool}`
  const limit = RATE_LIMITS[tool] || 60
  const now = Date.now()
  
  const entry = rateLimitStore.get(key)
  
  if (!entry || now > entry.resetAt) {
    // Create new window
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + 60000 // 1 minute
    })
    return true
  }
  
  if (entry.count >= limit) {
    return false
  }
  
  entry.count++
  return true
}

/**
 * Get credits for an organization
 */
async function getOrgCredits(orgId: string): Promise<Credits | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('credits')
    .select('*')
    .eq('org_id', orgId)
    .single()
  
  if (error || !data) {
    return null
  }
  
  return {
    id: data.id,
    orgId: data.org_id,
    balance: data.balance,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  }
}

/**
 * Deduct credits from organization balance
 */
async function deductCredits(
  creditId: string,
  amount: number,
  description: string,
  metadata: Record<string, unknown>
): Promise<void> {
  const supabase = await createClient()
  
  // Start transaction (using Postgres function if available, or manual)
  const { error: updateError } = await supabase
    .from('credits')
    .update({ 
      balance: supabase.rpc('decrement_balance', { amount }),
      updated_at: new Date().toISOString()
    })
    .eq('id', creditId)
  
  if (updateError) {
    // Fallback: manual update
    const { data: credit } = await supabase
      .from('credits')
      .select('balance')
      .eq('id', creditId)
      .single()
    
    if (credit) {
      await supabase
        .from('credits')
        .update({ 
          balance: credit.balance - amount,
          updated_at: new Date().toISOString()
        })
        .eq('id', creditId)
    }
  }
  
  // Get org_id from credit record for transaction log
  const { data: credit } = await supabase
    .from('credits')
    .select('org_id, balance')
    .eq('id', creditId)
    .single()
  
  // Log transaction
  if (credit) {
    await supabase
      .from('credit_transactions')
      .insert({
        org_id: credit.org_id,
        amount: -amount,
        balance_after: credit.balance - amount,
        transaction_type: 'usage',
        description,
        metadata
      })
  }
}

/**
 * Build orchestrator context
 */
async function buildContext(
  userId: string,
  projectId: string
): Promise<OrchestratorContext> {
  const supabase = await createClient()
  
  // Get project's org_id
  const { data: project } = await supabase
    .from('projects')
    .select('org_id')
    .eq('id', projectId)
    .single()
  
  if (!project) {
    throw new EmergentError('Project not found', 'PROJECT_NOT_FOUND', 404)
  }
  
  // Get org credits
  const credits = await getOrgCredits(project.org_id)
  
  if (!credits) {
    throw new EmergentError('Credits not found', 'CREDITS_NOT_FOUND', 500)
  }
  
  return {
    projectId,
    orgId: project.org_id,
    userId,
    credits
  }
}

/**
 * Route request to appropriate subagent
 */
async function routeToSubAgent(
  type: SubAgentType,
  request: SubAgentRequest
): Promise<SubAgentResponse> {
  const startTime = Date.now()
  
  try {
    let result: ToolResponse
    
    switch (type) {
      case 'test':
        result = await executeTestAgent(request)
        break
      
      case 'image':
        result = await executeImageAgent(request)
        break
      
      case 'integration':
        result = await executeIntegrationAgent(request)
        break
      
      case 'code':
      case 'human':
      case 'migration':
        // TODO: Implement these subagents
        result = {
          success: false,
          data: null,
          error: `Subagent '${type}' not yet implemented`
        }
        break
      
      default:
        result = {
          success: false,
          data: null,
          error: `Unknown subagent type: ${type}`
        }
    }
    
    const executionTime = Date.now() - startTime
    
    return {
      ...result,
      agentType: type,
      metadata: {
        ...result.metadata,
        executionTimeMs: executionTime
      }
    }
  } catch (error) {
    const executionTime = Date.now() - startTime
    
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
      agentType: type,
      metadata: {
        executionTimeMs: executionTime
      }
    }
  }
}

/**
 * Execute a tool request
 * 
 * Main orchestrator entry point. Validates input, checks permissions,
 * enforces rate limits, routes to subagent, logs actions, and deducts credits.
 * 
 * @param request - Tool request
 * @param userId - User ID
 * @param headers - Request headers (for IP, user agent)
 * @returns Tool response
 * 
 * @example
 * ```typescript
 * const response = await executeTool(
 *   {
 *     tool: 'run-tests',
 *     projectId: 'proj_123',
 *     params: { testPattern: '*.test.ts' }
 *   },
 *   'user_456',
 *   request.headers
 * )
 * ```
 */
export async function executeTool(
  request: ToolRequest,
  userId: string,
  headers: Headers
): Promise<ToolResponse> {
  const startTime = Date.now()
  
  try {
    // 1. Validate input
    if (!request.tool || !request.projectId) {
      throw new ValidationError('Missing required fields: tool, projectId')
    }
    
    // 2. Check permissions
    await requireProjectPermission(userId, request.projectId, 'member')
    
    // 3. Build context
    const context = await buildContext(userId, request.projectId)
    
    // 4. Check rate limits
    if (!checkRateLimit(request.projectId, request.tool)) {
      const resetAt = new Date(Date.now() + 60000)
      throw new RateLimitError(resetAt)
    }
    
    // 5. Check credits
    const cost = TOOL_COSTS[request.tool] || 10
    if (context.credits.balance < cost) {
      throw new InsufficientCreditsError(cost, context.credits.balance)
    }
    
    // 6. Map tool to subagent type
    const agentType = mapToolToAgent(request.tool)
    
    // 7. Execute subagent
    const response = await routeToSubAgent(agentType, {
      type: agentType,
      projectId: request.projectId,
      params: request.params
    })
    
    // 8. Deduct credits
    await deductCredits(
      context.credits.id,
      cost,
      `Tool execution: ${request.tool}`,
      {
        tool: request.tool,
        projectId: request.projectId,
        success: response.success
      }
    )
    
    // 9. Log audit event
    await logAudit({
      userId,
      orgId: context.orgId,
      action: 'execute_tool',
      resourceType: 'project',
      resourceId: request.projectId,
      metadata: {
        tool: request.tool,
        success: response.success,
        creditsUsed: cost
      },
      ipAddress: getIpAddress(headers),
      userAgent: getUserAgent(headers)
    })
    
    // 10. Return response with metadata
    const executionTime = Date.now() - startTime
    
    return {
      ...response,
      metadata: {
        ...response.metadata,
        executionTimeMs: executionTime,
        creditsUsed: cost,
        rateLimitRemaining: RATE_LIMITS[request.tool] || 60
      }
    }
  } catch (error) {
    const executionTime = Date.now() - startTime
    
    // Handle known errors
    if (error instanceof EmergentError) {
      return {
        success: false,
        data: null,
        error: error.message,
        metadata: {
          executionTimeMs: executionTime,
          errorCode: error.code
        }
      }
    }
    
    // Handle unknown errors
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
      metadata: {
        executionTimeMs: executionTime
      }
    }
  }
}

/**
 * Map tool name to subagent type
 */
function mapToolToAgent(tool: string): SubAgentType {
  const mapping: Record<string, SubAgentType> = {
    'bulk-write': 'code',
    'bulk-edit': 'code',
    'view-files': 'code',
    'run-tests': 'test',
    'integration': 'integration',
    'generate-image': 'image',
    'ask-human': 'human',
    'database-migration': 'migration',
    'deploy': 'code',
    'monitoring': 'integration'
  }
  
  return mapping[tool] || 'code'
}

/**
 * Get available tools for a project
 */
export async function getAvailableTools(projectId: string): Promise<string[]> {
  // Return all tools (could be filtered by project features later)
  return Object.keys(TOOL_COSTS)
}

/**
 * Get tool cost
 */
export function getToolCost(tool: string): number {
  return TOOL_COSTS[tool] || 10
}
