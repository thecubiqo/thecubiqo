-- Founders Pass: Feature flags, sites, OAuth tokens, action templates, audit log
-- Migration: 20260215000001_founders_pass_schema.sql

-- Sites table
CREATE TABLE IF NOT EXISTS sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  domain TEXT,
  description TEXT,
  config JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'preview')),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Feature flags table
CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  flag_type TEXT NOT NULL DEFAULT 'boolean' CHECK (flag_type IN ('boolean', 'percentage', 'variant')),
  default_value BOOLEAN NOT NULL DEFAULT false,
  rollout_rules JSONB DEFAULT '{}',
  required_scopes TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Flag overrides per-site or per-user
CREATE TABLE IF NOT EXISTS flag_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_id UUID NOT NULL REFERENCES feature_flags(id) ON DELETE CASCADE,
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(flag_id, site_id, user_id)
);

-- OAuth tokens (encrypted at rest)
CREATE TABLE IF NOT EXISTS oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  access_token_encrypted TEXT NOT NULL,
  refresh_token_encrypted TEXT,
  token_type TEXT DEFAULT 'Bearer',
  scopes TEXT[] DEFAULT '{}',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, provider)
);

-- Action templates
CREATE TABLE IF NOT EXISTS action_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  key TEXT NOT NULL UNIQUE,
  description TEXT,
  provider TEXT NOT NULL,
  required_scopes TEXT[] DEFAULT '{}',
  ui_schema JSONB DEFAULT '{}',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Audit log
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Feature events (analytics)
CREATE TABLE IF NOT EXISTS feature_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES sites(id),
  user_id UUID REFERENCES profiles(id),
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Integration configs
CREATE TABLE IF NOT EXISTS integration_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  client_id TEXT,
  config JSONB DEFAULT '{}',
  enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(site_id, provider)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_feature_flags_key ON feature_flags(key);
CREATE INDEX IF NOT EXISTS idx_flag_overrides_flag ON flag_overrides(flag_id);
CREATE INDEX IF NOT EXISTS idx_flag_overrides_site ON flag_overrides(site_id);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_user ON oauth_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feature_events_site ON feature_events(site_id);
CREATE INDEX IF NOT EXISTS idx_feature_events_type ON feature_events(event_type);

-- RLS Policies
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE flag_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_configs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read feature flags and sites
CREATE POLICY "feature_flags_read" ON feature_flags FOR SELECT TO authenticated USING (true);
CREATE POLICY "sites_read" ON sites FOR SELECT TO authenticated USING (true);
CREATE POLICY "action_templates_read" ON action_templates FOR SELECT TO authenticated USING (true);

-- Users can read their own tokens
CREATE POLICY "oauth_tokens_own" ON oauth_tokens FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Users can read their own events
CREATE POLICY "feature_events_own" ON feature_events FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Service role has full access (for admin operations)
CREATE POLICY "service_full_flags" ON feature_flags FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_full_sites" ON sites FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_full_overrides" ON flag_overrides FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_full_tokens" ON oauth_tokens FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_full_templates" ON action_templates FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_full_audit" ON audit_log FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_full_events" ON feature_events FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_full_integrations" ON integration_configs FOR ALL TO service_role USING (true) WITH CHECK (true);
