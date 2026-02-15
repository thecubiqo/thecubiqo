-- CQ-to-CQ Messaging System Database Schema
-- Supabase/PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CQ Numbers table
CREATE TABLE cq_numbers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cq_number VARCHAR(20) UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  rotation_interval BIGINT NOT NULL DEFAULT 2592000000, -- 30 days in ms
  previous_cq_number VARCHAR(20), -- For migration period
  
  CONSTRAINT cq_number_format CHECK (cq_number ~ '^CQ-[A-Z2-9]{4}-[A-Z2-9]{4}$'),
  CONSTRAINT status_values CHECK (status IN ('active', 'expired', 'rotating', 'blocked'))
);

-- Indexes for CQ numbers
CREATE INDEX idx_cq_numbers_user ON cq_numbers(user_id);
CREATE INDEX idx_cq_numbers_status ON cq_numbers(status);
CREATE INDEX idx_cq_numbers_expires ON cq_numbers(expires_at);
CREATE UNIQUE INDEX idx_cq_numbers_active ON cq_numbers(user_id) WHERE status = 'active';

-- Friend requests table
CREATE TABLE cq_friend_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_cq_number VARCHAR(20) NOT NULL,
  to_cq_number VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  message TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  
  CONSTRAINT no_self_request CHECK (from_user_id != to_user_id),
  CONSTRAINT status_values CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked'))
);

-- Indexes for friend requests
CREATE INDEX idx_friend_requests_from ON cq_friend_requests(from_user_id);
CREATE INDEX idx_friend_requests_to ON cq_friend_requests(to_user_id);
CREATE INDEX idx_friend_requests_status ON cq_friend_requests(status);
CREATE UNIQUE INDEX idx_friend_requests_unique ON cq_friend_requests(from_user_id, to_user_id) 
  WHERE status = 'pending';

-- Contacts table
CREATE TABLE cq_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_cq_number VARCHAR(20) NOT NULL,
  display_name VARCHAR(100),
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_message_at TIMESTAMPTZ,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  is_muted BOOLEAN NOT NULL DEFAULT false,
  is_blocked BOOLEAN NOT NULL DEFAULT false,
  
  CONSTRAINT no_self_contact CHECK (user_id != contact_user_id),
  UNIQUE(user_id, contact_user_id)
);

-- Indexes for contacts
CREATE INDEX idx_contacts_user ON cq_contacts(user_id);
CREATE INDEX idx_contacts_last_message ON cq_contacts(last_message_at DESC);
CREATE INDEX idx_contacts_pinned ON cq_contacts(user_id, is_pinned) WHERE is_pinned = true;

-- Conversations table
CREATE TABLE cq_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  participant_2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,
  
  -- Unread counts stored as JSONB
  unread_counts JSONB NOT NULL DEFAULT '{}',
  
  -- Archived status per user
  archived_by JSONB NOT NULL DEFAULT '{}',
  
  CONSTRAINT no_self_conversation CHECK (participant_1_id != participant_2_id),
  CONSTRAINT ordered_participants CHECK (participant_1_id < participant_2_id),
  UNIQUE(participant_1_id, participant_2_id)
);

-- Indexes for conversations
CREATE INDEX idx_conversations_participant_1 ON cq_conversations(participant_1_id);
CREATE INDEX idx_conversations_participant_2 ON cq_conversations(participant_2_id);
CREATE INDEX idx_conversations_last_message ON cq_conversations(last_message_at DESC);

-- Messages table
CREATE TABLE cq_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES cq_conversations(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL DEFAULT 'text',
  content TEXT NOT NULL,
  voice_url TEXT,
  voice_duration INTEGER,
  synthesized_audio_url TEXT,
  file_metadata JSONB,
  status VARCHAR(20) NOT NULL DEFAULT 'sent',
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  reply_to_id UUID REFERENCES cq_messages(id) ON DELETE SET NULL,
  
  CONSTRAINT type_values CHECK (type IN ('text', 'voice', 'file', 'system')),
  CONSTRAINT status_values CHECK (status IN ('sending', 'sent', 'delivered', 'read', 'failed'))
);

-- Indexes for messages
CREATE INDEX idx_messages_conversation ON cq_messages(conversation_id, sent_at DESC);
CREATE INDEX idx_messages_from_user ON cq_messages(from_user_id);
CREATE INDEX idx_messages_to_user ON cq_messages(to_user_id);
CREATE INDEX idx_messages_status ON cq_messages(status);
CREATE INDEX idx_messages_unread ON cq_messages(to_user_id, read_at) WHERE read_at IS NULL;

-- Calls table
CREATE TABLE cq_calls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES cq_conversations(id) ON DELETE CASCADE,
  initiator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'initiating',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  answered_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration INTEGER,
  webrtc_offer TEXT,
  webrtc_answer TEXT,
  ice_candidates JSONB DEFAULT '[]',
  
  CONSTRAINT type_values CHECK (type IN ('audio', 'video')),
  CONSTRAINT status_values CHECK (status IN ('initiating', 'ringing', 'active', 'ended', 'missed', 'rejected'))
);

-- Indexes for calls
CREATE INDEX idx_calls_conversation ON cq_calls(conversation_id, started_at DESC);
CREATE INDEX idx_calls_initiator ON cq_calls(initiator_id);
CREATE INDEX idx_calls_recipient ON cq_calls(recipient_id);
CREATE INDEX idx_calls_status ON cq_calls(status);

-- Screen share sessions
CREATE TABLE cq_screen_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  call_id UUID NOT NULL REFERENCES cq_calls(id) ON DELETE CASCADE,
  sharer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stream_id VARCHAR(255) NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

CREATE INDEX idx_screen_shares_call ON cq_screen_shares(call_id);

-- Notifications table
CREATE TABLE cq_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT type_values CHECK (type IN ('friend_request', 'message', 'call', 'system'))
);

-- Indexes for notifications
CREATE INDEX idx_notifications_user ON cq_notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON cq_notifications(user_id, read) WHERE read = false;

-- Privacy settings table
CREATE TABLE cq_privacy_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  who_can_add_me VARCHAR(30) NOT NULL DEFAULT 'anyone',
  who_can_call_me VARCHAR(30) NOT NULL DEFAULT 'contacts_only',
  who_can_see_online_status VARCHAR(30) NOT NULL DEFAULT 'contacts_only',
  read_receipts BOOLEAN NOT NULL DEFAULT true,
  typing_indicators BOOLEAN NOT NULL DEFAULT true,
  auto_rotate_cq BOOLEAN NOT NULL DEFAULT true,
  rotation_interval_days INTEGER NOT NULL DEFAULT 30,
  
  CONSTRAINT who_can_add_me_values CHECK (who_can_add_me IN ('anyone', 'friends_of_friends', 'nobody')),
  CONSTRAINT who_can_call_me_values CHECK (who_can_call_me IN ('anyone', 'contacts_only')),
  CONSTRAINT who_can_see_online_values CHECK (who_can_see_online_status IN ('everyone', 'contacts_only', 'nobody'))
);

-- Voice synthesis configuration
CREATE TABLE cq_voice_synthesis (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  cubiqo_voice_id VARCHAR(100) NOT NULL,
  voice_settings JSONB NOT NULL DEFAULT '{"stability": 0.5, "similarityBoost": 0.75}',
  enable_auto_read BOOLEAN NOT NULL DEFAULT true,
  read_only_when_active BOOLEAN NOT NULL DEFAULT false
);

-- Premium status table
CREATE TABLE cq_premium_status (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  is_premium BOOLEAN NOT NULL DEFAULT false,
  premium_until TIMESTAMPTZ,
  features JSONB NOT NULL DEFAULT '{"cqMessaging": false, "voiceCalls": false, "videoCalls": false, "screenSharing": false, "fileSharing": false, "customVoice": false}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Functions and triggers

-- Function to get or create conversation between two users
CREATE OR REPLACE FUNCTION get_or_create_conversation(user_1 UUID, user_2 UUID)
RETURNS UUID AS $$
DECLARE
  conv_id UUID;
  p1 UUID;
  p2 UUID;
BEGIN
  -- Ensure correct ordering
  IF user_1 < user_2 THEN
    p1 := user_1;
    p2 := user_2;
  ELSE
    p1 := user_2;
    p2 := user_1;
  END IF;
  
  -- Try to find existing conversation
  SELECT id INTO conv_id
  FROM cq_conversations
  WHERE participant_1_id = p1 AND participant_2_id = p2;
  
  -- Create if not exists
  IF conv_id IS NULL THEN
    INSERT INTO cq_conversations (participant_1_id, participant_2_id)
    VALUES (p1, p2)
    RETURNING id INTO conv_id;
  END IF;
  
  RETURN conv_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update conversation on new message
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE cq_conversations
  SET 
    last_message_at = NEW.sent_at,
    last_message_preview = LEFT(NEW.content, 100),
    unread_counts = jsonb_set(
      unread_counts,
      ARRAY[NEW.to_user_id::text],
      (COALESCE((unread_counts->>NEW.to_user_id::text)::int, 0) + 1)::text::jsonb
    )
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_on_message
AFTER INSERT ON cq_messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_on_message();

-- Function to reset unread count on message read
CREATE OR REPLACE FUNCTION reset_unread_on_read()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.read_at IS NOT NULL AND OLD.read_at IS NULL THEN
    UPDATE cq_conversations
    SET unread_counts = jsonb_set(
      unread_counts,
      ARRAY[NEW.to_user_id::text],
      '0'::jsonb
    )
    WHERE id = NEW.conversation_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_reset_unread_on_read
AFTER UPDATE ON cq_messages
FOR EACH ROW
EXECUTE FUNCTION reset_unread_on_read();

-- Function to auto-rotate expired CQ numbers
CREATE OR REPLACE FUNCTION rotate_expired_cq_numbers()
RETURNS void AS $$
BEGIN
  UPDATE cq_numbers
  SET status = 'expired'
  WHERE status = 'active' AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Row Level Security (RLS) Policies

ALTER TABLE cq_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE cq_friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE cq_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cq_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE cq_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE cq_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE cq_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE cq_privacy_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE cq_voice_synthesis ENABLE ROW LEVEL SECURITY;
ALTER TABLE cq_premium_status ENABLE ROW LEVEL SECURITY;

-- CQ Numbers: Users can only see their own
CREATE POLICY cq_numbers_policy ON cq_numbers
  FOR ALL USING (auth.uid() = user_id);

-- Friend Requests: Users can see requests they sent or received
CREATE POLICY friend_requests_policy ON cq_friend_requests
  FOR ALL USING (auth.uid() IN (from_user_id, to_user_id));

-- Contacts: Users can only see their own contacts
CREATE POLICY contacts_policy ON cq_contacts
  FOR ALL USING (auth.uid() = user_id);

-- Conversations: Users can only see conversations they're part of
CREATE POLICY conversations_policy ON cq_conversations
  FOR ALL USING (auth.uid() IN (participant_1_id, participant_2_id));

-- Messages: Users can only see messages in their conversations
CREATE POLICY messages_policy ON cq_messages
  FOR ALL USING (auth.uid() IN (from_user_id, to_user_id));

-- Calls: Users can only see calls they're part of
CREATE POLICY calls_policy ON cq_calls
  FOR ALL USING (auth.uid() IN (initiator_id, recipient_id));

-- Notifications: Users can only see their own notifications
CREATE POLICY notifications_policy ON cq_notifications
  FOR ALL USING (auth.uid() = user_id);

-- Privacy Settings: Users can only see/edit their own
CREATE POLICY privacy_settings_policy ON cq_privacy_settings
  FOR ALL USING (auth.uid() = user_id);

-- Voice Synthesis: Users can only see/edit their own
CREATE POLICY voice_synthesis_policy ON cq_voice_synthesis
  FOR ALL USING (auth.uid() = user_id);

-- Premium Status: Users can only see their own
CREATE POLICY premium_status_policy ON cq_premium_status
  FOR ALL USING (auth.uid() = user_id);
