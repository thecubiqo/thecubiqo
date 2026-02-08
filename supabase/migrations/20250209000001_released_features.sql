-- Feature Gate System
-- Table to track which features are released to regular users
-- Founders always have full access regardless of this table

CREATE TABLE released_features (
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

-- Index for fast lookups
CREATE INDEX idx_released_features_is_released ON released_features(is_released);

-- Update timestamp trigger
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
  ('featureGate', 'Feature Gate - Control feature releases (founder-only)', false);

-- RLS Policies for released_features
ALTER TABLE released_features ENABLE ROW LEVEL SECURITY;

-- Everyone can read (to check feature access)
CREATE POLICY "Anyone can view released features"
  ON released_features FOR SELECT
  USING (true);

-- Only authenticated users can update (will be further restricted in API)
CREATE POLICY "Authenticated users can update features"
  ON released_features FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Grant access
GRANT ALL ON released_features TO authenticated, anon;

COMMENT ON TABLE released_features IS 'Controls which features are released to regular users. Founders bypass this system.';
