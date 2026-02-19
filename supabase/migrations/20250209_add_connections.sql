-- ============================================================================
-- Add Connections Table for OAuth Integrations
-- Stores GitHub, Vercel, and other service connections
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Service details
  service VARCHAR(50) NOT NULL, -- 'github', 'vercel', 'supabase'
  
  -- OAuth tokens (encrypted at rest by Supabase)
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  
  -- Service-specific metadata
  metadata JSONB DEFAULT '{}',
  -- For GitHub: { username, repos, avatar_url }
  -- For Vercel: { team_id, username, projects }
  
  -- Timestamps
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_user_service UNIQUE(user_id, service)
);

-- Index for fast lookups
CREATE INDEX idx_connections_user_service ON public.connections(user_id, service);
CREATE INDEX idx_connections_service ON public.connections(service);

-- RLS Policies
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

-- Users can only see their own connections
CREATE POLICY "Users can view own connections"
  ON public.connections
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own connections
CREATE POLICY "Users can insert own connections"
  ON public.connections
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own connections
CREATE POLICY "Users can update own connections"
  ON public.connections
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own connections
CREATE POLICY "Users can delete own connections"
  ON public.connections
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_connections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER connections_updated_at
  BEFORE UPDATE ON public.connections
  FOR EACH ROW
  EXECUTE FUNCTION update_connections_updated_at();

-- ============================================================================
-- Deployments Table for tracking Vercel deployments
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES public.connections(id) ON DELETE CASCADE,
  
  -- Vercel deployment details
  vercel_deployment_id TEXT NOT NULL,
  vercel_project_id TEXT NOT NULL,
  
  -- Deployment info
  project_name TEXT NOT NULL,
  url TEXT NOT NULL,
  state TEXT NOT NULL, -- 'BUILDING', 'READY', 'ERROR', 'CANCELED'
  
  -- Build metadata
  commit_sha TEXT,
  commit_message TEXT,
  branch TEXT,
  
  -- Performance
  build_duration_ms INTEGER,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ready_at TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'
);

-- Indexes
CREATE INDEX idx_deployments_user ON public.deployments(user_id);
CREATE INDEX idx_deployments_connection ON public.deployments(connection_id);
CREATE INDEX idx_deployments_vercel_id ON public.deployments(vercel_deployment_id);
CREATE INDEX idx_deployments_project ON public.deployments(vercel_project_id);
CREATE INDEX idx_deployments_state ON public.deployments(state);

-- RLS Policies
ALTER TABLE public.deployments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own deployments"
  ON public.deployments
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own deployments"
  ON public.deployments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own deployments"
  ON public.deployments
  FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- Comment for documentation
-- ============================================================================

COMMENT ON TABLE public.connections IS 'OAuth connections to external services (GitHub, Vercel, etc.)';
COMMENT ON TABLE public.deployments IS 'Vercel deployment history and status tracking';
