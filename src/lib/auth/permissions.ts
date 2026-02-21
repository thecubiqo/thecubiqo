// Epic 1: Permission Middleware
// Author: @blossom (Backend Developer)
// Description: Middleware to check permissions in API routes

import { createClient } from '@/lib/supabase/server';
import { Role, Permission, hasPermission } from './rbac';

export interface AuthContext {
  userId: string;
  orgId: string;
  role: Role;
}

/**
 * Get user's role in an organization
 */
export async function getUserRole(
  userId: string,
  orgId: string
): Promise<Role | null> {
  const supabase = (await createClient()) as any;

  const { data, error } = await supabase
    .from('org_members')
    .select('role')
    .eq('user_id', userId)
    .eq('org_id', orgId)
    .single();

  if (error || !data) {
    return null;
  }

  return data.role as Role;
}

/**
 * Check if user has permission in organization
 */
export async function checkPermission(
  userId: string,
  orgId: string,
  permission: Permission
): Promise<boolean> {
  const role = await getUserRole(userId, orgId);

  if (!role) {
    return false;
  }

  return hasPermission(role, permission);
}

/**
 * Require authentication (throws if not authenticated)
 */
export async function requireAuth(): Promise<string> {
  const supabase = (await createClient()) as any;

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session) {
    throw new Error('Unauthorized: No active session');
  }

  return session.user.id;
}

/**
 * Require specific permission (throws if not authorized)
 */
export async function requirePermission(
  userId: string,
  orgId: string,
  permission: Permission
): Promise<AuthContext> {
  const role = await getUserRole(userId, orgId);

  if (!role) {
    throw new Error(`Forbidden: User is not a member of organization ${orgId}`);
  }

  if (!hasPermission(role, permission)) {
    throw new Error(
      `Forbidden: User lacks permission ${permission} (role: ${role})`
    );
  }

  return {
    userId,
    orgId,
    role,
  };
}

/**
 * Get organization ID from project ID
 */
export async function getOrgIdFromProject(
  projectId: string
): Promise<string | null> {
  const supabase = (await createClient()) as any;

  const { data, error } = await supabase
    .from('projects')
    .select('org_id')
    .eq('id', projectId)
    .single();

  if (error || !data) {
    return null;
  }

  return data.org_id;
}

/**
 * Get organization ID from environment ID
 */
export async function getOrgIdFromEnvironment(
  environmentId: string
): Promise<string | null> {
  const supabase = (await createClient()) as any;

  const { data, error } = await supabase
    .from('environments')
    .select('project_id, projects(org_id)')
    .eq('id', environmentId)
    .single();

  if (error || !data) {
    return null;
  }

  // Supabase typing issue with nested selects
  return data.projects?.org_id || null;
}

/**
 * Check if user has access to project
 */
export async function checkProjectAccess(
  userId: string,
  projectId: string,
  permission: Permission
): Promise<boolean> {
  const orgId = await getOrgIdFromProject(projectId);

  if (!orgId) {
    return false;
  }

  return checkPermission(userId, orgId, permission);
}

/**
 * Require project access (throws if not authorized)
 */
export async function requireProjectAccess(
  userId: string,
  projectId: string,
  permission: Permission
): Promise<AuthContext> {
  const orgId = await getOrgIdFromProject(projectId);

  if (!orgId) {
    throw new Error(`Not Found: Project ${projectId} not found`);
  }

  return requirePermission(userId, orgId, permission);
}

/**
 * Check if user owns organization (is owner role)
 */
export async function isOrgOwner(
  userId: string,
  orgId: string
): Promise<boolean> {
  const role = await getUserRole(userId, orgId);
  return role === Role.OWNER;
}

/**
 * Check if user is admin or owner
 */
export async function isOrgAdminOrOwner(
  userId: string,
  orgId: string
): Promise<boolean> {
  const role = await getUserRole(userId, orgId);
  return role === Role.OWNER || role === Role.ADMIN;
}
