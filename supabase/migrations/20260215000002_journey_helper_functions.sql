-- Journey Memory System - Helper Functions for Admin Metrics
-- Created: 2026-02-15

-- ============================================================================
-- GET TOP USERS BY MEMORY COUNT
-- ============================================================================

CREATE OR REPLACE FUNCTION get_top_journey_users(limit_count INT DEFAULT 10)
RETURNS TABLE (
  user_id UUID,
  memory_count BIGINT,
  avg_importance FLOAT,
  last_memory_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    jm.user_id,
    COUNT(jm.id) as memory_count,
    AVG(jm.importance_score) as avg_importance,
    MAX(jm.created_at) as last_memory_at
  FROM journey_memories jm
  GROUP BY jm.user_id
  ORDER BY memory_count DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION get_top_journey_users TO anon, authenticated;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
