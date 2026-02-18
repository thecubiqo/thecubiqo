/**
 * Role-Based Access Control (RBAC) Middleware
 * 
 * Implements permission checks for organization and project resources.
 * Enforces role hierarchy: owner > admin > member > viewer
 * 
 * @module emergent/security/rbac
 */

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database.types'

type OrgRole = 'owner' | 'admin' | 'member' | 'viewer'

/**
 * Role hierarchy levels (higher = more permissions)
 */
const ROLE_LEVELS: Record<OrgRole, number> = {
  owner: 3,
  admin: 2,
  member: 1,
  viewer: 0
}

/**
 * Permission check result
 */
export interface PermissionResult {
  allowed: boolean
  role?: OrgRole
  reason?: string
}

/**
 * Check if user has sufficient role level
 * 
 * @param userRole - User's actual role
 * @param requiredRole - Minimum required role
 * @returns True if user's role >= required role
 */
export function hasRoleLevel(userRole: OrgRole, requiredRole: OrgRole): boolean {
  return ROLE_LEVELS[userRole] >= ROLE_LEVELS[requiredRole]
}

/**
 * Get user's role in an organization
 * 
 * @param userId - User ID
 * @param orgId - Organization ID
 * @returns User's role or null if not a member
 */
export async function getUserOrgRole(
  userId: string,
  orgId: string
): Promise<OrgRole | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('org_members')
    .select('role')
    .eq('user_id', userId)
    .eq('org_id', orgId)
    .not('joined_at', 'is', null) // Only include members who have joined
    .single()
  
  if (error || !data) {
    return null
  }
  
  return data.role as OrgRole
}

/**
 * Check if user has permission to access organization
 * 
 * @param userId - User ID
 * @param orgId - Organization ID
 * @param requiredRole - Minimum required role (default: viewer)
 * @returns Permission result
 */
export async function checkOrgPermission(
  userId: string,
  orgId: string,
  requiredRole: OrgRole = 'viewer'
): Promise<PermissionResult> {
  const userRole = await getUserOrgRole(userId, orgId)
  
  if (!userRole) {
    return {
      allowed: false,
      reason: 'User is not a member of this organization'
    }
  }
  
  if (!hasRoleLevel(userRole, requiredRole)) {
    return {
      allowed: false,
      role: userRole,
      reason: `Insufficient permissions. Required: ${requiredRole}, Actual: ${userRole}`
    }
  }
  
  return {
    allowed: true,
    role: userRole
  }
}

/**
 * Check if user has permission to access project
 * (Checks both project existence and org membership)
 * 
 * @param userId - User ID
 * @param projectId - Project ID
 * @param requiredRole - Minimum required role (default: viewer)
 * @returns Permission result
 */
export async function checkProjectPermission(
  userId: string,
  projectId: string,
  requiredRole: OrgRole = 'viewer'
): Promise<PermissionResult> {
  const supabase = await createClient()
  
  // Get project's org_id
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('org_id')
    .eq('id', projectId)
    .single()
  
  if (projectError || !project) {
    return {
      allowed: false,
      reason: 'Project not found'
    }
  }
  
  // Check org permission
  return checkOrgPermission(userId, project.org_id, requiredRole)
}

/**
 * Require organization permission (throws if denied)
 * 
 * @param userId - User ID
 * @param orgId - Organization ID
 * @param requiredRole - Minimum required role
 * @throws {Error} If permission denied
 */
export async function requireOrgPermission(
  userId: string,
  orgId: string,
  requiredRole: OrgRole = 'viewer'
): Promise<OrgRole> {
  const result = await checkOrgPermission(userId, orgId, requiredRole)
  
  if (!result.allowed) {
    throw new Error(result.reason || 'Permission denied')
  }
  
  return result.role!
}

/**
 * Require project permission (throws if denied)
 * 
 * @param userId - User ID
 * @param projectId - Project ID
 * @param requiredRole - Minimum required role
 * @throws {Error} If permission denied
 */
export async function requireProjectPermission(
  userId: string,
  projectId: string,
  requiredRole: OrgRole = 'viewer'
): Promise<OrgRole> {
  const result = await checkProjectPermission(userId, projectId, requiredRole)
  
  if (!result.allowed) {
    throw new Error(result.reason || 'Permission denied')
  }
  
  return result.role!
}

/**
 * Get all organizations user has access to
 * 
 * @param userId - User ID
 * @param minRole - Minimum role level (default: viewer)
 * @returns List of organization IDs
 */
export async function getUserOrganizations(
  userId: string,
  minRole: OrgRole = 'viewer'
): Promise<string[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('org_members')
    .select('org_id, role')
    .eq('user_id', userId)
    .not('joined_at', 'is', null) // Only include members who have joined
  
  if (error || !data) {
    return []
  }
  
  // Filter by role level
  const minLevel = ROLE_LEVELS[minRole]
  return data
    .filter(member => ROLE_LEVELS[member.role as OrgRole] >= minLevel)
    .map(member => member.org_id)
}

/**
 * Get all projects user has access to
 * 
 * @param userId - User ID
 * @param minRole - Minimum role level (default: viewer)
 * @returns List of project IDs
 */
export async function getUserProjects(
  userId: string,
  minRole: OrgRole = 'viewer'
): Promise<string[]> {
  const supabase = await createClient()
  
  // Get user's orgs first
  const orgIds = await getUserOrganizations(userId, minRole)
  
  if (orgIds.length === 0) {
    return []
  }
  
  // Get all projects in those orgs
  const { data, error } = await supabase
    .from('projects')
    .select('id')
    .in('org_id', orgIds)
  
  if (error || !data) {
    return []
  }
  
  return data.map(project => project.id)
}

/**
 * Check if user is organization owner
 * 
 * @param userId - User ID
 * @param orgId - Organization ID
 * @returns True if user is owner
 */
export async function isOrgOwner(userId: string, orgId: string): Promise<boolean> {
  const role = await getUserOrgRole(userId, orgId)
  return role === 'owner'
}

/**
 * Check if user can manage secrets (admin or owner)
 * 
 * @param userId - User ID
 * @param projectId - Project ID
 * @returns True if user can manage secrets
 */
export async function canManageSecrets(
  userId: string,
  projectId: string
): Promise<boolean> {
  const result = await checkProjectPermission(userId, projectId, 'admin')
  return result.allowed
}

/**
 * Check if user can deploy (member or higher)
 * 
 * @param userId - User ID
 * @param projectId - Project ID
 * @returns True if user can deploy
 */
export async function canDeploy(
  userId: string,
  projectId: string
): Promise<boolean> {
  const result = await checkProjectPermission(userId, projectId, 'member')
  return result.allowed
}
