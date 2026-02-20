-- Migration: missing tables required by existing API routes
-- Adds: conscious_memories, daily_summaries, pending_intents, regions

-- ============================================================
-- 1. conscious_memories  (used by /api/memory/*)
-- ============================================================
CREATE TABLE IF NOT EXISTS conscious_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('factual', 'preference', 'emotional', 'goal', 'relationship', 'context')),
  content TEXT NOT NULL,
  importance TEXT NOT NULL DEFAULT 'medium' CHECK (importance IN ('low', 'medium', 'high', 'critical')),
  context TEXT,
  tags TEXT[] DEFAULT '{}',
  related_memories UUID[] DEFAULT '{}',
  source_conversation_id UUID,
  source_message_id UUID,
  verified BOOLEAN NOT NULL DEFAULT false,
  last_accessed TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  access_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE conscious_memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own memories"
  ON conscious_memories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own memories"
  ON conscious_memories FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_conscious_memories_user_id ON conscious_memories(user_id);
CREATE INDEX IF NOT EXISTS idx_conscious_memories_type ON conscious_memories(type);
CREATE INDEX IF NOT EXISTS idx_conscious_memories_importance ON conscious_memories(importance);
CREATE INDEX IF NOT EXISTS idx_conscious_memories_last_accessed ON conscious_memories(last_accessed DESC);

-- ============================================================
-- 2. daily_summaries  (used by /api/journal/summary and /api/journal/stats)
-- ============================================================
CREATE TABLE IF NOT EXISTS daily_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  entry_count INTEGER NOT NULL DEFAULT 0,
  dominant_color TEXT CHECK (dominant_color IN ('RED', 'YELLOW', 'GREEN_BLUE')),
  avg_mood NUMERIC(4,2),
  top_keywords TEXT[] DEFAULT '{}',
  highlights TEXT[] DEFAULT '{}',
  total_words INTEGER NOT NULL DEFAULT 0,
  voice_entries INTEGER NOT NULL DEFAULT 0,
  text_entries INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, date)
);

ALTER TABLE daily_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own daily summaries"
  ON daily_summaries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own daily summaries"
  ON daily_summaries FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_daily_summaries_user_date ON daily_summaries(user_id, date DESC);

-- ============================================================
-- 3. pending_intents  (used by /api/verbal-command)
-- ============================================================
CREATE TABLE IF NOT EXISTS pending_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  intent JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '5 minutes'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE pending_intents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own pending intents"
  ON pending_intents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own pending intents"
  ON pending_intents FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_pending_intents_user_id ON pending_intents(user_id);
CREATE INDEX IF NOT EXISTS idx_pending_intents_expires_at ON pending_intents(expires_at);

-- ============================================================
-- 4. regions  (used by /api/services)
-- ============================================================
CREATE TABLE IF NOT EXISTS regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id TEXT NOT NULL UNIQUE,
  country_code TEXT NOT NULL,
  name TEXT NOT NULL,
  locale TEXT NOT NULL DEFAULT 'en',
  routing JSONB NOT NULL DEFAULT '{}',
  localization JSONB NOT NULL DEFAULT '{}',
  cultural JSONB NOT NULL DEFAULT '{}',
  appearance JSONB NOT NULL DEFAULT '{}',
  features JSONB NOT NULL DEFAULT '{}',
  ai JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE regions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view regions"
  ON regions FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage regions"
  ON regions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    )
  );

CREATE INDEX IF NOT EXISTS idx_regions_region_id ON regions(region_id);
CREATE INDEX IF NOT EXISTS idx_regions_country_code ON regions(country_code);
