-- Emergent Workspaces Table
-- Stores Docker container workspace information
CREATE TABLE IF NOT EXISTS emergent_workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES emergent_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  container_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  runtime TEXT NOT NULL CHECK (runtime IN ('nodejs', 'python', 'go', 'php', 'ruby')),
  status TEXT NOT NULL CHECK (status IN ('creating', 'running', 'stopped', 'error')) DEFAULT 'creating',
  resources JSONB NOT NULL DEFAULT '{"cpu": 2, "memory": 4096, "storage": 10240}'::jsonb,
  preview_url TEXT,
  ip_address TEXT,
  port INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  stopped_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT fk_workspace_project FOREIGN KEY (project_id) REFERENCES emergent_projects(id),
  CONSTRAINT fk_workspace_user FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Indexes for workspaces
CREATE INDEX IF NOT EXISTS idx_workspace_user ON emergent_workspaces(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workspace_project ON emergent_workspaces(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workspace_status ON emergent_workspaces(status) WHERE status IN ('running', 'creating');
CREATE INDEX IF NOT EXISTS idx_workspace_container ON emergent_workspaces(container_id);

-- Emergent Deployments Table
-- Tracks all deployment attempts and their status
CREATE TABLE IF NOT EXISTS emergent_deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES emergent_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES emergent_workspaces(id) ON DELETE SET NULL,
  vercel_deployment_id TEXT,
  environment TEXT NOT NULL CHECK (environment IN ('preview', 'production', 'development')) DEFAULT 'production',
  status TEXT NOT NULL CHECK (status IN ('queued', 'building', 'deploying', 'success', 'failed', 'cancelled')) DEFAULT 'queued',
  url TEXT,
  build_logs TEXT,
  error_message TEXT,
  framework TEXT,
  build_command TEXT,
  deployed_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_deployment_project FOREIGN KEY (project_id) REFERENCES emergent_projects(id),
  CONSTRAINT fk_deployment_user FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT fk_deployment_workspace FOREIGN KEY (workspace_id) REFERENCES emergent_workspaces(id)
);

-- Indexes for deployments
CREATE INDEX IF NOT EXISTS idx_deployment_project ON emergent_deployments(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deployment_user ON emergent_deployments(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deployment_status ON emergent_deployments(status) WHERE status IN ('queued', 'building', 'deploying');
CREATE INDEX IF NOT EXISTS idx_deployment_vercel ON emergent_deployments(vercel_deployment_id) WHERE vercel_deployment_id IS NOT NULL;

-- Row Level Security (RLS) Policies

-- Enable RLS on workspaces
ALTER TABLE emergent_workspaces ENABLE ROW LEVEL SECURITY;

-- Users can view their own workspaces
CREATE POLICY "Users can view their own workspaces"
  ON emergent_workspaces FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own workspaces
CREATE POLICY "Users can create their own workspaces"
  ON emergent_workspaces FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own workspaces
CREATE POLICY "Users can update their own workspaces"
  ON emergent_workspaces FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own workspaces
CREATE POLICY "Users can delete their own workspaces"
  ON emergent_workspaces FOR DELETE
  USING (auth.uid() = user_id);

-- Enable RLS on deployments
ALTER TABLE emergent_deployments ENABLE ROW LEVEL SECURITY;

-- Users can view their own deployments
CREATE POLICY "Users can view their own deployments"
  ON emergent_deployments FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own deployments
CREATE POLICY "Users can create their own deployments"
  ON emergent_deployments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own deployments
CREATE POLICY "Users can update their own deployments"
  ON emergent_deployments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_emergent_workspaces_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_emergent_deployments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER trigger_emergent_workspaces_updated_at
  BEFORE UPDATE ON emergent_workspaces
  FOR EACH ROW
  EXECUTE FUNCTION update_emergent_workspaces_updated_at();

CREATE TRIGGER trigger_emergent_deployments_updated_at
  BEFORE UPDATE ON emergent_deployments
  FOR EACH ROW
  EXECUTE FUNCTION update_emergent_deployments_updated_at();

-- Comments for documentation
COMMENT ON TABLE emergent_workspaces IS 'Docker container workspaces for Emergent projects';
COMMENT ON TABLE emergent_deployments IS 'Deployment records for Emergent projects (Vercel, Netlify, etc)';

COMMENT ON COLUMN emergent_workspaces.container_id IS 'Docker container ID';
COMMENT ON COLUMN emergent_workspaces.resources IS 'JSON object with cpu, memory, storage limits';
COMMENT ON COLUMN emergent_workspaces.preview_url IS 'Generated preview URL for workspace';

COMMENT ON COLUMN emergent_deployments.vercel_deployment_id IS 'Vercel deployment ID if deployed via Vercel';
COMMENT ON COLUMN emergent_deployments.build_logs IS 'Build output logs';
COMMENT ON COLUMN emergent_deployments.framework IS 'Detected framework (nextjs, vite, etc)';
