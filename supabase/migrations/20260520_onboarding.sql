-- CubiQo Sprint 2 - Onboarding progress and completion tables.
-- Source of truth: CubiQo-Onboarding-Runbook.md + CubiQo-Onboarding-DB.md.

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

alter table public.profiles
  add column if not exists age_range text,
  add column if not exists primary_goal text,
  add column if not exists goal_domain text,
  add column if not exists timezone text default 'UTC',
  add column if not exists language_preference text default 'en',
  add column if not exists onboarding_done boolean default false,
  add column if not exists onboarding_summary text,
  add column if not exists last_seen_at timestamptz;

create table if not exists public.onboarding_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  step text not null,
  completed_at timestamptz,
  skipped boolean not null default false,
  answer_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, step)
);

alter table public.onboarding_progress
  add column if not exists answer_data jsonb not null default '{}'::jsonb,
  add column if not exists updated_at timestamptz not null default now();

drop trigger if exists set_onboarding_progress_updated_at on public.onboarding_progress;
create trigger set_onboarding_progress_updated_at
before update on public.onboarding_progress
for each row execute function public.set_updated_at();

alter table public.onboarding_progress enable row level security;

drop policy if exists "Users manage own onboarding progress" on public.onboarding_progress;
create policy "Users manage own onboarding progress"
on public.onboarding_progress
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create index if not exists onboarding_progress_user_idx
  on public.onboarding_progress(user_id, step);

create table if not exists public.onboarding_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  event_type text not null,
  step text,
  metadata jsonb not null default '{}'::jsonb,
  session_id uuid,
  created_at timestamptz not null default now()
);

alter table public.onboarding_events enable row level security;

drop policy if exists "Users read own onboarding events" on public.onboarding_events;
create policy "Users read own onboarding events"
on public.onboarding_events
for select
using (auth.uid() = user_id);

drop policy if exists "Service role inserts onboarding events" on public.onboarding_events;
create policy "Service role inserts onboarding events"
on public.onboarding_events
for insert
with check (auth.role() = 'service_role');

create index if not exists onboarding_events_user_idx
  on public.onboarding_events(user_id, created_at desc);

create index if not exists onboarding_events_type_idx
  on public.onboarding_events(event_type, created_at desc);
