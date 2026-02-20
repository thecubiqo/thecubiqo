-- =============================================================================
-- EMERGENT INTEGRATIONS MIGRATION
-- =============================================================================
-- Description: Tables for third-party integrations (Shopify, Printify, Stripe, OAuth)
-- Author: GUY (Database Administrator)
-- Date: 2026-02-18
-- Version: 1.0.0
-- =============================================================================

-- =============================================================================
-- 1. INTEGRATIONS (Main Integration Registry)
-- =============================================================================

CREATE TABLE IF NOT EXISTS integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Integration identity
  service VARCHAR(50) NOT NULL CHECK (service IN ('shopify', 'printify', 'stripe', 'sendgrid', 'twilio', 'cloudflare', 'vercel', 'github', 'gitlab', 'bitbucket', 'aws', 'gcp', 'azure', 'custom')),
  integration_name VARCHAR(255) NOT NULL, -- User-friendly name
  
  -- Configuration
  config JSONB NOT NULL DEFAULT '{}', -- Service-specific config (non-sensitive)
  credentials_encrypted TEXT, -- Encrypted credentials (API keys, secrets)
  
  -- OAuth (if applicable)
  oauth_provider VARCHAR(100),
  oauth_access_token_encrypted TEXT,
  oauth_refresh_token_encrypted TEXT,
  oauth_token_expires_at TIMESTAMP,
  oauth_scopes TEXT[], -- Array of granted scopes
  
  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'configuring' CHECK (status IN ('configuring', 'connected', 'error', 'disconnected', 'expired')),
  error_message TEXT,
  last_sync_at TIMESTAMP,
  last_error_at TIMESTAMP,
  
  -- Webhook
  webhook_url VARCHAR(500),
  webhook_secret VARCHAR(255),
  
  -- Environment
  environment VARCHAR(50) NOT NULL DEFAULT 'production' CHECK (environment IN ('sandbox', 'test', 'production')),
  
  -- Metadata
  created_by UUID NOT NULL, -- References auth.users
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP,
  
  UNIQUE(project_id, service, integration_name)
);

-- Indexes
CREATE INDEX idx_integrations_project_id ON integrations(project_id);
CREATE INDEX idx_integrations_service ON integrations(service);
CREATE INDEX idx_integrations_status ON integrations(status);
CREATE INDEX idx_integrations_oauth_expires ON integrations(oauth_token_expires_at) WHERE oauth_token_expires_at IS NOT NULL;

-- Trigger for updated_at
CREATE TRIGGER integrations_updated_at
  BEFORE UPDATE ON integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

-- Policies: Users can view integrations for their projects
CREATE POLICY "Users can view project integrations" ON integrations
  FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects WHERE org_id IN (
        SELECT org_id FROM org_members WHERE user_id = auth.uid()
      )
    )
  );

-- Policies: Members can manage integrations
CREATE POLICY "Members can manage integrations" ON integrations
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
-- 2. INTEGRATION LOGS (Activity & Sync History)
-- =============================================================================

CREATE TABLE IF NOT EXISTS integration_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  
  -- Event info
  event_type VARCHAR(100) NOT NULL, -- e.g., 'sync', 'webhook', 'oauth_refresh', 'api_call'
  event_status VARCHAR(50) NOT NULL CHECK (event_status IN ('success', 'failure', 'partial')),
  
  -- Details
  message TEXT,
  error_message TEXT,
  request_data JSONB,
  response_data JSONB,
  
  -- Performance
  duration_ms INTEGER,
  
  -- Context
  triggered_by UUID, -- References auth.users, NULL for automatic/webhook
  
  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_integration_logs_integration_id ON integration_logs(integration_id);
CREATE INDEX idx_integration_logs_event_type ON integration_logs(event_type);
CREATE INDEX idx_integration_logs_created_at ON integration_logs(created_at DESC);
CREATE INDEX idx_integration_logs_status ON integration_logs(event_status);

-- RLS
ALTER TABLE integration_logs ENABLE ROW LEVEL SECURITY;

-- Policies: Users can view logs for their integrations
CREATE POLICY "Users can view integration logs" ON integration_logs
  FOR SELECT
  USING (
    integration_id IN (
      SELECT id FROM integrations WHERE project_id IN (
        SELECT id FROM projects WHERE org_id IN (
          SELECT org_id FROM org_members WHERE user_id = auth.uid()
        )
      )
    )
  );

-- =============================================================================
-- 3. PLAYBOOKS (AI Agent Integration Recipes)
-- =============================================================================

CREATE TABLE IF NOT EXISTS playbooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Playbook identity
  name VARCHAR(255) NOT NULL UNIQUE,
  slug VARCHAR(100) UNIQUE NOT NULL,
  service VARCHAR(50) NOT NULL, -- Which integration this applies to
  
  -- Description
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  use_case TEXT, -- When to use this playbook
  
  -- Verification
  is_verified BOOLEAN DEFAULT FALSE, -- Official vs community
  verified_by UUID, -- References auth.users (platform admin)
  verified_at TIMESTAMP,
  
  -- Content
  instructions TEXT NOT NULL, -- Instructions for AI agent
  example_prompts TEXT[], -- Example user prompts
  required_scopes TEXT[], -- Required OAuth scopes
  config_schema JSONB, -- JSON Schema for configuration
  
  -- Code templates
  code_templates JSONB DEFAULT '{}', -- Template code snippets
  
  -- Popularity
  usage_count INTEGER DEFAULT 0,
  rating_average DECIMAL(3, 2),
  rating_count INTEGER DEFAULT 0,
  
  -- Categories
  categories TEXT[], -- e.g., ['ecommerce', 'shipping', 'inventory']
  tags TEXT[],
  
  -- Metadata
  author_id UUID, -- References auth.users
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  published_at TIMESTAMP,
  deleted_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_playbooks_service ON playbooks(service);
CREATE INDEX idx_playbooks_slug ON playbooks(slug);
CREATE INDEX idx_playbooks_is_verified ON playbooks(is_verified);
CREATE INDEX idx_playbooks_usage_count ON playbooks(usage_count DESC);
CREATE INDEX idx_playbooks_rating ON playbooks(rating_average DESC, rating_count DESC);
CREATE INDEX idx_playbooks_categories ON playbooks USING GIN(categories);
CREATE INDEX idx_playbooks_tags ON playbooks USING GIN(tags);

-- Trigger for updated_at
CREATE TRIGGER playbooks_updated_at
  BEFORE UPDATE ON playbooks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE playbooks ENABLE ROW LEVEL SECURITY;

-- Policies: Everyone can view verified playbooks
CREATE POLICY "Anyone can view verified playbooks" ON playbooks
  FOR SELECT
  USING (is_verified = TRUE AND published_at IS NOT NULL);

-- Policies: Authors can view their own playbooks
CREATE POLICY "Authors can view own playbooks" ON playbooks
  FOR SELECT
  USING (author_id = auth.uid());

-- Policies: Authenticated users can create playbooks
CREATE POLICY "Users can create playbooks" ON playbooks
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Policies: Authors can update their playbooks
CREATE POLICY "Authors can update own playbooks" ON playbooks
  FOR UPDATE
  USING (author_id = auth.uid());

-- =============================================================================
-- 4. PROJECT PLAYBOOKS (Installed Playbooks per Project)
-- =============================================================================

CREATE TABLE IF NOT EXISTS project_playbooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  playbook_id UUID NOT NULL REFERENCES playbooks(id) ON DELETE CASCADE,
  integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
  
  -- Configuration
  custom_config JSONB DEFAULT '{}', -- Project-specific overrides
  
  -- Status
  is_enabled BOOLEAN DEFAULT TRUE,
  last_used_at TIMESTAMP,
  usage_count INTEGER DEFAULT 0,
  
  -- Metadata
  installed_by UUID NOT NULL, -- References auth.users
  installed_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  UNIQUE(project_id, playbook_id)
);

-- Indexes
CREATE INDEX idx_project_playbooks_project_id ON project_playbooks(project_id);
CREATE INDEX idx_project_playbooks_playbook_id ON project_playbooks(playbook_id);
CREATE INDEX idx_project_playbooks_integration_id ON project_playbooks(integration_id);
CREATE INDEX idx_project_playbooks_enabled ON project_playbooks(is_enabled);

-- Trigger for updated_at
CREATE TRIGGER project_playbooks_updated_at
  BEFORE UPDATE ON project_playbooks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE project_playbooks ENABLE ROW LEVEL SECURITY;

-- Policies: Users can view playbooks for their projects
CREATE POLICY "Users can view project playbooks" ON project_playbooks
  FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects WHERE org_id IN (
        SELECT org_id FROM org_members WHERE user_id = auth.uid()
      )
    )
  );

-- Policies: Members can manage playbooks
CREATE POLICY "Members can manage playbooks" ON project_playbooks
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
-- 5. OAUTH CONNECTIONS (User-level OAuth Tokens)
-- =============================================================================

CREATE TABLE IF NOT EXISTS oauth_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL, -- References auth.users
  
  -- OAuth provider
  provider VARCHAR(100) NOT NULL, -- e.g., 'github', 'google', 'shopify'
  provider_user_id VARCHAR(255), -- User ID on the provider's platform
  provider_username VARCHAR(255),
  provider_email VARCHAR(255),
  
  -- Tokens (encrypted)
  access_token_encrypted TEXT NOT NULL,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMP,
  
  -- Scopes
  scopes TEXT[],
  
  -- Metadata
  connected_at TIMESTAMP DEFAULT NOW(),
  last_refreshed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP,
  
  UNIQUE(user_id, provider)
);

-- Indexes
CREATE INDEX idx_oauth_connections_user_id ON oauth_connections(user_id);
CREATE INDEX idx_oauth_connections_provider ON oauth_connections(provider);
CREATE INDEX idx_oauth_connections_expires_at ON oauth_connections(token_expires_at) WHERE token_expires_at IS NOT NULL;

-- Trigger for updated_at
CREATE TRIGGER oauth_connections_updated_at
  BEFORE UPDATE ON oauth_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE oauth_connections ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only view their own OAuth connections
CREATE POLICY "Users can view own oauth connections" ON oauth_connections
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage own oauth connections" ON oauth_connections
  FOR ALL
  USING (user_id = auth.uid());

-- =============================================================================
-- 6. WEBHOOK EVENTS (Incoming Webhooks from Integrations)
-- =============================================================================

CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  
  -- Event identity
  event_id VARCHAR(255), -- External event ID from provider
  event_type VARCHAR(100) NOT NULL,
  
  -- Payload
  payload JSONB NOT NULL,
  headers JSONB,
  
  -- Processing status
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'processed', 'failed', 'ignored')),
  processed_at TIMESTAMP,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Signature verification
  signature VARCHAR(500),
  signature_verified BOOLEAN,
  
  -- Metadata
  received_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_webhook_events_integration_id ON webhook_events(integration_id);
CREATE INDEX idx_webhook_events_event_type ON webhook_events(event_type);
CREATE INDEX idx_webhook_events_status ON webhook_events(status);
CREATE INDEX idx_webhook_events_received_at ON webhook_events(received_at DESC);
CREATE INDEX idx_webhook_events_event_id ON webhook_events(event_id);

-- RLS
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- Policies: Users can view webhook events for their integrations
CREATE POLICY "Users can view webhook events" ON webhook_events
  FOR SELECT
  USING (
    integration_id IN (
      SELECT id FROM integrations WHERE project_id IN (
        SELECT id FROM projects WHERE org_id IN (
          SELECT org_id FROM org_members WHERE user_id = auth.uid()
        )
      )
    )
  );

-- =============================================================================
-- 7. API RATE LIMITS (Track API Usage per Integration)
-- =============================================================================

CREATE TABLE IF NOT EXISTS integration_rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  
  -- Rate limit info
  endpoint VARCHAR(255), -- Specific endpoint, or NULL for global
  requests_made INTEGER DEFAULT 0,
  requests_limit INTEGER NOT NULL,
  window_start TIMESTAMP NOT NULL,
  window_end TIMESTAMP NOT NULL,
  
  -- Status
  is_throttled BOOLEAN DEFAULT FALSE,
  throttled_until TIMESTAMP,
  
  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  UNIQUE(integration_id, endpoint, window_start)
);

-- Indexes
CREATE INDEX idx_integration_rate_limits_integration_id ON integration_rate_limits(integration_id);
CREATE INDEX idx_integration_rate_limits_window ON integration_rate_limits(window_end);
CREATE INDEX idx_integration_rate_limits_throttled ON integration_rate_limits(is_throttled, throttled_until);

-- Trigger for updated_at
CREATE TRIGGER integration_rate_limits_updated_at
  BEFORE UPDATE ON integration_rate_limits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE integration_rate_limits ENABLE ROW LEVEL SECURITY;

-- Policies: Users can view rate limits for their integrations
CREATE POLICY "Users can view rate limits" ON integration_rate_limits
  FOR SELECT
  USING (
    integration_id IN (
      SELECT id FROM integrations WHERE project_id IN (
        SELECT id FROM projects WHERE org_id IN (
          SELECT org_id FROM org_members WHERE user_id = auth.uid()
        )
      )
    )
  );

-- =============================================================================
-- FUNCTIONS & TRIGGERS
-- =============================================================================

-- Function to auto-refresh expired OAuth tokens
CREATE OR REPLACE FUNCTION check_oauth_token_expiry()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.oauth_token_expires_at IS NOT NULL 
     AND NEW.oauth_token_expires_at < NOW() + INTERVAL '5 minutes' THEN
    NEW.status := 'expired';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER integrations_check_oauth_expiry
  BEFORE UPDATE ON integrations
  FOR EACH ROW
  WHEN (NEW.oauth_token_expires_at IS NOT NULL)
  EXECUTE FUNCTION check_oauth_token_expiry();

-- Function to increment playbook usage
CREATE OR REPLACE FUNCTION increment_playbook_usage()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE playbooks
  SET usage_count = usage_count + 1
  WHERE id = NEW.playbook_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER project_playbooks_increment_usage
  AFTER INSERT ON project_playbooks
  FOR EACH ROW
  EXECUTE FUNCTION increment_playbook_usage();

-- =============================================================================
-- VIEWS (Convenience Queries)
-- =============================================================================

-- Integration health summary
CREATE OR REPLACE VIEW integration_health AS
SELECT 
  i.*,
  p.name AS project_name,
  p.org_id,
  COUNT(il.id) FILTER (WHERE il.event_status = 'failure' AND il.created_at > NOW() - INTERVAL '24 hours') AS failures_24h,
  COUNT(il.id) FILTER (WHERE il.event_status = 'success' AND il.created_at > NOW() - INTERVAL '24 hours') AS successes_24h,
  CASE 
    WHEN i.status = 'error' THEN 'critical'
    WHEN COUNT(il.id) FILTER (WHERE il.event_status = 'failure' AND il.created_at > NOW() - INTERVAL '1 hour') > 5 THEN 'warning'
    ELSE 'healthy'
  END AS health_status
FROM integrations i
JOIN projects p ON i.project_id = p.id
LEFT JOIN integration_logs il ON i.id = il.integration_id
WHERE i.deleted_at IS NULL
GROUP BY i.id, p.name, p.org_id;

-- Popular playbooks
CREATE OR REPLACE VIEW popular_playbooks AS
SELECT 
  p.*,
  COUNT(pp.id) AS installation_count
FROM playbooks p
LEFT JOIN project_playbooks pp ON p.id = pp.playbook_id
WHERE p.is_verified = TRUE AND p.published_at IS NOT NULL
GROUP BY p.id
ORDER BY p.usage_count DESC, installation_count DESC
LIMIT 100;

-- =============================================================================
-- COMMENTS (Documentation)
-- =============================================================================

COMMENT ON TABLE integrations IS 'Third-party service integrations with encrypted credentials';
COMMENT ON TABLE integration_logs IS 'Activity and sync history for integrations';
COMMENT ON TABLE playbooks IS 'AI agent integration recipes (verified and community)';
COMMENT ON TABLE project_playbooks IS 'Installed playbooks per project';
COMMENT ON TABLE oauth_connections IS 'User-level OAuth tokens for services';
COMMENT ON TABLE webhook_events IS 'Incoming webhooks from integrated services';
COMMENT ON TABLE integration_rate_limits IS 'API rate limit tracking per integration';

-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
