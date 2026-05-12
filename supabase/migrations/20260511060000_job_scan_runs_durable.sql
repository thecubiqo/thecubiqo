-- Durable job scan run tracking for cron/self-report visibility.
-- Kept compatible with the older job_scan_tailoring migration.

create table if not exists public.job_scan_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null default 'all',
  status text not null default 'started',
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  jobs_found integer not null default 0,
  listings_found integer not null default 0,
  listings_saved integer not null default 0,
  score_threshold integer not null default 60,
  error text,
  ran_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

alter table public.job_scan_runs
  add column if not exists status text not null default 'completed',
  add column if not exists started_at timestamptz not null default now(),
  add column if not exists completed_at timestamptz,
  add column if not exists jobs_found integer not null default 0,
  add column if not exists error text,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

update public.job_scan_runs
set jobs_found = greatest(coalesce(jobs_found, 0), coalesce(listings_found, 0))
where coalesce(jobs_found, 0) = 0 and coalesce(listings_found, 0) > 0;

alter table public.job_scan_runs enable row level security;

drop policy if exists "Users can read own scan runs" on public.job_scan_runs;
create policy "Users can read own scan runs"
  on public.job_scan_runs for select
  using (auth.uid() = user_id);

drop policy if exists "Service role can insert scan runs" on public.job_scan_runs;
create policy "Service role can insert scan runs"
  on public.job_scan_runs for insert
  with check (true);

create index if not exists job_scan_runs_user_started_idx
  on public.job_scan_runs (user_id, started_at desc);
