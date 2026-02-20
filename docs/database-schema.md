# Epic 1: Database Schema Documentation

**Author:** @guy (Database Administrator)  
**Date:** 2026-02-18  
**Migration:** `20260218_001_epic1_foundations.sql`

---

## Overview

Complete database schema for AI App Factory Epic 1 (Foundations), implementing multi-tenant organizations, projects, environments, encrypted secrets, and audit logging.

## Tables

### 1. `organizations`

Primary tenant table for the platform.

**Columns:**
- `id` (UUID, PK): Unique organization identifier
- `name` (TEXT): Organization display name
- `slug` (TEXT, UNIQUE): URL-friendly identifier
- `billing_tier` (TEXT): Subscription tier (free/pro/enterprise)
- `credits_remaining` (INTEGER): Available compute credits
- `created_at` (TIMESTAMPTZ): Creation timestamp
- `updated_at` (TIMESTAMPTZ): Last update timestamp

**Indexes:**
- `idx_organizations_slug`: Fast slug lookups
- `idx_organizations_created_at`: Chronological queries

**RLS Policies:**
- SELECT: Users can view organizations they're members of
- UPDATE: Owners and admins can update
- INSERT: Any authenticated user can create
- DELETE: Only owners can delete

### 2. `org_members`

Organization membership with RBAC roles.

**Columns:**
- `org_id` (UUID, FK → organizations)
- `user_id` (UUID, FK → auth.users)
- `role` (TEXT): User role (owner/admin/member/viewer)
- `joined_at` (TIMESTAMPTZ): Membership start date

**Primary Key:** `(org_id, user_id)`

**Roles:**
- **owner**: Full control, can delete org, manage billing
- **admin**: Manage projects, members, deployments
- **member**: Create/edit projects, trigger builds
- **viewer**: Read-only access

**RLS Policies:**
- SELECT: Users can view members of their orgs
- INSERT: Admins and owners can add members
- DELETE: Admins and owners can remove members

### 3. `projects`

Projects within organizations.

**Columns:**
- `id` (UUID, PK): Unique project identifier
- `org_id` (UUID, FK → organizations)
- `name` (TEXT): Project display name
- `slug` (TEXT): URL-friendly identifier (unique within org)
- `description` (TEXT): Project description
- `framework` (TEXT): Framework type (nextjs/expo/fastapi)
- `status` (TEXT): Project status (draft/preview/deployed)
- `git_repo` (TEXT): Git repository URL
- `preview_url` (TEXT): Preview deployment URL
- `production_url` (TEXT): Production deployment URL
- `created_at` (TIMESTAMPTZ): Creation timestamp
- `updated_at` (TIMESTAMPTZ): Last update timestamp

**Unique Constraint:** `(org_id, slug)`

**Indexes:**
- `idx_projects_org_id`: Organization queries
- `idx_projects_status`: Status filtering
- `idx_projects_created_at`: Chronological queries

**RLS Policies:**
- SELECT: Users can view their org's projects
- INSERT: Members+ can create projects
- UPDATE: Members+ can update projects
- DELETE: Admins+ can delete projects

### 4. `environments`

Deployment environments for each project.

**Columns:**
- `id` (UUID, PK): Unique environment identifier
- `project_id` (UUID, FK → projects)
- `name` (TEXT): Environment name (development/preview/production)
- `created_at` (TIMESTAMPTZ): Creation timestamp

**Unique Constraint:** `(project_id, name)`

**Auto-Created:** Three default environments (development, preview, production) are automatically created for each new project.

**RLS Policies:**
- SELECT: Users can view environments for their projects
- ALL: Members+ can manage environments

### 5. `env_variables`

Environment variables with optional encryption.

**Columns:**
- `id` (UUID, PK): Unique variable identifier
- `environment_id` (UUID, FK → environments)
- `key` (TEXT): Variable name
- `value` (TEXT): Variable value (encrypted if is_secret=true)
- `is_secret` (BOOLEAN): Whether value is encrypted
- `created_at` (TIMESTAMPTZ): Creation timestamp
- `updated_at` (TIMESTAMPTZ): Last update timestamp

**Unique Constraint:** `(environment_id, key)`

**Security:**
- Values with `is_secret=true` are encrypted using `pgcrypto`
- Encryption/decryption happens server-side only
- RLS policies allow SELECT, but application layer masks secrets in API responses

**RLS Policies:**
- SELECT: Users can view env vars (secrets masked in app layer)
- ALL: Members+ can manage env vars

### 6. `audit_logs`

Audit trail for security-sensitive actions.

**Columns:**
- `id` (UUID, PK): Unique log identifier
- `org_id` (UUID, FK → organizations)
- `user_id` (UUID, FK → auth.users, nullable)
- `action` (TEXT): Action performed
- `resource_type` (TEXT): Type of resource affected
- `resource_id` (TEXT): ID of affected resource
- `metadata` (JSONB): Additional context
- `ip_address` (INET): Client IP address
- `user_agent` (TEXT): Client user agent
- `created_at` (TIMESTAMPTZ): Action timestamp

**Indexes:**
- `idx_audit_logs_org_id`: Organization queries
- `idx_audit_logs_user_id`: User activity queries
- `idx_audit_logs_resource`: Resource-specific queries
- `idx_audit_logs_action`: Action filtering
- `idx_audit_logs_created_at`: Chronological queries

**RLS Policies:**
- SELECT: Users can view their org's audit logs
- INSERT: Only via server-side functions (no direct user insert)

---

## Security Functions

### Encryption Functions

**`encrypt_secret(secret TEXT, encryption_key TEXT) RETURNS TEXT`**
- Encrypts a secret using pgcrypto symmetric encryption
- Returns base64-encoded ciphertext
- SECURITY DEFINER: Runs with elevated privileges

**`decrypt_secret(encrypted TEXT, encryption_key TEXT) RETURNS TEXT`**
- Decrypts a secret using pgcrypto symmetric decryption
- Takes base64-encoded ciphertext
- SECURITY DEFINER: Runs with elevated privileges

**Usage:**
```sql
-- Encrypt (server-side only)
INSERT INTO env_variables (environment_id, key, value, is_secret)
VALUES (
    'env-uuid',
    'API_KEY',
    encrypt_secret('sk-...', current_setting('app.encryption_key')),
    true
);

-- Decrypt (server-side only, never returned to client)
SELECT 
    key,
    CASE 
        WHEN is_secret THEN '[REDACTED]'
        ELSE value
    END as value
FROM env_variables;
```

---

## Triggers

### Auto-Create Owner Membership

When a new organization is created, the creating user is automatically added as an owner.

**Trigger:** `create_org_owner_membership_trigger`  
**Function:** `create_org_owner_membership()`

### Auto-Create Default Environments

When a new project is created, three default environments are automatically created:
- development
- preview
- production

**Trigger:** `create_default_environments_trigger`  
**Function:** `create_default_environments()`

### Update Timestamps

Automatically updates `updated_at` column on UPDATE operations.

**Triggers:**
- `update_organizations_updated_at`
- `update_projects_updated_at`
- `update_env_variables_updated_at`

**Function:** `update_updated_at()`

---

## Row-Level Security (RLS)

All tables have RLS enabled. Policies enforce:

1. **Multi-tenancy isolation**: Users only access their organization's data
2. **Role-based access control**: Different permissions based on role
3. **Audit log immutability**: Users can read but not modify logs

### Permission Matrix

| Resource | Owner | Admin | Member | Viewer |
|----------|-------|-------|--------|--------|
| View Org | ✅ | ✅ | ✅ | ✅ |
| Update Org | ✅ | ✅ | ❌ | ❌ |
| Delete Org | ✅ | ❌ | ❌ | ❌ |
| Manage Members | ✅ | ✅ | ❌ | ❌ |
| Create Project | ✅ | ✅ | ✅ | ❌ |
| Update Project | ✅ | ✅ | ✅ | ❌ |
| Delete Project | ✅ | ✅ | ❌ | ❌ |
| Manage Env Vars | ✅ | ✅ | ✅ | ❌ |
| View Audit Logs | ✅ | ✅ | ✅ | ✅ |

---

## Query Examples

### Get user's organizations

```sql
SELECT o.* 
FROM organizations o
JOIN org_members om ON o.id = om.org_id
WHERE om.user_id = auth.uid();
```

### Get organization's projects

```sql
SELECT p.* 
FROM projects p
WHERE p.org_id = 'org-uuid'
AND p.org_id IN (
    SELECT org_id FROM org_members WHERE user_id = auth.uid()
);
```

### Get project's environment variables (secrets masked)

```sql
SELECT 
    key,
    CASE 
        WHEN is_secret THEN '[REDACTED]'
        ELSE value
    END as value,
    is_secret,
    created_at
FROM env_variables
WHERE environment_id = 'env-uuid';
```

### Audit log for organization

```sql
SELECT * 
FROM audit_logs
WHERE org_id = 'org-uuid'
ORDER BY created_at DESC
LIMIT 100;
```

---

## Migration Instructions

### Apply Migration

```bash
# Using Supabase CLI
supabase db push

# Or manually
psql -h your-db-host -U postgres -d postgres -f supabase/migrations/20260218_001_epic1_foundations.sql
```

### Verify Migration

```sql
-- Check tables created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('organizations', 'org_members', 'projects', 'environments', 'env_variables', 'audit_logs');

-- Check RLS enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Check encryption functions exist
SELECT proname 
FROM pg_proc 
WHERE proname IN ('encrypt_secret', 'decrypt_secret');
```

---

## Performance Considerations

### Indexes

All foreign keys are indexed for join performance. Additional indexes:
- Slug lookups (organizations)
- Status filtering (projects)
- Chronological queries (created_at on all tables)
- Audit log queries (multiple composite indexes)

### Query Optimization

- Use prepared statements to leverage query plan caching
- Batch insert operations when possible
- Use `SELECT *` sparingly; specify needed columns
- Leverage indexes for WHERE clauses

### Encryption Performance

Encryption/decryption is computationally expensive:
- Only encrypt truly sensitive data (API keys, tokens)
- Cache decrypted values server-side when safe
- Consider key rotation strategy for long-term secrets

---

## Security Checklist

- [x] RLS enabled on all tables
- [x] Encryption functions use SECURITY DEFINER
- [x] Secrets encrypted at rest (pgcrypto)
- [x] No secrets returned to client (masked in app layer)
- [x] Audit logging for sensitive operations
- [x] Role-based access control enforced
- [x] Foreign key constraints prevent orphaned data
- [x] Triggers automate security (owner creation)

---

## Next Steps

1. **@blossom**: Implement API routes using this schema
2. **@bubbles**: Build UI components for org/project management
3. **@buttercup**: Write tests for RLS policies and encryption
4. **@guy**: Monitor query performance and add indexes as needed

---

**Status:** ✅ Epic 1 Database Schema Complete  
**Last Updated:** 2026-02-18
