-- Migration: Browser Sessions and Actions Audit Schema
-- Sprint 1 - Day 1: Browser automation tracking tables
-- Description: Tables for tracking browser sessions and actions performed during automated browsing
-- Author: GUY (Database Administrator)
-- Date: 2026-02-17

-- ============================================================================
-- TABLE: browser_sessions
-- Purpose: Track browser automation sessions initiated by users
-- ============================================================================

CREATE TABLE browser_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  purpose TEXT,
  status TEXT NOT NULL, -- 'pending', 'active', 'completed', 'failed', 'denied'
  consent_given BOOLEAN DEFAULT FALSE,
  consent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  metadata JSONB
);

-- Add constraint to ensure valid status values
ALTER TABLE browser_sessions
  ADD CONSTRAINT browser_sessions_status_check
  CHECK (status IN ('pending', 'active', 'completed', 'failed', 'denied'));

-- Indexes for performance optimization
CREATE INDEX idx_browser_sessions_user ON browser_sessions(user_id);
CREATE INDEX idx_browser_sessions_status ON browser_sessions(status);
CREATE INDEX idx_browser_sessions_created_at ON browser_sessions(created_at DESC);

-- Comments for documentation
COMMENT ON TABLE browser_sessions IS 'Tracks browser automation sessions initiated by users';
COMMENT ON COLUMN browser_sessions.status IS 'Session status: pending, active, completed, failed, denied';
COMMENT ON COLUMN browser_sessions.consent_given IS 'Whether user has given consent for this session';
COMMENT ON COLUMN browser_sessions.metadata IS 'Additional session metadata stored as JSON';

-- Row Level Security (RLS)
ALTER TABLE browser_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions"
  ON browser_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sessions"
  ON browser_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON browser_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- TABLE: browser_actions
-- Purpose: Audit log of all actions performed during browser sessions
-- ============================================================================

CREATE TABLE browser_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES browser_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'navigate', 'click', 'type', 'screenshot', etc.
  target TEXT, -- URL or selector
  result TEXT,
  success BOOLEAN NOT NULL,
  error TEXT,
  screenshot_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB
);

-- Indexes for performance optimization
CREATE INDEX idx_browser_actions_session ON browser_actions(session_id);
CREATE INDEX idx_browser_actions_user ON browser_actions(user_id);
CREATE INDEX idx_browser_actions_created_at ON browser_actions(created_at DESC);
CREATE INDEX idx_browser_actions_success ON browser_actions(success);

-- Comments for documentation
COMMENT ON TABLE browser_actions IS 'Audit log of all actions performed during browser automation sessions';
COMMENT ON COLUMN browser_actions.action_type IS 'Type of action: navigate, click, type, screenshot, etc.';
COMMENT ON COLUMN browser_actions.target IS 'Target URL or DOM selector for the action';
COMMENT ON COLUMN browser_actions.success IS 'Whether the action completed successfully';
COMMENT ON COLUMN browser_actions.screenshot_url IS 'URL to screenshot captured during or after action';
COMMENT ON COLUMN browser_actions.metadata IS 'Additional action metadata stored as JSON';

-- Row Level Security (RLS)
ALTER TABLE browser_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own actions"
  ON browser_actions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own actions"
  ON browser_actions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- MIGRATION ROLLBACK (Down Migration)
-- Uncomment and run to rollback this migration
-- ============================================================================

-- DROP TABLE IF EXISTS browser_actions CASCADE;
-- DROP TABLE IF EXISTS browser_sessions CASCADE;
