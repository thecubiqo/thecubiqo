/**
 * Audit Logger - Comprehensive Activity Logging
 * 
 * Logs all user actions for security and compliance.
 * Logs are automatically purged after 2 years.
 * 
 * @module emergent/security/audit-logger
 */

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database.types'

type AuditAction = 
  | 'create' | 'read' | 'update' | 'delete'
  | 'deploy' | 'rollback' | 'rotate_secret'
  | 'add_member' | 'remove_member' | 'change_role'
  | 'start_workspace' | 'stop_workspace'
  | 'execute_tool' | 'call_integration'

type ResourceType = 
  | 'organization' | 'project' | 'secret' 
  | 'workspace' | 'deployment' | 'integration'
  | 'member' | 'playbook' | 'webhook'

/**
 * Audit log entry parameters
 */
export interface AuditLogParams {
  userId: string
  orgId: string
  action: AuditAction
  resourceType: ResourceType
  resourceId: string
  metadata?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}

/**
 * Secret access log parameters
 */
export interface SecretAccessLogParams {
  secretId: string
  userId: string
  action: 'read' | 'write' | 'rotate' | 'delete'
  ipAddress?: string
}

/**
 * Log an audit event
 * 
 * @param params - Audit log parameters
 * @returns Log ID or null on error
 * 
 * @example
 * ```typescript
 * await logAudit({
 *   userId: user.id,
 *   orgId: org.id,
 *   action: 'create',
 *   resourceType: 'project',
 *   resourceId: project.id,
 *   metadata: { name: project.name, stack: project.stack },
 *   ipAddress: req.headers['x-forwarded-for'],
 *   userAgent: req.headers['user-agent']
 * })
 * ```
 */
export async function logAudit(params: AuditLogParams): Promise<string | null> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('audit_logs')
      .insert({
        user_id: params.userId,
        org_id: params.orgId,
        action: params.action,
        resource_type: params.resourceType,
        resource_id: params.resourceId,
        metadata: params.metadata || {},
        ip_address: params.ipAddress || null,
        user_agent: params.userAgent || null
      })
      .select('id')
      .single()
    
    if (error) {
      console.error('Failed to log audit event:', error)
      return null
    }
    
    return data.id
  } catch (error) {
    console.error('Audit logging error:', error)
    return null
  }
}

/**
 * Log secret access
 * 
 * @param params - Secret access log parameters
 * @returns Log ID or null on error
 * 
 * @example
 * ```typescript
 * await logSecretAccess({
 *   secretId: secret.id,
 *   userId: user.id,
 *   action: 'read',
 *   ipAddress: req.headers['x-forwarded-for']
 * })
 * ```
 */
export async function logSecretAccess(
  params: SecretAccessLogParams
): Promise<string | null> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('secret_access_logs')
      .insert({
        secret_id: params.secretId,
        user_id: params.userId,
        action: params.action,
        ip_address: params.ipAddress || null
      })
      .select('id')
      .single()
    
    if (error) {
      console.error('Failed to log secret access:', error)
      return null
    }
    
    return data.id
  } catch (error) {
    console.error('Secret access logging error:', error)
    return null
  }
}

/**
 * Query audit logs with filters
 * 
 * @param filters - Query filters
 * @returns Audit log entries
 * 
 * @example
 * ```typescript
 * const logs = await queryAuditLogs({
 *   orgId: org.id,
 *   resourceType: 'project',
 *   startDate: new Date('2024-01-01'),
 *   endDate: new Date('2024-01-31'),
 *   limit: 100
 * })
 * ```
 */
export async function queryAuditLogs(filters: {
  orgId?: string
  userId?: string
  resourceType?: ResourceType
  resourceId?: string
  action?: AuditAction
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}) {
  const supabase = await createClient()
  
  let query = supabase
    .from('audit_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
  
  if (filters.orgId) {
    query = query.eq('org_id', filters.orgId)
  }
  
  if (filters.userId) {
    query = query.eq('user_id', filters.userId)
  }
  
  if (filters.resourceType) {
    query = query.eq('resource_type', filters.resourceType)
  }
  
  if (filters.resourceId) {
    query = query.eq('resource_id', filters.resourceId)
  }
  
  if (filters.action) {
    query = query.eq('action', filters.action)
  }
  
  if (filters.startDate) {
    query = query.gte('created_at', filters.startDate.toISOString())
  }
  
  if (filters.endDate) {
    query = query.lte('created_at', filters.endDate.toISOString())
  }
  
  const limit = filters.limit || 50
  const offset = filters.offset || 0
  
  query = query.range(offset, offset + limit - 1)
  
  const { data, error, count } = await query
  
  if (error) {
    throw new Error(`Failed to query audit logs: ${error.message}`)
  }
  
  return {
    logs: data || [],
    total: count || 0,
    limit,
    offset
  }
}

/**
 * Get recent activity for a user
 * 
 * @param userId - User ID
 * @param limit - Number of entries (default: 20)
 * @returns Recent audit logs
 */
export async function getUserActivity(userId: string, limit: number = 20) {
  return queryAuditLogs({ userId, limit })
}

/**
 * Get recent activity for an organization
 * 
 * @param orgId - Organization ID
 * @param limit - Number of entries (default: 50)
 * @returns Recent audit logs
 */
export async function getOrgActivity(orgId: string, limit: number = 50) {
  return queryAuditLogs({ orgId, limit })
}

/**
 * Get secret access history
 * 
 * @param secretId - Secret ID
 * @param limit - Number of entries (default: 100)
 * @returns Secret access logs
 */
export async function getSecretAccessHistory(
  secretId: string,
  limit: number = 100
) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('secret_access_logs')
    .select('*')
    .eq('secret_id', secretId)
    .order('created_at', { ascending: false })
    .limit(limit)
  
  if (error) {
    throw new Error(`Failed to query secret access logs: ${error.message}`)
  }
  
  return data || []
}

/**
 * Helper: Get IP address from request headers
 * 
 * @param headers - Request headers
 * @returns IP address or null
 */
export function getIpAddress(headers: Headers): string | null {
  return (
    headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    headers.get('x-real-ip') ||
    null
  )
}

/**
 * Helper: Get user agent from request headers
 * 
 * @param headers - Request headers
 * @returns User agent or null
 */
export function getUserAgent(headers: Headers): string | null {
  return headers.get('user-agent')
}
