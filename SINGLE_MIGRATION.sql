-- ============================================
-- CubiQo Founders Pass - Complete Migration
-- Run this ONCE in Supabase SQL Editor
-- ============================================

-- 1. Create update_updated_at function (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TABLE 1: released_features
-- ============================================

CREATE TABLE IF NOT EXISTS released_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_name TEXT UNIQUE NOT NULL,
  is_released BOOLEAN DEFAULT false,
  description TEXT,
  released_at TIMESTAMPTZ,
  released_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_released_features_is_released ON released_features(is_released);

DROP TRIGGER IF EXISTS trg_released_features_updated_at ON released_features;
CREATE TRIGGER trg_released_features_updated_at
  BEFORE UPDATE ON released_features
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE FUNCTION set_released_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_released = true AND (OLD.is_released = false OR OLD.is_released IS NULL) THEN
    NEW.released_at := NOW();
  ELSIF NEW.is_released = false THEN
    NEW.released_at := NULL;
    NEW.released_by := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_released_at ON released_features;
CREATE TRIGGER trg_set_released_at
  BEFORE UPDATE ON released_features
  FOR EACH ROW
  EXECUTE FUNCTION set_released_at();

INSERT INTO released_features (feature_name, description, is_released) VALUES
  ('agents', 'AI Agents - Spawn and manage AI agents', false),
  ('files', 'File Management - Upload, manage files', false),
  ('memory', 'Memory System - Long-term context', false),
  ('codeExecution', 'Code Execution - Run scripts', false),
  ('browser', 'Browser Control - Web automation', false),
  ('integrations', 'Integrations - Third-party services', false),
  ('admin', 'Admin Panel - System admin (founder-only)', false),
  ('deploy', 'Deployment - Infrastructure (founder-only)', false),
  ('featureGate', 'Feature Gate - Control releases (founder-only)', false)
ON CONFLICT (feature_name) DO NOTHING;

ALTER TABLE released_features ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view released features" ON released_features;
CREATE POLICY "Anyone can view released features"
  ON released_features FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can update features" ON released_features;
CREATE POLICY "Authenticated users can update features"
  ON released_features FOR UPDATE USING (auth.uid() IS NOT NULL);

GRANT ALL ON released_features TO authenticated, anon;

-- ============================================
-- TABLE 2: user_integrations
-- ============================================

CREATE TABLE IF NOT EXISTS user_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  integration TEXT NOT NULL,
  connected BOOLEAN DEFAULT false,
  read_access BOOLEAN DEFAULT false,
  write_access BOOLEAN DEFAULT false,
  credentials JSONB DEFAULT '{}',
  avatar_url TEXT,
  connected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, integration)
);

CREATE INDEX IF NOT EXISTS idx_user_integrations_user_id ON user_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_integrations_connected ON user_integrations(connected);

DROP TRIGGER IF EXISTS trg_user_integrations_updated_at ON user_integrations;
CREATE TRIGGER trg_user_integrations_updated_at
  BEFORE UPDATE ON user_integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE FUNCTION set_connected_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.connected = true AND (OLD.connected = false OR OLD.connected IS NULL) THEN
    NEW.connected_at := NOW();
  ELSIF NEW.connected = false THEN
    NEW.connected_at := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_connected_at ON user_integrations;
CREATE TRIGGER trg_set_connected_at
  BEFORE UPDATE ON user_integrations
  FOR EACH ROW
  EXECUTE FUNCTION set_connected_at();

ALTER TABLE user_integrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own integrations" ON user_integrations;
CREATE POLICY "Users can view own integrations"
  ON user_integrations FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own integrations" ON user_integrations;
CREATE POLICY "Users can insert own integrations"
  ON user_integrations FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own integrations" ON user_integrations;
CREATE POLICY "Users can update own integrations"
  ON user_integrations FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own integrations" ON user_integrations;
CREATE POLICY "Users can delete own integrations"
  ON user_integrations FOR DELETE USING (auth.uid() = user_id);

GRANT ALL ON user_integrations TO authenticated;

-- ============================================
-- DONE! Verify:
SELECT 'released_features' as table_name, COUNT(*) as rows FROM released_features
UNION ALL
SELECT 'user_integrations', COUNT(*) FROM user_integrations;
-- Should show: released_features = 9, user_integrations = 0
-- ============================================
