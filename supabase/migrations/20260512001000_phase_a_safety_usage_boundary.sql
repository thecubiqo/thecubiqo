-- Phase A safety, capsule boundary, and usage tracking.
-- This migration is intentionally additive and leaves subscriptions, Tier 4
-- networks, browser-extension attribution, and Amazon PA API for later phases.

alter table if exists public.signals
  add column if not exists capsule_status text default 'none'
    check (capsule_status in ('none', 'candidate', 'saved', 'discarded')),
  add column if not exists capsule_summary text,
  add column if not exists capsule_confidence numeric default 0.5,
  add column if not exists classified_at timestamptz,
  add column if not exists classification_metadata jsonb default '{}',
  add column if not exists freshness_live_search_required boolean default false,
  add column if not exists source_modality text default 'text';

create index if not exists signals_capsule_status_idx
  on public.signals(user_id, capsule_status, created_at desc);

create table if not exists public.output_safety_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  input_hash text,
  output_flagged text,
  action_taken text not null default 'logged_only'
    check (action_taken in ('replaced', 'blocked', 'logged_only')),
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

create index if not exists output_safety_log_user_idx
  on public.output_safety_log(user_id, created_at desc);

alter table public.output_safety_log enable row level security;

drop policy if exists "Users read own output safety log" on public.output_safety_log;
create policy "Users read own output safety log"
  on public.output_safety_log
  for select
  using (auth.uid() = user_id);

create table if not exists public.user_api_usage (
  user_id uuid references auth.users(id) on delete cascade,
  window_start timestamptz not null,
  llm_calls int default 0,
  stt_seconds int default 0,
  vision_frames int default 0,
  tool_calls int default 0,
  tokens_input int default 0,
  tokens_output int default 0,
  cost_estimate numeric default 0,
  updated_at timestamptz default now(),
  primary key (user_id, window_start)
);

alter table public.user_api_usage enable row level security;

drop policy if exists "Users read own API usage" on public.user_api_usage;
create policy "Users read own API usage"
  on public.user_api_usage
  for select
  using (auth.uid() = user_id);

create table if not exists public.api_usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  session_id text,
  route text not null,
  provider text,
  model text,
  tokens_input int,
  tokens_output int,
  cost_estimate numeric,
  latency_ms int,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

create index if not exists api_usage_events_user_idx
  on public.api_usage_events(user_id, created_at desc);

create index if not exists api_usage_events_route_idx
  on public.api_usage_events(route, created_at desc);

alter table public.api_usage_events enable row level security;

drop policy if exists "Users read own API usage events" on public.api_usage_events;
create policy "Users read own API usage events"
  on public.api_usage_events
  for select
  using (auth.uid() = user_id);
