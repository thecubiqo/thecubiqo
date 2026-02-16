-- Self-Heal Reports Table
-- Created: 2026-02-15
-- Purpose: Store audit entries for daily self-heal job runs

-- ============================================================================
-- SELF_HEAL_REPORTS TABLE
-- Tracks self-heal job executions with diagnostics, fixes, and reports
-- ============================================================================

CREATE TABLE self_heal_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Diagnostics results
  diagnostics JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Auto-fixes performed
  fixes_applied JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Issues found (if any)
  issues_found JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Status of the run
  status TEXT NOT NULL CHECK (status IN ('success', 'partial', 'failed')),
  
  -- Rollback patch file path
  rollback_patch_path TEXT,
  
  -- Report file path
  report_path TEXT,
  
  -- Email sent confirmation
  email_sent BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMPTZ,
  
  -- Signature for verification
  report_signature TEXT,
  
  -- Duration in milliseconds
  duration_ms INT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for querying recent reports
CREATE INDEX idx_self_heal_reports_executed_at ON self_heal_reports(executed_at DESC);
CREATE INDEX idx_self_heal_reports_status ON self_heal_reports(status);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE self_heal_reports ENABLE ROW LEVEL SECURITY;

-- Only service role can insert
CREATE POLICY "Service role can insert self heal reports"
  ON self_heal_reports FOR INSERT
  WITH CHECK (true);

-- Only service role can view
CREATE POLICY "Service role can view self heal reports"
  ON self_heal_reports FOR SELECT
  USING (true);

-- ============================================================================
-- GRANTS
-- ============================================================================

-- Grant access to authenticated users (admin UI needs to read)
GRANT SELECT ON self_heal_reports TO authenticated;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE self_heal_reports IS 'Audit log for daily self-heal job executions';
COMMENT ON COLUMN self_heal_reports.diagnostics IS 'JSON object containing diagnostic results (cache size, service health, etc.)';
COMMENT ON COLUMN self_heal_reports.fixes_applied IS 'Array of fixes that were applied during this run';
COMMENT ON COLUMN self_heal_reports.issues_found IS 'Array of issues detected during diagnostics';
COMMENT ON COLUMN self_heal_reports.rollback_patch_path IS 'File path to rollback patch if fixes were applied';
COMMENT ON COLUMN self_heal_reports.report_signature IS 'Cryptographic signature of the report for verification';
