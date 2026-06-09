-- Phase A cron reliability and daily context metadata.

alter table if exists public.profiles
  add column if not exists daily_context_generated_at timestamptz,
  add column if not exists daily_context_expires_at timestamptz;

create table if not exists public.job_runs (
  id uuid primary key default gen_random_uuid(),
  job_name text not null,
  dedupe_key text not null,
  status text not null default 'running'
    check (status in ('running', 'succeeded', 'failed', 'skipped')),
  started_at timestamptz default now(),
  finished_at timestamptz,
  error text,
  metadata jsonb default '{}',
  unique(job_name, dedupe_key)
);

create index if not exists job_runs_job_idx
  on public.job_runs(job_name, started_at desc);

alter table public.job_runs enable row level security;
