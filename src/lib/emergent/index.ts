/**
 * Emergent AI System - Main Export
 * 
 * Central export point for all Emergent backend modules.
 * 
 * @module emergent
 */

// Core types
export * from './agent-types'

// Orchestrator
export { executeTool, getAvailableTools, getToolCost } from './orchestrator'

// Security
export {
  encryptSecret,
  decryptSecret,
  rotateSecret,
  hashSecret,
  verifySecretHash,
  generateSecret,
  maskSecret
} from './security/secrets-manager'

export {
  hasRoleLevel,
  getUserOrgRole,
  checkOrgPermission,
  checkProjectPermission,
  requireOrgPermission,
  requireProjectPermission,
  getUserOrganizations,
  getUserProjects,
  isOrgOwner,
  canManageSecrets,
  canDeploy
} from './security/rbac'

export {
  logAudit,
  logSecretAccess,
  queryAuditLogs,
  getUserActivity,
  getOrgActivity,
  getSecretAccessHistory,
  getIpAddress,
  getUserAgent
} from './security/audit-logger'

// Subagents
export { executeTestAgent } from './subagents/testing-agent'
export { executeImageAgent } from './subagents/image-agent'
export { executeIntegrationAgent } from './subagents/integration-agent'

// Integrations
export { executePlaybook } from './integrations/playbook-executor'
export { validatePlaybook, validateStep, getStepConfigSchema } from './integrations/playbook-schema'
export { shopifyPlaybook, verifyShopifyWebhook } from './integrations/playbooks/shopify'
export { printifyPlaybook, verifyPrintifyWebhook } from './integrations/playbooks/printify'

// Type guards
export function isToolResponse<T>(obj: unknown): obj is import('./agent-types').ToolResponse<T> {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'success' in obj &&
    'data' in obj &&
    'error' in obj
  )
}
