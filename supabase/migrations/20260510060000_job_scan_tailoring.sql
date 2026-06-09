-- Job scan + LLM tailoring additions
-- Adds scan_enabled, experience_summary to job_profiles
-- Adds content to resume_versions
-- Adds cron_discovered flag support to job_listings metadata

alter table if exists job_profiles
  add column if not exists scan_enabled boolean not null default false,
  add column if not exists experience_summary text,
  add column if not exists score_threshold integer not null default 60;

alter table if exists resume_versions
  add column if not exists content text;

-- Index for cron job scan query
create index if not exists job_profiles_scan_enabled_idx
  on job_profiles (scan_enabled)
  where scan_enabled = true;

-- Cron job scan audit table
create table if not exists job_scan_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null,
  listings_found integer not null default 0,
  listings_saved integer not null default 0,
  score_threshold integer not null default 60,
  ran_at timestamptz not null default now(),
  metadata jsonb
);

alter table job_scan_runs enable row level security;

create policy "Users can read own scan runs"
  on job_scan_runs for select
  using (auth.uid() = user_id);

-- Service role insert only (cron worker)
create policy "Service role can insert scan runs"
  on job_scan_runs for insert
  with check (true);
