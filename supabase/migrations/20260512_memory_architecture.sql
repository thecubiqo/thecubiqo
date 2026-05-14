-- Migration: 20260512_memory_architecture.sql
-- CREATE memory_events, user_ai_profile, market_watch_subscriptions, user_outcomes,
-- interventions_log, background_trigger_failures + ALTER journal_entries (memory_extracted)
-- + indexes, RLS policies

-- 1. memory_events
create table if not exists public.memory_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  event_type text not null,
    -- 'session_summary' | 'goal_update' | 'commitment' | 'blocker' | 'outcome' | 'episode'
  summary text not null,
  signal_ids uuid[],
  weight int default 1,               -- 1=routine, 2=important, 3=pivotal
  keywords text[] default '{}',       -- for relevance-ranked reads
  expires_at timestamptz,             -- null = permanent
  archived_at timestamptz,            -- set by strategic-forgetting cron, not deleted
  created_at timestamptz not null default now()
);

create index if not exists memory_events_user_idx
  on public.memory_events(user_id, weight desc, created_at desc);
create index if not exists memory_events_keywords_idx
  on public.memory_events using gin(keywords);

alter table public.memory_events enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Users read own memory') then
    create policy "Users read own memory"
      on public.memory_events for select using (auth.uid() = user_id);
  end if;
end
$$;

-- 2. user_ai_profile
create table if not exists public.user_ai_profile (
  user_id uuid primary key references auth.users(id) on delete cascade,
  personality_read text,
  primary_drive text,
  communication_style text,
  current_phase text,
  working_patterns text,
  what_motivates text,
  what_blocks text,
  open_loops text[],
  session_count int default 0,
  confidence_map jsonb default '{}',   -- { primary_drive: 0.8, what_blocks: 0.6 }
  corrections jsonb default '[]',      -- user-supplied corrections to AI's read
  last_updated timestamptz default now()
);

alter table public.user_ai_profile enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Users read own ai profile') then
    create policy "Users read own ai profile"
      on public.user_ai_profile for select using (auth.uid() = user_id);
  end if;
end
$$;

-- 3. market_watch_subscriptions
create table if not exists public.market_watch_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  briefing_id uuid,
  domain text not null,
  keywords text[] not null default '{}',
  alert_threshold text not null default 'high',
  check_frequency_hours int not null default 24,
  last_checked_at timestamptz,
  last_results_hash text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 4. user_outcomes
create table if not exists public.user_outcomes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  signal_id uuid,
  briefing_id uuid,
  domain text not null,
  outcome_type text,
  outcome_detail text,
  days_to_outcome int,
  captured_at timestamptz not null default now(),
  metadata jsonb not null default '{}'
);

-- 5. interventions_log
create table if not exists public.interventions_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  intervention_type text,
    -- 'commitment_expiry' | 'stale_goal' | 'inactivity' | 'open_loop' | 'market_watch'
  signal_id uuid,
  memory_event_id uuid,
  message_sent text,
  delivered_via text,          -- 'push' | 'inline'
  user_response text,
  snoozed_until timestamptz,
  created_at timestamptz default now()
);

-- 6. background_trigger_failures
create table if not exists public.background_trigger_failures (
  id uuid primary key default gen_random_uuid(),
  signal_id uuid,
  user_id uuid references auth.users(id) on delete cascade,
  error text,
  retry_count int default 0,           -- max 3, then resolved = true (give up)
  next_retry_at timestamptz,           -- backoff: 60s, 120s, 240s
  resolved boolean default false,
  created_at timestamptz default now()
);

create index if not exists btf_retry_idx
  on public.background_trigger_failures(resolved, next_retry_at)
  where resolved = false;

-- 7. journal_entries alter
alter table public.journal_entries
  add column if not exists memory_extracted boolean default false;

create index if not exists journal_unextracted_idx
  on public.journal_entries(user_id, memory_extracted)
  where memory_extracted = false;
