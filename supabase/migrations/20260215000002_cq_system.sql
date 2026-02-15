-- CQ-to-CQ Communication System
-- Created: 2026-02-15
-- Version: 1.0
-- 
-- This migration:
-- 1. Updates CQ number format from CQ#[0-9]{1,5} to CQ[A-Z0-9]{3}
-- 2. Creates friends table for user connections
-- 3. Creates direct_messages table for CQ-to-CQ messaging

-- ============================================================================
-- PART 1: Update CQ Number Format
-- ============================================================================

-- Drop old constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS handle_format;

-- Add new constraint: CQ followed by exactly 3 alphanumeric characters
ALTER TABLE profiles ADD CONSTRAINT handle_format
  CHECK (handle ~ '^CQ[A-Z0-9]{3}$');

-- Update the generate_unique_handle function
CREATE OR REPLACE FUNCTION generate_unique_handle()
RETURNS TEXT AS $$
DECLARE
  new_handle TEXT;
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  char1 TEXT;
  char2 TEXT;
  char3 TEXT;
BEGIN
  LOOP
    -- Generate 3 random alphanumeric characters
    char1 := substr(chars, floor(random() * 36 + 1)::int, 1);
    char2 := substr(chars, floor(random() * 36 + 1)::int, 1);
    char3 := substr(chars, floor(random() * 36 + 1)::int, 1);
    new_handle := 'CQ' || char1 || char2 || char3;

    -- Check if handle exists
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE handle = new_handle) THEN
      RETURN new_handle;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Note: Existing handles will remain unchanged. They will be updated on next profile update
-- or users can manually update their handles through the UI

-- ============================================================================
-- PART 2: Friends System
-- ============================================================================

-- Friends/Contacts table
CREATE TABLE IF NOT EXISTS friends (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  friend_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- RLS policies for friends
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;

-- Users can see their own friend relationships
CREATE POLICY "Users can view own friends"
  ON friends FOR SELECT
  USING (user_id = auth.uid() OR friend_id = auth.uid());

-- Users can send friend requests
CREATE POLICY "Users can create friend requests"
  ON friends FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update friend status (accept/block)
CREATE POLICY "Users can update friend status"
  ON friends FOR UPDATE
  USING (friend_id = auth.uid() OR user_id = auth.uid());

-- Users can delete friendships
CREATE POLICY "Users can delete friendships"
  ON friends FOR DELETE
  USING (user_id = auth.uid() OR friend_id = auth.uid());

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_friends_user_id ON friends(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_friend_id ON friends(friend_id);
CREATE INDEX IF NOT EXISTS idx_friends_status ON friends(status);

-- ============================================================================
-- PART 3: Direct Messaging
-- ============================================================================

-- Direct messages between users
CREATE TABLE IF NOT EXISTS direct_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  is_voice_delivered BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own messages"
  ON direct_messages FOR SELECT
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can send messages to friends"
  ON direct_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM friends
      WHERE status = 'accepted'
      AND (
        (user_id = auth.uid() AND friend_id = direct_messages.receiver_id)
        OR (friend_id = auth.uid() AND user_id = direct_messages.receiver_id)
      )
    )
  );

CREATE POLICY "Users can update own received messages"
  ON direct_messages FOR UPDATE
  USING (receiver_id = auth.uid());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_dm_sender ON direct_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_dm_receiver ON direct_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_dm_created ON direct_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dm_unread ON direct_messages(receiver_id, is_read) WHERE is_read = false;
