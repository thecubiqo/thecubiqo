-- Seed Data for Staging Environment (Social Army & Features)
-- Run this AFTER applying all schema migrations!

-- 1. Ensure Feature Flags exist (Idempotent)
INSERT INTO features_catalog (feature_key, label, description, category, feature_type, default_enabled, risk_level, config) VALUES
  ('social_army.dashboard', 'Social Army Dashboard', 'Access to the marketing automation command center', 'admin', 'toggle', true, 'safe', '{"icon": "🌍"}'),
  ('social_army.auto_posting', 'Auto Posting', 'Allow workers to post content automatically', 'admin', 'toggle', false, 'warning', '{"icon": "🤖"}')
ON CONFLICT (feature_key) DO NOTHING;

-- 2. Seed Social Army Accounts (The Soldiers)
-- We use gen_random_uuid() for IDs so we don't need to know them in advance
INSERT INTO social_accounts (username, platform, persona_type, status) VALUES
  ('DevDave_99', 'twitter', 'builder', 'active'),
  ('CodeNinja_X', 'twitter', 'builder', 'active'),
  ('CryptoKing_01', 'twitter', 'guru', 'active'),
  ('AI_Philosopher', 'twitter', 'philosopher', 'active'),
  ('MemeLord_Prime', 'tiktok', 'memer', 'active'),
  ('DesignDaily_UX', 'instagram', 'artist', 'active'),
  ('TechTrespasser', 'youtube', 'guru', 'active'),
  ('StartupHustle_VC', 'linkedin', 'guru', 'active'),
  ('Pythonista_Py', 'twitter', 'builder', 'active'),
  ('Rust_Evangelist', 'twitter', 'builder', 'limited');

-- 3. Seed Campaigns
INSERT INTO social_campaigns (name, seed_topic, status, total_posts_target) VALUES
  ('Launch Week Hype', 'CubiQo Launch', 'running', 100),
  ('AI Ethics Debate', 'The Future of Sentience', 'paused', 50),
  ('Developer Adoption', ' API Integrations', 'draft', 200);

-- 4. Seed Content Queue (Linked to Campaigns)
-- Use a CTE to get IDs dynamically
WITH campaigns AS (
  SELECT id, name FROM social_campaigns WHERE name = 'Launch Week Hype' LIMIT 1
),
accounts AS (
  SELECT id FROM social_accounts WHERE username = 'DevDave_99' LIMIT 1
)
INSERT INTO content_queue (campaign_id, target_account_id, content_type, generation_status, caption, created_at)
SELECT 
  campaigns.id, 
  accounts.id, 
  'text', 
  'posted', 
  'Just discovered CubiQo! The voice interface is insane. 🤯 #AI #Tech',
  NOW() - INTERVAL '2 hours'
FROM campaigns, accounts;

WITH campaigns AS (
  SELECT id FROM social_campaigns WHERE name = 'Launch Week Hype' LIMIT 1
),
accounts AS (
  SELECT id FROM social_accounts WHERE username = 'CodeNinja_X' LIMIT 1
)
INSERT INTO content_queue (campaign_id, target_account_id, content_type, generation_status, caption, created_at)
SELECT 
  campaigns.id, 
  accounts.id, 
  'video', 
  'processing', 
  'Building a quick demo with the new SDK...',
  NOW() - INTERVAL '5 minutes'
FROM campaigns, accounts;

WITH campaigns AS (
  SELECT id FROM social_campaigns WHERE name = 'AI Ethics Debate' LIMIT 1
),
accounts AS (
  SELECT id FROM social_accounts WHERE username = 'AI_Philosopher' LIMIT 1
)
INSERT INTO content_queue (campaign_id, target_account_id, content_type, generation_status, caption, created_at)
SELECT 
  campaigns.id, 
  accounts.id, 
  'text', 
  'pending', 
  'Is an AI assistant truly private if it learns from you?',
  NOW()
FROM campaigns, accounts;
