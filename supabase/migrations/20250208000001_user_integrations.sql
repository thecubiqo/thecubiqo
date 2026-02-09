-- User Integrations Table
-- Created: 2025-02-08
-- Enables granular control over which services the AI agent can access

-- ============================================================================
-- USER_INTEGRATIONS TABLE
-- Tracks connection status and read/write permissions for each service
-- ============================================================================

CREATE TABLE user_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  service TEXT NOT NULL,                    -- gmail, calendar, slack, etc.
  is_connected BOOLEAN DEFAULT false,       -- OAuth connection status
  read_enabled BOOLEAN DEFAULT false,       -- Can agent READ from this service?
  write_enabled BOOLEAN DEFAULT false,      -- Can agent WRITE to this service?
  
  -- OAuth tokens (encrypted in application layer)
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  
  -- Service-specific configuration
  config JSONB DEFAULT '{}'::jsonb,         -- email filters, calendar IDs, etc.
  
  -- Metadata
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Service validation - all supported integrations
ALTER TABLE user_integrations ADD CONSTRAINT service_valid
  CHECK (service IN (
    'gmail',
    'calendar',
    'slack',
    'discord',
    'telegram',
    'whatsapp',
    'notion',
    'drive',
    'github',
    'maps',
    'uber',
    'spotify',
    'twitter',
    'linkedin'
  ));

-- Unique constraint: one entry per user per service
CREATE UNIQUE INDEX idx_user_integrations_user_service 
  ON user_integrations(user_id, service);

-- Indexes for lookups
CREATE INDEX idx_user_integrations_user_id ON user_integrations(user_id);
CREATE INDEX idx_user_integrations_service ON user_integrations(service);
CREATE INDEX idx_user_integrations_connected ON user_integrations(is_connected);

-- Auto-update timestamp
CREATE TRIGGER trg_user_integrations_updated_at
  BEFORE UPDATE ON user_integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE user_integrations ENABLE ROW LEVEL SECURITY;

-- Users can view their own integrations
CREATE POLICY "Users can view own integrations"
  ON user_integrations FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own integrations
CREATE POLICY "Users can create own integrations"
  ON user_integrations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own integrations
CREATE POLICY "Users can update own integrations"
  ON user_integrations FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own integrations
CREATE POLICY "Users can delete own integrations"
  ON user_integrations FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to check if a service is enabled for a user
CREATE OR REPLACE FUNCTION is_service_enabled(
  p_user_id UUID,
  p_service TEXT,
  p_permission TEXT -- 'read' or 'write'
)
RETURNS BOOLEAN AS $$
DECLARE
  v_enabled BOOLEAN;
BEGIN
  IF p_permission = 'read' THEN
    SELECT read_enabled INTO v_enabled
    FROM user_integrations
    WHERE user_id = p_user_id
      AND service = p_service
      AND is_connected = true;
  ELSIF p_permission = 'write' THEN
    SELECT write_enabled INTO v_enabled
    FROM user_integrations
    WHERE user_id = p_user_id
      AND service = p_service
      AND is_connected = true;
  ELSE
    RETURN false;
  END IF;
  
  RETURN COALESCE(v_enabled, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all enabled services for a user
CREATE OR REPLACE FUNCTION get_enabled_services(
  p_user_id UUID,
  p_permission TEXT DEFAULT 'read' -- 'read' or 'write'
)
RETURNS TABLE(service TEXT) AS $$
BEGIN
  IF p_permission = 'read' THEN
    RETURN QUERY
    SELECT ui.service
    FROM user_integrations ui
    WHERE ui.user_id = p_user_id
      AND ui.is_connected = true
      AND ui.read_enabled = true;
  ELSIF p_permission = 'write' THEN
    RETURN QUERY
    SELECT ui.service
    FROM user_integrations ui
    WHERE ui.user_id = p_user_id
      AND ui.is_connected = true
      AND ui.write_enabled = true;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT ALL ON user_integrations TO anon, authenticated;
GRANT EXECUTE ON FUNCTION is_service_enabled(UUID, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_enabled_services(UUID, TEXT) TO anon, authenticated;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE user_integrations IS 'Stores OAuth connections and permission toggles for AI agent tool access';
COMMENT ON COLUMN user_integrations.is_connected IS 'True when OAuth flow completed successfully';
COMMENT ON COLUMN user_integrations.read_enabled IS 'Controls if agent can READ from this service';
COMMENT ON COLUMN user_integrations.write_enabled IS 'Controls if agent can WRITE to this service';
COMMENT ON COLUMN user_integrations.config IS 'Service-specific settings (filters, IDs, preferences)';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
