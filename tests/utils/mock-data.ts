/**
 * Mock Data for Tests
 * 
 * Provides realistic mock data for testing
 */

import type { Database } from '@/types/database.types'

/**
 * Mock users
 */
export const mockUsers = {
  admin: {
    id: 'user_admin_123',
    email: 'admin@cubiqo.com',
    name: 'Admin User',
    created_at: '2024-01-01T00:00:00Z'
  },
  member: {
    id: 'user_member_456',
    email: 'member@cubiqo.com',
    name: 'Member User',
    created_at: '2024-01-02T00:00:00Z'
  },
  viewer: {
    id: 'user_viewer_789',
    email: 'viewer@cubiqo.com',
    name: 'Viewer User',
    created_at: '2024-01-03T00:00:00Z'
  },
  unauthorized: {
    id: 'user_unauth_000',
    email: 'unauth@example.com',
    name: 'Unauthorized User',
    created_at: '2024-01-04T00:00:00Z'
  }
}

/**
 * Mock organizations
 */
export const mockOrganizations = {
  main: {
    id: 'org_main_123',
    name: 'CubiQo Test Org',
    slug: 'cubiqo-test',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  secondary: {
    id: 'org_secondary_456',
    name: 'Secondary Org',
    slug: 'secondary-test',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z'
  }
}

/**
 * Mock organization members
 */
export const mockOrgMembers = [
  {
    id: 'mem_1',
    org_id: mockOrganizations.main.id,
    user_id: mockUsers.admin.id,
    role: 'owner',
    joined_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'mem_2',
    org_id: mockOrganizations.main.id,
    user_id: mockUsers.member.id,
    role: 'member',
    joined_at: '2024-01-02T00:00:00Z'
  },
  {
    id: 'mem_3',
    org_id: mockOrganizations.main.id,
    user_id: mockUsers.viewer.id,
    role: 'viewer',
    joined_at: '2024-01-03T00:00:00Z'
  }
]

/**
 * Mock projects
 */
export const mockProjects = {
  active: {
    id: 'proj_active_123',
    org_id: mockOrganizations.main.id,
    name: 'Active Project',
    stack: 'nextjs',
    status: 'active',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  inactive: {
    id: 'proj_inactive_456',
    org_id: mockOrganizations.main.id,
    name: 'Inactive Project',
    stack: 'nextjs',
    status: 'archived',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z'
  }
}

/**
 * Mock credits
 */
export const mockCredits = {
  active: {
    id: 'cred_active_123',
    org_id: mockOrganizations.main.id,
    balance: 10000,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  lowBalance: {
    id: 'cred_low_456',
    org_id: mockOrganizations.secondary.id,
    balance: 5,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z'
  }
}

/**
 * Mock secrets
 */
export const mockSecrets = {
  apiKey: {
    id: 'secret_api_123',
    project_id: mockProjects.active.id,
    key: 'STRIPE_API_KEY',
    encrypted_value: 'encrypted_value_123',
    iv: 'iv_123',
    auth_tag: 'tag_123',
    created_by: mockUsers.admin.id,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    last_rotated_at: null
  },
  dbPassword: {
    id: 'secret_db_456',
    project_id: mockProjects.active.id,
    key: 'DATABASE_PASSWORD',
    encrypted_value: 'encrypted_value_456',
    iv: 'iv_456',
    auth_tag: 'tag_456',
    created_by: mockUsers.admin.id,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    last_rotated_at: null
  }
}

/**
 * Mock audit logs
 */
export const mockAuditLogs = [
  {
    id: 'audit_1',
    user_id: mockUsers.admin.id,
    org_id: mockOrganizations.main.id,
    action: 'create',
    resource_type: 'project',
    resource_id: mockProjects.active.id,
    metadata: { name: 'Active Project' },
    ip_address: '127.0.0.1',
    user_agent: 'Mozilla/5.0',
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'audit_2',
    user_id: mockUsers.admin.id,
    org_id: mockOrganizations.main.id,
    action: 'rotate_secret',
    resource_type: 'secret',
    resource_id: mockSecrets.apiKey.id,
    metadata: { key: 'STRIPE_API_KEY' },
    ip_address: '127.0.0.1',
    user_agent: 'Mozilla/5.0',
    created_at: '2024-01-02T00:00:00Z'
  }
]

/**
 * Mock playbooks
 */
export const mockPlaybooks = {
  shopify: {
    id: 'playbook_shopify_123',
    name: 'Shopify Order Creation',
    description: 'Create orders in Shopify',
    integration: 'shopify',
    code_templates: {
      steps: [
        {
          type: 'http',
          method: 'POST',
          url: 'https://{{config.shopUrl}}/admin/api/orders.json',
          headers: {
            'X-Shopify-Access-Token': '{{secrets.SHOPIFY_TOKEN}}'
          }
        }
      ]
    },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
}

/**
 * Mock credit transactions
 */
export const mockCreditTransactions = [
  {
    id: 'tx_1',
    org_id: mockOrganizations.main.id,
    amount: -10,
    balance_after: 9990,
    transaction_type: 'usage',
    description: 'Tool execution: run-tests',
    metadata: { tool: 'run-tests' },
    created_at: '2024-01-01T12:00:00Z'
  },
  {
    id: 'tx_2',
    org_id: mockOrganizations.main.id,
    amount: 1000,
    balance_after: 10990,
    transaction_type: 'purchase',
    description: 'Credit purchase',
    metadata: { amount: 1000 },
    created_at: '2024-01-02T12:00:00Z'
  }
]

/**
 * Mock tool requests
 */
export const mockToolRequests = {
  runTests: {
    tool: 'run-tests',
    projectId: mockProjects.active.id,
    params: {
      testPattern: '*.test.ts',
      coverage: true
    }
  },
  generateImage: {
    tool: 'generate-image',
    projectId: mockProjects.active.id,
    params: {
      prompt: 'A beautiful sunset',
      size: '1024x1024'
    }
  },
  integration: {
    tool: 'integration',
    projectId: mockProjects.active.id,
    params: {
      integration: 'shopify',
      action: 'create_order',
      data: { items: [] }
    }
  }
}
