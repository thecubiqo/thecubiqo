-- Closure patch for role-agnostic career phases 9-10.
-- Adds durable tailoring metadata to appended resume versions and expands the
-- product-facing tracker lifecycle without changing external action guardrails.

alter table if exists public.resume_versions
  add column if not exists company text,
  add column if not exists match_score integer,
  add column if not exists jd_keywords text[] not null default '{}'::text[],
  add column if not exists cover_letter_content text;

create index if not exists idx_resume_versions_user_match_score
  on public.resume_versions(user_id, match_score desc, created_at desc);

alter table if exists public.job_listings
  drop constraint if exists job_listings_status_check;

alter table if exists public.job_listings
  add constraint job_listings_status_check
  check (status in (
    'saved', 'reviewing', 'prepared', 'approved_for_submission',
    'submitted_by_user', 'archived',
    'discovered', 'matched', 'drafted', 'tailoring',
    'questions_needed', 'ready', 'ready_to_apply',
    'applying', 'ready_to_submit', 'submitted',
    'applied', 'response', 'failed', 'cancelled',
    'interview', 'offer', 'rejected', 'withdrawn'
  ));

alter table if exists public.job_applications
  drop constraint if exists job_applications_status_check;

alter table if exists public.job_applications
  add constraint job_applications_status_check
  check (status in (
    'pending', 'in_progress', 'drafted', 'tailoring',
    'questions_needed', 'ready', 'ready_to_apply',
    'ready_to_submit', 'applying', 'submitted',
    'applied', 'response', 'failed', 'cancelled',
    'withdrawn', 'interview', 'offer', 'rejected'
  ));
