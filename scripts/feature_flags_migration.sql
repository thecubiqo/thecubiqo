-- Feature Flags Table for Founders Pass
-- Run this migration in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  enabled_for_production BOOLEAN DEFAULT false,
  enabled_for_founders BOOLEAN DEFAULT true,
  risk_level TEXT CHECK (risk_level IN ('safe', 'moderate', 'dangerous')) DEFAULT 'safe',
  category TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read feature flags
CREATE POLICY "Anyone can read feature flags" ON feature_flags
  FOR SELECT USING (true);

-- Policy: Only founders can update feature flags
CREATE POLICY "Founders can update feature flags" ON feature_flags
  FOR UPDATE USING (
    auth.jwt() ->> 'email' = 'aditya@cubiqo.ai'
  );

-- Seed data with all available tools/features
INSERT INTO feature_flags (feature_id, name, description, enabled_for_production, risk_level, category) VALUES
  ('web_search', 'Web Search', 'Search the web for information', true, 'safe', 'tools'),
  ('web_fetch', 'Web Fetch', 'Fetch content from URLs', true, 'safe', 'tools'),
  ('vision_analyze', 'Vision Analysis', 'Analyze images and screenshots', true, 'safe', 'tools'),
  ('file_read', 'File Read', 'Read files from workspace', true, 'safe', 'tools'),
  ('file_write', 'File Write', 'Write files to workspace', false, 'moderate', 'tools'),
  ('file_list', 'File List', 'List files in workspace', true, 'safe', 'tools'),
  ('exec', 'Shell Execution', 'Execute shell commands', false, 'dangerous', 'tools'),
  ('git', 'Git Operations', 'Perform git commands', false, 'dangerous', 'tools'),
  ('email_send', 'Email Send', 'Send emails on behalf of user', false, 'moderate', 'integrations'),
  ('email_read', 'Email Read', 'Read user emails (read-only)', false, 'moderate', 'integrations'),
  ('slack_send', 'Slack Messages', 'Send Slack messages', false, 'moderate', 'integrations'),
  ('discord_send', 'Discord Messages', 'Send Discord messages', false, 'moderate', 'integrations'),
  ('telegram_send', 'Telegram Messages', 'Send Telegram messages', false, 'moderate', 'integrations'),
  ('browser', 'Browser Automation', 'Control browser via relay', false, 'dangerous', 'tools'),
  ('sessions_spawn', 'Spawn Subagents', 'Create subagent sessions', false, 'moderate', 'agents'),
  ('sessions_send', 'Message Subagents', 'Send messages to subagents', false, 'moderate', 'agents'),
  ('voice_mode', 'Voice Mode', 'Enable voice input/output', true, 'safe', 'experience'),
  ('memory_system', 'Memory System', 'Remember user preferences', true, 'safe', 'experience'),
  ('coding_mode', 'Coding Mode', 'Full coding assistant features', false, 'moderate', 'experience')
ON CONFLICT (feature_id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  risk_level = EXCLUDED.risk_level,
  category = EXCLUDED.category,
  updated_at = now();

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_feature_flags_feature_id ON feature_flags(feature_id);
CREATE INDEX IF NOT EXISTS idx_feature_flags_category ON feature_flags(category);
