-- V2 job application workflow foundation for cq.ai.
-- Browser/job-board automation is not performed here. These tables store user-owned
-- listings, review cards, and approval state for later visible browser/API execution.

create extension if not exists pgcrypto;

create table if not exists public.job_listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  approval_id uuid references public.action_approvals(id) on delete set null,
  browser_session_id uuid references public.browser_sessions(id) on delete set null,
  source_platform text not null check (source_platform in ('linkedin', 'indeed', 'dice')),
  source_url text,
  external_id text,
  title text not null,
  company text not null,
  location text,
  description text,
  employment_type text,
  compensation text,
  posted_at timestamptz,
  discovered_at timestamptz not null default now(),
  apply_url text,
  status text not null default 'saved'
    check (status in ('saved', 'reviewing', 'prepared', 'approved_for_submission', 'submitted_by_user', 'archived')),
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint job_listings_title_not_blank check (length(trim(title)) > 0),
  constraint job_listings_company_not_blank check (length(trim(company)) > 0)
);

create table if not exists public.job_application_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  approval_id uuid references public.action_approvals(id) on delete set null,
  submit_approval_id uuid references public.action_approvals(id) on delete set null,
  browser_session_id uuid references public.browser_sessions(id) on delete set null,
  job_listing_id uuid references public.job_listings(id) on delete set null,
  source_platform text not null check (source_platform in ('linkedin', 'indeed', 'dice')),
  target_url text,
  status text not null default 'prepared'
    check (status in ('prepared', 'approved_for_submission', 'cancelled', 'failed')),
  candidate_name text,
  candidate_email text,
  candidate_phone text,
  resume_summary text,
  cover_letter text,
  answers jsonb not null default '[]'::jsonb,
  submission_payload jsonb not null default '{}'::jsonb,
  external_submission_performed boolean not null default false,
  prepared_at timestamptz not null default now(),
  approved_at timestamptz,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_job_listings_user_created
  on public.job_listings(user_id, created_at desc);

create index if not exists idx_job_listings_user_source
  on public.job_listings(user_id, source_platform, created_at desc);

create index if not exists idx_job_application_reviews_user_created
  on public.job_application_reviews(user_id, created_at desc);

create index if not exists idx_job_application_reviews_listing
  on public.job_application_reviews(job_listing_id, created_at desc);

drop trigger if exists set_job_listings_updated_at on public.job_listings;
create trigger set_job_listings_updated_at
before update on public.job_listings
for each row execute function public.set_updated_at();

drop trigger if exists set_job_application_reviews_updated_at on public.job_application_reviews;
create trigger set_job_application_reviews_updated_at
before update on public.job_application_reviews
for each row execute function public.set_updated_at();

alter table public.job_listings enable row level security;
alter table public.job_application_reviews enable row level security;

drop policy if exists "job_listings_select_own" on public.job_listings;
create policy "job_listings_select_own"
on public.job_listings for select
using (auth.uid() = user_id);

drop policy if exists "job_application_reviews_select_own" on public.job_application_reviews;
create policy "job_application_reviews_select_own"
on public.job_application_reviews for select
using (auth.uid() = user_id);

drop policy if exists "job_listings_insert_own" on public.job_listings;
drop policy if exists "job_listings_update_own" on public.job_listings;
drop policy if exists "job_application_reviews_insert_own" on public.job_application_reviews;
drop policy if exists "job_application_reviews_update_own" on public.job_application_reviews;

-- Job workflow state is user-visible but server-controlled.
-- All writes must pass through /api/actions/execute so approval checks, capability
-- checks, and audit logging cannot be bypassed from the browser client.
