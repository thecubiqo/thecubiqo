/**
 * Tests for Role-Based Access Control (RBAC)
 * 
 * Tests permission checks, role hierarchy, and access control
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
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
} from '../security/rbac'
import { mockUsers, mockOrganizations, mockProjects, mockOrgMembers } from '../../../../tests/utils/mock-data'

// Mock Supabase
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve({
    from: (table: string) => ({
      select: (fields?: string) => {
        if (table === 'org_members') {
          return {
            eq: (field: string, value: unknown) => ({
              eq: (field2: string, value2: unknown) => ({
                not: () => ({
                  single: () => {
                    // Find matching org member
                    const member = mockOrgMembers.find(
                      m => m.user_id === value && m.org_id === value2
                    )
                    return Promise.resolve({
                      data: member || null,
                      error: member ? null : { message: 'Not found' }
                    })
                  }
                }),
                single: () => {
                  const member = mockOrgMembers.find(
                    m => m.user_id === value && m.org_id === value2
                  )
                  return Promise.resolve({
                    data: member || null,
                    error: member ? null : { message: 'Not found' }
                  })
                }
              }),
              not: () => {
                const members = mockOrgMembers.filter(
                  m => m.user_id === value && m.joined_at !== null
                )
                return Promise.resolve({
                  data: members,
                  error: null
                })
              }
            })
          }
        } else if (table === 'projects') {
          return {
            eq: (field: string, value: unknown) => ({
              single: () => {
                const project = Object.values(mockProjects).find(
                  p => p.id === value
                )
                return Promise.resolve({
                  data: project || null,
                  error: project ? null : { message: 'Not found' }
                })
              }
            }),
            in: (field: string, values: unknown[]) => {
              const projects = Object.values(mockProjects).filter(
                p => values.includes(p.org_id)
              )
              return Promise.resolve({
                data: projects,
                error: null
              })
            }
          }
        }
        return {
          eq: () => ({
            single: () => Promise.resolve({ data: null, error: null })
          })
        }
      }
    })
  }))
}))

describe('RBAC', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('hasRoleLevel', () => {
    it('should correctly compare role levels', () => {
      expect(hasRoleLevel('owner', 'viewer')).toBe(true)
      expect(hasRoleLevel('owner', 'member')).toBe(true)
      expect(hasRoleLevel('owner', 'admin')).toBe(true)
      expect(hasRoleLevel('owner', 'owner')).toBe(true)
      
      expect(hasRoleLevel('admin', 'viewer')).toBe(true)
      expect(hasRoleLevel('admin', 'member')).toBe(true)
      expect(hasRoleLevel('admin', 'admin')).toBe(true)
      expect(hasRoleLevel('admin', 'owner')).toBe(false)
      
      expect(hasRoleLevel('member', 'viewer')).toBe(true)
      expect(hasRoleLevel('member', 'member')).toBe(true)
      expect(hasRoleLevel('member', 'admin')).toBe(false)
      expect(hasRoleLevel('member', 'owner')).toBe(false)
      
      expect(hasRoleLevel('viewer', 'viewer')).toBe(true)
      expect(hasRoleLevel('viewer', 'member')).toBe(false)
      expect(hasRoleLevel('viewer', 'admin')).toBe(false)
      expect(hasRoleLevel('viewer', 'owner')).toBe(false)
    })
  })

  describe('getUserOrgRole', () => {
    it('should return user role in organization', async () => {
      const role = await getUserOrgRole(
        mockUsers.admin.id,
        mockOrganizations.main.id
      )
      
      expect(role).toBe('owner')
    })

    it('should return null if user is not a member', async () => {
      const role = await getUserOrgRole(
        mockUsers.unauthorized.id,
        mockOrganizations.main.id
      )
      
      expect(role).toBeNull()
    })

    it('should handle different roles correctly', async () => {
      const adminRole = await getUserOrgRole(
        mockUsers.admin.id,
        mockOrganizations.main.id
      )
      const memberRole = await getUserOrgRole(
        mockUsers.member.id,
        mockOrganizations.main.id
      )
      const viewerRole = await getUserOrgRole(
        mockUsers.viewer.id,
        mockOrganizations.main.id
      )
      
      expect(adminRole).toBe('owner')
      expect(memberRole).toBe('member')
      expect(viewerRole).toBe('viewer')
    })
  })

  describe('checkOrgPermission', () => {
    it('should allow access with sufficient permissions', async () => {
      const result = await checkOrgPermission(
        mockUsers.admin.id,
        mockOrganizations.main.id,
        'viewer'
      )
      
      expect(result.allowed).toBe(true)
      expect(result.role).toBe('owner')
    })

    it('should deny access with insufficient permissions', async () => {
      const result = await checkOrgPermission(
        mockUsers.viewer.id,
        mockOrganizations.main.id,
        'admin'
      )
      
      expect(result.allowed).toBe(false)
      expect(result.role).toBe('viewer')
      expect(result.reason).toContain('Insufficient permissions')
    })

    it('should deny access if user is not a member', async () => {
      const result = await checkOrgPermission(
        mockUsers.unauthorized.id,
        mockOrganizations.main.id,
        'viewer'
      )
      
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('not a member')
    })

    it('should use default role of viewer', async () => {
      const result = await checkOrgPermission(
        mockUsers.viewer.id,
        mockOrganizations.main.id
      )
      
      expect(result.allowed).toBe(true)
    })
  })

  describe('checkProjectPermission', () => {
    it('should allow access to project if org member', async () => {
      const result = await checkProjectPermission(
        mockUsers.admin.id,
        mockProjects.active.id,
        'viewer'
      )
      
      expect(result.allowed).toBe(true)
      expect(result.role).toBe('owner')
    })

    it('should deny access to project if not org member', async () => {
      const result = await checkProjectPermission(
        mockUsers.unauthorized.id,
        mockProjects.active.id,
        'viewer'
      )
      
      expect(result.allowed).toBe(false)
    })

    it('should check org permission through project', async () => {
      const result = await checkProjectPermission(
        mockUsers.member.id,
        mockProjects.active.id,
        'admin'
      )
      
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('Insufficient permissions')
    })
  })

  describe('requireOrgPermission', () => {
    it('should return role if permission granted', async () => {
      const role = await requireOrgPermission(
        mockUsers.admin.id,
        mockOrganizations.main.id,
        'viewer'
      )
      
      expect(role).toBe('owner')
    })

    it('should throw error if permission denied', async () => {
      await expect(
        requireOrgPermission(
          mockUsers.viewer.id,
          mockOrganizations.main.id,
          'admin'
        )
      ).rejects.toThrow('Insufficient permissions')
    })

    it('should throw error if user is not a member', async () => {
      await expect(
        requireOrgPermission(
          mockUsers.unauthorized.id,
          mockOrganizations.main.id,
          'viewer'
        )
      ).rejects.toThrow('not a member')
    })
  })

  describe('requireProjectPermission', () => {
    it('should return role if permission granted', async () => {
      const role = await requireProjectPermission(
        mockUsers.admin.id,
        mockProjects.active.id,
        'viewer'
      )
      
      expect(role).toBe('owner')
    })

    it('should throw error if permission denied', async () => {
      await expect(
        requireProjectPermission(
          mockUsers.viewer.id,
          mockProjects.active.id,
          'admin'
        )
      ).rejects.toThrow()
    })

    it('should throw error if project not found', async () => {
      await expect(
        requireProjectPermission(
          mockUsers.admin.id,
          'nonexistent_project',
          'viewer'
        )
      ).rejects.toThrow()
    })
  })

  describe('getUserOrganizations', () => {
    it('should return list of org IDs user has access to', async () => {
      const orgIds = await getUserOrganizations(mockUsers.admin.id)
      
      expect(Array.isArray(orgIds)).toBe(true)
      expect(orgIds).toContain(mockOrganizations.main.id)
    })

    it('should filter by minimum role', async () => {
      const adminOrgs = await getUserOrganizations(mockUsers.viewer.id, 'admin')
      const viewerOrgs = await getUserOrganizations(mockUsers.viewer.id, 'viewer')
      
      expect(adminOrgs).toHaveLength(0)
      expect(viewerOrgs.length).toBeGreaterThan(0)
    })

    it('should return empty array for users with no orgs', async () => {
      const orgIds = await getUserOrganizations(mockUsers.unauthorized.id)
      
      expect(orgIds).toEqual([])
    })
  })

  describe('getUserProjects', () => {
    it('should return list of project IDs user has access to', async () => {
      const projectIds = await getUserProjects(mockUsers.admin.id)
      
      expect(Array.isArray(projectIds)).toBe(true)
      expect(projectIds.length).toBeGreaterThan(0)
    })

    it('should filter by minimum role', async () => {
      const adminProjects = await getUserProjects(mockUsers.viewer.id, 'admin')
      const viewerProjects = await getUserProjects(mockUsers.viewer.id, 'viewer')
      
      expect(adminProjects).toHaveLength(0)
      expect(viewerProjects.length).toBeGreaterThan(0)
    })

    it('should return empty array for users with no projects', async () => {
      const projectIds = await getUserProjects(mockUsers.unauthorized.id)
      
      expect(projectIds).toEqual([])
    })
  })

  describe('isOrgOwner', () => {
    it('should return true for org owner', async () => {
      const result = await isOrgOwner(
        mockUsers.admin.id,
        mockOrganizations.main.id
      )
      
      expect(result).toBe(true)
    })

    it('should return false for non-owner', async () => {
      const result = await isOrgOwner(
        mockUsers.member.id,
        mockOrganizations.main.id
      )
      
      expect(result).toBe(false)
    })

    it('should return false for non-member', async () => {
      const result = await isOrgOwner(
        mockUsers.unauthorized.id,
        mockOrganizations.main.id
      )
      
      expect(result).toBe(false)
    })
  })

  describe('canManageSecrets', () => {
    it('should return true for admin and owner', async () => {
      const adminResult = await canManageSecrets(
        mockUsers.admin.id,
        mockProjects.active.id
      )
      
      expect(adminResult).toBe(true)
    })

    it('should return false for member and viewer', async () => {
      const memberResult = await canManageSecrets(
        mockUsers.member.id,
        mockProjects.active.id
      )
      const viewerResult = await canManageSecrets(
        mockUsers.viewer.id,
        mockProjects.active.id
      )
      
      expect(memberResult).toBe(false)
      expect(viewerResult).toBe(false)
    })
  })

  describe('canDeploy', () => {
    it('should return true for member and above', async () => {
      const adminResult = await canDeploy(
        mockUsers.admin.id,
        mockProjects.active.id
      )
      const memberResult = await canDeploy(
        mockUsers.member.id,
        mockProjects.active.id
      )
      
      expect(adminResult).toBe(true)
      expect(memberResult).toBe(true)
    })

    it('should return false for viewer', async () => {
      const result = await canDeploy(
        mockUsers.viewer.id,
        mockProjects.active.id
      )
      
      expect(result).toBe(false)
    })
  })

  describe('Role Hierarchy', () => {
    it('should enforce owner > admin > member > viewer', () => {
      expect(hasRoleLevel('owner', 'admin')).toBe(true)
      expect(hasRoleLevel('admin', 'member')).toBe(true)
      expect(hasRoleLevel('member', 'viewer')).toBe(true)
      
      expect(hasRoleLevel('viewer', 'member')).toBe(false)
      expect(hasRoleLevel('member', 'admin')).toBe(false)
      expect(hasRoleLevel('admin', 'owner')).toBe(false)
    })
  })
})
