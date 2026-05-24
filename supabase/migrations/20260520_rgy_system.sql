-- CubiQo Sprint 2 - RGY operational status system.
-- Source of truth: CubiQo-RGY-System-Runbook.md + CubiQo-RGY-System-DB.md.

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

create table if not exists public.rgy_status (
  user_id uuid primary key references auth.users(id) on delete cascade,
  status text not null default 'yellow' check (status in ('green', 'yellow', 'red')),
  score numeric(5,2) not null default 50,
  reason text,
  changed_at timestamptz not null default now(),
  evaluated_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.rgy_status
  add column if not exists score numeric(5,2) not null default 50,
  add column if not exists reason text,
  add column if not exists evaluated_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

drop trigger if exists set_rgy_status_updated_at on public.rgy_status;
create trigger set_rgy_status_updated_at
before update on public.rgy_status
for each row execute function public.set_updated_at();

alter table public.rgy_status enable row level security;

drop policy if exists "Users read own RGY status" on public.rgy_status;
create policy "Users read own RGY status"
on public.rgy_status
for select
using (auth.uid() = user_id);

drop policy if exists "Service role manages RGY status" on public.rgy_status;
create policy "Service role manages RGY status"
on public.rgy_status
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

create index if not exists rgy_status_changed_idx
  on public.rgy_status(user_id, changed_at desc);

create table if not exists public.rgy_transitions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  from_status text check (from_status in ('green', 'yellow', 'red')),
  to_status text not null check (to_status in ('green', 'yellow', 'red')),
  reason text,
  trigger_type text not null default 'cron_eval',
  triggered_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.rgy_transitions
  add column if not exists trigger_type text not null default 'cron_eval',
  add column if not exists triggered_at timestamptz not null default now(),
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.rgy_transitions enable row level security;

drop policy if exists "Users read own RGY transitions" on public.rgy_transitions;
create policy "Users read own RGY transitions"
on public.rgy_transitions
for select
using (auth.uid() = user_id);

drop policy if exists "Service role inserts RGY transitions" on public.rgy_transitions;
create policy "Service role inserts RGY transitions"
on public.rgy_transitions
for insert
with check (auth.role() = 'service_role');

create index if not exists rgy_transitions_user_idx
  on public.rgy_transitions(user_id, triggered_at desc);

create index if not exists rgy_transitions_status_idx
  on public.rgy_transitions(to_status, triggered_at desc);

create table if not exists public.rgy_rules (
  key text primary key,
  value numeric not null,
  description text,
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.rgy_rules enable row level security;

drop policy if exists "Authenticated users read RGY rules" on public.rgy_rules;
create policy "Authenticated users read RGY rules"
on public.rgy_rules
for select
using (auth.uid() is not null);

drop policy if exists "Service role manages RGY rules" on public.rgy_rules;
create policy "Service role manages RGY rules"
on public.rgy_rules
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

insert into public.rgy_rules (key, value, description, active) values
  ('inactivity_days_yellow', 3, 'Days since last session before yellow state', true),
  ('inactivity_days_red', 10, 'Days since last session before red state', true),
  ('engagement_boost_per_session', 8, 'Score boost per session in the last 7 days', true),
  ('green_min_score', 70, 'Minimum score for green status', true),
  ('yellow_min_score', 35, 'Minimum score for yellow status', true)
on conflict (key) do update set
  value = excluded.value,
  description = excluded.description,
  active = excluded.active,
  updated_at = now();
