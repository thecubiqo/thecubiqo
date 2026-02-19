-- MASTER PRODUCTION SETUP SCRIPT
-- RUN THIS IS YOUR PRODUCTION PROJECT SQL EDITOR
-- Includes: Features Catalog, Messaging (CQ), Social Army, Monetization Schemas.
-- EXCLUDES: Dummy Data (Seed). This is clean for real users.

-- ==========================================
-- PART 0: FEATURES CATALOG (Core Configuration)
-- ==========================================

CREATE TABLE IF NOT EXISTS features_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('social', 'communication', 'utility', 'support', 'visuals', 'admin', 'general')),
  feature_type TEXT DEFAULT 'toggle' CHECK (feature_type IN ('toggle', 'design_variant', 'config')),
  default_enabled BOOLEAN DEFAULT false,
  risk_level TEXT DEFAULT 'safe' CHECK (risk_level IN ('safe', 'warning', 'dangerous')),
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_feature_toggles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL,
  enabled BOOLEAN NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, feature_key)
);

ALTER TABLE features_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_feature_toggles ENABLE ROW LEVEL SECURITY;

-- Policies (Simplified for setup)
CREATE POLICY "Anyone can view features catalog" ON features_catalog FOR SELECT USING (true);
CREATE POLICY "Users can view own toggles" ON user_feature_toggles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own toggles" ON user_feature_toggles FOR ALL USING (auth.uid() = user_id);

-- Seed Core Features (Required Config)
INSERT INTO features_catalog (feature_key, label, description, category, feature_type, default_enabled, risk_level, config) VALUES
  ('social.share_journey', 'Share Journey', 'Allow users to share their emotional journey', 'social', 'toggle', false, 'safe', '{"icon": "📱"}'),
  ('communication.voice_chat', 'Voice Chat', 'AI voice conversation capability', 'communication', 'toggle', true, 'safe', '{"icon": "🎤"}'),
  ('utility.journal_entries', 'Journal Entries', 'Personal emotional journaling system', 'utility', 'toggle', true, 'safe', '{"icon": "📔"}'),
  ('design.plasma_wave', 'Plasma Wave Field', 'HD plasma wave animation', 'visuals', 'design_variant', true, 'safe', '{"icon": "🌊"}')
ON CONFLICT (feature_key) DO NOTHING;

-- Social Army Features (Default Off for Prod)
INSERT INTO features_catalog (feature_key, label, description, category, feature_type, default_enabled, risk_level, config) VALUES
  ('social_army.dashboard', 'Social Army Dashboard', 'Access to the marketing automation command center', 'admin', 'toggle', true, 'safe', '{"icon": "🌍"}'),
  ('social_army.auto_posting', 'Auto Posting', 'Allow workers to post content automatically', 'admin', 'toggle', false, 'warning', '{"icon": "🤖"}')
ON CONFLICT (feature_key) DO NOTHING;


-- ==========================================
-- PART 1: MESSAGING & CQ SYSTEM
-- ==========================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS cq_numbers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cq_number VARCHAR(20) UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  rotation_interval BIGINT NOT NULL DEFAULT 2592000000,
  previous_cq_number VARCHAR(20),
  CONSTRAINT cq_number_format CHECK (cq_number ~ '^CQ-[A-Z2-9]{4}-[A-Z2-9]{4}$'),
  CONSTRAINT status_values CHECK (status IN ('active', 'expired', 'rotating', 'blocked'))
);

CREATE INDEX IF NOT EXISTS idx_cq_numbers_user ON cq_numbers(user_id);
CREATE INDEX IF NOT EXISTS idx_cq_numbers_status ON cq_numbers(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_cq_numbers_active ON cq_numbers(user_id) WHERE status = 'active';

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

CREATE INDEX IF NOT EXISTS idx_friend_requests_from ON cq_friend_requests(from_user_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_to ON cq_friend_requests(to_user_id);

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

CREATE INDEX IF NOT EXISTS idx_contacts_user ON cq_contacts(user_id);

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

CREATE INDEX IF NOT EXISTS idx_conversations_participant_1 ON cq_conversations(participant_1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_participant_2 ON cq_conversations(participant_2_id);

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

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON cq_messages(conversation_id, sent_at DESC);

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

ALTER TABLE cq_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE cq_friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE cq_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cq_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE cq_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE cq_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE cq_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY cq_numbers_policy ON cq_numbers FOR ALL USING (auth.uid() = user_id);
CREATE POLICY friend_requests_policy ON cq_friend_requests FOR ALL USING (auth.uid() IN (from_user_id, to_user_id));
CREATE POLICY contacts_policy ON cq_contacts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY conversations_policy ON cq_conversations FOR ALL USING (auth.uid() IN (participant_1_id, participant_2_id));
CREATE POLICY messages_policy ON cq_messages FOR ALL USING (auth.uid() IN (from_user_id, to_user_id));
CREATE POLICY calls_policy ON cq_calls FOR ALL USING (auth.uid() IN (initiator_id, recipient_id));
CREATE POLICY notifications_policy ON cq_notifications FOR ALL USING (auth.uid() = user_id);


-- ==========================================
-- PART 2: SOCIAL ARMY
-- ==========================================

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

create table if not exists social_campaigns (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  seed_topic text not null,
  status text default 'draft' check (status in ('draft', 'running', 'paused', 'completed')),
  total_posts_target int default 0,
  created_at timestamptz default now()
);

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

alter table social_accounts enable row level security;
alter table social_campaigns enable row level security;
alter table content_queue enable row level security;

create policy "Admins can view social accounts" on social_accounts for select using (auth.role() = 'authenticated');
create policy "Admins can manage social accounts" on social_accounts for all using (auth.role() = 'authenticated');
create policy "Admins can view campaigns" on social_campaigns for select using (auth.role() = 'authenticated');
create policy "Admins can manage campaigns" on social_campaigns for all using (auth.role() = 'authenticated');
create policy "Admins can view content queue" on content_queue for select using (auth.role() = 'authenticated');
create policy "Admins can manage content queue" on content_queue for all using (auth.role() = 'authenticated');


-- ==========================================
-- PART 3: MONETIZATION
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
