-- Add ui.useParticleLandingAsHome feature flag
-- Created: 2026-02-16
-- Purpose: Allow switching between default FullscreenApp and ParticleLanding as home page
-- Related to PR #37

-- Insert the feature flag (disabled by default to maintain current behavior)
INSERT INTO feature_flags (name, description, enabled, scope, config)
VALUES (
  'ui.useParticleLandingAsHome',
  'Use ParticleLanding scene as the main landing page instead of FullscreenApp. When enabled, the home page (/) will render the interactive particle scene with landing overlay.',
  false,
  'global',
  '{}'::jsonb
)
ON CONFLICT (name) DO NOTHING;
