-- Migration: Monitoring Events Table
-- Created: 2026-02-19
-- Purpose: Store activity events from GitHub Actions workflows for monitoring

-- Create monitoring_events table
CREATE TABLE IF NOT EXISTS monitoring_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL CHECK (event_type IN ('branch_push', 'pr_activity', 'deployment', 'health_check')),
  event_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  repository TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_monitoring_events_type ON monitoring_events(event_type);
CREATE INDEX IF NOT EXISTS idx_monitoring_events_created_at ON monitoring_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_monitoring_events_repository ON monitoring_events(repository);

-- Add RLS (Row Level Security) policies
ALTER TABLE monitoring_events ENABLE ROW LEVEL SECURITY;

-- Policy: Admin users can read all monitoring events
CREATE POLICY "Admin users can read monitoring events"
  ON monitoring_events
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE is_admin = true
    )
  );

-- Policy: System can insert monitoring events (service role only)
-- This will be used by the API endpoint with service role key
CREATE POLICY "System can insert monitoring events"
  ON monitoring_events
  FOR INSERT
  WITH CHECK (true); -- Service role bypasses this anyway

-- Add comment for documentation
COMMENT ON TABLE monitoring_events IS 'Stores activity events from GitHub Actions workflows for system monitoring';
COMMENT ON COLUMN monitoring_events.event_type IS 'Type of monitoring event: branch_push, pr_activity, deployment, or health_check';
COMMENT ON COLUMN monitoring_events.event_data IS 'JSON data containing event-specific details';
COMMENT ON COLUMN monitoring_events.repository IS 'GitHub repository identifier (e.g., owner/repo)';

-- Grant permissions
GRANT SELECT ON monitoring_events TO authenticated;
GRANT INSERT ON monitoring_events TO service_role;
