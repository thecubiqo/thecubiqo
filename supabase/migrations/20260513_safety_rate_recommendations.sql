-- Migration: 20260513_safety_rate_recommendations.sql
-- CREATE output_safety_log, user_api_usage, api_usage_events
-- + ALTER affiliate_links (logo_url, promo_code, postback_supported, tagline, recommendation_blurb)
-- + increment_api_usage() Postgres function

-- 1. output_safety_log
create table if not exists public.output_safety_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  input_hash text,                     -- SHA-256 of input (never plain text stored)
  output_flagged text,                 -- the flagged portion of LLM output
  action_taken text,                   -- 'replaced' | 'logged_only'
  created_at timestamptz default now()
);

-- 2. user_api_usage
create table if not exists public.user_api_usage (
  user_id uuid references auth.users(id) on delete cascade,
  window_start timestamptz,            -- hourly bucket: truncated to :00:00
  llm_calls int default 0,
  tokens_used int default 0,
  primary key (user_id, window_start)
);

-- 3. api_usage_events
create table if not exists public.api_usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  route text,                          -- '/api/agent/stream', '/api/agent/greet', etc.
  provider text,                       -- 'openai', 'anthropic', etc.
  model text,                          -- 'gpt-4.1-mini', 'gpt-4o', 'whisper-1'
  tokens_input int,
  tokens_output int,
  cost_usd numeric(10,6),
  latency_ms int,
  created_at timestamptz default now()
);
create index if not exists api_usage_user_idx on public.api_usage_events(user_id, created_at desc);

-- 4. affiliate_links alter
alter table public.affiliate_links
  add column if not exists logo_url text,
  add column if not exists promo_code text,
  add column if not exists postback_supported boolean default false,
  add column if not exists tagline text,
  add column if not exists recommendation_blurb text;

-- 5. increment_api_usage() Postgres function
create or replace function public.increment_api_usage(
  uid uuid, ws timestamptz, toks int
) returns void language sql as $$
  insert into public.user_api_usage (user_id, window_start, llm_calls, tokens_used)
  values (uid, ws, 1, toks)
  on conflict (user_id, window_start)
  do update set
    llm_calls = public.user_api_usage.llm_calls + 1,
    tokens_used = public.user_api_usage.tokens_used + toks;
$$;
