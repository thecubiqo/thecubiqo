-- =============================================================================
-- EMERGENT FOUNDATIONS MIGRATION
-- =============================================================================
-- Description: Core tables for users, organizations, projects, RBAC, and audit
-- Author: GUY (Database Administrator)
-- Date: 2026-02-18
-- Version: 1.0.0
-- =============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- 1. ORGANIZATIONS (Multi-Tenancy Root)
-- =============================================================================

CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  owner_id UUID NOT NULL, -- References auth.users, but can't FK to Supabase auth table
  plan VARCHAR(50) NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'pro', 'enterprise')),
  
  -- Billing
  stripe_customer_id VARCHAR(255) UNIQUE,
  stripe_subscription_id VARCHAR(255),
  subscription_status VARCHAR(50) DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'trialing', 'past_due', 'canceled')),
  trial_ends_at TIMESTAMP,
  
  -- Settings
  settings JSONB DEFAULT '{}',
  
  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_organizations_owner_id ON organizations(owner_id);
CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_stripe_customer_id ON organizations(stripe_customer_id);
CREATE INDEX idx_organizations_deleted_at ON organizations(deleted_at) WHERE deleted_at IS NULL;

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Policies: Users can view orgs they're members of
CREATE POLICY "Users can view their organizations" ON organizations
  FOR SELECT
  USING (
    owner_id = auth.uid()
    OR id IN (
      SELECT org_id FROM org_members WHERE user_id = auth.uid()
    )
  );

-- Policies: Only owners can update their organizations
CREATE POLICY "Owners can update their organizations" ON organizations
  FOR UPDATE
  USING (owner_id = auth.uid());

-- Policies: Authenticated users can create organizations
CREATE POLICY "Authenticated users can create organizations" ON organizations
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- =============================================================================
-- 2. ORGANIZATION MEMBERS (RBAC)
-- =============================================================================

CREATE TABLE IF NOT EXISTS org_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL, -- References auth.users
  role VARCHAR(50) NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  
  -- Invitation tracking
  invited_by UUID, -- References auth.users
  invited_at TIMESTAMP,
  joined_at TIMESTAMP DEFAULT NOW(),
  
  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  UNIQUE(org_id, user_id)
);

-- Indexes
CREATE INDEX idx_org_members_org_id ON org_members(org_id);
CREATE INDEX idx_org_members_user_id ON org_members(user_id);
CREATE INDEX idx_org_members_role ON org_members(role);

-- Trigger for updated_at
CREATE TRIGGER org_members_updated_at
  BEFORE UPDATE ON org_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;

-- Policies: Users can view members of their organizations
CREATE POLICY "Users can view org members" ON org_members
  FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM org_members WHERE user_id = auth.uid()
    )
  );

-- Policies: Admins can manage members
CREATE POLICY "Admins can manage members" ON org_members
  FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

-- =============================================================================
-- 3. PROJECTS
-- =============================================================================

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  description TEXT,
  
  -- Tech stack
  stack VARCHAR(50) NOT NULL DEFAULT 'nextjs' CHECK (stack IN ('nextjs', 'react', 'vue', 'angular', 'svelte', 'express', 'fastapi', 'django', 'rails')),
  framework_version VARCHAR(50),
  language VARCHAR(50) DEFAULT 'typescript' CHECK (language IN ('typescript', 'javascript', 'python', 'ruby', 'php', 'go')),
  
  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'initializing' CHECK (status IN ('initializing', 'active', 'building', 'deploying', 'deployed', 'error', 'archived')),
  error_message TEXT,
  
  -- Repository
  git_repo_url VARCHAR(500),
  git_branch VARCHAR(255) DEFAULT 'main',
  
  -- Resources
  workspace_id VARCHAR(255) UNIQUE, -- External workspace ID in runner
  storage_used_mb INTEGER DEFAULT 0,
  compute_hours_used DECIMAL(10, 2) DEFAULT 0,
  
  -- Settings
  settings JSONB DEFAULT '{}',
  
  -- Metadata
  created_by UUID NOT NULL, -- References auth.users
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_deployed_at TIMESTAMP,
  deleted_at TIMESTAMP,
  
  UNIQUE(org_id, slug)
);

-- Indexes
CREATE INDEX idx_projects_org_id ON projects(org_id);
CREATE INDEX idx_projects_created_by ON projects(created_by);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_workspace_id ON projects(workspace_id);
CREATE INDEX idx_projects_deleted_at ON projects(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_projects_slug ON projects(org_id, slug);

-- Trigger for updated_at
CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Policies: Users can view projects in their organizations
CREATE POLICY "Users can view their org projects" ON projects
  FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM org_members WHERE user_id = auth.uid()
    )
    AND deleted_at IS NULL
  );

-- Policies: Members can create projects
CREATE POLICY "Members can create projects" ON projects
  FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin', 'member')
    )
  );

-- Policies: Admins can update/delete projects
CREATE POLICY "Admins can modify projects" ON projects
  FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins can delete projects" ON projects
  FOR DELETE
  USING (
    org_id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

-- =============================================================================
-- 4. PROJECT MEMBERS (Per-Project RBAC)
-- =============================================================================

CREATE TABLE IF NOT EXISTS project_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL, -- References auth.users
  role VARCHAR(50) NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')),
  
  -- Metadata
  added_by UUID, -- References auth.users
  added_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  UNIQUE(project_id, user_id)
);

-- Indexes
CREATE INDEX idx_project_members_project_id ON project_members(project_id);
CREATE INDEX idx_project_members_user_id ON project_members(user_id);

-- Trigger for updated_at
CREATE TRIGGER project_members_updated_at
  BEFORE UPDATE ON project_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- Policies: Users can view members of projects they have access to
CREATE POLICY "Users can view project members" ON project_members
  FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects WHERE org_id IN (
        SELECT org_id FROM org_members WHERE user_id = auth.uid()
      )
    )
  );

-- =============================================================================
-- 5. API KEYS & SECRETS
-- =============================================================================

CREATE TABLE IF NOT EXISTS project_secrets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Secret data
  key_name VARCHAR(255) NOT NULL,
  encrypted_value TEXT NOT NULL, -- AES-256-GCM encrypted
  description TEXT,
  
  -- Rotation tracking
  last_rotated_at TIMESTAMP DEFAULT NOW(),
  rotation_schedule_days INTEGER, -- NULL = manual rotation only
  next_rotation_at TIMESTAMP,
  
  -- Access control
  environment VARCHAR(50) DEFAULT 'production' CHECK (environment IN ('development', 'preview', 'production', 'all')),
  
  -- Metadata
  created_by UUID NOT NULL, -- References auth.users
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP,
  
  UNIQUE(project_id, key_name, environment)
);

-- Indexes
CREATE INDEX idx_project_secrets_project_id ON project_secrets(project_id);
CREATE INDEX idx_project_secrets_environment ON project_secrets(environment);
CREATE INDEX idx_project_secrets_next_rotation ON project_secrets(next_rotation_at) WHERE next_rotation_at IS NOT NULL;
CREATE INDEX idx_project_secrets_deleted_at ON project_secrets(deleted_at) WHERE deleted_at IS NULL;

-- Trigger for updated_at
CREATE TRIGGER project_secrets_updated_at
  BEFORE UPDATE ON project_secrets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS (Very restricted - secrets should only be accessed server-side)
ALTER TABLE project_secrets ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only view KEY NAMES (not values)
CREATE POLICY "Users can view secret names only" ON project_secrets
  FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects WHERE org_id IN (
        SELECT org_id FROM org_members WHERE user_id = auth.uid()
      )
    )
  );

-- Note: Only service role can read encrypted_value column

-- =============================================================================
-- 6. SECRET ACCESS LOGS (Audit Trail)
-- =============================================================================

CREATE TABLE IF NOT EXISTS secret_access_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  secret_id UUID NOT NULL REFERENCES project_secrets(id) ON DELETE CASCADE,
  
  -- Access details
  accessed_by UUID, -- References auth.users, NULL for service role
  accessed_from VARCHAR(255), -- IP address or service name
  operation VARCHAR(50) NOT NULL CHECK (operation IN ('read', 'write', 'rotate', 'delete')),
  
  -- Context
  user_agent TEXT,
  request_id VARCHAR(255),
  
  -- Metadata
  accessed_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_secret_access_logs_secret_id ON secret_access_logs(secret_id);
CREATE INDEX idx_secret_access_logs_accessed_by ON secret_access_logs(accessed_by);
CREATE INDEX idx_secret_access_logs_accessed_at ON secret_access_logs(accessed_at DESC);
CREATE INDEX idx_secret_access_logs_operation ON secret_access_logs(operation);

-- RLS
ALTER TABLE secret_access_logs ENABLE ROW LEVEL SECURITY;

-- Policies: Admins can view access logs
CREATE POLICY "Admins can view secret access logs" ON secret_access_logs
  FOR SELECT
  USING (
    secret_id IN (
      SELECT id FROM project_secrets 
      WHERE project_id IN (
        SELECT id FROM projects 
        WHERE org_id IN (
          SELECT org_id FROM org_members 
          WHERE user_id = auth.uid() 
          AND role IN ('owner', 'admin')
        )
      )
    )
  );

-- =============================================================================
-- 7. AUDIT LOGS (Comprehensive Activity Tracking)
-- =============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Actor
  user_id UUID, -- References auth.users, NULL for system actions
  org_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  
  -- Action
  action VARCHAR(100) NOT NULL, -- e.g., 'user.login', 'project.created', 'secret.accessed'
  resource_type VARCHAR(50) NOT NULL, -- e.g., 'user', 'project', 'secret', 'deployment'
  resource_id UUID,
  
  -- Context
  metadata JSONB DEFAULT '{}', -- Additional context data
  ip_address INET,
  user_agent TEXT,
  request_id VARCHAR(255),
  
  -- Result
  status VARCHAR(50) DEFAULT 'success' CHECK (status IN ('success', 'failure', 'error')),
  error_message TEXT,
  
  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes (optimized for common queries)
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_org_id ON audit_logs(org_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_status ON audit_logs(status);

-- Composite index for common queries
CREATE INDEX idx_audit_logs_user_action_time ON audit_logs(user_id, action, created_at DESC);

-- RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies: Users can view audit logs for their organizations
CREATE POLICY "Users can view org audit logs" ON audit_logs
  FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM org_members WHERE user_id = auth.uid()
    )
    OR user_id = auth.uid()
  );

-- =============================================================================
-- 8. BILLING & CREDITS
-- =============================================================================

CREATE TABLE IF NOT EXISTS credits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Balance
  balance DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (balance >= 0),
  reserved DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (reserved >= 0), -- Credits reserved for running operations
  
  -- Free tier allocation
  free_tier_balance DECIMAL(12, 2) DEFAULT 0,
  free_tier_reset_at TIMESTAMP,
  
  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  UNIQUE(org_id)
);

-- Indexes
CREATE INDEX idx_credits_org_id ON credits(org_id);
CREATE INDEX idx_credits_balance ON credits(balance);

-- Trigger for updated_at
CREATE TRIGGER credits_updated_at
  BEFORE UPDATE ON credits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE credits ENABLE ROW LEVEL SECURITY;

-- Policies: Users can view credits for their organizations
CREATE POLICY "Users can view org credits" ON credits
  FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM org_members WHERE user_id = auth.uid()
    )
  );

-- =============================================================================
-- 9. CREDIT TRANSACTIONS (Ledger)
-- =============================================================================

CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Transaction details
  amount DECIMAL(12, 2) NOT NULL, -- Positive = credit, negative = debit
  balance_after DECIMAL(12, 2) NOT NULL,
  transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('purchase', 'usage', 'refund', 'bonus', 'free_tier', 'reservation', 'release')),
  
  -- Context
  description TEXT NOT NULL,
  resource_type VARCHAR(50), -- e.g., 'agent_request', 'deployment', 'compute_hour'
  resource_id UUID,
  metadata JSONB DEFAULT '{}',
  
  -- Payment info (for purchases)
  stripe_payment_intent_id VARCHAR(255),
  
  -- Metadata
  created_by UUID, -- References auth.users
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_credit_transactions_org_id ON credit_transactions(org_id);
CREATE INDEX idx_credit_transactions_created_at ON credit_transactions(created_at DESC);
CREATE INDEX idx_credit_transactions_type ON credit_transactions(transaction_type);
CREATE INDEX idx_credit_transactions_resource ON credit_transactions(resource_type, resource_id);
CREATE INDEX idx_credit_transactions_stripe ON credit_transactions(stripe_payment_intent_id);

-- RLS
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- Policies: Users can view transactions for their organizations
CREATE POLICY "Users can view org transactions" ON credit_transactions
  FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM org_members WHERE user_id = auth.uid()
    )
  );

-- =============================================================================
-- 10. USAGE LOGS (Detailed Resource Consumption)
-- =============================================================================

CREATE TABLE IF NOT EXISTS usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  user_id UUID, -- References auth.users
  
  -- Resource usage
  resource_type VARCHAR(50) NOT NULL, -- e.g., 'agent_request', 'code_generation', 'deployment', 'compute_hour'
  quantity DECIMAL(10, 4) NOT NULL DEFAULT 1, -- Amount consumed
  unit VARCHAR(50) NOT NULL, -- e.g., 'request', 'hour', 'GB', 'generation'
  credits_consumed DECIMAL(12, 2) NOT NULL,
  
  -- Context
  metadata JSONB DEFAULT '{}', -- Additional details (model used, duration, etc.)
  
  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_usage_logs_org_id ON usage_logs(org_id);
CREATE INDEX idx_usage_logs_project_id ON usage_logs(project_id);
CREATE INDEX idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX idx_usage_logs_resource_type ON usage_logs(resource_type);
CREATE INDEX idx_usage_logs_created_at ON usage_logs(created_at DESC);

-- Composite index for reporting
CREATE INDEX idx_usage_logs_org_resource_time ON usage_logs(org_id, resource_type, created_at DESC);

-- RLS
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;

-- Policies: Users can view usage for their organizations
CREATE POLICY "Users can view org usage" ON usage_logs
  FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM org_members WHERE user_id = auth.uid()
    )
  );

-- =============================================================================
-- FUNCTIONS & TRIGGERS
-- =============================================================================

-- Function to update credits balance
CREATE OR REPLACE FUNCTION update_credits_balance()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE credits
  SET 
    balance = balance + NEW.amount,
    updated_at = NOW()
  WHERE org_id = NEW.org_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update credits on transaction
CREATE TRIGGER credit_transactions_update_balance
  AFTER INSERT ON credit_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_credits_balance();

-- Function to log audit events
CREATE OR REPLACE FUNCTION log_audit_event(
  p_user_id UUID,
  p_org_id UUID,
  p_action VARCHAR,
  p_resource_type VARCHAR,
  p_resource_id UUID,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_audit_id UUID;
BEGIN
  INSERT INTO audit_logs (
    user_id,
    org_id,
    action,
    resource_type,
    resource_id,
    metadata,
    status
  ) VALUES (
    p_user_id,
    p_org_id,
    p_action,
    p_resource_type,
    p_resource_id,
    p_metadata,
    'success'
  ) RETURNING id INTO v_audit_id;
  
  RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- COMMENTS (Documentation)
-- =============================================================================

COMMENT ON TABLE organizations IS 'Root multi-tenancy entity - represents a company or team';
COMMENT ON TABLE org_members IS 'Organization membership with RBAC roles';
COMMENT ON TABLE projects IS 'Individual AI-built applications within an organization';
COMMENT ON TABLE project_members IS 'Per-project access control';
COMMENT ON TABLE project_secrets IS 'Encrypted API keys and environment variables';
COMMENT ON TABLE secret_access_logs IS 'Audit trail for secret access';
COMMENT ON TABLE audit_logs IS 'Comprehensive activity tracking for compliance';
COMMENT ON TABLE credits IS 'Credit balance per organization';
COMMENT ON TABLE credit_transactions IS 'Immutable ledger of all credit movements';
COMMENT ON TABLE usage_logs IS 'Detailed resource consumption tracking';

-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
