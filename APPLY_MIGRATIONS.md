# Apply Migrations to Supabase

**Go to:** https://supabase.com/dashboard/project/naoxezcmcauecawchgjk/sql/new

**Copy and paste each migration below, one at a time, and click "Run"**

---

## Migration 1: released_features table

```sql
-- Feature Gate System
-- Table to track which features are released to regular users
-- Founders always have full access regardless of this table

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

-- Feature name validation (must be valid FeatureAccess key)
DO $$ BEGIN
  ALTER TABLE released_features ADD CONSTRAINT feature_name_valid
    CHECK (feature_name IN (
      'agents',
      'files',
      'memory',
      'codeExecution',
      'browser',
      'integrations',
      'admin',
      'deploy',
      'featureGate'
    ));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_released_features_is_released ON released_features(is_released);

-- Update timestamp function (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update timestamp trigger
DROP TRIGGER IF EXISTS trg_released_features_updated_at ON released_features;
CREATE TRIGGER trg_released_features_updated_at
  BEFORE UPDATE ON released_features
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Auto-set released_at when toggled to true
CREATE OR REPLACE FUNCTION set_released_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_released = true AND OLD.is_released = false THEN
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

-- Insert all features with default state (unreleased)
INSERT INTO released_features (feature_name, description, is_released) VALUES
  ('agents', 'AI Agents - Spawn and manage AI agents for complex tasks', false),
  ('files', 'File Management - Upload, manage, and process files', false),
  ('memory', 'Memory System - Long-term memory and context retention', false),
  ('codeExecution', 'Code Execution - Run code snippets and scripts', false),
  ('browser', 'Browser Control - Web automation and browser interaction', false),
  ('integrations', 'Integrations - Third-party service integrations', false),
  ('admin', 'Admin Panel - System administration (founder-only)', false),
  ('deploy', 'Deployment - Deploy and manage infrastructure (founder-only)', false),
  ('featureGate', 'Feature Gate - Control feature releases (founder-only)', false)
ON CONFLICT (feature_name) DO NOTHING;

-- RLS Policies for released_features
ALTER TABLE released_features ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view released features" ON released_features;
CREATE POLICY "Anyone can view released features"
  ON released_features FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can update features" ON released_features;
CREATE POLICY "Authenticated users can update features"
  ON released_features FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Grant access
GRANT ALL ON released_features TO authenticated, anon;

COMMENT ON TABLE released_features IS 'Controls which features are released to regular users. Founders bypass this system.';
```

---

## Migration 2: user_integrations table

```sql
-- User Integrations System
-- Tracks which external services users have connected and their access levels

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

-- Integration name validation
DO $$ BEGIN
  ALTER TABLE user_integrations ADD CONSTRAINT integration_valid
    CHECK (integration IN (
      'gmail',
      'calendar',
      'maps',
      'uber',
      'twitter',
      'linkedin',
      'github',
      'slack',
      'discord',
      'telegram',
      'whatsapp',
      'notion',
      'drive',
      'spotify'
    ));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_integrations_user_id ON user_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_integrations_connected ON user_integrations(connected);

-- Update timestamp trigger
DROP TRIGGER IF EXISTS trg_user_integrations_updated_at ON user_integrations;
CREATE TRIGGER trg_user_integrations_updated_at
  BEFORE UPDATE ON user_integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Auto-set connected_at when connected becomes true
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

-- RLS Policies
ALTER TABLE user_integrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own integrations" ON user_integrations;
CREATE POLICY "Users can view own integrations"
  ON user_integrations FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own integrations" ON user_integrations;
CREATE POLICY "Users can insert own integrations"
  ON user_integrations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own integrations" ON user_integrations;
CREATE POLICY "Users can update own integrations"
  ON user_integrations FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own integrations" ON user_integrations;
CREATE POLICY "Users can delete own integrations"
  ON user_integrations FOR DELETE
  USING (auth.uid() = user_id);

-- Grant access
GRANT ALL ON user_integrations TO authenticated;

COMMENT ON TABLE user_integrations IS 'Tracks user connections to external services with read/write permissions';
```

---

## After Running Both Migrations

**Verify in Supabase:**
1. Go to Table Editor
2. You should see:
   - `released_features` table with 9 rows
   - `user_integrations` table (empty)

**Then come back here and I'll:**
1. Remove the mock data from the code
2. Rebuild with real database
3. Deploy to production
4. Feature gate will work permanently!
