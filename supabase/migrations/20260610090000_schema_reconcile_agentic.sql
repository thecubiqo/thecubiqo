-- Schema reconcile: code/DB drift repair for the proactive agentic stack.
-- Strictly additive — safe to run against any of the three historical shapes
-- (phase-A migrations, phase-B migrations, scripts/run-phase-ab-migrations.mjs).
--
-- Repairs (audit 2026-06-10, all adversarially verified):
--   1. job_runs split-brain: code writes idempotency_key AND/OR dedupe_key and
--      status 'completed'; no deployed shape has all of them.
--   2. scheduled_tasks: consumed by accountability-followups cron + written by
--      agent/background, but never created by any migration.
--   3. duo_projects_status_check: approve route writes 'active' which the
--      check rejects — severing plan-approval → execution.
--   4. user_comms_settings channel check: app accepts 'whatsapp', DB rejects.
--   5. self_heal_proposals: insert shape matches no deployed variant.

-- ── 1. job_runs ───────────────────────────────────────────────────────────────
alter table if exists public.job_runs add column if not exists idempotency_key text;
alter table if exists public.job_runs add column if not exists dedupe_key text;
alter table if exists public.job_runs add column if not exists job_name text;
alter table if exists public.job_runs add column if not exists status text;
alter table if exists public.job_runs add column if not exists started_at timestamptz;
alter table if exists public.job_runs add column if not exists ran_at timestamptz default now();
alter table if exists public.job_runs add column if not exists metadata jsonb default '{}'::jsonb;

do $$
begin
  -- phase-A shape made dedupe_key NOT NULL; code paths that write only
  -- idempotency_key must not fail on it.
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'job_runs'
      and column_name = 'dedupe_key' and is_nullable = 'NO'
  ) then
    alter table public.job_runs alter column dedupe_key drop not null;
  end if;
end $$;

create unique index if not exists job_runs_idempotency_key_uidx
  on public.job_runs (idempotency_key) where idempotency_key is not null;

alter table if exists public.job_runs drop constraint if exists job_runs_status_check;
alter table if exists public.job_runs add constraint job_runs_status_check
  check (status is null or status in ('running','started','succeeded','failed','skipped','completed'));

-- ── 2. scheduled_tasks ────────────────────────────────────────────────────────
create table if not exists public.scheduled_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  task_type text not null,
  run_at timestamptz not null,
  completed_at timestamptz,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists scheduled_tasks_due_idx
  on public.scheduled_tasks (task_type, run_at) where completed_at is null;
alter table public.scheduled_tasks enable row level security;

-- ── 3. duo_projects status check ──────────────────────────────────────────────
alter table if exists public.duo_projects drop constraint if exists duo_projects_status_check;
alter table if exists public.duo_projects add constraint duo_projects_status_check
  check (status in ('planning','working','running','active','paused','blocked',
                    'waiting_user','waiting_approval','done','failed','shot',
                    'cancelled','archived'));

-- ── 4. user_comms_settings channel check ──────────────────────────────────────
alter table if exists public.user_comms_settings drop constraint if exists user_comms_settings_channel_check;
alter table if exists public.user_comms_settings add constraint user_comms_settings_channel_check
  check (channel in ('sms','whatsapp','email','both'));

-- ── 5. self_heal_proposals ────────────────────────────────────────────────────
alter table if exists public.self_heal_proposals add column if not exists issue_type text;
alter table if exists public.self_heal_proposals add column if not exists diagnosis text;
alter table if exists public.self_heal_proposals add column if not exists proposed_fix text;
alter table if exists public.self_heal_proposals add column if not exists diff_summary text;
alter table if exists public.self_heal_proposals add column if not exists severity text;
alter table if exists public.self_heal_proposals add column if not exists state text;
alter table if exists public.self_heal_proposals add column if not exists status text;
alter table if exists public.self_heal_proposals add column if not exists title text;
alter table if exists public.self_heal_proposals add column if not exists branch_name text;

do $$
declare col text;
begin
  foreach col in array array['branch_name','title','summary','proposed_fix','diagnosis','issue_type'] loop
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'self_heal_proposals'
        and column_name = col and is_nullable = 'NO'
    ) then
      execute format('alter table public.self_heal_proposals alter column %I drop not null', col);
    end if;
  end loop;
end $$;

alter table if exists public.self_heal_proposals drop constraint if exists self_heal_proposals_state_check;
alter table if exists public.self_heal_proposals add constraint self_heal_proposals_state_check
  check (state is null or state in ('proposed','pending_approval','approved','rejected','applied','abandoned'));
