-- Journey Memory System - Database Schema
-- Created: 2026-02-15
-- Feature: Progressive memory storage with consent and privacy controls
-- Status: Behind feature flag

-- ============================================================================
-- FEATURE FLAGS TABLE
-- Control feature rollout and access
-- ============================================================================

CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  enabled BOOLEAN DEFAULT false,
  description TEXT,
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for feature flag lookups
CREATE INDEX idx_feature_flags_name ON feature_flags(name);
CREATE INDEX idx_feature_flags_enabled ON feature_flags(enabled);

-- Insert journey memory feature flag (disabled by default)
INSERT INTO feature_flags (name, enabled, description, config)
VALUES (
  'journey_memory',
  false,
  'Progressive memory system with consent and privacy controls',
  '{"version": "1.0", "max_memories_per_user": 10000, "retention_days_default": 365}'::jsonb
)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- JOURNEY CONSENTS TABLE
-- Track user opt-in and retention preferences
-- ============================================================================

CREATE TABLE journey_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  opted_in BOOLEAN DEFAULT false NOT NULL,
  retention_days INT DEFAULT 365,          -- How long to keep memories (null = forever)
  consent_version TEXT DEFAULT 'v1.0',
  consented_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,      -- Store consent details, IP, user agent, etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure one active consent per user
CREATE UNIQUE INDEX idx_journey_consents_user_active 
  ON journey_consents(user_id) 
  WHERE revoked_at IS NULL;

-- Indexes for consent lookups
CREATE INDEX idx_journey_consents_user_id ON journey_consents(user_id);
CREATE INDEX idx_journey_consents_opted_in ON journey_consents(opted_in);
CREATE INDEX idx_journey_consents_session_id ON journey_consents(session_id);

-- ============================================================================
-- JOURNEY MEMORIES TABLE
-- Progressive memory storage with embeddings for similarity search
-- ============================================================================

CREATE TABLE journey_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  
  -- Memory content
  content TEXT NOT NULL,
  summary TEXT,                            -- Auto-generated summary for fast access
  category TEXT,                           -- green/yellow/red or custom categories
  importance_score FLOAT DEFAULT 0.5,      -- 0-1 scale for memory importance
  
  -- Embeddings for similarity search
  embedding vector(1536),                  -- OpenAI text-embedding-3-small dimension
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,      -- Store context, entities, tags, etc.
  source TEXT,                             -- chat/journal/voice/etc.
  
  -- Privacy and lifecycle
  is_sensitive BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ,                  -- Auto-delete date based on retention
  accessed_count INT DEFAULT 0,
  last_accessed_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for memory lookups and performance
CREATE INDEX idx_journey_memories_user_id ON journey_memories(user_id);
CREATE INDEX idx_journey_memories_session_id ON journey_memories(session_id);
CREATE INDEX idx_journey_memories_conversation_id ON journey_memories(conversation_id);
CREATE INDEX idx_journey_memories_category ON journey_memories(category);
CREATE INDEX idx_journey_memories_importance ON journey_memories(importance_score DESC);
CREATE INDEX idx_journey_memories_expires_at ON journey_memories(expires_at);
CREATE INDEX idx_journey_memories_created_at ON journey_memories(created_at DESC);

-- Enable pgvector extension for similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Vector similarity index (IVFFlat for fast approximate search)
CREATE INDEX idx_journey_memories_embedding ON journey_memories 
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- ============================================================================
-- JOURNEY ROLLBACK LOGS TABLE
-- Track all memory deletions and modifications for audit trail
-- ============================================================================

CREATE TABLE journey_rollback_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,               -- delete_memory, delete_all, revoke_consent, etc.
  affected_memory_id UUID,                 -- Reference to deleted memory (if applicable)
  affected_count INT DEFAULT 0,            -- Number of memories affected
  reason TEXT,                             -- User-provided or system reason
  metadata JSONB DEFAULT '{}'::jsonb,      -- Store deleted memory snapshot, request details, etc.
  performed_by TEXT DEFAULT 'user',        -- user/admin/system
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for audit trail
CREATE INDEX idx_journey_rollback_logs_user_id ON journey_rollback_logs(user_id);
CREATE INDEX idx_journey_rollback_logs_action_type ON journey_rollback_logs(action_type);
CREATE INDEX idx_journey_rollback_logs_created_at ON journey_rollback_logs(created_at DESC);
CREATE INDEX idx_journey_rollback_logs_memory_id ON journey_rollback_logs(affected_memory_id);

-- ============================================================================
-- JOURNEY METRICS TABLE (for monetization and analytics)
-- Aggregate memory statistics for admin dashboard
-- ============================================================================

CREATE TABLE journey_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Memory stats
  total_memories INT DEFAULT 0,
  memories_added_today INT DEFAULT 0,
  memories_accessed_today INT DEFAULT 0,
  average_importance FLOAT DEFAULT 0,
  
  -- Completeness metrics
  memory_completeness_score FLOAT DEFAULT 0,  -- 0-1 scale
  profile_completeness_score FLOAT DEFAULT 0, -- 0-1 scale
  
  -- Engagement metrics
  similarity_queries_count INT DEFAULT 0,
  memory_quality_score FLOAT DEFAULT 0,       -- Based on richness, connections, etc.
  
  -- Monetization hooks
  monetizable_interactions INT DEFAULT 0,
  premium_feature_uses INT DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint: one row per user per date
CREATE UNIQUE INDEX idx_journey_metrics_user_date ON journey_metrics(user_id, metric_date);

-- Indexes for analytics
CREATE INDEX idx_journey_metrics_user_id ON journey_metrics(user_id);
CREATE INDEX idx_journey_metrics_date ON journey_metrics(metric_date DESC);
CREATE INDEX idx_journey_metrics_completeness ON journey_metrics(memory_completeness_score DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE journey_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE journey_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE journey_rollback_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE journey_metrics ENABLE ROW LEVEL SECURITY;

-- Feature Flags Policies (read-only for all, admin-only write)
CREATE POLICY "Anyone can read feature flags"
  ON feature_flags FOR SELECT
  USING (true);

-- Journey Consents Policies
CREATE POLICY "Users can view own consents"
  ON journey_consents FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own consents"
  ON journey_consents FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own consents"
  ON journey_consents FOR UPDATE
  USING (user_id = auth.uid());

-- Journey Memories Policies
CREATE POLICY "Users can view own memories"
  ON journey_memories FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own memories"
  ON journey_memories FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own memories"
  ON journey_memories FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own memories"
  ON journey_memories FOR DELETE
  USING (user_id = auth.uid());

-- Journey Rollback Logs Policies
CREATE POLICY "Users can view own rollback logs"
  ON journey_rollback_logs FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create rollback logs"
  ON journey_rollback_logs FOR INSERT
  WITH CHECK (true);  -- System can create logs for any user

-- Journey Metrics Policies
CREATE POLICY "Users can view own metrics"
  ON journey_metrics FOR SELECT
  USING (user_id = auth.uid());

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Auto-set memory expiry based on user's retention preference
CREATE OR REPLACE FUNCTION set_journey_memory_expiry()
RETURNS TRIGGER AS $$
DECLARE
  retention_days INT;
BEGIN
  IF NEW.expires_at IS NULL THEN
    -- Get user's retention preference
    SELECT jc.retention_days INTO retention_days
    FROM journey_consents jc
    WHERE jc.user_id = NEW.user_id 
      AND jc.opted_in = true
      AND jc.revoked_at IS NULL
    ORDER BY jc.created_at DESC
    LIMIT 1;
    
    -- Set expiry if retention period is defined
    IF retention_days IS NOT NULL THEN
      NEW.expires_at := NOW() + (retention_days || ' days')::INTERVAL;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_journey_memory_expiry
  BEFORE INSERT ON journey_memories
  FOR EACH ROW
  EXECUTE FUNCTION set_journey_memory_expiry();

-- Update timestamps
CREATE TRIGGER trg_journey_consents_updated_at
  BEFORE UPDATE ON journey_consents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_journey_memories_updated_at
  BEFORE UPDATE ON journey_memories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_journey_metrics_updated_at
  BEFORE UPDATE ON journey_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_feature_flags_updated_at
  BEFORE UPDATE ON feature_flags
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- SIMILARITY SEARCH FUNCTION
-- Find similar memories using vector embeddings
-- ============================================================================

CREATE OR REPLACE FUNCTION search_journey_memories(
  query_embedding vector(1536),
  query_user_id UUID,
  match_threshold FLOAT DEFAULT 0.5,
  match_count INT DEFAULT 10,
  filter_category TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  summary TEXT,
  category TEXT,
  importance_score FLOAT,
  similarity FLOAT,
  metadata JSONB,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    jm.id,
    jm.content,
    jm.summary,
    jm.category,
    jm.importance_score,
    1 - (jm.embedding <=> query_embedding) AS similarity,
    jm.metadata,
    jm.created_at
  FROM journey_memories jm
  WHERE jm.user_id = query_user_id
    AND jm.embedding IS NOT NULL
    AND (filter_category IS NULL OR jm.category = filter_category)
    AND (jm.expires_at IS NULL OR jm.expires_at > NOW())
    AND 1 - (jm.embedding <=> query_embedding) >= match_threshold
  ORDER BY jm.embedding <=> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- CLEANUP FUNCTIONS
-- ============================================================================

-- Function to clean up expired memories
CREATE OR REPLACE FUNCTION cleanup_expired_journey_memories()
RETURNS INT AS $$
DECLARE
  deleted_count INT;
BEGIN
  -- Log deletions before removing
  INSERT INTO journey_rollback_logs (user_id, action_type, affected_count, reason, performed_by)
  SELECT 
    user_id,
    'expired_deletion',
    COUNT(*),
    'Automatic deletion of expired memories',
    'system'
  FROM journey_memories
  WHERE expires_at IS NOT NULL AND expires_at < NOW()
  GROUP BY user_id;
  
  -- Delete expired memories
  WITH deleted AS (
    DELETE FROM journey_memories
    WHERE expires_at IS NOT NULL AND expires_at < NOW()
    RETURNING id
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE journey_memories IS 'Progressive memory storage for Journey system with vector embeddings';
COMMENT ON TABLE journey_consents IS 'User consent and retention preferences for Journey memory system';
COMMENT ON TABLE journey_rollback_logs IS 'Audit trail for all memory deletions and modifications';
COMMENT ON TABLE journey_metrics IS 'Aggregated metrics for admin dashboard and monetization';
COMMENT ON TABLE feature_flags IS 'Feature flag management for gradual rollout';

COMMENT ON COLUMN journey_memories.embedding IS 'OpenAI text-embedding-3-small (1536 dimensions) for similarity search';
COMMENT ON COLUMN journey_memories.importance_score IS 'AI-computed importance score (0-1) for memory prioritization';
COMMENT ON COLUMN journey_metrics.memory_completeness_score IS 'Score indicating how complete the user memory profile is (0-1)';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
