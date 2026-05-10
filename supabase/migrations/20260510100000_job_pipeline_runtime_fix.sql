-- Runtime fix for DUO/job pipeline QA.
-- Keeps old job workflow rows valid while adding the broader platforms/states
-- required by the current Job Pipeline, DUO MODE, and 12-hour scan flow.

create extension if not exists "pgcrypto";

create table if not exists public.application_answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question text not null,
  answer text not null,
  platform_hint text,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.application_answers enable row level security;

drop policy if exists "Users own their application answers" on public.application_answers;
create policy "Users own their application answers"
on public.application_answers for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create index if not exists application_answers_user_idx
on public.application_answers(user_id, display_order);

alter table if exists public.job_profiles
  add column if not exists target_roles text[] not null default '{}'::text[],
  add column if not exists skills text[] not null default '{}'::text[],
  add column if not exists preferred_locations text[] not null default '{}'::text[],
  add column if not exists work_modes text[] not null default '{}'::text[],
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists full_name text,
  add column if not exists email text,
  add column if not exists phone text,
  add column if not exists city text,
  add column if not exists linkedin_url text,
  add column if not exists desired_salary text,
  add column if not exists availability text default '2 weeks notice',
  add column if not exists usc boolean not null default false,
  add column if not exists autonomous_apply boolean not null default false,
  add column if not exists apply_threshold integer not null default 80,
  add column if not exists scan_enabled boolean not null default false,
  add column if not exists score_threshold integer not null default 60;

alter table if exists public.resume_versions
  add column if not exists name text,
  add column if not exists target_role text,
  add column if not exists resume_content text,
  add column if not exists content text,
  add column if not exists ats_score integer,
  add column if not exists cover_letter text,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table if exists public.job_applications
  add column if not exists listing_id uuid references public.job_listings(id) on delete set null,
  add column if not exists apply_url text,
  add column if not exists job_url text,
  add column if not exists job_title text,
  add column if not exists company text,
  add column if not exists browser_session_id text,
  add column if not exists approval_id uuid references public.action_approvals(id) on delete set null,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists updated_at timestamptz not null default now();

update public.job_applications
set job_url = coalesce(job_url, apply_url)
where job_url is null and apply_url is not null;

update public.job_applications
set apply_url = coalesce(apply_url, job_url)
where apply_url is null and job_url is not null;

alter table if exists public.job_listings
  add column if not exists metadata jsonb not null default '{}'::jsonb;

update public.job_listings
set metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
  'legacy_raw', coalesce(raw, '{}'::jsonb),
  'posted_at', posted_at
)
where metadata = '{}'::jsonb and (raw <> '{}'::jsonb or posted_at is not null);

alter table if exists public.job_listings
  drop constraint if exists job_listings_source_platform_check,
  drop constraint if exists job_listings_status_check;

alter table if exists public.job_listings
  add constraint job_listings_source_platform_check
  check (source_platform in (
    'linkedin', 'indeed', 'dice', 'monster',
    'greenhouse', 'lever', 'workday', 'ziprecruiter',
    'wellfound', 'company_site', 'ats', 'other'
  )),
  add constraint job_listings_status_check
  check (status in (
    'saved', 'reviewing', 'prepared', 'approved_for_submission',
    'submitted_by_user', 'archived',
    'discovered', 'tailoring', 'ready', 'applying',
    'submitted', 'applied', 'failed', 'interview',
    'offer', 'rejected', 'withdrawn'
  ));

alter table if exists public.job_application_reviews
  drop constraint if exists job_application_reviews_source_platform_check,
  drop constraint if exists job_application_reviews_status_check;

alter table if exists public.job_application_reviews
  add constraint job_application_reviews_source_platform_check
  check (source_platform in (
    'linkedin', 'indeed', 'dice', 'monster',
    'greenhouse', 'lever', 'workday', 'ziprecruiter',
    'wellfound', 'company_site', 'ats', 'other'
  )),
  add constraint job_application_reviews_status_check
  check (status in (
    'prepared', 'approved_for_submission', 'cancelled',
    'failed', 'ready_to_submit', 'submitted'
  ));

alter table if exists public.job_applications
  drop constraint if exists job_applications_platform_check,
  drop constraint if exists job_applications_status_check;

alter table if exists public.job_applications
  add constraint job_applications_platform_check
  check (platform in (
    'linkedin', 'indeed', 'dice', 'monster',
    'greenhouse', 'lever', 'workday', 'ziprecruiter',
    'wellfound', 'company_site', 'ats', 'other'
  )),
  add constraint job_applications_status_check
  check (status in (
    'pending', 'in_progress', 'ready_to_submit', 'applying',
    'submitted', 'failed', 'cancelled', 'withdrawn',
    'interview', 'offer', 'rejected'
  ));

create or replace function public.insert_default_application_answers(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.application_answers (user_id, question, answer, platform_hint, display_order)
  values
    (p_user_id, 'Are you authorized to work in the United States?', 'Yes', 'all', 1),
    (p_user_id, 'Will you now or in the future require sponsorship?', 'No', 'all', 2),
    (p_user_id, 'Are you a U.S. Citizen?', 'Yes', 'all', 3),
    (p_user_id, 'Are you open to remote work?', 'Yes - remote only', 'all', 4),
    (p_user_id, 'Are you willing to relocate?', 'No', 'all', 5),
    (p_user_id, 'What is your desired salary?', 'Competitive / negotiable', 'all', 6),
    (p_user_id, 'When can you start?', '2 weeks notice from offer acceptance', 'all', 7),
    (p_user_id, 'Are you a veteran?', 'No', 'all', 8),
    (p_user_id, 'Do you have a disability?', 'Prefer not to say', 'all', 9)
  on conflict do nothing;
end;
$$;
