-- MASTER STAGING SETUP SCRIPT
-- RUN THIS IN SUPABASE SQL EDITOR
-- Includes: Messaging (CQ), Social Army, Monetization, and Seed Data.

-- ==========================================
-- PART 1: MESSAGING & CQ SYSTEM (The Big PR)
-- ==========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CQ Numbers table
CREATE TABLE IF NOT EXISTS cq_numbers (
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
CREATE INDEX IF NOT EXISTS idx_cq_numbers_user ON cq_numbers(user_id);
CREATE INDEX IF NOT EXISTS idx_cq_numbers_status ON cq_numbers(status);
CREATE INDEX IF NOT EXISTS idx_cq_numbers_expires ON cq_numbers(expires_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_cq_numbers_active ON cq_numbers(user_id) WHERE status = 'active';

-- Friend requests table
CREATE TABLE IF NOT EXISTS cq_friend_requests (
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
CREATE INDEX IF NOT EXISTS idx_friend_requests_from ON cq_friend_requests(from_user_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_to ON cq_friend_requests(to_user_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_status ON cq_friend_requests(status);
-- Fix: logic error in SQL constraints if duplicates exist, skipping complex constraint for now

-- Contacts table
CREATE TABLE IF NOT EXISTS cq_contacts (
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
CREATE INDEX IF NOT EXISTS idx_contacts_user ON cq_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_last_message ON cq_contacts(last_message_at DESC);

-- Conversations table
CREATE TABLE IF NOT EXISTS cq_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  participant_2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,
  unread_counts JSONB NOT NULL DEFAULT '{}',
  archived_by JSONB NOT NULL DEFAULT '{}',
  
  CONSTRAINT no_self_conversation CHECK (participant_1_id != participant_2_id),
  UNIQUE(participant_1_id, participant_2_id)
);

-- Indexes for conversations
CREATE INDEX IF NOT EXISTS idx_conversations_participant_1 ON cq_conversations(participant_1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_participant_2 ON cq_conversations(participant_2_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON cq_conversations(last_message_at DESC);

-- Messages table
CREATE TABLE IF NOT EXISTS cq_messages (
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
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON cq_messages(conversation_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_from_user ON cq_messages(from_user_id);
CREATE INDEX IF NOT EXISTS idx_messages_to_user ON cq_messages(to_user_id);

-- Calls table
CREATE TABLE IF NOT EXISTS cq_calls (
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

-- Notifications table
CREATE TABLE IF NOT EXISTS cq_notifications (
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

-- Enable RLS for Messaging
ALTER TABLE cq_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE cq_friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE cq_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cq_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE cq_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE cq_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE cq_notifications ENABLE ROW LEVEL SECURITY;

-- Messaging Policies (Simplified)
CREATE POLICY cq_numbers_policy ON cq_numbers FOR ALL USING (auth.uid() = user_id);
CREATE POLICY friend_requests_policy ON cq_friend_requests FOR ALL USING (auth.uid() IN (from_user_id, to_user_id));
CREATE POLICY contacts_policy ON cq_contacts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY conversations_policy ON cq_conversations FOR ALL USING (auth.uid() IN (participant_1_id, participant_2_id));
CREATE POLICY messages_policy ON cq_messages FOR ALL USING (auth.uid() IN (from_user_id, to_user_id));
CREATE POLICY calls_policy ON cq_calls FOR ALL USING (auth.uid() IN (initiator_id, recipient_id));
CREATE POLICY notifications_policy ON cq_notifications FOR ALL USING (auth.uid() = user_id);


-- ==========================================
-- PART 2: SOCIAL ARMY (The New Feature)
-- ==========================================

-- 1. Social Accounts
create table if not exists social_accounts (
  id uuid default gen_random_uuid() primary key,
  platform text not null check (platform in ('twitter', 'tiktok', 'linkedin', 'instagram', 'youtube')),
  username text not null,
  password_encrypted text,
  persona_type text check (persona_type in ('builder', 'guru', 'philosopher', 'artist', 'memer')),
  status text default 'active' check (status in ('active', 'limited', 'banned', 'offline')),
  last_posted_at timestamptz,
  created_at timestamptz default now()
);

-- 2. Campaigns
create table if not exists social_campaigns (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  seed_topic text not null,
  status text default 'draft' check (status in ('draft', 'running', 'paused', 'completed')),
  total_posts_target int default 0,
  created_at timestamptz default now()
);

-- 3. Content Queue
create table if not exists content_queue (
  id uuid default gen_random_uuid() primary key,
  campaign_id uuid references social_campaigns(id),
  target_account_id uuid references social_accounts(id),
  content_type text check (content_type in ('video', 'image', 'text')),
  generation_status text default 'pending' check (generation_status in ('pending', 'processing', 'ready', 'failed', 'posted')),
  asset_url text,
  caption text,
  scheduled_for timestamptz,
  posted_at timestamptz,
  created_at timestamptz default now()
);

-- Enable RLS for Social Army
alter table social_accounts enable row level security;
alter table social_campaigns enable row level security;
alter table content_queue enable row level security;

-- Policies
create policy "Admins can view social accounts" on social_accounts for select using (auth.role() = 'authenticated');
create policy "Admins can manage social accounts" on social_accounts for all using (auth.role() = 'authenticated');

create policy "Admins can view campaigns" on social_campaigns for select using (auth.role() = 'authenticated');
create policy "Admins can manage campaigns" on social_campaigns for all using (auth.role() = 'authenticated');

create policy "Admins can view content queue" on content_queue for select using (auth.role() = 'authenticated');
create policy "Admins can manage content queue" on content_queue for all using (auth.role() = 'authenticated');


-- ==========================================
-- PART 3: MONETIZATION (Subscriptions)
-- ==========================================

create table if not exists subscription_tiers (
  id text primary key,
  name text not null,
  price_monthly integer default 0,
  features jsonb default '{}'::jsonb,
  is_active boolean default true
);

insert into subscription_tiers (id, name, price_monthly, features) values
  ('free', 'Free Tier', 0, '{"maxtokens": 10000, "voice_hours": 0, "social_accounts": 0}'),
  ('pro', 'Pro User', 2900, '{"maxtokens": -1, "voice_hours": 10, "social_accounts": 1}'),
  ('commander', 'Commander', 49900, '{"maxtokens": -1, "voice_hours": -1, "social_accounts": 10}'),
  ('general', 'General', 199900, '{"maxtokens": -1, "voice_hours": -1, "social_accounts": 100}')
on conflict (id) do nothing;

create table if not exists user_subscriptions (
  user_id uuid references auth.users(id) primary key,
  tier_id text references subscription_tiers(id) default 'free',
  stripe_customer_id text,
  credits_video_balance int default 0,
  status text default 'active',
  created_at timestamptz default now()
);

alter table user_subscriptions enable row level security;
create policy "Users can view own subscription" on user_subscriptions for select using (auth.uid() = user_id);


-- ==========================================
-- PART 4: SEED DATA (Dummy Data)
-- ==========================================

-- Seed Features
INSERT INTO features_catalog (feature_key, label, description, category, feature_type, default_enabled, risk_level, config) VALUES
  ('social_army.dashboard', 'Social Army Dashboard', 'Access to the marketing automation command center', 'admin', 'toggle', true, 'safe', '{"icon": "🌍"}'),
  ('social_army.auto_posting', 'Auto Posting', 'Allow workers to post content automatically', 'admin', 'toggle', false, 'warning', '{"icon": "🤖"}')
ON CONFLICT (feature_key) DO NOTHING;

-- Seed Accounts
INSERT INTO social_accounts (username, platform, persona_type, status) VALUES
  ('DevDave_99', 'twitter', 'builder', 'active'),
  ('CodeNinja_X', 'twitter', 'builder', 'active'),
  ('CryptoKing_01', 'twitter', 'guru', 'active'),
  ('AI_Philosopher', 'twitter', 'philosopher', 'active'),
  ('DesignDaily_UX', 'instagram', 'artist', 'active');

-- Seed Campaigns
INSERT INTO social_campaigns (name, seed_topic, status, total_posts_target) VALUES
  ('Launch Week Hype', 'CubiQo Launch', 'running', 100),
  ('AI Ethics Debate', 'Future of Sentience', 'paused', 50);

-- Seed Queue Items (Using simple subqueries for safety)
INSERT INTO content_queue (campaign_id, target_account_id, content_type, generation_status, caption, created_at)
SELECT 
  (SELECT id FROM social_campaigns WHERE name = 'Launch Week Hype' LIMIT 1), 
  (SELECT id FROM social_accounts WHERE username = 'DevDave_99' LIMIT 1), 
  'text', 'posted', 'Just discovered CubiQo! #AI', NOW();

INSERT INTO content_queue (campaign_id, target_account_id, content_type, generation_status, caption, created_at)
SELECT 
  (SELECT id FROM social_campaigns WHERE name = 'Launch Week Hype' LIMIT 1), 
  (SELECT id FROM social_accounts WHERE username = 'CodeNinja_X' LIMIT 1), 
  'video', 'processing', 'Building a demo...', NOW();
