-- =============================================================================
-- EMERGENT RUNNER SYSTEM MIGRATION (Ciqo Edition)
-- =============================================================================
-- Description: Tables for Ciqo (formerly Emergent Runner) workspaces, deployments
-- Author: Antigravity Agent
-- Date: 2026-02-18
-- Version: 1.0.1
-- =============================================================================

-- =============================================================================
-- 1. WORKSPACES (Sandboxed Execution Environments)
-- =============================================================================

CREATE TABLE IF NOT EXISTS emergent_workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES emergent_projects(id) ON DELETE CASCADE,
  
  -- Workspace identity
  workspace_id VARCHAR(255) UNIQUE NOT NULL, -- External ID in Ciqo runner system
  subdomain VARCHAR(100) UNIQUE NOT NULL, -- e.g., 'proj-abc123.emergent.dev'
  
  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'initializing' CHECK (status IN ('initializing', 'running', 'stopped', 'error', 'terminated')),
  error_message TEXT,
  
  -- Container info
  container_id VARCHAR(255),
  container_image VARCHAR(255),
  port INTEGER DEFAULT 3000,
  
  -- Resource limits
  cpu_limit_cores DECIMAL(4, 2) DEFAULT 1.0,
  memory_limit_mb INTEGER DEFAULT 2048,
  storage_limit_mb INTEGER DEFAULT 1024,
  
  -- Resource usage
  cpu_usage_percent DECIMAL(5, 2),
  memory_usage_mb INTEGER,
  storage_used_mb INTEGER DEFAULT 0,
  
  -- Runtime
  started_at TIMESTAMP WITH TIME ZONE,
  stopped_at TIMESTAMP WITH TIME ZONE,
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Auto-shutdown
  auto_shutdown_minutes INTEGER DEFAULT 60, -- Stop after inactivity
  shutdown_scheduled_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  UNIQUE(project_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_emergent_workspaces_project_id ON emergent_workspaces(project_id);
CREATE INDEX IF NOT EXISTS idx_emergent_workspaces_workspace_id ON emergent_workspaces(workspace_id);
CREATE INDEX IF NOT EXISTS idx_emergent_workspaces_status ON emergent_workspaces(status);
CREATE INDEX IF NOT EXISTS idx_emergent_workspaces_subdomain ON emergent_workspaces(subdomain);
CREATE INDEX IF NOT EXISTS idx_emergent_workspaces_last_activity ON emergent_workspaces(last_activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_emergent_workspaces_shutdown_scheduled ON emergent_workspaces(shutdown_scheduled_at) WHERE shutdown_scheduled_at IS NOT NULL;

-- Trigger for updated_at
CREATE TRIGGER emergent_workspaces_updated_at
  BEFORE UPDATE ON emergent_workspaces
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE emergent_workspaces ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view project workspaces" ON emergent_workspaces
  FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM emergent_projects WHERE org_id IN (
        SELECT org_id FROM emergent_org_members WHERE user_id = auth.uid()
      )
    )
  );

-- =============================================================================
-- 2. DEPLOYMENTS (Build & Deploy History)
-- =============================================================================

CREATE TABLE IF NOT EXISTS emergent_deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES emergent_projects(id) ON DELETE CASCADE,
  
  -- Deployment identity
  deployment_number INTEGER, -- Auto-increment per project
  version VARCHAR(50), -- e.g., 'v1.2.3' or commit SHA
  
  -- Environment
  environment VARCHAR(50) NOT NULL DEFAULT 'preview' CHECK (environment IN ('development', 'preview', 'production')),
  
  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'building', 'deploying', 'active', 'failed', 'canceled', 'archived')),
  error_message TEXT,
  
  -- Build info
  build_started_at TIMESTAMP WITH TIME ZONE,
  build_completed_at TIMESTAMP WITH TIME ZONE,
  build_duration_seconds INTEGER,
  build_logs_url TEXT,
  
  -- Deploy info
  deploy_started_at TIMESTAMP WITH TIME ZONE,
  deploy_completed_at TIMESTAMP WITH TIME ZONE,
  deploy_duration_seconds INTEGER,
  deploy_logs_url TEXT,
  
  -- URLs
  preview_url VARCHAR(500), -- e.g., 'https://proj-abc123-v5.emergent.dev'
  production_url VARCHAR(500),
  
  -- Source
  git_commit_sha VARCHAR(255),
  git_branch VARCHAR(255),
  git_commit_message TEXT,
  git_author VARCHAR(255),
  
  -- Platform
  platform VARCHAR(50) DEFAULT 'vercel' CHECK (platform IN ('vercel', 'netlify', 'cloudflare', 'custom')),
  platform_deployment_id VARCHAR(255),
  platform_url VARCHAR(500),
  
  -- Health check
  health_check_url VARCHAR(500),
  health_check_status VARCHAR(50),
  health_check_last_checked_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  triggered_by UUID, -- References auth.users
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  UNIQUE(project_id, deployment_number)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_emergent_deployments_project_id ON emergent_deployments(project_id);
CREATE INDEX IF NOT EXISTS idx_emergent_deployments_environment ON emergent_deployments(environment);
CREATE INDEX IF NOT EXISTS idx_emergent_deployments_status ON emergent_deployments(status);
CREATE INDEX IF NOT EXISTS idx_emergent_deployments_created_at ON emergent_deployments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_emergent_deployments_platform_id ON emergent_deployments(platform, platform_deployment_id);
CREATE INDEX IF NOT EXISTS idx_emergent_deployments_git_commit ON emergent_deployments(git_commit_sha);

-- Trigger for updated_at
CREATE TRIGGER emergent_deployments_updated_at
  BEFORE UPDATE ON emergent_deployments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to auto-increment deployment_number
CREATE OR REPLACE FUNCTION set_deployment_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.deployment_number IS NULL THEN
    SELECT COALESCE(MAX(deployment_number), 0) + 1
    INTO NEW.deployment_number
    FROM emergent_deployments
    WHERE project_id = NEW.project_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER emergent_deployments_set_number
  BEFORE INSERT ON emergent_deployments
  FOR EACH ROW
  EXECUTE FUNCTION set_deployment_number();

-- RLS
ALTER TABLE emergent_deployments ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view project deployments" ON emergent_deployments
  FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM emergent_projects WHERE org_id IN (
        SELECT org_id FROM emergent_org_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Members can create deployments" ON emergent_deployments
  FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT id FROM emergent_projects WHERE org_id IN (
        SELECT org_id FROM emergent_org_members 
        WHERE user_id = auth.uid() 
        AND role IN ('owner', 'admin', 'member')
      )
    )
  );

-- =============================================================================
-- 3. CUSTOM DOMAINS
-- =============================================================================

CREATE TABLE IF NOT EXISTS emergent_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES emergent_projects(id) ON DELETE CASCADE,
  
  -- Domain info
  domain VARCHAR(255) UNIQUE NOT NULL,
  subdomain VARCHAR(100), -- Optional subdomain (e.g., 'app' in 'app.example.com')
  
  -- DNS verification
  verification_status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'failed')),
  verification_token VARCHAR(255) UNIQUE,
  verification_method VARCHAR(50) DEFAULT 'txt' CHECK (verification_method IN ('txt', 'cname')),
  verified_at TIMESTAMP WITH TIME ZONE,
  
  -- SSL/TLS
  ssl_status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (ssl_status IN ('pending', 'issued', 'failed', 'expired')),
  ssl_cert_issued_at TIMESTAMP WITH TIME ZONE,
  ssl_cert_expires_at TIMESTAMP WITH TIME ZONE,
  ssl_cert_auto_renew BOOLEAN DEFAULT TRUE,
  
  -- DNS records
  dns_records JSONB DEFAULT '[]',
  
  -- Deployment target
  environment VARCHAR(50) NOT NULL DEFAULT 'production' CHECK (environment IN ('preview', 'production')),
  deployment_id UUID REFERENCES emergent_deployments(id) ON DELETE SET NULL,
  
  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'configuring' CHECK (status IN ('configuring', 'active', 'error', 'disabled')),
  error_message TEXT,
  
  -- Metadata
  added_by UUID NOT NULL, -- References auth.users
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_emergent_domains_project_id ON emergent_domains(project_id);
CREATE INDEX IF NOT EXISTS idx_emergent_domains_domain ON emergent_domains(domain);
CREATE INDEX IF NOT EXISTS idx_emergent_domains_verification_status ON emergent_domains(verification_status);
CREATE INDEX IF NOT EXISTS idx_emergent_domains_ssl_status ON emergent_domains(ssl_status);
CREATE INDEX IF NOT EXISTS idx_emergent_domains_ssl_expires ON emergent_domains(ssl_cert_expires_at) WHERE ssl_cert_expires_at IS NOT NULL;

-- Trigger for updated_at
CREATE TRIGGER emergent_domains_updated_at
  BEFORE UPDATE ON emergent_domains
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE emergent_domains ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view project domains" ON emergent_domains
  FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM emergent_projects WHERE org_id IN (
        SELECT org_id FROM emergent_org_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Admins can manage domains" ON emergent_domains
  FOR ALL
  USING (
    project_id IN (
      SELECT id FROM emergent_projects WHERE org_id IN (
        SELECT org_id FROM emergent_org_members 
        WHERE user_id = auth.uid() 
        AND role IN ('owner', 'admin')
      )
    )
  );

-- =============================================================================
-- 4. ENVIRONMENT VARIABLES
-- =============================================================================

CREATE TABLE IF NOT EXISTS emergent_env_vars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES emergent_projects(id) ON DELETE CASCADE,
  
  -- Variable info
  key_name VARCHAR(255) NOT NULL,
  value_encrypted TEXT NOT NULL, -- Encrypted value
  description TEXT,
  
  -- Environment targeting
  environment VARCHAR(50) NOT NULL DEFAULT 'all' CHECK (environment IN ('development', 'preview', 'production', 'all')),
  
  -- Type
  is_secret BOOLEAN DEFAULT FALSE, -- If true, treated as sensitive
  is_system BOOLEAN DEFAULT FALSE, -- If true, managed by system (not user)
  
  -- Metadata
  created_by UUID NOT NULL, -- References auth.users
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  UNIQUE(project_id, key_name, environment)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_emergent_env_vars_project_id ON emergent_env_vars(project_id);
CREATE INDEX IF NOT EXISTS idx_emergent_env_vars_environment ON emergent_env_vars(environment);
CREATE INDEX IF NOT EXISTS idx_emergent_env_vars_is_secret ON emergent_env_vars(is_secret);

-- Trigger for updated_at
CREATE TRIGGER emergent_env_vars_updated_at
  BEFORE UPDATE ON emergent_env_vars
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE emergent_env_vars ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view env vars" ON emergent_env_vars
  FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM emergent_projects WHERE org_id IN (
        SELECT org_id FROM emergent_org_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Editors can manage env vars" ON emergent_env_vars
  FOR ALL
  USING (
    project_id IN (
      SELECT id FROM emergent_projects WHERE org_id IN (
        SELECT org_id FROM emergent_org_members 
        WHERE user_id = auth.uid() 
        AND role IN ('owner', 'admin', 'member')
      )
    )
  );

-- =============================================================================
-- 5. BUILD LOGS (Streaming Build Output)
-- =============================================================================

CREATE TABLE IF NOT EXISTS emergent_build_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deployment_id UUID NOT NULL REFERENCES emergent_deployments(id) ON DELETE CASCADE,
  
  -- Log data
  log_line INTEGER NOT NULL, -- Line number for ordering
  log_text TEXT NOT NULL,
  log_level VARCHAR(20) DEFAULT 'info' CHECK (log_level IN ('debug', 'info', 'warning', 'error', 'fatal')),
  
  -- Context
  phase VARCHAR(50), -- e.g., 'install', 'build', 'test', 'deploy'
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  UNIQUE(deployment_id, log_line)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_emergent_build_logs_deployment_id ON emergent_build_logs(deployment_id, log_line);
CREATE INDEX IF NOT EXISTS idx_emergent_build_logs_level ON emergent_build_logs(log_level);
CREATE INDEX IF NOT EXISTS idx_emergent_build_logs_created_at ON emergent_build_logs(created_at);

-- RLS
ALTER TABLE emergent_build_logs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view build logs" ON emergent_build_logs
  FOR SELECT
  USING (
    deployment_id IN (
      SELECT id FROM emergent_deployments WHERE project_id IN (
        SELECT id FROM emergent_projects WHERE org_id IN (
          SELECT org_id FROM emergent_org_members WHERE user_id = auth.uid()
        )
      )
    )
  );

-- =============================================================================
-- 6. WORKSPACE SNAPSHOTS (Backup & Restore)
-- =============================================================================

CREATE TABLE IF NOT EXISTS emergent_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES emergent_workspaces(id) ON DELETE CASCADE,
  
  -- Snapshot info
  snapshot_name VARCHAR(255),
  snapshot_type VARCHAR(50) NOT NULL DEFAULT 'manual' CHECK (snapshot_type IN ('manual', 'auto', 'pre_deploy', 'scheduled')),
  
  -- Storage
  storage_path VARCHAR(500) NOT NULL, -- Path to snapshot in object storage
  size_mb INTEGER,
  
  -- Files snapshot
  file_count INTEGER,
  files_metadata JSONB DEFAULT '{}', -- Summary of files included
  
  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'creating' CHECK (status IN ('creating', 'ready', 'restoring', 'failed', 'deleted')),
  error_message TEXT,
  
  -- Metadata
  created_by UUID, -- References auth.users
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE, -- Auto-delete after this date
  restored_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_emergent_snapshots_workspace_id ON emergent_snapshots(workspace_id);
CREATE INDEX IF NOT EXISTS idx_emergent_snapshots_created_at ON emergent_snapshots(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_emergent_snapshots_expires_at ON emergent_snapshots(expires_at) WHERE expires_at IS NOT NULL;

-- RLS
ALTER TABLE emergent_snapshots ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view workspace snapshots" ON emergent_snapshots
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT id FROM emergent_workspaces WHERE project_id IN (
        SELECT id FROM emergent_projects WHERE org_id IN (
          SELECT org_id FROM emergent_org_members WHERE user_id = auth.uid()
        )
      )
    )
  );

-- =============================================================================
-- FUNCTIONS & TRIGGERS
-- =============================================================================

-- Function to update workspace last activity
CREATE OR REPLACE FUNCTION update_workspace_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE emergent_workspaces
  SET last_activity_at = NOW()
  WHERE id = NEW.workspace_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-schedule workspace shutdown
CREATE OR REPLACE FUNCTION schedule_workspace_shutdown()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'running' AND NEW.auto_shutdown_minutes IS NOT NULL THEN
    NEW.shutdown_scheduled_at := NOW() + (NEW.auto_shutdown_minutes || ' minutes')::INTERVAL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER emergent_workspaces_schedule_shutdown
  BEFORE UPDATE ON emergent_workspaces
  FOR EACH ROW
  WHEN (NEW.last_activity_at IS DISTINCT FROM OLD.last_activity_at)
  EXECUTE FUNCTION schedule_workspace_shutdown();

-- =============================================================================
-- VIEWS (Convenience Queries)
-- =============================================================================

CREATE OR REPLACE VIEW emergent_active_deployments AS
SELECT 
  d.*,
  p.name AS project_name,
  p.org_id,
  o.name AS org_name
FROM emergent_deployments d
JOIN emergent_projects p ON d.project_id = p.id
JOIN emergent_orgs o ON p.org_id = o.id
WHERE d.status = 'active';

CREATE OR REPLACE VIEW emergent_workspace_health AS
SELECT 
  w.*,
  p.name AS project_name,
  p.org_id,
  CASE 
    WHEN w.cpu_usage_percent > 80 THEN 'critical'
    WHEN w.cpu_usage_percent > 60 THEN 'warning'
    ELSE 'healthy'
  END AS cpu_health,
  CASE 
    WHEN w.memory_usage_mb::DECIMAL / w.memory_limit_mb > 0.8 THEN 'critical'
    WHEN w.memory_usage_mb::DECIMAL / w.memory_limit_mb > 0.6 THEN 'warning'
    ELSE 'healthy'
  END AS memory_health,
  CASE 
    WHEN w.storage_used_mb::DECIMAL / w.storage_limit_mb > 0.8 THEN 'critical'
    WHEN w.storage_used_mb::DECIMAL / w.storage_limit_mb > 0.6 THEN 'warning'
    ELSE 'healthy'
  END AS storage_health
FROM emergent_workspaces w
JOIN emergent_projects p ON w.project_id = p.id
WHERE w.status = 'running';

-- =============================================================================
-- COMMENTS (Documentation)
-- =============================================================================

COMMENT ON TABLE emergent_workspaces IS 'Sandboxed execution environments for Ciqo (formerly Emergent Runner)';
COMMENT ON TABLE emergent_deployments IS 'Deployment history with build and deploy logs';
COMMENT ON TABLE emergent_domains IS 'Custom domain configurations with SSL/TLS';
COMMENT ON TABLE emergent_env_vars IS 'Per-environment configuration variables';
COMMENT ON TABLE emergent_build_logs IS 'Streaming build output logs';
COMMENT ON TABLE emergent_snapshots IS 'Workspace backups for restore functionality';

-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
