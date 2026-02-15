-- Self-Heal Reports System
-- Created: 2026-02-15
-- Tracks daily self-heal job execution and results

-- Enable UUID extension (should already be enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- SELF_HEAL_REPORTS TABLE
-- Stores the results of each self-heal job execution
-- ============================================================================

CREATE TABLE self_heal_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  status TEXT NOT NULL,                     -- success/partial/failed
  diagnostics JSONB DEFAULT '{}'::jsonb,    -- Diagnostic results
  repairs JSONB DEFAULT '[]'::jsonb,        -- Array of repairs attempted
  rollback_patch TEXT,                      -- SQL or commands to rollback changes
  fixed_issues JSONB DEFAULT '[]'::jsonb,   -- Issues that were fixed
  critical_issues JSONB DEFAULT '[]'::jsonb, -- Critical issues found
  recommendations JSONB DEFAULT '[]'::jsonb, -- Recommendations for manual review
  email_sent BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMPTZ,
  email_to TEXT DEFAULT 'aditya@cubiqo.ai',
  execution_time_ms INTEGER,                -- Time taken to complete
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Status validation
ALTER TABLE self_heal_reports ADD CONSTRAINT status_valid
  CHECK (status IN ('success', 'partial', 'failed'));

-- Index for date lookups
CREATE INDEX idx_self_heal_reports_run_date ON self_heal_reports(run_date DESC);
CREATE INDEX idx_self_heal_reports_status ON self_heal_reports(status);

-- ============================================================================
-- SELF_HEAL_AUDIT_LOGS TABLE
-- Detailed audit trail for each repair action taken
-- ============================================================================

CREATE TABLE self_heal_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES self_heal_reports(id) ON DELETE CASCADE NOT NULL,
  action_type TEXT NOT NULL,                -- cache_clear/service_restart/migration_reapply/etc
  action_details JSONB DEFAULT '{}'::jsonb, -- Specific details about the action
  status TEXT NOT NULL,                     -- success/failed/skipped
  error_message TEXT,
  rollback_command TEXT,                    -- Command to undo this specific action
  executed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Status validation
ALTER TABLE self_heal_audit_logs ADD CONSTRAINT audit_status_valid
  CHECK (status IN ('success', 'failed', 'skipped'));

-- Index for report lookups
CREATE INDEX idx_self_heal_audit_logs_report_id ON self_heal_audit_logs(report_id);
CREATE INDEX idx_self_heal_audit_logs_executed_at ON self_heal_audit_logs(executed_at DESC);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE self_heal_reports IS 'Stores results of daily self-heal job executions';
COMMENT ON TABLE self_heal_audit_logs IS 'Detailed audit trail for each repair action taken during self-heal jobs';
