# Emergent AI App Builder - Backend Implementation

## Overview

This is the complete backend implementation for the **Emergent-Level AI App Builder + Post-Launch OS** project. The backend provides:

- **Control Plane APIs** for managing organizations, projects, secrets, and deployments
- **Agent Orchestrator** for coordinating subagents and tool execution
- **Security Layer** with encryption, RBAC, and comprehensive audit logging
- **Integration Framework** for third-party service playbooks (Shopify, Printify, etc.)

## Architecture

```
src/
├── app/api/emergent/           # API Routes (Next.js App Router)
│   ├── orgs/                   # Organizations (POST, GET)
│   ├── projects/               # Projects (POST, GET, GET/:id)
│   ├── secrets/                # Secrets Management (POST, GET, DELETE, PUT/rotate)
│   ├── audit/                  # Audit Logs (GET)
│   ├── workspaces/             # TODO: Workspace management
│   └── deployments/            # TODO: Deployment management
│
└── lib/emergent/               # Core Backend Logic
    ├── agent-types.ts          # TypeScript type definitions
    ├── orchestrator.ts         # Main agent orchestrator
    │
    ├── security/               # Security utilities
    │   ├── secrets-manager.ts  # AES-256-GCM encryption/decryption
    │   ├── rbac.ts             # Role-based access control
    │   └── audit-logger.ts     # Comprehensive audit logging
    │
    ├── subagents/              # Subagent implementations
    │   ├── testing-agent.ts    # Test runner
    │   ├── image-agent.ts      # Image generation
    │   └── integration-agent.ts # Integration executor
    │
    └── integrations/           # Integration framework
        ├── playbook-executor.ts # Execute integration playbooks
        ├── playbook-schema.ts   # Playbook validation
        └── playbooks/
            ├── shopify.ts       # Shopify integration
            └── printify.ts      # Printify integration
```

## API Endpoints

### Organizations

**Create Organization**
```
POST /api/emergent/orgs
Body: { name, slug, plan? }
Response: { success, data: { id, name, slug, plan, createdAt }, error }
```

**List User's Organizations**
```
GET /api/emergent/orgs
Response: { success, data: [orgs], error, metadata: { total } }
```

### Projects

**Create Project**
```
POST /api/emergent/projects
Body: { orgId, name, slug, description?, stack, framework?, language? }
Response: { success, data: { id, orgId, name, slug, stack, ... }, error }
```

**List Projects**
```
GET /api/emergent/projects?orgId=xxx
Response: { success, data: [projects], error, metadata: { total } }
```

**Get Project Details**
```
GET /api/emergent/projects/{id}
Response: { success, data: { project, recentDeployments, workspace }, error }
```

### Secrets Management

**Create Secret**
```
POST /api/emergent/secrets
Body: { projectId, key, value, description? }
Response: { success, data: { id, key, maskedValue, ... }, error }
```

**List Secrets (Metadata Only)**
```
GET /api/emergent/secrets?projectId=xxx
Response: { success, data: [secrets], error, metadata: { total, warning } }
```

**Rotate Secret**
```
PUT /api/emergent/secrets/{id}/rotate
Response: { success, data: { id, lastRotatedAt, ... }, error }
```

**Delete Secret**
```
DELETE /api/emergent/secrets/{id}
Response: { success, data: { id }, error }
```

### Audit Logs

**Query Audit Logs**
```
GET /api/emergent/audit?orgId=xxx&resourceType=project&startDate=...&limit=50
Response: { success, data: [logs], error, metadata: { total, limit, offset, hasMore } }
```

## Security Features

### 1. AES-256-GCM Encryption

All secrets are encrypted using AES-256-GCM before storage:

```typescript
import { encryptSecret, decryptSecret } from '@/lib/emergent/security/secrets-manager'

// Encrypt
const encrypted = encryptSecret('my-api-key')
// Store: encrypted.encryptedValue, encrypted.iv, encrypted.authTag

// Decrypt
const plaintext = decryptSecret({
  encryptedValue: row.encrypted_value,
  iv: row.iv,
  authTag: row.auth_tag
})
```

**Key Features:**
- 256-bit encryption key derived from service role key
- Random IV per encryption (rotation-safe)
- Authentication tag prevents tampering
- Never exposes plaintext to frontend

### 2. Role-Based Access Control (RBAC)

Role hierarchy: `owner (3) > admin (2) > member (1) > viewer (0)`

```typescript
import { requireProjectPermission } from '@/lib/emergent/security/rbac'

// In API route
await requireProjectPermission(userId, projectId, 'admin') // Throws if insufficient permissions
```

**Permissions Matrix:**

| Action | Viewer | Member | Admin | Owner |
|--------|--------|--------|-------|-------|
| View project | ✅ | ✅ | ✅ | ✅ |
| Deploy | ❌ | ✅ | ✅ | ✅ |
| Manage secrets | ❌ | ❌ | ✅ | ✅ |
| Delete project | ❌ | ❌ | ❌ | ✅ |

### 3. Comprehensive Audit Logging

Every action is logged to `audit_logs` table:

```typescript
import { logAudit } from '@/lib/emergent/security/audit-logger'

await logAudit({
  userId: user.id,
  orgId: org.id,
  action: 'create',
  resourceType: 'project',
  resourceId: project.id,
  metadata: { name, stack },
  ipAddress: getIpAddress(request.headers),
  userAgent: getUserAgent(request.headers)
})
```

**Features:**
- All CRUD operations logged
- Secret access tracking (`secret_access_logs`)
- IP address and user agent capture
- 2-year retention (auto-purge)

## Agent Orchestrator

The orchestrator coordinates subagents and enforces business rules:

```typescript
import { executeTool } from '@/lib/emergent/orchestrator'

const response = await executeTool(
  {
    tool: 'run-tests',
    projectId: 'proj_123',
    params: { testPattern: '*.test.ts', coverage: true }
  },
  userId,
  request.headers
)
```

**Orchestrator Flow:**

1. **Validate Input** - Zod schema validation
2. **Check Permissions** - RBAC enforcement
3. **Check Rate Limits** - Per-tool rate limiting
4. **Check Credits** - Ensure sufficient balance
5. **Route to Subagent** - Execute appropriate subagent
6. **Deduct Credits** - Update org balance
7. **Log Audit Event** - Record action
8. **Return Response** - Standardized format

**Tool Costs (Credits):**

| Tool | Cost | Rate Limit (per min) |
|------|------|----------------------|
| bulk-write | 10 | 10 |
| bulk-edit | 5 | 20 |
| view-files | 1 | 100 |
| run-tests | 20 | 5 |
| integration | 15 | 30 |
| generate-image | 100 | 10 |
| deploy | 100 | 5 |

## Subagents

### 1. Testing Agent

Executes test suites and generates coverage reports.

```typescript
// Internal use only
const result = await executeTestAgent({
  type: 'test',
  projectId: 'proj_123',
  params: {
    testPattern: '**/*.test.ts',
    coverage: true,
    timeout: 60000
  }
})
```

### 2. Image Agent

Generates images using DALL-E or Stable Diffusion.

```typescript
const result = await executeImageAgent({
  type: 'image',
  projectId: 'proj_123',
  params: {
    prompt: 'Modern SaaS dashboard UI',
    size: '1024x1024',
    style: 'vivid'
  }
})
```

### 3. Integration Agent

Executes integration playbooks for third-party services.

```typescript
const result = await executeIntegrationAgent({
  type: 'integration',
  projectId: 'proj_123',
  params: {
    service: 'shopify',
    action: 'sync_products',
    limit: 50
  }
})
```

## Integration Framework

### Playbook Structure

```typescript
const playbook = {
  name: 'Shopify E-commerce Integration',
  service: 'shopify',
  version: '1.0.0',
  parameters: [
    { name: 'action', type: 'string', required: true },
    { name: 'productId', type: 'string', required: false }
  ],
  steps: [
    {
      name: 'Fetch Products',
      type: 'http',
      config: {
        method: 'GET',
        url: 'https://{{secrets.SHOPIFY_STORE_URL}}/admin/api/2024-01/products.json',
        headers: { 'X-Shopify-Access-Token': '{{secrets.SHOPIFY_API_KEY}}' }
      }
    }
  ]
}
```

### Supported Services

- **E-commerce:** Shopify, Printify
- **Payments:** Stripe
- **Communication:** SendGrid, Twilio
- **Infrastructure:** Vercel, Cloudflare
- **VCS:** GitHub, GitLab

### Variable Substitution

Playbooks support variable interpolation:

- `{{secrets.SECRET_KEY}}` - Inject secret
- `{{vars.paramName}}` - Use parameter
- `{{config.configKey}}` - Use integration config

## Database Schema

Key tables implemented:

- `organizations` - Root tenant entity
- `org_members` - User-org relationships with roles
- `projects` - Individual applications
- `project_secrets` - Encrypted API keys
- `credits` - Organization credit balance
- `credit_transactions` - Usage tracking
- `audit_logs` - Comprehensive activity log
- `secret_access_logs` - Secret access tracking
- `integrations` - Third-party service connections
- `playbooks` - Integration recipes
- `workspaces` - Execution sandboxes (TODO)
- `deployments` - Live instances (TODO)

## Error Handling

All API responses follow standard format:

```typescript
interface ToolResponse<T> {
  success: boolean
  data: T | null
  error: string | null
  metadata?: Record<string, unknown>
}
```

**HTTP Status Codes:**

- `200` - Success
- `201` - Created
- `400` - Validation error
- `401` - Unauthorized (not logged in)
- `403` - Forbidden (insufficient permissions)
- `404` - Not found
- `409` - Conflict (duplicate slug, etc.)
- `429` - Rate limit exceeded
- `500` - Internal server error

## Testing

All critical paths should be tested:

```bash
# Run tests
npm run test

# Run with coverage
npm run test:coverage
```

## Environment Variables

Required:

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (for encryption)
- `EMERGENT_ENCRYPTION_KEY` - (Optional) Dedicated encryption key

## TODO

Remaining implementation work:

1. **Workspaces API** - Container management, terminal WebSocket
2. **Deployments API** - Deploy to production, rollback
3. **Code Subagent** - File operations (bulk-write, bulk-edit, view-files)
4. **Human Subagent** - Ask human via UI
5. **Migration Subagent** - Database migrations
6. **Rate Limiter** - Redis-based distributed rate limiting
7. **Webhook Processing** - Handle incoming webhooks from integrations
8. **Usage Analytics** - Track tool usage, performance metrics

## Coordination with Team

### For Bubbles (Frontend Developer)

API contracts are defined and ready for integration:

- All endpoints return standardized `ToolResponse<T>` format
- Use `POST /api/emergent/orgs` to create organizations
- Use `POST /api/emergent/projects` to create projects
- Use `POST /api/emergent/secrets` to add API keys (never stored client-side)
- Secrets are automatically masked on response (`maskedValue`)

### For Buttercup (QA Engineer)

Test coverage areas:

- **Unit tests** for security utilities (encryption, RBAC)
- **Integration tests** for API endpoints
- **Permission tests** - Verify RBAC enforcement
- **Rate limit tests** - Ensure limits work correctly
- **Audit log tests** - Verify all actions are logged

### For Guy (DBA)

Database requirements:

- All tables follow 3NF normalization
- Indexes on foreign keys and common query patterns
- RLS policies for multi-tenancy
- Triggers for `updated_at` timestamps
- pg_cron job for audit log purging (2-year retention)

### For MO (CTO)

Review priorities:

- Security implementation (encryption, RBAC, audit logging)
- Error handling and edge cases
- Rate limiting and credit enforcement
- Code organization and documentation

## Notes

- **Security First:** Never expose secrets to frontend, always validate permissions
- **Rate Limits:** In-memory for now, use Redis in production
- **Credits:** Deducted transactionally with audit trail
- **Subagents:** Main agent only, no subagent-to-subagent calls
- **Idempotency:** Tools safely callable multiple times

---

Built with ❤️ by Blossom (Backend Developer) for the Powerpuff Girls dev team.
