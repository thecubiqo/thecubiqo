-- Unified Notifications System Migration
-- Supports 100+ integrations: social media, smart home, chat, etc.

-- User integrations (which apps/devices user has connected)
CREATE TABLE IF NOT EXISTS user_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  integration_type TEXT NOT NULL, -- 'chat', 'social', 'smart_home', 'productivity'
  integration_name TEXT NOT NULL, -- 'whatsapp', 'twitter', 'philips_hue', etc.
  credentials JSONB, -- encrypted OAuth tokens, API keys, etc.
  settings JSONB DEFAULT '{}'::jsonb, -- user preferences for this integration
  status TEXT DEFAULT 'active', -- 'active', 'paused', 'error', 'disconnected'
  last_sync_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_integration UNIQUE(user_id, integration_name)
);

-- Notifications table (all incoming notifications from all integrations)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  integration_id UUID REFERENCES user_integrations(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'message', 'mention', 'alert', 'reminder', 'device_state'
  title TEXT NOT NULL,
  body TEXT,
  data JSONB DEFAULT '{}'::jsonb, -- integration-specific data
  priority INTEGER DEFAULT 1, -- 0=low, 1=normal, 2=high, 3=urgent
  read_at TIMESTAMPTZ,
  acted_on_at TIMESTAMPTZ,
  action_taken TEXT, -- 'replied', 'dismissed', 'executed', etc.
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Action executions (track all actions taken by users)
CREATE TABLE IF NOT EXISTS action_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_id UUID REFERENCES notifications(id) ON DELETE SET NULL,
  integration_name TEXT NOT NULL,
  action_type TEXT NOT NULL, -- 'send_message', 'turn_on_light', 'reply_tweet', etc.
  action_data JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'pending', -- 'pending', 'executing', 'success', 'failed'
  result JSONB,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Smart home device registry
CREATE TABLE IF NOT EXISTS smart_home_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  integration_id UUID NOT NULL REFERENCES user_integrations(id) ON DELETE CASCADE,
  device_type TEXT NOT NULL, -- 'light', 'lock', 'thermostat', 'camera', 'sensor'
  device_name TEXT NOT NULL,
  device_id TEXT NOT NULL, -- ID from the integration/hub
  capabilities JSONB DEFAULT '{}'::jsonb, -- {brightness: true, color: true}
  state JSONB DEFAULT '{}'::jsonb, -- current device state
  room TEXT,
  last_update_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_device UNIQUE(user_id, integration_id, device_id)
);

-- Notification preferences per integration
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  integration_name TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  notification_types TEXT[] DEFAULT ARRAY['message', 'mention', 'alert'], -- which types to show
  frequency TEXT DEFAULT 'instant', -- 'instant', 'batch_hourly', 'batch_daily'
  quiet_hours JSONB, -- {start: '22:00', end: '08:00', timezone: 'UTC'}
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_integration_pref UNIQUE(user_id, integration_name)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_integrations_user ON user_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_integrations_status ON user_integrations(status) WHERE status != 'disconnected';
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, created_at DESC) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_integration ON notifications(integration_id);
CREATE INDEX IF NOT EXISTS idx_action_executions_user ON action_executions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_action_executions_status ON action_executions(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_smart_home_devices_user ON smart_home_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_smart_home_devices_type ON smart_home_devices(device_type);

-- RLS Policies
ALTER TABLE user_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE smart_home_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY user_integrations_policy ON user_integrations
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY notifications_policy ON notifications
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY action_executions_policy ON action_executions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY smart_home_devices_policy ON smart_home_devices
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY notification_preferences_policy ON notification_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Helper function: Get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM notifications
    WHERE user_id = p_user_id
      AND read_at IS NULL
      AND (expires_at IS NULL OR expires_at > NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: Mark notifications as read
CREATE OR REPLACE FUNCTION mark_notifications_read(p_notification_ids UUID[])
RETURNS INTEGER AS $$
BEGIN
  UPDATE notifications
  SET read_at = NOW()
  WHERE id = ANY(p_notification_ids)
    AND user_id = auth.uid()
    AND read_at IS NULL;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
