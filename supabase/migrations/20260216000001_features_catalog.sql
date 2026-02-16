-- Features Catalog & User Toggles System
-- Created: 2026-02-16
-- Version: 1.0
-- Purpose: Unified catalog for all features and designs with per-user toggle support

-- ============================================================================
-- FEATURES CATALOG TABLE
-- Single source of truth for all features and design variants
-- ============================================================================

CREATE TABLE features_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key TEXT NOT NULL UNIQUE,              -- Unique key (e.g., "ui.chat_assistant", "design.plasma_wave")
  label TEXT NOT NULL,                           -- Display name
  description TEXT,                              -- Human-readable description
  category TEXT NOT NULL,                        -- 'social', 'communication', 'utility', 'support', 'visuals', 'admin'
  feature_type TEXT DEFAULT 'toggle',            -- 'toggle', 'design_variant', 'config'
  default_enabled BOOLEAN DEFAULT false,         -- Global default state
  risk_level TEXT DEFAULT 'safe',                -- 'safe', 'warning', 'dangerous'
  config JSONB DEFAULT '{}'::jsonb,             -- Additional config (icon, order, etc.)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Category validation
ALTER TABLE features_catalog ADD CONSTRAINT category_valid
  CHECK (category IN ('social', 'communication', 'utility', 'support', 'visuals', 'admin', 'general'));

-- Feature type validation
ALTER TABLE features_catalog ADD CONSTRAINT feature_type_valid
  CHECK (feature_type IN ('toggle', 'design_variant', 'config'));

-- Risk level validation
ALTER TABLE features_catalog ADD CONSTRAINT risk_level_valid
  CHECK (risk_level IN ('safe', 'warning', 'dangerous'));

-- Indexes
CREATE INDEX idx_features_catalog_category ON features_catalog(category);
CREATE INDEX idx_features_catalog_feature_type ON features_catalog(feature_type);
CREATE INDEX idx_features_catalog_key ON features_catalog(feature_key);

-- ============================================================================
-- USER FEATURE TOGGLES TABLE
-- Per-user overrides for features and design preferences
-- ============================================================================

CREATE TABLE user_feature_toggles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL,                     -- References features_catalog.feature_key
  enabled BOOLEAN NOT NULL,                      -- User's preference
  metadata JSONB DEFAULT '{}'::jsonb,           -- Additional user-specific config
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one row per user per feature
  UNIQUE(user_id, feature_key)
);

-- Indexes
CREATE INDEX idx_user_toggles_user_id ON user_feature_toggles(user_id);
CREATE INDEX idx_user_toggles_feature_key ON user_feature_toggles(feature_key);
CREATE INDEX idx_user_toggles_user_feature ON user_feature_toggles(user_id, feature_key);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE features_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_feature_toggles ENABLE ROW LEVEL SECURITY;

-- Anyone can read the catalog
CREATE POLICY "Anyone can view features catalog"
  ON features_catalog FOR SELECT
  TO authenticated, anon
  USING (true);

-- Only authenticated users can manage catalog (admin check in API layer)
CREATE POLICY "Authenticated users can manage catalog"
  ON features_catalog FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Users can view their own toggles
CREATE POLICY "Users can view their own toggles"
  ON user_feature_toggles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can manage their own toggles
CREATE POLICY "Users can manage their own toggles"
  ON user_feature_toggles FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Update updated_at timestamp
CREATE TRIGGER trg_features_catalog_updated_at
  BEFORE UPDATE ON features_catalog
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_user_toggles_updated_at
  BEFORE UPDATE ON user_feature_toggles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Function to get effective feature state for a user (with user override)
CREATE OR REPLACE FUNCTION get_effective_feature_state(
  p_feature_key TEXT,
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_catalog features_catalog%ROWTYPE;
  v_user_toggle user_feature_toggles%ROWTYPE;
BEGIN
  -- Get catalog entry
  SELECT * INTO v_catalog
  FROM features_catalog
  WHERE feature_key = p_feature_key
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Check for user override
  SELECT * INTO v_user_toggle
  FROM user_feature_toggles
  WHERE feature_key = p_feature_key
    AND user_id = p_user_id
  LIMIT 1;
  
  -- User override takes precedence
  IF FOUND THEN
    RETURN v_user_toggle.enabled;
  END IF;
  
  -- Fall back to catalog default
  RETURN v_catalog.default_enabled;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SEED DATA - Core Features and Design Variants
-- ============================================================================

-- Social Features
INSERT INTO features_catalog (feature_key, label, description, category, feature_type, default_enabled, risk_level, config) VALUES
  ('social.share_journey', 'Share Journey', 'Allow users to share their emotional journey on social media', 'social', 'toggle', false, 'safe', '{"icon": "📱"}'),
  ('social.friend_connections', 'Friend Connections', 'Connect with friends and see their emotional states', 'social', 'toggle', false, 'warning', '{"icon": "👥"}'),
  ('social.community_board', 'Community Board', 'Access to community support and discussions', 'social', 'toggle', false, 'safe', '{"icon": "🌐"}');

-- Communication Features
INSERT INTO features_catalog (feature_key, label, description, category, feature_type, default_enabled, risk_level, config) VALUES
  ('communication.voice_chat', 'Voice Chat', 'AI voice conversation capability', 'communication', 'toggle', true, 'safe', '{"icon": "🎤"}'),
  ('communication.text_chat', 'Text Chat', 'AI text conversation capability', 'communication', 'toggle', true, 'safe', '{"icon": "💬"}'),
  ('communication.email_integration', 'Email Integration', 'Read and respond to emails via AI', 'communication', 'toggle', false, 'dangerous', '{"icon": "📧"}'),
  ('communication.calendar_sync', 'Calendar Sync', 'Sync and manage calendar events', 'communication', 'toggle', false, 'warning', '{"icon": "📅"}');

-- Utility Features
INSERT INTO features_catalog (feature_key, label, description, category, feature_type, default_enabled, risk_level, config) VALUES
  ('utility.journal_entries', 'Journal Entries', 'Personal emotional journaling system', 'utility', 'toggle', true, 'safe', '{"icon": "📔"}'),
  ('utility.mood_tracking', 'Mood Tracking', 'Track emotional patterns over time', 'utility', 'toggle', true, 'safe', '{"icon": "📊"}'),
  ('utility.meditation_timer', 'Meditation Timer', 'Guided meditation and mindfulness', 'utility', 'toggle', true, 'safe', '{"icon": "🧘"}'),
  ('utility.browser_automation', 'Browser Automation', 'AI-powered web browsing and task automation', 'utility', 'toggle', false, 'dangerous', '{"icon": "🌐"}');

-- Support Features
INSERT INTO features_catalog (feature_key, label, description, category, feature_type, default_enabled, risk_level, config) VALUES
  ('support.crisis_detection', 'Crisis Detection', 'AI detects emotional distress and offers resources', 'support', 'toggle', true, 'safe', '{"icon": "🆘"}'),
  ('support.therapist_matching', 'Therapist Matching', 'Connect with licensed mental health professionals', 'support', 'toggle', false, 'warning', '{"icon": "👨‍⚕️"}'),
  ('support.emergency_contacts', 'Emergency Contacts', 'Quick access to emergency helplines', 'support', 'toggle', true, 'safe', '{"icon": "📞"}');

-- Visual Design Variants
INSERT INTO features_catalog (feature_key, label, description, category, feature_type, default_enabled, risk_level, config) VALUES
  ('design.plasma_wave', 'Plasma Wave Field', 'HD plasma wave animation with soul particles (120k+ particles)', 'visuals', 'design_variant', true, 'safe', '{"icon": "🌊", "preview": "/previews/plasma-wave.png"}'),
  ('design.tech_wireframe', 'Energy Wireframe Cube', 'Rotating isometric cube with energy grid overlay', 'visuals', 'design_variant', false, 'safe', '{"icon": "📦", "preview": "/previews/tech-wireframe.png"}'),
  ('design.classic_cube', 'Classic Cube', 'Simple rotating 3D cube with clean lines', 'visuals', 'design_variant', false, 'safe', '{"icon": "🎲", "preview": "/previews/classic-cube.png"}'),
  ('design.glassmorphic', 'Glassmorphic Isometric Cube', 'Modern glass-effect isometric cube design', 'visuals', 'design_variant', false, 'safe', '{"icon": "💎", "preview": "/previews/glassmorphic.png"}');

-- Admin Features
INSERT INTO features_catalog (feature_key, label, description, category, feature_type, default_enabled, risk_level, config) VALUES
  ('admin.feature_dashboard', 'Feature Dashboard', 'Access to FoundersPass dashboard', 'admin', 'toggle', false, 'dangerous', '{"icon": "🎛️"}'),
  ('admin.user_management', 'User Management', 'Manage user accounts and permissions', 'admin', 'toggle', false, 'dangerous', '{"icon": "👤"}'),
  ('admin.analytics_panel', 'Analytics Panel', 'View usage analytics and metrics', 'admin', 'toggle', false, 'warning', '{"icon": "📈"}');

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT SELECT ON features_catalog TO anon, authenticated;
GRANT ALL ON features_catalog TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_feature_toggles TO authenticated;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
