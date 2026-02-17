-- Migration: Browser Consent Records Schema
-- Sprint 1 - Day 2: User consent tracking for browser automation
-- Description: Table for tracking user consent decisions for browser automation actions
-- Author: GUY (Database Administrator)
-- Date: 2026-02-17

-- ============================================================================
-- TABLE: browser_consent_records
-- Purpose: Track user consent decisions for browser automation by domain
-- ============================================================================

CREATE TABLE browser_consent_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES browser_sessions(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  action_description TEXT NOT NULL,
  approved BOOLEAN NOT NULL,
  reason TEXT,
  remember_choice BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance optimization
CREATE INDEX idx_consent_user ON browser_consent_records(user_id);
CREATE INDEX idx_consent_domain ON browser_consent_records(domain);
CREATE INDEX idx_consent_session ON browser_consent_records(session_id);
CREATE INDEX idx_consent_user_domain ON browser_consent_records(user_id, domain);
CREATE INDEX idx_consent_created_at ON browser_consent_records(created_at DESC);

-- Comments for documentation
COMMENT ON TABLE browser_consent_records IS 'Tracks user consent decisions for browser automation actions by domain';
COMMENT ON COLUMN browser_consent_records.domain IS 'Domain name for which consent was requested';
COMMENT ON COLUMN browser_consent_records.action_description IS 'Human-readable description of the action requiring consent';
COMMENT ON COLUMN browser_consent_records.approved IS 'Whether user approved or denied the action';
COMMENT ON COLUMN browser_consent_records.reason IS 'Optional reason provided by user for their decision';
COMMENT ON COLUMN browser_consent_records.remember_choice IS 'Whether to remember this consent choice for future requests';

-- Row Level Security (RLS)
ALTER TABLE browser_consent_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own consent records"
  ON browser_consent_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own consent records"
  ON browser_consent_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- HELPER FUNCTION: Get user's last consent for a domain
-- Purpose: Quickly retrieve user's most recent consent decision for a domain
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_domain_consent(
  p_user_id UUID,
  p_domain TEXT
)
RETURNS TABLE (
  approved BOOLEAN,
  remember_choice BOOLEAN,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bcr.approved,
    bcr.remember_choice,
    bcr.created_at
  FROM browser_consent_records bcr
  WHERE bcr.user_id = p_user_id
    AND bcr.domain = p_domain
    AND bcr.remember_choice = TRUE
  ORDER BY bcr.created_at DESC
  LIMIT 1;
END;
$$;

COMMENT ON FUNCTION get_user_domain_consent IS 'Retrieves the most recent remembered consent decision for a user and domain';

-- ============================================================================
-- MIGRATION ROLLBACK (Down Migration)
-- Uncomment and run to rollback this migration
-- ============================================================================

-- DROP FUNCTION IF EXISTS get_user_domain_consent(UUID, TEXT) CASCADE;
-- DROP TABLE IF EXISTS browser_consent_records CASCADE;
