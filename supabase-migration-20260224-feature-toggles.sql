-- ============================================================================
-- SUPABASE PRODUCTION MIGRATION: FoundersPass Feature Toggle System
-- Date: 2026-02-24
-- Purpose: Create tables for Issue #79 - FoundersPass board feature toggles
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. FEATURES CATALOG TABLE
-- Master list of all toggleable features in the system
-- ============================================================================
CREATE TABLE IF NOT EXISTS features_catalog (
  -- Primary identifier
  feature_key TEXT PRIMARY KEY,
  
  -- Display information
  label TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  
  -- Configuration
  is_global BOOLEAN DEFAULT FALSE,
  default_enabled BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_category CHECK (category IN ('social', 'coding', 'utilities', 'integrations', 'ai', 'ui', 'admin', 'other'))
);

-- Index for faster category-based queries
CREATE INDEX IF NOT EXISTS idx_features_catalog_category ON features_catalog(category);
CREATE INDEX IF NOT EXISTS idx_features_catalog_is_global ON features_catalog(is_global);

-- ============================================================================
-- 2. USER FEATURE TOGGLES TABLE
-- Per-user feature enablement settings
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_feature_toggles (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- References
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL REFERENCES features_catalog(feature_key) ON DELETE CASCADE,
  
  -- Toggle state
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Audit trail
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id),
  
  -- Ensure one toggle per user per feature
  UNIQUE (user_id, feature_key)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_feature_toggles_user_id ON user_feature_toggles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_feature_toggles_feature_key ON user_feature_toggles(feature_key);
CREATE INDEX IF NOT EXISTS idx_user_feature_toggles_enabled ON user_feature_toggles(enabled);

-- ============================================================================
-- 3. AUDIT LOG TABLE (Optional but recommended)
-- Track all feature toggle changes for compliance
-- ============================================================================
CREATE TABLE IF NOT EXISTS feature_toggle_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- What changed
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL,
  old_enabled BOOLEAN,
  new_enabled BOOLEAN,
  
  -- Who changed it
  changed_by UUID REFERENCES auth.users(id),
  
  -- When
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Context
  ip_address INET,
  user_agent TEXT
);

-- Index for audit queries
CREATE INDEX IF NOT EXISTS idx_feature_toggle_audit_user ON feature_toggle_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_feature_toggle_audit_feature ON feature_toggle_audit_log(feature_key);
CREATE INDEX IF NOT EXISTS idx_feature_toggle_audit_time ON feature_toggle_audit_log(changed_at DESC);

-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE features_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_feature_toggles ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_toggle_audit_log ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------
-- features_catalog RLS Policies
-- ------------------------------------------------------
-- Anyone can view the features catalog (read-only for all)
CREATE POLICY "Anyone can view features catalog" ON features_catalog
  FOR SELECT USING (true);

-- Only admins can modify the catalog
CREATE POLICY "Only admins can insert features" ON features_catalog
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM user_feature_toggles 
      WHERE feature_key = 'admin_access' AND enabled = true
    )
    OR
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Only admins can update features" ON features_catalog
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM user_feature_toggles 
      WHERE feature_key = 'admin_access' AND enabled = true
    )
    OR
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Only admins can delete features" ON features_catalog
  FOR DELETE USING (
    auth.uid() IN (
      SELECT user_id FROM user_feature_toggles 
      WHERE feature_key = 'admin_access' AND enabled = true
    )
    OR
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- ------------------------------------------------------
-- user_feature_toggles RLS Policies
-- ------------------------------------------------------
-- Users can view their own toggles
CREATE POLICY "Users can view own toggles" ON user_feature_toggles
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can view all toggles
CREATE POLICY "Admins can view all toggles" ON user_feature_toggles
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM user_feature_toggles 
      WHERE feature_key = 'admin_access' AND enabled = true
    )
    OR
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Users can update their own toggles (for non-admin features)
CREATE POLICY "Users can update own non-admin toggles" ON user_feature_toggles
  FOR UPDATE USING (
    auth.uid() = user_id 
    AND feature_key NOT IN ('admin_access', 'system_admin', 'founderspass_admin')
  );

-- Only admins can update admin-related toggles
CREATE POLICY "Only admins can update admin toggles" ON user_feature_toggles
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM user_feature_toggles 
      WHERE feature_key = 'admin_access' AND enabled = true
    )
    OR
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM user_feature_toggles 
      WHERE feature_key = 'admin_access' AND enabled = true
    )
    OR
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Only admins can insert toggles (system assigns defaults)
CREATE POLICY "Only admins can insert toggles" ON user_feature_toggles
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM user_feature_toggles 
      WHERE feature_key = 'admin_access' AND enabled = true
    )
    OR
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- ------------------------------------------------------
-- feature_toggle_audit_log RLS Policies
-- ------------------------------------------------------
-- Everyone can view audit logs (transparency)
CREATE POLICY "Anyone can view audit logs" ON feature_toggle_audit_log
  FOR SELECT USING (true);

-- System/triggers can insert audit logs
CREATE POLICY "System can insert audit logs" ON feature_toggle_audit_log
  FOR INSERT WITH CHECK (true);

-- ============================================================================
-- 5. TRIGGERS FOR AUTOMATIC UPDATED_AT
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to features_catalog
DROP TRIGGER IF EXISTS update_features_catalog_updated_at ON features_catalog;
CREATE TRIGGER update_features_catalog_updated_at
  BEFORE UPDATE ON features_catalog
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply to user_feature_toggles  
DROP TRIGGER IF EXISTS update_user_feature_toggles_updated_at ON user_feature_toggles;
CREATE TRIGGER update_user_feature_toggles_updated_at
  BEFORE UPDATE ON user_feature_toggles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 6. AUDIT LOG TRIGGER
-- Automatically log all toggle changes
-- ============================================================================
CREATE OR REPLACE FUNCTION log_feature_toggle_change()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO feature_toggle_audit_log (
    user_id, feature_key, old_enabled, new_enabled, changed_by
  ) VALUES (
    NEW.user_id, NEW.feature_key, OLD.enabled, NEW.enabled, auth.uid()
  );
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS log_user_feature_toggle_change ON user_feature_toggles;
CREATE TRIGGER log_user_feature_toggle_change
  AFTER UPDATE OF enabled ON user_feature_toggles
  FOR EACH ROW
  WHEN (OLD.enabled IS DISTINCT FROM NEW.enabled)
  EXECUTE FUNCTION log_feature_toggle_change();

-- ============================================================================
-- 7. INITIAL DATA: SEED WITH COMMON FEATURES
-- ============================================================================
INSERT INTO features_catalog (feature_key, label, category, description, is_global, default_enabled) VALUES
  -- Admin Features
  ('admin_access', 'Admin Access', 'admin', 'Full administrative access to all system controls', false, false),
  ('founderspass_admin', 'FoundersPass Admin', 'admin', 'Access to FoundersPass control board', false, false),
  ('system_admin', 'System Administrator', 'admin', 'System-level administrative privileges', false, false),
  
  -- AI Features
  ('ai_chat', 'AI Chat', 'ai', 'Access to AI chat functionality', false, true),
  ('ai_voice', 'AI Voice', 'ai', 'Voice interaction with AI', false, true),
  ('ai_image_generation', 'AI Image Generation', 'ai', 'Generate images with AI', false, false),
  ('ai_code_assistance', 'AI Code Assistance', 'ai', 'Get AI help with coding', false, true),
  
  -- Social Features
  ('social_sharing', 'Social Sharing', 'social', 'Share content to social media', false, true),
  ('social_analytics', 'Social Analytics', 'social', 'View social media analytics', false, false),
  ('community_chat', 'Community Chat', 'social', 'Participate in community discussions', false, true),
  
  -- Coding Features
  ('code_editor', 'Code Editor', 'coding', 'Access to built-in code editor', false, true),
  ('git_integration', 'Git Integration', 'coding', 'Connect to Git repositories', false, false),
  ('deployment_tools', 'Deployment Tools', 'coding', 'Deploy applications', false, false),
  ('api_testing', 'API Testing', 'coding', 'Test API endpoints', false, true),
  
  -- Utility Features
  ('file_upload', 'File Upload', 'utilities', 'Upload and manage files', false, true),
  ('data_export', 'Data Export', 'utilities', 'Export data in various formats', false, true),
  ('notifications', 'Notifications', 'utilities', 'Receive system notifications', false, true),
  ('calendar_integration', 'Calendar Integration', 'utilities', 'Sync with calendar services', false, false),
  
  -- Integration Features
  ('github_integration', 'GitHub Integration', 'integrations', 'Connect to GitHub', false, false),
  ('slack_integration', 'Slack Integration', 'integrations', 'Connect to Slack', false, false),
  ('discord_integration', 'Discord Integration', 'integrations', 'Connect to Discord', false, false),
  ('google_drive_integration', 'Google Drive Integration', 'integrations', 'Connect to Google Drive', false, false),
  
  -- UI Features
  ('dark_mode', 'Dark Mode', 'ui', 'Toggle dark/light theme', false, true),
  ('animations', 'Animations', 'ui', 'Enable UI animations', false, true),
  ('high_contrast', 'High Contrast Mode', 'ui', 'High contrast accessibility mode', false, false),
  
  -- Global Features (affect all users)
  ('maintenance_mode', 'Maintenance Mode', 'admin', 'Put system in maintenance mode', true, false),
  ('signups_enabled', 'New Signups', 'admin', 'Allow new user registrations', true, true),
  ('payments_enabled', 'Payments', 'admin', 'Enable payment processing', true, false)
ON CONFLICT (feature_key) DO UPDATE SET
  label = EXCLUDED.label,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  is_global = EXCLUDED.is_global,
  default_enabled = EXCLUDED.default_enabled,
  updated_at = NOW();

-- ============================================================================
-- 8. DEFAULT USER TOGGLES FUNCTION
-- Automatically create default toggles for new users
-- ============================================================================
CREATE OR REPLACE FUNCTION create_default_user_toggles()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert default enabled features for new users
  INSERT INTO user_feature_toggles (user_id, feature_key, enabled)
  SELECT NEW.id, feature_key, default_enabled
  FROM features_catalog
  WHERE is_global = false;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS create_default_toggles_on_signup ON auth.users;
CREATE TRIGGER create_default_toggles_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_user_toggles();

-- ============================================================================
-- 9. HEALTH CHECK FUNCTION
-- For FoundersPass board diagnostics
-- ============================================================================
CREATE OR REPLACE FUNCTION check_feature_toggle_health()
RETURNS TABLE (
  total_features INT,
  total_users_with_toggles INT,
  last_audit_log TIMESTAMPTZ,
  catalog_health BOOLEAN,
  toggle_health BOOLEAN,
  audit_health BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM features_catalog)::INT AS total_features,
    (SELECT COUNT(DISTINCT user_id) FROM user_feature_toggles)::INT AS total_users_with_toggles,
    (SELECT MAX(changed_at) FROM feature_toggle_audit_log) AS last_audit_log,
    (SELECT COUNT(*) = (SELECT COUNT(*) FROM features_catalog WHERE is_global = false)) AS catalog_health,
    (SELECT COUNT(*) > 0 FROM user_feature_toggles) AS toggle_health,
    (SELECT COUNT(*) > 0 FROM feature_toggle_audit_log) AS audit_health;
END;
$$ language 'plpgsql';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

SELECT '✅ Migration completed successfully!' AS status,
       (SELECT COUNT(*) FROM features_catalog) AS features_created,
       (SELECT COUNT(*) FROM user_feature_toggles) AS user_toggles_created,
       (SELECT COUNT(*) FROM feature_toggle_audit_log) AS audit_logs_created;