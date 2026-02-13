-- CubiQo Phase 2 - Initial Database Schema
-- Created: 2025-11-24
-- Version: 1.0

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- PROFILES TABLE
-- Extends auth.users with application-specific data
-- ============================================================================

CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  handle TEXT UNIQUE,                    -- CQ#93 format (generated)
  display_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Handle format validation: CQ#1-99999
ALTER TABLE profiles ADD CONSTRAINT handle_format
  CHECK (handle ~ '^CQ#[0-9]{1,5}$');

-- Index for handle lookups
CREATE INDEX idx_profiles_handle ON profiles(handle);

-- ============================================================================
-- SESSIONS TABLE
-- Tracks both guest and authenticated user sessions
-- ============================================================================

CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  is_guest BOOLEAN DEFAULT true,
  device_info JSONB DEFAULT '{}'::jsonb,
  geo_location TEXT,                     -- US/CA only (from middleware)
  expires_at TIMESTAMPTZ,                -- 30 days for guests
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for session lookups
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

-- Auto-set expiry for guest sessions (30 days)
CREATE OR REPLACE FUNCTION set_guest_session_expiry()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_guest = true AND NEW.expires_at IS NULL THEN
    NEW.expires_at := NOW() + INTERVAL '30 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_guest_session_expiry
  BEFORE INSERT ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION set_guest_session_expiry();

-- ============================================================================
-- CONVERSATIONS TABLE
-- Chat conversations with color state and AI model tracking
-- ============================================================================

CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  title TEXT,
  color_state TEXT DEFAULT 'trcl',      -- trcl/green/yellow/red
  ai_model TEXT DEFAULT 'claude',       -- claude/openai
  message_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Color state validation
ALTER TABLE conversations ADD CONSTRAINT color_state_valid
  CHECK (color_state IN ('trcl', 'green', 'yellow', 'red'));

-- AI model validation
ALTER TABLE conversations ADD CONSTRAINT ai_model_valid
  CHECK (ai_model IN ('claude', 'openai'));

-- Indexes for conversation lookups
CREATE INDEX idx_conversations_session_id ON conversations(session_id);
CREATE INDEX idx_conversations_color_state ON conversations(color_state);

-- ============================================================================
-- MESSAGES TABLE
-- Individual messages within conversations
-- ============================================================================

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL,                    -- user/assistant/system
  content TEXT NOT NULL,
  color TEXT,                            -- green/yellow/red (for routing)
  tokens_used INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Role validation
ALTER TABLE messages ADD CONSTRAINT role_valid
  CHECK (role IN ('user', 'assistant', 'system'));

-- Color validation
ALTER TABLE messages ADD CONSTRAINT color_valid
  CHECK (color IS NULL OR color IN ('green', 'yellow', 'red'));

-- Indexes for message lookups
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

-- Increment message count on insert
CREATE OR REPLACE FUNCTION increment_message_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET message_count = message_count + 1,
      updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_increment_message_count
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION increment_message_count();

-- ============================================================================
-- MEMORY TABLE
-- Extracted facts/preferences from conversations
-- ============================================================================

CREATE TABLE memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  key TEXT NOT NULL,                     -- name, preference_food, etc.
  value TEXT NOT NULL,
  zone TEXT DEFAULT 'green',             -- green/yellow/red
  expires_at TIMESTAMPTZ,                -- 30d for guests, NULL for users
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Zone validation
ALTER TABLE memory ADD CONSTRAINT zone_valid
  CHECK (zone IN ('green', 'yellow', 'red'));

-- Indexes for memory lookups
CREATE INDEX idx_memory_session_id ON memory(session_id);
CREATE INDEX idx_memory_key ON memory(key);
CREATE INDEX idx_memory_zone ON memory(zone);
CREATE INDEX idx_memory_expires_at ON memory(expires_at);

-- Unique constraint: one key per session per zone
CREATE UNIQUE INDEX idx_memory_session_key_zone ON memory(session_id, key, zone);

-- Auto-set expiry for guest memory (30 days)
CREATE OR REPLACE FUNCTION set_guest_memory_expiry()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expires_at IS NULL THEN
    -- Check if session is guest
    IF EXISTS (
      SELECT 1 FROM sessions
      WHERE id = NEW.session_id AND is_guest = true
    ) THEN
      NEW.expires_at := NOW() + INTERVAL '30 days';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_guest_memory_expiry
  BEFORE INSERT ON memory
  FOR EACH ROW
  EXECUTE FUNCTION set_guest_memory_expiry();

-- ============================================================================
-- EVENTS TABLE
-- Analytics and tracking
-- ============================================================================

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  type TEXT NOT NULL,                    -- app_opened, voice_granted, etc.
  properties JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for event analytics
CREATE INDEX idx_events_type ON events(type);
CREATE INDEX idx_events_session_id ON events(session_id);
CREATE INDEX idx_events_user_id ON events(user_id);
CREATE INDEX idx_events_created_at ON events(created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PROFILES POLICIES
-- ============================================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile (during signup)
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- SESSIONS POLICIES
-- ============================================================================

-- Users can access their own sessions
CREATE POLICY "Users can view own sessions"
  ON sessions FOR SELECT
  USING (user_id = auth.uid() OR user_id IS NULL);

-- Users can insert sessions
CREATE POLICY "Users can create sessions"
  ON sessions FOR INSERT
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- Users can update their own sessions
CREATE POLICY "Users can update own sessions"
  ON sessions FOR UPDATE
  USING (user_id = auth.uid() OR user_id IS NULL);

-- ============================================================================
-- CONVERSATIONS POLICIES
-- ============================================================================

-- Users can view conversations from their sessions
CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM sessions
      WHERE user_id = auth.uid() OR user_id IS NULL
    )
  );

-- Users can create conversations in their sessions
CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (
    session_id IN (
      SELECT id FROM sessions
      WHERE user_id = auth.uid() OR user_id IS NULL
    )
  );

-- Users can update their own conversations
CREATE POLICY "Users can update own conversations"
  ON conversations FOR UPDATE
  USING (
    session_id IN (
      SELECT id FROM sessions
      WHERE user_id = auth.uid() OR user_id IS NULL
    )
  );

-- ============================================================================
-- MESSAGES POLICIES
-- ============================================================================

-- Users can view messages in their conversations
CREATE POLICY "Users can view own messages"
  ON messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM conversations
      WHERE session_id IN (
        SELECT id FROM sessions
        WHERE user_id = auth.uid() OR user_id IS NULL
      )
    )
  );

-- Users can create messages in their conversations
CREATE POLICY "Users can create messages"
  ON messages FOR INSERT
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM conversations
      WHERE session_id IN (
        SELECT id FROM sessions
        WHERE user_id = auth.uid() OR user_id IS NULL
      )
    )
  );

-- ============================================================================
-- MEMORY POLICIES
-- ============================================================================

-- Users can view memory from their sessions
CREATE POLICY "Users can view own memory"
  ON memory FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM sessions
      WHERE user_id = auth.uid() OR user_id IS NULL
    )
  );

-- Users can create memory in their sessions
CREATE POLICY "Users can create memory"
  ON memory FOR INSERT
  WITH CHECK (
    session_id IN (
      SELECT id FROM sessions
      WHERE user_id = auth.uid() OR user_id IS NULL
    )
  );

-- Users can update their own memory
CREATE POLICY "Users can update own memory"
  ON memory FOR UPDATE
  USING (
    session_id IN (
      SELECT id FROM sessions
      WHERE user_id = auth.uid() OR user_id IS NULL
    )
  );

-- Users can delete their own memory
CREATE POLICY "Users can delete own memory"
  ON memory FOR DELETE
  USING (
    session_id IN (
      SELECT id FROM sessions
      WHERE user_id = auth.uid() OR user_id IS NULL
    )
  );

-- ============================================================================
-- EVENTS POLICIES
-- ============================================================================

-- Users can view their own events
CREATE POLICY "Users can view own events"
  ON events FOR SELECT
  USING (user_id = auth.uid() OR session_id IN (
    SELECT id FROM sessions WHERE user_id = auth.uid() OR user_id IS NULL
  ));

-- Users can create events
CREATE POLICY "Users can create events"
  ON events FOR INSERT
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Generate unique CQ# handle
CREATE OR REPLACE FUNCTION generate_unique_handle()
RETURNS TEXT AS $$
DECLARE
  new_handle TEXT;
  handle_number INT;
BEGIN
  LOOP
    -- Generate random number between 1 and 99999
    handle_number := floor(random() * 99999 + 1)::int;
    new_handle := 'CQ#' || handle_number;

    -- Check if handle exists
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE handle = new_handle) THEN
      RETURN new_handle;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Auto-generate handle on profile creation
CREATE OR REPLACE FUNCTION auto_generate_handle()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.handle IS NULL THEN
    NEW.handle := generate_unique_handle();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_auto_generate_handle
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_handle();

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- CLEANUP JOB (Optional - can be scheduled via pg_cron)
-- ============================================================================

-- Function to clean up expired guest sessions and memory
CREATE OR REPLACE FUNCTION cleanup_expired_data()
RETURNS void AS $$
BEGIN
  -- Delete expired guest sessions (cascades to conversations, messages, memory)
  DELETE FROM sessions
  WHERE is_guest = true
    AND expires_at < NOW();

  -- Delete expired memory entries
  DELETE FROM memory
  WHERE expires_at IS NOT NULL
    AND expires_at < NOW();

  RAISE NOTICE 'Cleanup completed';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- INITIAL DATA (Optional)
-- ============================================================================

-- Example system events types (for reference)
COMMENT ON COLUMN events.type IS 'Event types: app_opened, world_entered, voice_granted, voice_denied, action_confirmed, action_executed, a2hs_shown, a2hs_done, a2hs_dismissed, session_ended, profile_created, color_changed, adult_mode_enabled';

-- ============================================================================
-- GRANTS (Public access through RLS)
-- ============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
