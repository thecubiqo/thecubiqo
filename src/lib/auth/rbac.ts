// Epic 1: RBAC (Role-Based Access Control) Implementation
// Author: @blossom (Backend Developer)
// Description: Permission definitions and role checking functions

export enum Role {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
  VIEWER = 'viewer',
}

export enum Permission {
  // Organization permissions
  ORG_VIEW = 'org:view',
  ORG_UPDATE = 'org:update',
  ORG_DELETE = 'org:delete',
  ORG_BILLING = 'org:billing',
  
  // Member permissions
  MEMBER_VIEW = 'member:view',
  MEMBER_INVITE = 'member:invite',
  MEMBER_REMOVE = 'member:remove',
  MEMBER_UPDATE_ROLE = 'member:update_role',
  
  // Project permissions
  PROJECT_VIEW = 'project:view',
  PROJECT_CREATE = 'project:create',
  PROJECT_UPDATE = 'project:update',
  PROJECT_DELETE = 'project:delete',
  
  // Environment permissions
  ENV_VIEW = 'env:view',
  ENV_CREATE = 'env:create',
  ENV_UPDATE = 'env:update',
  ENV_DELETE = 'env:delete',
  
  // Environment variable permissions
  ENV_VAR_VIEW = 'env_var:view',
  ENV_VAR_CREATE = 'env_var:create',
  ENV_VAR_UPDATE = 'env_var:update',
  ENV_VAR_DELETE = 'env_var:delete',
  
  // Deployment permissions
  DEPLOY_TRIGGER = 'deploy:trigger',
  DEPLOY_ROLLBACK = 'deploy:rollback',
  
  // Audit log permissions
  AUDIT_VIEW = 'audit:view',
}

// Role → Permissions mapping
const rolePermissions: Record<Role, Permission[]> = {
  [Role.OWNER]: [
    // Owners have ALL permissions
    Permission.ORG_VIEW,
    Permission.ORG_UPDATE,
    Permission.ORG_DELETE,
    Permission.ORG_BILLING,
    Permission.MEMBER_VIEW,
    Permission.MEMBER_INVITE,
    Permission.MEMBER_REMOVE,
    Permission.MEMBER_UPDATE_ROLE,
    Permission.PROJECT_VIEW,
    Permission.PROJECT_CREATE,
    Permission.PROJECT_UPDATE,
    Permission.PROJECT_DELETE,
    Permission.ENV_VIEW,
    Permission.ENV_CREATE,
    Permission.ENV_UPDATE,
    Permission.ENV_DELETE,
    Permission.ENV_VAR_VIEW,
    Permission.ENV_VAR_CREATE,
    Permission.ENV_VAR_UPDATE,
    Permission.ENV_VAR_DELETE,
    Permission.DEPLOY_TRIGGER,
    Permission.DEPLOY_ROLLBACK,
    Permission.AUDIT_VIEW,
  ],
  
  [Role.ADMIN]: [
    // Admins: everything except org delete and billing
    Permission.ORG_VIEW,
    Permission.ORG_UPDATE,
    Permission.MEMBER_VIEW,
    Permission.MEMBER_INVITE,
    Permission.MEMBER_REMOVE,
    Permission.MEMBER_UPDATE_ROLE,
    Permission.PROJECT_VIEW,
    Permission.PROJECT_CREATE,
    Permission.PROJECT_UPDATE,
    Permission.PROJECT_DELETE,
    Permission.ENV_VIEW,
    Permission.ENV_CREATE,
    Permission.ENV_UPDATE,
    Permission.ENV_DELETE,
    Permission.ENV_VAR_VIEW,
    Permission.ENV_VAR_CREATE,
    Permission.ENV_VAR_UPDATE,
    Permission.ENV_VAR_DELETE,
    Permission.DEPLOY_TRIGGER,
    Permission.DEPLOY_ROLLBACK,
    Permission.AUDIT_VIEW,
  ],
  
  [Role.MEMBER]: [
    // Members: can work on projects but not manage org/members
    Permission.ORG_VIEW,
    Permission.MEMBER_VIEW,
    Permission.PROJECT_VIEW,
    Permission.PROJECT_CREATE,
    Permission.PROJECT_UPDATE,
    Permission.ENV_VIEW,
    Permission.ENV_CREATE,
    Permission.ENV_UPDATE,
    Permission.ENV_VAR_VIEW,
    Permission.ENV_VAR_CREATE,
    Permission.ENV_VAR_UPDATE,
    Permission.ENV_VAR_DELETE,
    Permission.DEPLOY_TRIGGER,
    Permission.AUDIT_VIEW,
  ],
  
  [Role.VIEWER]: [
    // Viewers: read-only access
    Permission.ORG_VIEW,
    Permission.MEMBER_VIEW,
    Permission.PROJECT_VIEW,
    Permission.ENV_VIEW,
    Permission.ENV_VAR_VIEW,
    Permission.AUDIT_VIEW,
  ],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  return rolePermissions[role].includes(permission);
}

/**
 * Check if a role has ANY of the given permissions
 */
export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
  return permissions.some((permission) => hasPermission(role, permission));
}

/**
 * Check if a role has ALL of the given permissions
 */
export function hasAllPermissions(role: Role, permissions: Permission[]): boolean {
  return permissions.every((permission) => hasPermission(role, permission));
}

/**
 * Get all permissions for a role
 */
export function getPermissions(role: Role): Permission[] {
  return rolePermissions[role];
}

/**
 * Check if one role is more powerful than another
 */
export function isRoleHigherThan(role1: Role, role2: Role): boolean {
  const roleHierarchy = [Role.VIEWER, Role.MEMBER, Role.ADMIN, Role.OWNER];
  return roleHierarchy.indexOf(role1) > roleHierarchy.indexOf(role2);
}

/**
 * Get the minimum role required for a permission
 */
export function getMinimumRoleForPermission(permission: Permission): Role | null {
  const roles = [Role.VIEWER, Role.MEMBER, Role.ADMIN, Role.OWNER];
  
  for (const role of roles) {
    if (hasPermission(role, permission)) {
      return role;
    }
  }
  
  return null;
}

/**
 * Validate that a role exists
 */
export function isValidRole(role: string): role is Role {
  return Object.values(Role).includes(role as Role);
}

/**
 * Get human-readable role name
 */
export function getRoleName(role: Role): string {
  const names: Record<Role, string> = {
    [Role.OWNER]: 'Owner',
    [Role.ADMIN]: 'Administrator',
    [Role.MEMBER]: 'Member',
    [Role.VIEWER]: 'Viewer',
  };
  return names[role];
}

/**
 * Get role description
 */
export function getRoleDescription(role: Role): string {
  const descriptions: Record<Role, string> = {
    [Role.OWNER]: 'Full control over the organization, including deletion and billing',
    [Role.ADMIN]: 'Manage projects, members, and deployments',
    [Role.MEMBER]: 'Create and edit projects, trigger deployments',
    [Role.VIEWER]: 'Read-only access to organization resources',
  };
  return descriptions[role];
}
