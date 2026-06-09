-- V2 job_apply workflow state for cq.ai.
-- The browser automation can prepare an application and stop at review, but the
-- final submit remains a separate explicit user action.

create extension if not exists "pgcrypto";

create table if not exists public.job_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  browser_session_id text not null,
  platform text not null
    check (platform in ('linkedin', 'indeed', 'dice', 'greenhouse', 'lever')),
  job_url text not null,
  job_title text,
  company text,
  status text not null default 'pending'
    check (status in ('pending', 'in_progress', 'ready_to_submit', 'submitted', 'failed', 'cancelled')),
  approval_id uuid references public.action_approvals(id) on delete set null,
  screenshot_url text,
  accessibility_tree_snapshot jsonb,
  error text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  submitted_at timestamptz,
  cancelled_at timestamptz,
  constraint job_applications_job_url_not_blank check (length(trim(job_url)) > 0),
  constraint job_applications_browser_session_not_blank check (length(trim(browser_session_id)) > 0)
);

create index if not exists idx_job_applications_user_created
  on public.job_applications(user_id, created_at desc);

create index if not exists idx_job_applications_user_status
  on public.job_applications(user_id, status, created_at desc);

create index if not exists idx_job_applications_browser_session
  on public.job_applications(browser_session_id);

drop trigger if exists set_job_applications_updated_at on public.job_applications;
create trigger set_job_applications_updated_at
before update on public.job_applications
for each row execute function public.set_updated_at();

alter table public.job_applications enable row level security;

drop policy if exists "job_applications_select_own" on public.job_applications;
create policy "job_applications_select_own"
on public.job_applications for select
using (auth.uid() = user_id);

drop policy if exists "job_applications_insert_own" on public.job_applications;
drop policy if exists "job_applications_update_own" on public.job_applications;
drop policy if exists "job_applications_delete_own" on public.job_applications;

-- Direct browser/client writes intentionally remain denied.
-- Server routes write with the service role only after approval, session, and
-- platform-gate checks pass.

create or replace function public.require_v2_approved_action()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  matching_approval public.action_approvals%rowtype;
  expected_action_type text := tg_argv[0];
begin
  if new.approval_id is null then
    raise exception 'approval_id is required for %', expected_action_type;
  end if;

  select *
  into matching_approval
  from public.action_approvals
  where id = new.approval_id
    and user_id = new.user_id
    and status = 'approved'
    and expires_at > now()
    and (
      action_type = expected_action_type
      or (
        tg_table_name = 'daily_reports'
        and action_type in ('self_report_create', 'daily_report_send')
      )
      or (
        tg_table_name = 'browser_sessions'
        and expected_action_type = 'browser_open'
        and action_type in ('browser_open', 'job_apply')
      )
    )
  limit 1;

  if matching_approval.id is null then
    raise exception 'approved % approval is required', expected_action_type;
  end if;

  return new;
end;
$$;
