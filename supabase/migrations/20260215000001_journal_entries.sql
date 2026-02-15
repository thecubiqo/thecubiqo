-- Daily Journal Feature - Database Schema
-- Created: 2026-02-15
-- Version: 1.0

-- ============================================================================
-- JOURNAL_ENTRIES TABLE
-- Stores daily journal entries with once-per-day enforcement
-- ============================================================================

CREATE TABLE journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Journal content
  content TEXT NOT NULL,
  mood TEXT DEFAULT 'neutral',              -- neutral, positive, reflective, challenged
  color_state TEXT DEFAULT 'ORANGE',        -- ORANGE (journal mode), RED, YELLOW, GREEN_BLUE
  
  -- Metadata
  duration_seconds INT DEFAULT 0,           -- Time spent journaling
  word_count INT DEFAULT 0,
  
  -- Email tracking
  email_queued BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_journal_entries_session_id ON journal_entries(session_id);
CREATE INDEX idx_journal_entries_user_id ON journal_entries(user_id);
CREATE INDEX idx_journal_entries_created_at ON journal_entries(created_at DESC);
CREATE INDEX idx_journal_entries_email_queued ON journal_entries(email_queued) WHERE email_queued = false;

-- Enforce one entry per user per day (UTC day)
CREATE UNIQUE INDEX idx_journal_daily_user 
  ON journal_entries(user_id, DATE(created_at))
  WHERE user_id IS NOT NULL;

-- For guest sessions (less strict, allow by session)
CREATE UNIQUE INDEX idx_journal_daily_session 
  ON journal_entries(session_id, DATE(created_at))
  WHERE user_id IS NULL;

-- ============================================================================
-- JOURNAL_ANALYTICS TABLE
-- Track engagement metrics for admin dashboard
-- ============================================================================

CREATE TABLE journal_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID REFERENCES journal_entries(id) ON DELETE CASCADE,
  
  -- Engagement metrics
  prompts_completed INT DEFAULT 0,          -- Number of prompts answered
  interruptions INT DEFAULT 0,               -- Times user paused/resumed
  completion_rate DECIMAL(5,2),              -- 0.00 to 100.00
  
  -- Behavioral data
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  device_info JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_journal_analytics_entry_id ON journal_analytics(entry_id);
CREATE INDEX idx_journal_analytics_created_at ON journal_analytics(created_at DESC);

-- ============================================================================
-- EMAIL_QUEUE TABLE
-- Queue for sending journal summary emails
-- ============================================================================

CREATE TABLE email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Email details
  type TEXT NOT NULL,                        -- journal_summary, journal_reminder, etc.
  recipient_email TEXT NOT NULL,
  subject TEXT,
  
  -- Payload
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Status tracking
  status TEXT DEFAULT 'pending',             -- pending, processing, sent, failed
  attempts INT DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Status validation
ALTER TABLE email_queue ADD CONSTRAINT status_valid
  CHECK (status IN ('pending', 'processing', 'sent', 'failed'));

-- Indexes for queue processing
CREATE INDEX idx_email_queue_status ON email_queue(status);
CREATE INDEX idx_email_queue_created_at ON email_queue(created_at DESC);
CREATE INDEX idx_email_queue_pending ON email_queue(status, created_at) WHERE status = 'pending';

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Update updated_at timestamp
CREATE TRIGGER trg_journal_entries_updated_at
  BEFORE UPDATE ON journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Auto-calculate word count on insert/update
CREATE OR REPLACE FUNCTION calculate_word_count()
RETURNS TRIGGER AS $$
BEGIN
  NEW.word_count := array_length(regexp_split_to_array(trim(NEW.content), '\s+'), 1);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_calculate_word_count
  BEFORE INSERT OR UPDATE ON journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION calculate_word_count();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;

-- Users can view their own journal entries
CREATE POLICY "Users can view own journal entries"
  ON journal_entries FOR SELECT
  USING (
    user_id = auth.uid() OR
    session_id IN (
      SELECT id FROM sessions
      WHERE user_id = auth.uid() OR (user_id IS NULL AND is_guest = true)
    )
  );

-- Users can create journal entries
CREATE POLICY "Users can create journal entries"
  ON journal_entries FOR INSERT
  WITH CHECK (
    user_id = auth.uid() OR
    session_id IN (
      SELECT id FROM sessions
      WHERE user_id = auth.uid() OR (user_id IS NULL AND is_guest = true)
    )
  );

-- Users can update their own entries (within same day)
CREATE POLICY "Users can update own journal entries"
  ON journal_entries FOR UPDATE
  USING (
    (user_id = auth.uid() OR
    session_id IN (
      SELECT id FROM sessions
      WHERE user_id = auth.uid() OR (user_id IS NULL AND is_guest = true)
    )) AND
    DATE(created_at) = CURRENT_DATE
  );

-- Analytics policies (read-only for users)
CREATE POLICY "Users can view own analytics"
  ON journal_analytics FOR SELECT
  USING (
    entry_id IN (
      SELECT id FROM journal_entries
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service can manage analytics"
  ON journal_analytics FOR ALL
  USING (true);

-- Email queue policies (service role only)
CREATE POLICY "Service can manage email queue"
  ON email_queue FOR ALL
  USING (true);

-- ============================================================================
-- HELPER FUNCTION - Check if user can journal today
-- ============================================================================

CREATE OR REPLACE FUNCTION can_journal_today(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  entry_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM journal_entries
    WHERE user_id = p_user_id
      AND DATE(created_at) = CURRENT_DATE
  ) INTO entry_exists;
  
  RETURN NOT entry_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON journal_entries TO anon, authenticated;
GRANT ALL ON journal_analytics TO anon, authenticated;
GRANT ALL ON email_queue TO anon, authenticated;
GRANT EXECUTE ON FUNCTION can_journal_today TO anon, authenticated;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
