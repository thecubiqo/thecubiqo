-- =============================================================================
-- EMERGENT RUNNER SYSTEM MIGRATION
-- =============================================================================
-- Description: Tables for workspaces, deployments, domains, and environments
-- Author: GUY (Database Administrator)
-- Date: 2026-02-18
-- Version: 1.0.0
-- =============================================================================

-- =============================================================================
-- 1. WORKSPACES (Sandboxed Execution Environments)
-- =============================================================================

CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Workspace identity
  workspace_id VARCHAR(255) UNIQUE NOT NULL, -- External ID in runner system
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
  started_at TIMESTAMP,
  stopped_at TIMESTAMP,
  last_activity_at TIMESTAMP DEFAULT NOW(),
  
  -- Auto-shutdown
  auto_shutdown_minutes INTEGER DEFAULT 60, -- Stop after inactivity
  shutdown_scheduled_at TIMESTAMP,
  
  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP,
  
  UNIQUE(project_id)
);

-- Indexes
CREATE INDEX idx_workspaces_project_id ON workspaces(project_id);
CREATE INDEX idx_workspaces_workspace_id ON workspaces(workspace_id);
CREATE INDEX idx_workspaces_status ON workspaces(status);
CREATE INDEX idx_workspaces_subdomain ON workspaces(subdomain);
CREATE INDEX idx_workspaces_last_activity ON workspaces(last_activity_at DESC);
CREATE INDEX idx_workspaces_shutdown_scheduled ON workspaces(shutdown_scheduled_at) WHERE shutdown_scheduled_at IS NOT NULL;

-- Trigger for updated_at
CREATE TRIGGER workspaces_updated_at
  BEFORE UPDATE ON workspaces
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

-- Policies: Users can view workspaces for their projects
CREATE POLICY "Users can view project workspaces" ON workspaces
  FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects WHERE org_id IN (
        SELECT org_id FROM org_members WHERE user_id = auth.uid()
      )
    )
  );

-- =============================================================================
-- 2. DEPLOYMENTS (Build & Deploy History)
-- =============================================================================

CREATE TABLE IF NOT EXISTS deployments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Deployment identity
  deployment_number INTEGER NOT NULL, -- Auto-increment per project
  version VARCHAR(50), -- e.g., 'v1.2.3' or commit SHA
  
  -- Environment
  environment VARCHAR(50) NOT NULL DEFAULT 'preview' CHECK (environment IN ('development', 'preview', 'production')),
  
  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'building', 'deploying', 'active', 'failed', 'canceled', 'archived')),
  error_message TEXT,
  
  -- Build info
  build_started_at TIMESTAMP,
  build_completed_at TIMESTAMP,
  build_duration_seconds INTEGER,
  build_logs_url TEXT,
  
  -- Deploy info
  deploy_started_at TIMESTAMP,
  deploy_completed_at TIMESTAMP,
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
  health_check_last_checked_at TIMESTAMP,
  
  -- Metadata
  triggered_by UUID, -- References auth.users
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  UNIQUE(project_id, deployment_number)
);

-- Indexes
CREATE INDEX idx_deployments_project_id ON deployments(project_id);
CREATE INDEX idx_deployments_environment ON deployments(environment);
CREATE INDEX idx_deployments_status ON deployments(status);
CREATE INDEX idx_deployments_created_at ON deployments(created_at DESC);
CREATE INDEX idx_deployments_platform_id ON deployments(platform, platform_deployment_id);
CREATE INDEX idx_deployments_git_commit ON deployments(git_commit_sha);

-- Trigger for updated_at
CREATE TRIGGER deployments_updated_at
  BEFORE UPDATE ON deployments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to auto-increment deployment_number
CREATE OR REPLACE FUNCTION set_deployment_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.deployment_number IS NULL THEN
    SELECT COALESCE(MAX(deployment_number), 0) + 1
    INTO NEW.deployment_number
    FROM deployments
    WHERE project_id = NEW.project_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER deployments_set_number
  BEFORE INSERT ON deployments
  FOR EACH ROW
  EXECUTE FUNCTION set_deployment_number();

-- RLS
ALTER TABLE deployments ENABLE ROW LEVEL SECURITY;

-- Policies: Users can view deployments for their projects
CREATE POLICY "Users can view project deployments" ON deployments
  FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects WHERE org_id IN (
        SELECT org_id FROM org_members WHERE user_id = auth.uid()
      )
    )
  );

-- Policies: Members can create deployments
CREATE POLICY "Members can create deployments" ON deployments
  FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE org_id IN (
        SELECT org_id FROM org_members 
        WHERE user_id = auth.uid() 
        AND role IN ('owner', 'admin', 'member')
      )
    )
  );

-- =============================================================================
-- 3. CUSTOM DOMAINS
-- =============================================================================

CREATE TABLE IF NOT EXISTS custom_domains (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Domain info
  domain VARCHAR(255) UNIQUE NOT NULL,
  subdomain VARCHAR(100), -- Optional subdomain (e.g., 'app' in 'app.example.com')
  
  -- DNS verification
  verification_status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'failed')),
  verification_token VARCHAR(255) UNIQUE,
  verification_method VARCHAR(50) DEFAULT 'txt' CHECK (verification_method IN ('txt', 'cname')),
  verified_at TIMESTAMP,
  
  -- SSL/TLS
  ssl_status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (ssl_status IN ('pending', 'issued', 'failed', 'expired')),
  ssl_cert_issued_at TIMESTAMP,
  ssl_cert_expires_at TIMESTAMP,
  ssl_cert_auto_renew BOOLEAN DEFAULT TRUE,
  
  -- DNS records (for display to user)
  dns_records JSONB DEFAULT '[]', -- Array of required DNS records
  
  -- Deployment target
  environment VARCHAR(50) NOT NULL DEFAULT 'production' CHECK (environment IN ('preview', 'production')),
  deployment_id UUID REFERENCES deployments(id) ON DELETE SET NULL,
  
  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'configuring' CHECK (status IN ('configuring', 'active', 'error', 'disabled')),
  error_message TEXT,
  
  -- Metadata
  added_by UUID NOT NULL, -- References auth.users
  added_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_custom_domains_project_id ON custom_domains(project_id);
CREATE INDEX idx_custom_domains_domain ON custom_domains(domain);
CREATE INDEX idx_custom_domains_verification_status ON custom_domains(verification_status);
CREATE INDEX idx_custom_domains_ssl_status ON custom_domains(ssl_status);
CREATE INDEX idx_custom_domains_ssl_expires ON custom_domains(ssl_cert_expires_at) WHERE ssl_cert_expires_at IS NOT NULL;

-- Trigger for updated_at
CREATE TRIGGER custom_domains_updated_at
  BEFORE UPDATE ON custom_domains
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE custom_domains ENABLE ROW LEVEL SECURITY;

-- Policies: Users can view domains for their projects
CREATE POLICY "Users can view project domains" ON custom_domains
  FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects WHERE org_id IN (
        SELECT org_id FROM org_members WHERE user_id = auth.uid()
      )
    )
  );

-- Policies: Admins can manage domains
CREATE POLICY "Admins can manage domains" ON custom_domains
  FOR ALL
  USING (
    project_id IN (
      SELECT id FROM projects WHERE org_id IN (
        SELECT org_id FROM org_members 
        WHERE user_id = auth.uid() 
        AND role IN ('owner', 'admin')
      )
    )
  );

-- =============================================================================
-- 4. ENVIRONMENT VARIABLES
-- =============================================================================

CREATE TABLE IF NOT EXISTS environment_variables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
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
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP,
  
  UNIQUE(project_id, key_name, environment)
);

-- Indexes
CREATE INDEX idx_environment_variables_project_id ON environment_variables(project_id);
CREATE INDEX idx_environment_variables_environment ON environment_variables(environment);
CREATE INDEX idx_environment_variables_is_secret ON environment_variables(is_secret);

-- Trigger for updated_at
CREATE TRIGGER environment_variables_updated_at
  BEFORE UPDATE ON environment_variables
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE environment_variables ENABLE ROW LEVEL SECURITY;

-- Policies: Users can view env vars for their projects (but not values for secrets)
CREATE POLICY "Users can view env vars" ON environment_variables
  FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects WHERE org_id IN (
        SELECT org_id FROM org_members WHERE user_id = auth.uid()
      )
    )
  );

-- Policies: Editors can manage env vars
CREATE POLICY "Editors can manage env vars" ON environment_variables
  FOR ALL
  USING (
    project_id IN (
      SELECT id FROM projects WHERE org_id IN (
        SELECT org_id FROM org_members 
        WHERE user_id = auth.uid() 
        AND role IN ('owner', 'admin', 'member')
      )
    )
  );

-- =============================================================================
-- 5. BUILD LOGS (Streaming Build Output)
-- =============================================================================

CREATE TABLE IF NOT EXISTS build_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deployment_id UUID NOT NULL REFERENCES deployments(id) ON DELETE CASCADE,
  
  -- Log data
  log_line INTEGER NOT NULL, -- Line number for ordering
  log_text TEXT NOT NULL,
  log_level VARCHAR(20) DEFAULT 'info' CHECK (log_level IN ('debug', 'info', 'warning', 'error', 'fatal')),
  
  -- Context
  phase VARCHAR(50), -- e.g., 'install', 'build', 'test', 'deploy'
  
  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  UNIQUE(deployment_id, log_line)
);

-- Indexes
CREATE INDEX idx_build_logs_deployment_id ON build_logs(deployment_id, log_line);
CREATE INDEX idx_build_logs_level ON build_logs(log_level);
CREATE INDEX idx_build_logs_created_at ON build_logs(created_at);

-- RLS
ALTER TABLE build_logs ENABLE ROW LEVEL SECURITY;

-- Policies: Users can view logs for their deployments
CREATE POLICY "Users can view build logs" ON build_logs
  FOR SELECT
  USING (
    deployment_id IN (
      SELECT id FROM deployments WHERE project_id IN (
        SELECT id FROM projects WHERE org_id IN (
          SELECT org_id FROM org_members WHERE user_id = auth.uid()
        )
      )
    )
  );

-- =============================================================================
-- 6. WORKSPACE SNAPSHOTS (Backup & Restore)
-- =============================================================================

CREATE TABLE IF NOT EXISTS workspace_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  
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
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP, -- Auto-delete after this date
  restored_at TIMESTAMP,
  deleted_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_workspace_snapshots_workspace_id ON workspace_snapshots(workspace_id);
CREATE INDEX idx_workspace_snapshots_created_at ON workspace_snapshots(created_at DESC);
CREATE INDEX idx_workspace_snapshots_expires_at ON workspace_snapshots(expires_at) WHERE expires_at IS NOT NULL;

-- RLS
ALTER TABLE workspace_snapshots ENABLE ROW LEVEL SECURITY;

-- Policies: Users can view snapshots for their workspaces
CREATE POLICY "Users can view workspace snapshots" ON workspace_snapshots
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE project_id IN (
        SELECT id FROM projects WHERE org_id IN (
          SELECT org_id FROM org_members WHERE user_id = auth.uid()
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
  UPDATE workspaces
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

CREATE TRIGGER workspaces_schedule_shutdown
  BEFORE UPDATE ON workspaces
  FOR EACH ROW
  WHEN (NEW.last_activity_at IS DISTINCT FROM OLD.last_activity_at)
  EXECUTE FUNCTION schedule_workspace_shutdown();

-- =============================================================================
-- VIEWS (Convenience Queries)
-- =============================================================================

-- Active deployments by project
CREATE OR REPLACE VIEW active_deployments AS
SELECT 
  d.*,
  p.name AS project_name,
  p.org_id,
  o.name AS org_name
FROM deployments d
JOIN projects p ON d.project_id = p.id
JOIN organizations o ON p.org_id = o.id
WHERE d.status = 'active';

-- Workspace health summary
CREATE OR REPLACE VIEW workspace_health AS
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
FROM workspaces w
JOIN projects p ON w.project_id = p.id
WHERE w.status = 'running';

-- =============================================================================
-- COMMENTS (Documentation)
-- =============================================================================

COMMENT ON TABLE workspaces IS 'Sandboxed execution environments for projects';
COMMENT ON TABLE deployments IS 'Deployment history with build and deploy logs';
COMMENT ON TABLE custom_domains IS 'Custom domain configurations with SSL/TLS';
COMMENT ON TABLE environment_variables IS 'Per-environment configuration variables';
COMMENT ON TABLE build_logs IS 'Streaming build output logs';
COMMENT ON TABLE workspace_snapshots IS 'Workspace backups for restore functionality';

-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
