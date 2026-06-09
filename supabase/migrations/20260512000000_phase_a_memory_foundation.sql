-- CubiQo Phase A - Step 1 Core Memory Architecture
--
-- Runbook source:
-- C:\Users\avloy\Desktop\CubiQo-PhaseA-Runbook.md
--
-- Scope for Step 1:
-- - profiles Phase A context columns
-- - user_permissions first-class consent table
-- - memory_events rolling active memory
-- - user_ai_profile inferred user understanding
-- - system_prompts real seed content
--
-- Deliberately later:
-- - subscription checkout / paid tiers
-- - Tier 4 affiliate networks
-- - browser-extension attribution
-- - Amazon PA API

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 1A: profiles - Phase A context columns
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.profiles
  add column if not exists display_name text,
  add column if not exists voice_preference text default 'text'
    check (voice_preference in ('text', 'voice')),
  add column if not exists timezone text default 'UTC',
  add column if not exists city text,
  add column if not exists country text,
  add column if not exists last_seen_at timestamptz,
  add column if not exists visit_count int default 0,
  add column if not exists primary_goal text,
  add column if not exists goal_domain text,
  add column if not exists onboarding_done boolean default false,
  add column if not exists onboarding_summary text,
  add column if not exists daily_context text,
  add column if not exists language_preference text default 'en',
  add column if not exists script_preference text default 'latin',
  add column if not exists active_device_id text;

-- Kept as data columns only, not checkout implementation.
-- They support later product packaging without introducing payment flows.
alter table public.profiles
  add column if not exists subscription_tier text default 'free'
    check (subscription_tier in ('free', 'pro', 'business')),
  add column if not exists referral_code text,
  add column if not exists referred_by uuid references auth.users(id) on delete set null;

create unique index if not exists profiles_referral_code_unique_idx
  on public.profiles(referral_code)
  where referral_code is not null;

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 1B: user_permissions - first-class permission/consent state
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.user_permissions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  mic text default 'pending' check (mic in ('granted', 'denied', 'pending')),
  camera text default 'pending' check (camera in ('granted', 'denied', 'pending')),
  memory text default 'pending' check (memory in ('granted', 'denied', 'pending')),
  location text default 'pending' check (location in ('granted', 'denied', 'pending')),
  push text default 'pending' check (push in ('granted', 'denied', 'pending')),
  tracking text default 'pending' check (tracking in ('granted', 'denied', 'pending')),
  mic_granted_at timestamptz,
  camera_granted_at timestamptz,
  memory_granted_at timestamptz,
  location_granted_at timestamptz,
  push_granted_at timestamptz,
  tracking_granted_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_permissions
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

drop trigger if exists set_user_permissions_updated_at on public.user_permissions;
create trigger set_user_permissions_updated_at
before update on public.user_permissions
for each row execute function public.set_updated_at();

alter table public.user_permissions enable row level security;

drop policy if exists "Users manage own permissions" on public.user_permissions;
create policy "Users manage own permissions"
on public.user_permissions
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 1C: memory_events - rolling active memory
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.memory_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  event_type text not null
    check (event_type in (
      'session_summary',
      'goal_update',
      'commitment',
      'blocker',
      'outcome',
      'episode',
      'journal_insight',
      'preference',
      'profile_correction'
    )),
  summary text not null check (char_length(summary) <= 800),
  keywords text[] default '{}',
  signal_ids uuid[] default '{}',
  weight int default 1 check (weight in (1, 2, 3)),
  confidence numeric default 0.8 check (confidence >= 0 and confidence <= 1),
  source text not null default 'conversation',
  source_id uuid,
  user_confirmed boolean not null default false,
  expires_at timestamptz,
  archived_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.memory_events
  add column if not exists keywords text[] default '{}',
  add column if not exists signal_ids uuid[] default '{}',
  add column if not exists confidence numeric default 0.8,
  add column if not exists source text not null default 'conversation',
  add column if not exists source_id uuid,
  add column if not exists user_confirmed boolean not null default false,
  add column if not exists archived_at timestamptz,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists updated_at timestamptz not null default now();

drop trigger if exists set_memory_events_updated_at on public.memory_events;
create trigger set_memory_events_updated_at
before update on public.memory_events
for each row execute function public.set_updated_at();

alter table public.memory_events enable row level security;

drop policy if exists "Users manage own memory" on public.memory_events;
create policy "Users manage own memory"
on public.memory_events
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create index if not exists memory_events_user_weight_idx
  on public.memory_events(user_id, weight desc, created_at desc)
  where archived_at is null;

create index if not exists memory_events_user_keywords_idx
  on public.memory_events using gin(keywords)
  where archived_at is null;

create index if not exists memory_events_user_type_idx
  on public.memory_events(user_id, event_type, created_at desc);

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 1D: user_ai_profile - CubiQo's behavioural model
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.user_ai_profile (
  user_id uuid primary key references auth.users(id) on delete cascade,
  personality_read text,
  primary_drive text,
  communication_style text,
  current_phase text,
  working_patterns text,
  what_motivates text,
  what_blocks text,
  open_loops text[] default '{}',
  confidence jsonb default '{}',
  corrections jsonb default '{}',
  session_count int default 0,
  last_updated timestamptz default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_ai_profile
  add column if not exists confidence jsonb default '{}',
  add column if not exists corrections jsonb default '{}',
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

drop trigger if exists set_user_ai_profile_updated_at on public.user_ai_profile;
create trigger set_user_ai_profile_updated_at
before update on public.user_ai_profile
for each row execute function public.set_updated_at();

alter table public.user_ai_profile enable row level security;

drop policy if exists "Users manage own AI profile" on public.user_ai_profile;
create policy "Users manage own AI profile"
on public.user_ai_profile
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 1E: journal bridge fields for later extraction
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.journal_entries
  add column if not exists memory_extracted boolean default false,
  add column if not exists memory_extracted_at timestamptz,
  add column if not exists memory_event_ids uuid[] default '{}';

create index if not exists journal_entries_memory_pending_idx
  on public.journal_entries(user_id, created_at desc)
  where memory_extracted = false;

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 1F: system_prompts - real seed content, no placeholders
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.system_prompts (
  name text not null,
  version int not null default 1,
  content text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (name, version)
);

insert into public.system_prompts (name, version, content, active) values
  (
    'base',
    1,
    'You are CubiQo — a proactive AI built to help people achieve their goals through research, planning, and execution. You are direct, specific, and action-oriented. You never give generic advice when specific advice is possible. You think in terms of outcomes, not activities. You have memory: you know what this user is working on, what blocks them, and what they have committed to. Use that knowledge. Use tools only when they help achieve what the user actually needs, not just to answer a question. Guardrails: never process payments, never execute final publish/send/submit/push/deploy actions. Always confirm before irreversible actions.',
    true
  ),
  (
    'onboarding',
    1,
    'You are CubiQo, meeting a new user for the first time. Your job is to understand them in 3 questions. Ask one question at a time. Be warm but brief. When you have their goal, context, and main blocker, stop asking and confirm you have what you need. Do not ask more than 3 questions.',
    true
  )
on conflict (name, version)
do update set
  content = excluded.content,
  active = excluded.active;

