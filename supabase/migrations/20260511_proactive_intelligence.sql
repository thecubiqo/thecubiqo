-- ============================================================
-- Proactive Intelligence Engine + Sprint 4 Migration
-- Run this entire script in Supabase SQL Editor
-- All statements are idempotent (IF NOT EXISTS / ON CONFLICT DO NOTHING)
-- ============================================================

-- ─────────────────────────────────────────────
-- 1. capsule_briefings
-- ─────────────────────────────────────────────
create table if not exists capsule_briefings (
  id uuid primary key default gen_random_uuid(),
  signal_id uuid references signals(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  domain text not null,
  status text not null default 'pending',        -- pending | running | ready | failed
  headline text,
  context_summary text,
  blockers jsonb not null default '[]',
  recommended_actions jsonb not null default '[]',
  open_questions jsonb not null default '[]',
  research_results jsonb not null default '[]',
  raw_agent_output text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists capsule_briefings_signal_id_idx on capsule_briefings(signal_id);
create index if not exists capsule_briefings_user_status_idx on capsule_briefings(user_id, status);
create index if not exists capsule_briefings_updated_idx on capsule_briefings(updated_at);

-- ─────────────────────────────────────────────
-- 2. background_trigger_failures (retry queue)
-- ─────────────────────────────────────────────
create table if not exists background_trigger_failures (
  id uuid primary key default gen_random_uuid(),
  signal_id uuid,
  user_id uuid references auth.users(id) on delete cascade,
  error text,
  retry_count int not null default 0,
  next_retry_at timestamptz not null default now(),
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists bg_trigger_failures_retry_idx on background_trigger_failures(next_retry_at, resolved, retry_count);

-- ─────────────────────────────────────────────
-- 3. browserbase_usage_log (cost circuit breaker)
-- ─────────────────────────────────────────────
create table if not exists browserbase_usage_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  domain text,
  reason text,
  created_at timestamptz not null default now()
);
create index if not exists bb_usage_created_idx on browserbase_usage_log(created_at);

-- ─────────────────────────────────────────────
-- 4. user_outcomes (outcome tracking)
-- ─────────────────────────────────────────────
create table if not exists user_outcomes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  signal_id uuid references signals(id) on delete set null,
  briefing_id uuid references capsule_briefings(id) on delete set null,
  domain text not null,
  outcome_type text,   -- interview_booked | sale_made | investor_reply | product_shipped | offer_received | no_progress
  outcome_detail text,
  days_to_outcome int,
  captured_at timestamptz not null default now(),
  metadata jsonb not null default '{}'
);
create index if not exists user_outcomes_user_domain_idx on user_outcomes(user_id, domain);

-- ─────────────────────────────────────────────
-- 5. user_documents (artifact analysis)
-- ─────────────────────────────────────────────
create table if not exists user_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  document_type text not null,  -- pitch_deck | business_plan | landing_page_url | resume_url
  storage_path text,
  url text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, document_type)
);

-- ─────────────────────────────────────────────
-- 6. briefing_action_completions (adaptive briefing)
-- ─────────────────────────────────────────────
create table if not exists briefing_action_completions (
  id uuid primary key default gen_random_uuid(),
  briefing_id uuid references capsule_briefings(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  action_index int not null,
  completion_note text,
  completed_at timestamptz not null default now()
);
create index if not exists bac_briefing_idx on briefing_action_completions(briefing_id);

-- ─────────────────────────────────────────────
-- 7. market_watch_subscriptions
-- ─────────────────────────────────────────────
create table if not exists market_watch_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  briefing_id uuid references capsule_briefings(id) on delete cascade,
  domain text not null,
  keywords text[] not null default '{}',
  alert_threshold text not null default 'high',  -- low | medium | high
  check_frequency_hours int not null default 24,
  last_checked_at timestamptz,
  last_results_hash text,   -- hash of previous results for diff detection
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists mws_user_active_idx on market_watch_subscriptions(user_id, active);
create index if not exists mws_check_due_idx on market_watch_subscriptions(last_checked_at, active);

-- ─────────────────────────────────────────────
-- 8. job_scan_runs (durability for job scan cron)
-- ─────────────────────────────────────────────
create table if not exists job_scan_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  status text not null default 'running',  -- running | completed | failed
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  jobs_found int not null default 0,
  jobs_matched int not null default 0,
  error text,
  metadata jsonb not null default '{}'
);
create index if not exists job_scan_runs_user_idx on job_scan_runs(user_id, started_at desc);

-- ─────────────────────────────────────────────
-- 9. Sprint 4: safety_patterns
-- ─────────────────────────────────────────────
create table if not exists safety_patterns (
  id uuid primary key default gen_random_uuid(),
  pattern_type text not null,  -- crisis | hard_block | age_gate
  pattern text not null,
  flags text not null default 'i',
  active boolean not null default true,
  priority int not null default 0,
  created_at timestamptz not null default now()
);

-- Seed current hardcoded patterns (idempotent — skip if already seeded)
insert into safety_patterns (pattern_type, pattern, flags, priority) values
  ('crisis', '\bsuicide\b', 'i', 10),
  ('crisis', '\bself.harm\b', 'i', 10),
  ('crisis', '\bkill myself\b', 'i', 10),
  ('crisis', '\bend my life\b', 'i', 10),
  ('crisis', '\bwant to die\b', 'i', 9),
  ('crisis', '\bself harm\b', 'i', 9),
  ('hard_block', '\bchild.porn\b', 'i', 10),
  ('hard_block', '\bcsam\b', 'i', 10),
  ('hard_block', '\bcp porn\b', 'i', 10),
  ('age_gate', '\bgrindr\b', 'i', 5),
  ('age_gate', '\btinder\b', 'i', 5),
  ('age_gate', '\badult content\b', 'i', 5),
  ('age_gate', '\bnsfw\b', 'i', 5),
  ('age_gate', '\bexplicit\b', 'i', 4),
  ('age_gate', '\bhookup\b', 'i', 4)
on conflict do nothing;

-- ─────────────────────────────────────────────
-- 10. Sprint 4: system_prompts
-- ─────────────────────────────────────────────
create table if not exists system_prompts (
  name text not null,
  version int not null default 1,
  content text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (name, version)
);

-- Seed placeholder rows — UPDATE content with actual prompt text after first deploy
insert into system_prompts (name, version, content, active) values
  ('base', 1, '__REPLACE_WITH_BASE_PROMPT__', true),
  ('career_addendum', 1, '__REPLACE_WITH_CAREER_ADDENDUM__', true),
  ('startup_addendum', 1, '__REPLACE_WITH_STARTUP_ADDENDUM__', true),
  ('marketing_addendum', 1, '__REPLACE_WITH_MARKETING_ADDENDUM__', true),
  ('sales_addendum', 1, '__REPLACE_WITH_SALES_ADDENDUM__', true),
  ('investment_addendum', 1, '__REPLACE_WITH_INVESTMENT_ADDENDUM__', true),
  ('ecommerce_addendum', 1, '__REPLACE_WITH_ECOMMERCE_ADDENDUM__', true),
  ('health_addendum', 1, '__REPLACE_WITH_HEALTH_ADDENDUM__', true),
  ('social_addendum', 1, '__REPLACE_WITH_SOCIAL_ADDENDUM__', true)
on conflict (name, version) do nothing;

-- ─────────────────────────────────────────────
-- 11. Sprint 4: capability_overrides
-- ─────────────────────────────────────────────
create table if not exists capability_overrides (
  capability text primary key,
  status text,              -- active | locked | read_only | null = use default
  approval_required boolean,
  endpoint text,
  notes text,
  updated_at timestamptz not null default now()
);
-- Starts empty — no overrides = all defaults = identical to current behaviour

-- ─────────────────────────────────────────────
-- 12. Sprint 4: feature_flags
-- ─────────────────────────────────────────────
create table if not exists feature_flags (
  flag text primary key,
  enabled boolean not null default false,
  requires_admin_override boolean not null default true,
  description text,
  updated_at timestamptz not null default now()
);

insert into feature_flags (flag, enabled, description) values
  ('shopify_billing',       false, 'Shopify billing/payment API access'),
  ('autonomous_email',      false, 'Autonomous email sending without user approval'),
  ('autonomous_deploy',     false, 'Autonomous deployment to production'),
  ('linkedin_direct_post',  false, 'Direct LinkedIn posting without browser automation'),
  ('autonomous_social_post',false, 'Autonomous social posting without user approval')
on conflict (flag) do nothing;

-- ─────────────────────────────────────────────
-- 13. Sprint 4: platform_settings
-- ─────────────────────────────────────────────
create table if not exists platform_settings (
  key text primary key,
  value text,
  description text,
  overridable_by_user boolean not null default false
);
-- Add column if table already existed without it
alter table platform_settings
  add column if not exists overridable_by_user boolean not null default false;

insert into platform_settings (key, value, description, overridable_by_user) values
  ('shopify_api_version',      '2025-10',  'Shopify API version used across all requests', false),
  ('pod_default_price',        '0.00',     'Default POD product price — 0 forces explicit pricing', true),
  ('pod_default_tags',         '[]',       'Default product tags JSON array', true),
  ('pod_default_title',        'New Product', 'Default product title fallback', true),
  ('elevenlabs_voice_id',      '',         'ElevenLabs voice ID (empty = use SDK default)', false),
  ('elevenlabs_model_id',      '',         'ElevenLabs model ID (empty = use SDK default)', false),
  ('browserbase_daily_limit',  '50',       'Max Browserbase sessions per day (circuit breaker)', false),
  ('push_max_per_day',         '5',        'Max push notifications per user per day', true),
  ('push_quiet_hours_start',   '22',       'Push quiet hours start (24h, user timezone)', true),
  ('push_quiet_hours_end',     '8',        'Push quiet hours end (24h, user timezone)', true)
on conflict (key) do nothing;

-- ─────────────────────────────────────────────
-- 14. Extend push_subscriptions for rate limiting
-- ─────────────────────────────────────────────
alter table push_subscriptions
  add column if not exists max_per_day int default 5,
  add column if not exists quiet_hours_start int default 22,
  add column if not exists quiet_hours_end int default 8,
  add column if not exists timezone text default 'UTC';

-- ─────────────────────────────────────────────
-- 15. Extend shopify_store_connections
-- ─────────────────────────────────────────────
alter table shopify_store_connections
  add column if not exists api_version text default null,
  add column if not exists default_product_tags text[] default '{}',
  add column if not exists default_product_price numeric(10,2) default null,
  add column if not exists default_product_title text default null,
  add column if not exists default_collection_name text default null,
  add column if not exists brand_name text default null,
  add column if not exists metadata jsonb default '{}';

-- ─────────────────────────────────────────────
-- 16. social_accounts (if not already created)
-- ─────────────────────────────────────────────
create table if not exists social_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  platform text not null,
  account_handle text,
  account_id text,
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  posting_enabled boolean not null default true,
  posting_frequency_minutes int not null default 60,
  daily_post_limit int not null default 6,
  active boolean not null default true,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, platform)
);

-- ─────────────────────────────────────────────
-- 17. pod_providers (if not already created)
-- ─────────────────────────────────────────────
create table if not exists pod_providers (
  id text primary key,
  label text not null,
  api_url text,
  dashboard_url_template text,
  shopify_app_url text,
  integration_type text not null default 'direct_api',  -- direct_api | shopify_app
  supports_automation boolean not null default false,
  active boolean not null default true,
  metadata jsonb not null default '{}'
);

insert into pod_providers (id, label, api_url, dashboard_url_template, integration_type, supports_automation) values
  ('printify',    'Printify',   'https://api.printify.com/v1',   'https://printify.com/app/products/{id}',  'direct_api',  true),
  ('printful',    'Printful',   'https://api.printful.com',      'https://www.printful.com/dashboard',      'direct_api',  true),
  ('gelato',      'Gelato',     'https://order.gelatoapis.com',  'https://dashboard.gelato.com',            'direct_api',  true),
  ('apliiq',      'Apliiq',     null,                            null,                                      'shopify_app', false),
  ('customcat',   'CustomCat',  null,                            null,                                      'shopify_app', false),
  ('teelaunch',   'Teelaunch',  null,                            null,                                      'shopify_app', false)
on conflict (id) do nothing;

-- ─────────────────────────────────────────────
-- Done. Verify with:
--   select count(*) from capsule_briefings;
--   select count(*) from safety_patterns;
--   select count(*) from feature_flags;
--   select count(*) from platform_settings;
-- ─────────────────────────────────────────────
