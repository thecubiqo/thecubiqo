-- RGY Intelligent Matching System
-- Created: 2026-02-18
-- Purpose: Enable intent-based matching and opportunity discovery

-- Enable vector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- USER_INTENTS TABLE
-- Stores user interests, keywords, and RGY context preferences
-- ============================================================================

CREATE TABLE user_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rgy_context TEXT NOT NULL,              -- 'red', 'yellow', or 'green'
  keywords TEXT[] DEFAULT '{}',           -- Array of user-defined keywords
  intent_description TEXT,                -- Optional longer description
  embedding vector(1536),                 -- OpenAI ada-002 embeddings for matching
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RGY context validation
ALTER TABLE user_intents ADD CONSTRAINT rgy_context_valid
  CHECK (rgy_context IN ('red', 'yellow', 'green'));

-- Indexes for efficient lookups
CREATE INDEX idx_user_intents_user_id ON user_intents(user_id);
CREATE INDEX idx_user_intents_rgy_context ON user_intents(rgy_context);
CREATE INDEX idx_user_intents_is_active ON user_intents(is_active);
CREATE INDEX idx_user_intents_embedding ON user_intents USING ivfflat (embedding vector_cosine_ops);

-- Ensure one active intent per user per RGY context
CREATE UNIQUE INDEX idx_user_intents_unique_active 
  ON user_intents(user_id, rgy_context) 
  WHERE is_active = true;

-- ============================================================================
-- OPPORTUNITIES TABLE
-- Matchable rooms, events, connections, or activities
-- ============================================================================

CREATE TABLE opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  rgy_context TEXT NOT NULL,              -- 'red', 'yellow', or 'green'
  opportunity_type TEXT NOT NULL,         -- 'room', 'event', 'connection', 'activity'
  keywords TEXT[] DEFAULT '{}',
  embedding vector(1536),                 -- For matching against user intents
  metadata JSONB DEFAULT '{}'::jsonb,     -- Flexible storage for additional data
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ                  -- Optional expiry for time-limited opportunities
);

-- RGY context validation
ALTER TABLE opportunities ADD CONSTRAINT opp_rgy_context_valid
  CHECK (rgy_context IN ('red', 'yellow', 'green'));

-- Opportunity type validation
ALTER TABLE opportunities ADD CONSTRAINT opp_type_valid
  CHECK (opportunity_type IN ('room', 'event', 'connection', 'activity'));

-- Indexes for efficient lookups and matching
CREATE INDEX idx_opportunities_rgy_context ON opportunities(rgy_context);
CREATE INDEX idx_opportunities_type ON opportunities(opportunity_type);
CREATE INDEX idx_opportunities_is_active ON opportunities(is_active);
CREATE INDEX idx_opportunities_embedding ON opportunities USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_opportunities_expires_at ON opportunities(expires_at) WHERE expires_at IS NOT NULL;

-- ============================================================================
-- MATCHES TABLE
-- Tracks user interest in opportunities and match quality
-- ============================================================================

CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE NOT NULL,
  intent_id UUID REFERENCES user_intents(id) ON DELETE CASCADE,
  similarity_score DECIMAL(5,4),          -- 0.0000 to 1.0000
  status TEXT DEFAULT 'suggested',        -- 'suggested', 'interested', 'joined', 'declined'
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Status validation
ALTER TABLE matches ADD CONSTRAINT match_status_valid
  CHECK (status IN ('suggested', 'interested', 'joined', 'declined', 'expired'));

-- Indexes for efficient lookups
CREATE INDEX idx_matches_user_id ON matches(user_id);
CREATE INDEX idx_matches_opportunity_id ON matches(opportunity_id);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_similarity_score ON matches(similarity_score DESC);

-- Unique constraint: one match per user per opportunity
CREATE UNIQUE INDEX idx_matches_unique ON matches(user_id, opportunity_id);

-- ============================================================================
-- PRO_MATCH_SUBSCRIPTIONS TABLE
-- Tracks users who have opted in for AI-powered opportunity discovery
-- ============================================================================

CREATE TABLE pro_match_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  subscription_tier TEXT DEFAULT 'free',  -- 'free', 'pro', 'premium'
  preferences JSONB DEFAULT '{}'::jsonb,  -- Search frequency, notification settings, etc.
  last_discovery_run TIMESTAMPTZ,         -- When AI last searched for opportunities
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscription tier validation
ALTER TABLE pro_match_subscriptions ADD CONSTRAINT subscription_tier_valid
  CHECK (subscription_tier IN ('free', 'pro', 'premium'));

-- Index for active subscriptions
CREATE INDEX idx_pro_match_subscriptions_active ON pro_match_subscriptions(is_active);
CREATE INDEX idx_pro_match_subscriptions_last_run ON pro_match_subscriptions(last_discovery_run);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER trg_user_intents_updated_at
  BEFORE UPDATE ON user_intents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_opportunities_updated_at
  BEFORE UPDATE ON opportunities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_matches_updated_at
  BEFORE UPDATE ON matches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_pro_match_subscriptions_updated_at
  BEFORE UPDATE ON pro_match_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- MATCHING FUNCTION
-- Find opportunities similar to a user's intent using vector similarity
-- ============================================================================

CREATE OR REPLACE FUNCTION find_matching_opportunities(
  p_user_id UUID,
  p_rgy_context TEXT,
  p_limit INT DEFAULT 10
)
RETURNS TABLE (
  opportunity_id UUID,
  title TEXT,
  description TEXT,
  similarity_score DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.title,
    o.description,
    ROUND((1 - (ui.embedding <=> o.embedding))::numeric, 4) AS similarity_score
  FROM opportunities o
  CROSS JOIN user_intents ui
  WHERE ui.user_id = p_user_id
    AND ui.rgy_context = p_rgy_context
    AND ui.is_active = true
    AND o.rgy_context = p_rgy_context
    AND o.is_active = true
    AND (o.expires_at IS NULL OR o.expires_at > NOW())
    AND ui.embedding IS NOT NULL
    AND o.embedding IS NOT NULL
  ORDER BY ui.embedding <=> o.embedding
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE user_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE pro_match_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies for user_intents: Users can only see and modify their own intents
CREATE POLICY "Users can view their own intents"
  ON user_intents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own intents"
  ON user_intents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own intents"
  ON user_intents FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own intents"
  ON user_intents FOR DELETE
  USING (auth.uid() = user_id);

-- Policies for opportunities: Anyone can view active opportunities
CREATE POLICY "Anyone can view active opportunities"
  ON opportunities FOR SELECT
  USING (is_active = true AND (expires_at IS NULL OR expires_at > NOW()));

CREATE POLICY "Authenticated users can create opportunities"
  ON opportunities FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creators can update their opportunities"
  ON opportunities FOR UPDATE
  USING (auth.uid() = created_by);

-- Policies for matches: Users can only see their own matches
CREATE POLICY "Users can view their own matches"
  ON matches FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own matches"
  ON matches FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own matches"
  ON matches FOR UPDATE
  USING (auth.uid() = user_id);

-- Policies for pro_match_subscriptions: Users can only see and modify their own subscription
CREATE POLICY "Users can view their own subscription"
  ON pro_match_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscription"
  ON pro_match_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription"
  ON pro_match_subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- INITIAL DATA (Optional examples)
-- ============================================================================

-- Create some sample opportunities for testing
-- Note: These will need real embeddings to work with vector matching
INSERT INTO opportunities (title, description, rgy_context, opportunity_type, keywords, metadata) VALUES
  ('Morning Yoga Group', 'Join us for mindful morning yoga sessions', 'green', 'activity', ARRAY['wellness', 'yoga', 'morning', 'health'], '{"schedule": "Mon-Fri 7am", "location": "Virtual"}'),
  ('Tech Startup Networking', 'Connect with fellow entrepreneurs', 'green', 'event', ARRAY['startup', 'tech', 'networking', 'business'], '{"date": "2026-03-15", "format": "Virtual"}'),
  ('Coffee Chat Buddies', 'Casual conversations over virtual coffee', 'yellow', 'room', ARRAY['coffee', 'chat', 'casual', 'friends'], '{"vibe": "relaxed"}'),
  ('Book Club - Fiction Lovers', 'Monthly book discussions', 'yellow', 'room', ARRAY['books', 'reading', 'fiction', 'discussion'], '{"frequency": "monthly"}'),
  ('Creative Writing Workshop', 'Explore creative expression through writing', 'red', 'activity', ARRAY['writing', 'creative', 'expression', 'art'], '{"level": "all"}'),
  ('Deep Conversations Room', 'Meaningful discussions on life and philosophy', 'red', 'room', ARRAY['philosophy', 'deep', 'meaning', 'life'], '{"style": "intimate"}'
);

-- Create indexes for text search on keywords (optional but useful)
CREATE INDEX idx_user_intents_keywords ON user_intents USING GIN (keywords);
CREATE INDEX idx_opportunities_keywords ON opportunities USING GIN (keywords);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
