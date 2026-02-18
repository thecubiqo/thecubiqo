/**
 * Emergent AI Agent System - Core Type Definitions
 * 
 * Defines TypeScript types for the agent orchestrator, subagents,
 * tool execution, and integration playbooks.
 * 
 * @module emergent/agent-types
 */

// ============================================================================
// Base Types
// ============================================================================

/**
 * Standard API response wrapper for all tool calls
 */
export interface ToolResponse<T = unknown> {
  /** Whether the operation succeeded */
  success: boolean
  /** Response data (null on error) */
  data: T | null
  /** Error message (null on success) */
  error: string | null
  /** Additional metadata (execution time, credits used, etc.) */
  metadata?: {
    executionTimeMs?: number
    creditsUsed?: number
    rateLimitRemaining?: number
    [key: string]: unknown
  }
}

/**
 * Base tool request structure
 */
export interface ToolRequest {
  /** Tool identifier */
  tool: string
  /** Project ID */
  projectId: string
  /** Tool-specific parameters */
  params: Record<string, unknown>
}

// ============================================================================
// Organization & Project Types
// ============================================================================

export interface Organization {
  id: string
  name: string
  slug: string
  plan: 'free' | 'pro' | 'enterprise'
  stripeCustomerId: string | null
  createdAt: string
  updatedAt: string
}

export interface OrganizationMember {
  id: string
  orgId: string
  userId: string
  role: 'owner' | 'admin' | 'member' | 'viewer'
  invitedAt: string
  joinedAt: string | null
}

export interface Project {
  id: string
  orgId: string
  name: string
  slug: string
  description: string | null
  stack: 'nextjs' | 'react' | 'vue' | 'svelte' | 'vanilla'
  framework: string | null
  language: 'typescript' | 'javascript' | 'python'
  repository: string | null
  status: 'active' | 'building' | 'deployed' | 'error' | 'archived'
  createdAt: string
  updatedAt: string
  lastBuiltAt: string | null
}

// ============================================================================
// Secrets Management Types
// ============================================================================

export interface ProjectSecret {
  id: string
  projectId: string
  key: string
  encryptedValue: string
  iv: string
  authTag: string
  description: string | null
  lastRotatedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface SecretMetadata {
  id: string
  projectId: string
  key: string
  description: string | null
  lastRotatedAt: string | null
  createdAt: string
  updatedAt: string
}

// ============================================================================
// Workspace & Deployment Types
// ============================================================================

export interface Workspace {
  id: string
  projectId: string
  status: 'initializing' | 'ready' | 'running' | 'stopped' | 'error'
  containerId: string | null
  port: number | null
  cpuLimit: number
  memoryLimit: number
  storageLimit: number
  lastActivityAt: string | null
  createdAt: string
  expiresAt: string
}

export interface Deployment {
  id: string
  projectId: string
  version: string
  environment: 'preview' | 'production'
  status: 'pending' | 'building' | 'deploying' | 'live' | 'failed' | 'rolled_back'
  url: string | null
  buildLogs: string | null
  deployedAt: string | null
  createdAt: string
}

// ============================================================================
// Integration & Playbook Types
// ============================================================================

export interface Integration {
  id: string
  projectId: string
  service: string
  name: string
  config: Record<string, unknown>
  secretIds: string[]
  status: 'active' | 'inactive' | 'error'
  lastSyncAt: string | null
  createdAt: string
  updatedAt: string
}

export interface Playbook {
  id: string
  name: string
  service: string
  description: string
  instructions: string
  codeTemplates: Record<string, string>
  isVerified: boolean
  authorId: string | null
  usageCount: number
  ratingAverage: number | null
  createdAt: string
  updatedAt: string
}

export interface PlaybookExecution {
  playbookId: string
  projectId: string
  params: Record<string, unknown>
  context?: Record<string, unknown>
}

// ============================================================================
// Audit & Monitoring Types
// ============================================================================

export interface AuditLog {
  id: string
  userId: string
  orgId: string
  action: string
  resourceType: string
  resourceId: string
  metadata: Record<string, unknown>
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
}

export interface SecretAccessLog {
  id: string
  secretId: string
  userId: string
  action: 'read' | 'write' | 'rotate' | 'delete'
  ipAddress: string | null
  createdAt: string
}

// ============================================================================
// Credits & Billing Types
// ============================================================================

export interface Credits {
  id: string
  orgId: string
  balance: number
  createdAt: string
  updatedAt: string
}

export interface CreditTransaction {
  id: string
  orgId: string
  amount: number
  balanceAfter: number
  transactionType: 'purchase' | 'usage' | 'refund' | 'bonus'
  description: string
  metadata: Record<string, unknown>
  createdAt: string
}

// ============================================================================
// Agent Orchestrator Types
// ============================================================================

export type SubAgentType = 'code' | 'test' | 'image' | 'integration' | 'human' | 'migration'

export interface SubAgentRequest {
  type: SubAgentType
  projectId: string
  params: Record<string, unknown>
}

export interface SubAgentResponse<T = unknown> extends ToolResponse<T> {
  agentType: SubAgentType
}

export interface OrchestratorContext {
  projectId: string
  orgId: string
  userId: string
  credits: Credits
}

export interface OrchestratorTask {
  id: string
  type: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  result?: ToolResponse
  createdAt: Date
  completedAt?: Date
}

// ============================================================================
// Rate Limiting Types
// ============================================================================

export interface RateLimitConfig {
  maxRequests: number
  windowMs: number
}

export interface RateLimitStatus {
  remaining: number
  resetAt: Date
  blocked: boolean
}

// ============================================================================
// Webhook Types
// ============================================================================

export interface WebhookEvent {
  id: string
  integrationId: string
  service: string
  eventType: string
  payload: Record<string, unknown>
  status: 'pending' | 'processing' | 'processed' | 'failed'
  retryCount: number
  processedAt: string | null
  createdAt: string
}

// ============================================================================
// Tool-Specific Types
// ============================================================================

export interface BulkWriteParams {
  files: Array<{
    path: string
    content: string
  }>
}

export interface BulkEditParams {
  edits: Array<{
    path: string
    oldContent: string
    newContent: string
  }>
}

export interface ViewFilesParams {
  paths: string[]
}

export interface RunTestsParams {
  testPattern?: string
  coverage?: boolean
  timeout?: number
}

export interface IntegrationCallParams {
  service: string
  action: string
  params: Record<string, unknown>
}

export interface GenerateImageParams {
  prompt: string
  size?: '256x256' | '512x512' | '1024x1024'
  style?: 'vivid' | 'natural'
}

export interface AskHumanParams {
  question: string
  context?: string
  timeout?: number
}

export interface DeployParams {
  environment: 'preview' | 'production'
  version?: string
}

// ============================================================================
// Error Types
// ============================================================================

export class EmergentError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public metadata?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'EmergentError'
  }
}

export class InsufficientCreditsError extends EmergentError {
  constructor(required: number, available: number) {
    super(
      `Insufficient credits. Required: ${required}, Available: ${available}`,
      'INSUFFICIENT_CREDITS',
      402,
      { required, available }
    )
  }
}

export class RateLimitError extends EmergentError {
  constructor(resetAt: Date) {
    super(
      `Rate limit exceeded. Resets at ${resetAt.toISOString()}`,
      'RATE_LIMIT_EXCEEDED',
      429,
      { resetAt: resetAt.toISOString() }
    )
  }
}

export class UnauthorizedError extends EmergentError {
  constructor(message: string = 'Unauthorized') {
    super(message, 'UNAUTHORIZED', 401)
  }
}

export class ForbiddenError extends EmergentError {
  constructor(message: string = 'Forbidden') {
    super(message, 'FORBIDDEN', 403)
  }
}

export class NotFoundError extends EmergentError {
  constructor(resource: string) {
    super(`${resource} not found`, 'NOT_FOUND', 404, { resource })
  }
}

export class ValidationError extends EmergentError {
  constructor(message: string, errors?: Record<string, string[]>) {
    super(message, 'VALIDATION_ERROR', 400, { errors })
  }
}
