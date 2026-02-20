-- Unified Notifications System - Database Schema
-- Migration: 20260218000001_unified_notifications.sql
-- Author: MO (CTO) + GUY (DBA)
-- Date: 2026-02-18
-- Description: Core tables for unified notifications system supporting 100+ integrations

-- ============================================================================
-- TABLE: user_integrations
-- Purpose: Track which integrations each user has connected
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Integration identity
  integration_id TEXT NOT NULL,              -- 'twitter', 'philips_hue', 'home_assistant', etc.
  integration_category TEXT NOT NULL,        -- enum: social_media, chat, smart_home, smart_home_hub, productivity, entertainment
  integration_method TEXT NOT NULL,          -- enum: api, hub, webhook, browser, websocket
  
  -- Credentials (use oauth_tokens table for OAuth, this is for API keys and custom auth)
  credentials_encrypted TEXT,                -- Encrypted JSON for non-OAuth integrations
  
  -- Configuration
  settings JSONB DEFAULT '{}'::jsonb,        -- User preferences per integration
  webhook_secret TEXT,                       -- For webhook signature verification
  
  -- Status
  status TEXT DEFAULT 'active',              -- active, paused, error, expired
  last_sync_at TIMESTAMPTZ,
  last_error TEXT,
  error_count INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT integration_category_valid CHECK (
    integration_category IN ('social_media', 'chat', 'smart_home', 'smart_home_hub', 'productivity', 'entertainment')
  ),
  CONSTRAINT integration_method_valid CHECK (
    integration_method IN ('api', 'hub', 'webhook', 'browser', 'websocket')
  ),
  CONSTRAINT status_valid CHECK (
    status IN ('active', 'paused', 'error', 'expired')
  )
);

-- Indexes for user_integrations
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_integrations_unique 
  ON user_integrations(user_id, integration_id);
CREATE INDEX IF NOT EXISTS idx_user_integrations_status 
  ON user_integrations(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_user_integrations_category 
  ON user_integrations(integration_category);
CREATE INDEX IF NOT EXISTS idx_user_integrations_user 
  ON user_integrations(user_id);

-- Comments for documentation
COMMENT ON TABLE user_integrations IS 'Tracks which integrations each user has connected (social media, smart home, chat, etc.)';
COMMENT ON COLUMN user_integrations.integration_id IS 'Integration identifier (e.g., twitter, philips_hue, home_assistant)';
COMMENT ON COLUMN user_integrations.integration_category IS 'Category: social_media, chat, smart_home, smart_home_hub, productivity, entertainment';
COMMENT ON COLUMN user_integrations.integration_method IS 'Connection method: api, hub, webhook, browser, websocket';
COMMENT ON COLUMN user_integrations.credentials_encrypted IS 'Encrypted credentials for non-OAuth integrations (API keys, session tokens)';
COMMENT ON COLUMN user_integrations.webhook_secret IS 'Secret for verifying webhook signatures';
COMMENT ON COLUMN user_integrations.settings IS 'User-specific integration settings (preferences, filters, etc.)';

-- ============================================================================
-- TABLE: notifications
-- Purpose: All incoming notifications from all integrations
-- ============================================================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  integration_id UUID REFERENCES user_integrations(id) ON DELETE CASCADE NOT NULL,
  
  -- Content
  type TEXT NOT NULL,                        -- 'message', 'mention', 'alert', 'device_state_changed', etc.
  title TEXT NOT NULL,
  body TEXT,
  data JSONB DEFAULT '{}'::jsonb,            -- Integration-specific data
  
  -- Priority & urgency
  priority INTEGER DEFAULT 1,                -- 0=low, 1=normal, 2=high, 3=urgent
  
  -- Actions available
  actions JSONB DEFAULT '[]'::jsonb,         -- Array of NotificationAction objects
  
  -- Branding (optional, inherits from integration)
  logo TEXT,
  color TEXT,
  
  -- Status
  read_at TIMESTAMPTZ,
  acted_on_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT priority_valid CHECK (priority >= 0 AND priority <= 3)
);

-- Critical indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
  ON notifications(user_id, created_at DESC) 
  WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_user_priority 
  ON notifications(user_id, priority DESC, created_at DESC) 
  WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_integration 
  ON notifications(integration_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_expires 
  ON notifications(expires_at) 
  WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_user_created 
  ON notifications(user_id, created_at DESC);

-- Comments
COMMENT ON TABLE notifications IS 'All notifications from all integrations (social media, smart home, chat, etc.)';
COMMENT ON COLUMN notifications.type IS 'Notification type: message, mention, alert, device_state_changed, etc.';
COMMENT ON COLUMN notifications.priority IS 'Priority: 0=low, 1=normal, 2=high, 3=urgent (affects delivery and display)';
COMMENT ON COLUMN notifications.actions IS 'Array of available actions (reply, like, turn_on, etc.) stored as JSON';
COMMENT ON COLUMN notifications.data IS 'Integration-specific data (tweet object, device state, etc.)';

-- ============================================================================
-- TABLE: action_executions
-- Purpose: Track all actions executed by users (audit log + queue)
-- ============================================================================

CREATE TABLE IF NOT EXISTS action_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID REFERENCES notifications(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  integration_id UUID REFERENCES user_integrations(id) ON DELETE CASCADE NOT NULL,
  
  -- Action details
  action_type TEXT NOT NULL,                 -- 'reply', 'like', 'turn_on', 'set_temperature', etc.
  action_data JSONB DEFAULT '{}'::jsonb,     -- Action parameters
  
  -- Execution tracking
  status TEXT DEFAULT 'pending',             -- pending, executing, success, failed, cancelled
  result JSONB,
  error TEXT,
  retry_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  CONSTRAINT status_valid CHECK (
    status IN ('pending', 'executing', 'success', 'failed', 'cancelled')
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_action_executions_user 
  ON action_executions(user_id);
CREATE INDEX IF NOT EXISTS idx_action_executions_status 
  ON action_executions(status, created_at DESC) 
  WHERE status IN ('pending', 'executing');
CREATE INDEX IF NOT EXISTS idx_action_executions_notification 
  ON action_executions(notification_id);
CREATE INDEX IF NOT EXISTS idx_action_executions_integration 
  ON action_executions(integration_id, created_at DESC);

-- Comments
COMMENT ON TABLE action_executions IS 'Audit log and queue for all actions executed by users';
COMMENT ON COLUMN action_executions.action_type IS 'Type of action: reply, like, turn_on, set_temperature, etc.';
COMMENT ON COLUMN action_executions.status IS 'Execution status: pending, executing, success, failed, cancelled';
COMMENT ON COLUMN action_executions.retry_count IS 'Number of retry attempts (max 3)';

-- ============================================================================
-- TABLE: smart_home_devices
-- Purpose: Registry of all smart home devices connected via integrations
-- ============================================================================

CREATE TABLE IF NOT EXISTS smart_home_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  integration_id UUID REFERENCES user_integrations(id) ON DELETE CASCADE NOT NULL,
  
  -- Device identity
  device_id TEXT NOT NULL,                   -- ID from the integration (e.g., 'light.living_room')
  device_type TEXT NOT NULL,                 -- light, thermostat, lock, camera, sensor, switch, plug, speaker, tv, appliance, other
  device_name TEXT NOT NULL,
  manufacturer TEXT,
  model TEXT,
  
  -- Organization
  room TEXT,                                 -- 'Living Room', 'Bedroom', 'Kitchen', etc.
  zone TEXT,                                 -- 'Upstairs', 'Downstairs', 'Outside', etc.
  
  -- Capabilities
  capabilities JSONB DEFAULT '{}'::jsonb,    -- {brightness: true, color: true, temperature: false}
  
  -- State (cached from hub/device)
  state JSONB DEFAULT '{}'::jsonb,           -- Current device state (cached, updated via webhook)
  online BOOLEAN DEFAULT true,
  
  -- Metadata
  last_update_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT device_type_valid CHECK (
    device_type IN ('light', 'thermostat', 'lock', 'camera', 'sensor', 'switch', 'plug', 'speaker', 'tv', 'appliance', 'other')
  )
);

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_smart_home_devices_unique 
  ON smart_home_devices(user_id, integration_id, device_id);
CREATE INDEX IF NOT EXISTS idx_smart_home_devices_user 
  ON smart_home_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_smart_home_devices_type 
  ON smart_home_devices(device_type);
CREATE INDEX IF NOT EXISTS idx_smart_home_devices_room 
  ON smart_home_devices(room);
CREATE INDEX IF NOT EXISTS idx_smart_home_devices_online 
  ON smart_home_devices(online) WHERE online = true;
CREATE INDEX IF NOT EXISTS idx_smart_home_devices_integration 
  ON smart_home_devices(integration_id);

-- Comments
COMMENT ON TABLE smart_home_devices IS 'Registry of all smart home devices (lights, locks, thermostats, etc.)';
COMMENT ON COLUMN smart_home_devices.device_type IS 'Device type: light, thermostat, lock, camera, sensor, switch, plug, speaker, tv, appliance, other';
COMMENT ON COLUMN smart_home_devices.capabilities IS 'Device capabilities: {brightness: true, color: true, temperature: false}';
COMMENT ON COLUMN smart_home_devices.state IS 'Current device state (cached from hub, updated via webhook)';
COMMENT ON COLUMN smart_home_devices.room IS 'Room location for organizing devices';

-- ============================================================================
-- TABLE: integration_rate_limits
-- Purpose: Track API rate limits per integration to prevent exceeding quotas
-- ============================================================================

CREATE TABLE IF NOT EXISTS integration_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID REFERENCES user_integrations(id) ON DELETE CASCADE NOT NULL,
  
  window_start TIMESTAMPTZ NOT NULL,
  window_duration_minutes INTEGER NOT NULL,
  request_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(integration_id, window_start, window_duration_minutes)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_rate_limits_integration 
  ON integration_rate_limits(integration_id, window_start DESC);

-- Comments
COMMENT ON TABLE integration_rate_limits IS 'Track API rate limits per integration to prevent quota exhaustion';

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE user_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE smart_home_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_rate_limits ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- USER_INTEGRATIONS POLICIES
-- ============================================================================

CREATE POLICY "user_integrations_own" 
  ON user_integrations FOR ALL 
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "service_full_integrations" 
  ON user_integrations FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

-- ============================================================================
-- NOTIFICATIONS POLICIES
-- ============================================================================

CREATE POLICY "notifications_own" 
  ON notifications FOR ALL 
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "service_full_notifications" 
  ON notifications FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

-- ============================================================================
-- ACTION_EXECUTIONS POLICIES
-- ============================================================================

CREATE POLICY "action_executions_own" 
  ON action_executions FOR ALL 
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "service_full_actions" 
  ON action_executions FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

-- ============================================================================
-- SMART_HOME_DEVICES POLICIES
-- ============================================================================

CREATE POLICY "smart_home_devices_own" 
  ON smart_home_devices FOR ALL 
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "service_full_devices" 
  ON smart_home_devices FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

-- ============================================================================
-- INTEGRATION_RATE_LIMITS POLICIES
-- ============================================================================

CREATE POLICY "rate_limits_own" 
  ON integration_rate_limits FOR ALL 
  TO authenticated
  USING (
    integration_id IN (
      SELECT id FROM user_integrations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "service_full_rate_limits" 
  ON integration_rate_limits FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_integrations_updated_at
  BEFORE UPDATE ON user_integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- CLEANUP FUNCTION (for expired notifications)
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS void AS $$
BEGIN
  -- Delete expired notifications
  DELETE FROM notifications
  WHERE expires_at IS NOT NULL
    AND expires_at < NOW();
  
  -- Delete old notifications (older than 30 days by default)
  DELETE FROM notifications
  WHERE created_at < NOW() - INTERVAL '30 days'
    AND expires_at IS NULL;
  
  RAISE NOTICE 'Cleanup completed';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- GRANTS (Public access through RLS)
-- ============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

-- ============================================================================
-- INITIAL SEED DATA (Optional - for testing)
-- ============================================================================

-- Example integration metadata (could be moved to a separate integrations_catalog table)
COMMENT ON TABLE user_integrations IS 'User integrations table. Connect to oauth_tokens for OAuth-based integrations. For integration metadata (name, logo, color, capabilities), create a separate integrations_catalog table if needed.';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

-- Migration summary:
-- ✅ user_integrations - Track connected integrations per user
-- ✅ notifications - All notifications from all integrations
-- ✅ action_executions - Audit log + queue for actions
-- ✅ smart_home_devices - Registry of smart home devices
-- ✅ integration_rate_limits - Rate limiting per integration
-- ✅ RLS policies - Row-level security for all tables
-- ✅ Indexes - Optimized for common queries
-- ✅ Cleanup function - Auto-delete expired notifications
