-- Founders Pass Feature Flags System
-- Created: 2026-02-15
-- Version: 1.0

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- FEATURE FLAGS TABLE
-- Stores feature flag definitions with scope (global/site/user)
-- ============================================================================

CREATE TABLE feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,                    -- Unique flag name (e.g., "founders_pass_v2")
  description TEXT,                             -- Human-readable description
  enabled BOOLEAN DEFAULT false,                -- Master enable/disable
  scope TEXT DEFAULT 'global',                  -- 'global', 'site', 'user'
  target_id TEXT,                               -- Site ID or User ID (when scope != 'global')
  config JSONB DEFAULT '{}'::jsonb,            -- Rollout rules, percentage, user lists, etc.
  created_by UUID REFERENCES profiles(id),      -- Admin who created this flag
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scope validation
ALTER TABLE feature_flags ADD CONSTRAINT scope_valid
  CHECK (scope IN ('global', 'site', 'user'));

-- Indexes for flag lookups
CREATE INDEX idx_feature_flags_name ON feature_flags(name);
CREATE INDEX idx_feature_flags_enabled ON feature_flags(enabled);
CREATE INDEX idx_feature_flags_scope ON feature_flags(scope);
CREATE INDEX idx_feature_flags_target_id ON feature_flags(target_id);
CREATE INDEX idx_feature_flags_created_at ON feature_flags(created_at DESC);

-- ============================================================================
-- FEATURE FLAG AUDIT LOG TABLE
-- Tracks all changes to feature flags for compliance and debugging
-- ============================================================================

CREATE TABLE feature_flag_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_id UUID REFERENCES feature_flags(id) ON DELETE CASCADE,
  flag_name TEXT NOT NULL,                      -- Denormalized for history
  action TEXT NOT NULL,                         -- 'created', 'updated', 'deleted', 'toggled'
  changed_by UUID REFERENCES profiles(id),      -- Admin who made the change
  changes JSONB DEFAULT '{}'::jsonb,           -- Before/after values
  metadata JSONB DEFAULT '{}'::jsonb,          -- Additional context (IP, user agent, etc.)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Action validation
ALTER TABLE feature_flag_audit ADD CONSTRAINT action_valid
  CHECK (action IN ('created', 'updated', 'deleted', 'toggled'));

-- Indexes for audit queries
CREATE INDEX idx_feature_flag_audit_flag_id ON feature_flag_audit(flag_id);
CREATE INDEX idx_feature_flag_audit_flag_name ON feature_flag_audit(flag_name);
CREATE INDEX idx_feature_flag_audit_action ON feature_flag_audit(action);
CREATE INDEX idx_feature_flag_audit_changed_by ON feature_flag_audit(changed_by);
CREATE INDEX idx_feature_flag_audit_created_at ON feature_flag_audit(created_at DESC);

-- ============================================================================
-- WEBHOOK CONFIGURATIONS TABLE
-- Stores webhook endpoints to notify on flag changes
-- ============================================================================

CREATE TABLE feature_flag_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_id UUID REFERENCES feature_flags(id) ON DELETE CASCADE,
  url TEXT NOT NULL,                            -- Webhook endpoint URL
  secret TEXT,                                  -- Optional HMAC secret for verification
  enabled BOOLEAN DEFAULT true,                 -- Enable/disable this webhook
  events TEXT[] DEFAULT ARRAY['updated', 'toggled']::TEXT[], -- Which events to listen to
  retry_config JSONB DEFAULT '{"max_retries": 3, "backoff_ms": 1000}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for webhook lookups
CREATE INDEX idx_feature_flag_webhooks_flag_id ON feature_flag_webhooks(flag_id);
CREATE INDEX idx_feature_flag_webhooks_enabled ON feature_flag_webhooks(enabled);

-- ============================================================================
-- WEBHOOK DELIVERY LOG TABLE
-- Tracks webhook delivery attempts and results
-- ============================================================================

CREATE TABLE feature_flag_webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID REFERENCES feature_flag_webhooks(id) ON DELETE CASCADE,
  flag_id UUID REFERENCES feature_flags(id) ON DELETE CASCADE,
  url TEXT NOT NULL,                            -- Snapshot of URL at delivery time
  event TEXT NOT NULL,                          -- Event type that triggered webhook
  payload JSONB NOT NULL,                       -- Webhook payload sent
  status_code INT,                              -- HTTP status code received
  response_body TEXT,                           -- Response from webhook
  error TEXT,                                   -- Error message if failed
  attempt_number INT DEFAULT 1,                 -- Retry attempt number
  delivered_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for webhook log queries
CREATE INDEX idx_webhook_logs_webhook_id ON feature_flag_webhook_logs(webhook_id);
CREATE INDEX idx_webhook_logs_flag_id ON feature_flag_webhook_logs(flag_id);
CREATE INDEX idx_webhook_logs_status_code ON feature_flag_webhook_logs(status_code);
CREATE INDEX idx_webhook_logs_delivered_at ON feature_flag_webhook_logs(delivered_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flag_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flag_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flag_webhook_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- FEATURE FLAGS POLICIES
-- Admin-only access for modifications, public read for checking flags
-- ============================================================================

-- Authenticated users can view all feature flags (for checking)
CREATE POLICY "Anyone can view feature flags"
  ON feature_flags FOR SELECT
  TO authenticated, anon
  USING (true);

-- Only authenticated users can insert/update/delete feature flags
-- (We'll add admin role check via service role key in API)
CREATE POLICY "Authenticated users can manage feature flags"
  ON feature_flags FOR ALL
  USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- AUDIT LOG POLICIES
-- ============================================================================

-- Anyone can view audit logs (for transparency)
CREATE POLICY "Anyone can view audit logs"
  ON feature_flag_audit FOR SELECT
  TO authenticated, anon
  USING (true);

-- Only authenticated users can insert audit logs
CREATE POLICY "Authenticated users can create audit logs"
  ON feature_flag_audit FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================================
-- WEBHOOK POLICIES
-- ============================================================================

-- Authenticated users can view webhooks
CREATE POLICY "Authenticated users can view webhooks"
  ON feature_flag_webhooks FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can manage webhooks
CREATE POLICY "Authenticated users can manage webhooks"
  ON feature_flag_webhooks FOR ALL
  USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- WEBHOOK LOG POLICIES
-- ============================================================================

-- Authenticated users can view webhook logs
CREATE POLICY "Authenticated users can view webhook logs"
  ON feature_flag_webhook_logs FOR SELECT
  TO authenticated
  USING (true);

-- Service can insert webhook logs
CREATE POLICY "Anyone can create webhook logs"
  ON feature_flag_webhook_logs FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Update updated_at timestamp on feature flags
CREATE TRIGGER trg_feature_flags_updated_at
  BEFORE UPDATE ON feature_flags
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Update updated_at timestamp on webhooks
CREATE TRIGGER trg_feature_flag_webhooks_updated_at
  BEFORE UPDATE ON feature_flag_webhooks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Auto-create audit log entry on feature flag changes
CREATE OR REPLACE FUNCTION audit_feature_flag_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO feature_flag_audit (flag_id, flag_name, action, changed_by, changes)
    VALUES (
      NEW.id,
      NEW.name,
      'created',
      NEW.created_by,
      jsonb_build_object('new', row_to_json(NEW))
    );
  ELSIF TG_OP = 'UPDATE' THEN
    -- Determine if this is a toggle or full update
    DECLARE
      action_type TEXT;
    BEGIN
      IF OLD.enabled != NEW.enabled AND 
         OLD.name = NEW.name AND 
         OLD.description IS NOT DISTINCT FROM NEW.description AND
         OLD.scope = NEW.scope AND
         OLD.target_id IS NOT DISTINCT FROM NEW.target_id THEN
        action_type := 'toggled';
      ELSE
        action_type := 'updated';
      END IF;

      INSERT INTO feature_flag_audit (flag_id, flag_name, action, changed_by, changes)
      VALUES (
        NEW.id,
        NEW.name,
        action_type,
        NEW.created_by, -- In real app, get from session
        jsonb_build_object('old', row_to_json(OLD), 'new', row_to_json(NEW))
      );
    END;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO feature_flag_audit (flag_id, flag_name, action, changed_by, changes)
    VALUES (
      OLD.id,
      OLD.name,
      'deleted',
      OLD.created_by,
      jsonb_build_object('old', row_to_json(OLD))
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_feature_flag_changes
  AFTER INSERT OR UPDATE OR DELETE ON feature_flags
  FOR EACH ROW
  EXECUTE FUNCTION audit_feature_flag_changes();

-- Function to check if a feature flag is enabled for a given context
CREATE OR REPLACE FUNCTION check_feature_flag(
  p_flag_name TEXT,
  p_user_id UUID DEFAULT NULL,
  p_site_id TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_flag feature_flags%ROWTYPE;
  v_rollout_percentage INT;
  v_user_hash INT;
BEGIN
  -- Get the flag
  SELECT * INTO v_flag
  FROM feature_flags
  WHERE name = p_flag_name
  LIMIT 1;
  
  -- Flag doesn't exist or is disabled
  IF NOT FOUND OR v_flag.enabled = false THEN
    RETURN false;
  END IF;
  
  -- Check scope
  IF v_flag.scope = 'global' THEN
    -- Check for percentage rollout
    v_rollout_percentage := COALESCE((v_flag.config->>'percentage')::INT, 100);
    
    IF v_rollout_percentage = 100 THEN
      RETURN true;
    END IF;
    
    -- Percentage-based rollout using user_id hash
    IF p_user_id IS NOT NULL THEN
      v_user_hash := abs(hashtext(p_user_id::TEXT)) % 100;
      RETURN v_user_hash < v_rollout_percentage;
    END IF;
    
    -- No user context for percentage rollout, default to enabled
    RETURN true;
    
  ELSIF v_flag.scope = 'site' THEN
    -- Check if this site matches
    RETURN v_flag.target_id = p_site_id;
    
  ELSIF v_flag.scope = 'user' THEN
    -- Check if this user matches
    RETURN v_flag.target_id::UUID = p_user_id;
  END IF;
  
  -- Default fallback
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON feature_flags TO anon, authenticated;
GRANT ALL ON feature_flags TO authenticated;
GRANT SELECT ON feature_flag_audit TO anon, authenticated;
GRANT INSERT ON feature_flag_audit TO authenticated;
GRANT ALL ON feature_flag_webhooks TO authenticated;
GRANT SELECT ON feature_flag_webhooks TO authenticated;
GRANT SELECT, INSERT ON feature_flag_webhook_logs TO authenticated;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
