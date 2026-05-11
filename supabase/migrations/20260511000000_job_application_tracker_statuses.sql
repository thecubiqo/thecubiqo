-- Phase 10 application tracking lifecycle for cq.ai.
-- Keeps existing runtime states valid while adding product-facing tracker states.

alter table if exists public.job_listings
  drop constraint if exists job_listings_status_check;

alter table if exists public.job_listings
  add constraint job_listings_status_check
  check (status in (
    'saved', 'reviewing', 'prepared', 'approved_for_submission',
    'submitted_by_user', 'archived',
    'discovered', 'drafted', 'tailoring', 'ready', 'applying',
    'submitted', 'applied', 'response', 'failed', 'interview',
    'offer', 'rejected', 'withdrawn'
  ));

alter table if exists public.job_applications
  drop constraint if exists job_applications_status_check;

alter table if exists public.job_applications
  add constraint job_applications_status_check
  check (status in (
    'pending', 'in_progress', 'drafted', 'ready_to_submit', 'ready',
    'applying', 'submitted', 'applied', 'response', 'failed',
    'cancelled', 'withdrawn', 'interview', 'offer', 'rejected'
  ));

create index if not exists idx_job_listings_tracker_status
  on public.job_listings(user_id, ((metadata ->> 'tracker_status')), created_at desc);

create index if not exists idx_job_applications_tracker_status
  on public.job_applications(user_id, ((metadata ->> 'tracker_status')), created_at desc);
