-- Design/Feature Toggles System
-- Created: 2026-02-15
-- Version: 1.0
-- Purpose: Dedicated table for design and feature toggles, separate from feature_flags

-- ============================================================================
-- DESIGN TOGGLES TABLE
-- Stores design and feature toggles with simpler structure than feature_flags
-- ============================================================================

CREATE TABLE IF NOT EXISTS design_toggles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'design', -- 'design', 'feature', 'experiment'
  is_enabled BOOLEAN DEFAULT true,
  config JSONB DEFAULT '{}'::jsonb,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Category validation
ALTER TABLE design_toggles ADD CONSTRAINT category_valid
  CHECK (category IN ('design', 'feature', 'experiment'));

-- Indexes for toggle lookups
CREATE INDEX idx_design_toggles_name ON design_toggles(name);
CREATE INDEX idx_design_toggles_category ON design_toggles(category);
CREATE INDEX idx_design_toggles_is_enabled ON design_toggles(is_enabled);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE design_toggles ENABLE ROW LEVEL SECURITY;

-- Anyone can read design toggles (for checking in client)
CREATE POLICY "Anyone can read design toggles"
  ON design_toggles FOR SELECT
  USING (true);

-- Only admins can manage design toggles
-- Admin check: user email must be in the admin list
CREATE POLICY "Admins can manage design toggles"
  ON design_toggles FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM profiles 
      WHERE email IN ('aditya@cubiqo.ai')
    )
  );

-- ============================================================================
-- TRIGGER: Update updated_at timestamp
-- ============================================================================

CREATE TRIGGER trg_design_toggles_updated_at
  BEFORE UPDATE ON design_toggles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- SEED DATA: Default design toggles
-- ============================================================================

INSERT INTO design_toggles (name, display_name, description, category, is_enabled) VALUES
  ('glassmorphic_cube', 'Glassmorphic Isometric Cube', 'Frosted glass cube with particle effects', 'design', false),
  ('energy_wireframe_cube', 'Energy Wireframe Cube', 'Wireframe cube with energy flows', 'design', true),
  ('classic_cube', 'Classic 3D Cube', 'Original CubiQo cube design', 'design', true),
  ('particle_landing', 'Particle Scene Landing', 'Particle-based landing page', 'design', true),
  ('fullscreen_app_landing', 'Fullscreen App Landing', 'Original fullscreen app as landing', 'design', false),
  ('sidekick_mode', 'Sidekick Interaction Mode', 'AI acts as a sidekick companion', 'feature', false),
  ('cope_mode', 'Cope Interaction Mode', 'AI helps with coping and wellness', 'feature', false),
  ('founder_mode', 'Founder Mode', 'Special admin-only mode with elevated AI', 'feature', false),
  ('policy_router', 'Policy Router', 'AI routing with founder escalation', 'feature', false),
  ('ab_testing', 'A/B Testing Framework', 'Enable A/B test experiments', 'experiment', false),
  ('journey_memory', 'Journey Memory System', 'User memory tracking across sessions', 'feature', true),
  ('cq_messaging', 'CQ-to-CQ Messaging', 'Direct messaging between CQ users', 'feature', false),
  ('dark_premium_theme', 'Apple-Grade Premium Theme', 'SF Pro fonts, glass materials, spring animations', 'design', true)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON design_toggles TO anon, authenticated;
GRANT ALL ON design_toggles TO authenticated;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
