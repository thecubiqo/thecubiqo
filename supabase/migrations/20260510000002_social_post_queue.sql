-- V2 social_post_queue workflow state for cq.ai.
-- Browser automation can compose a post and capture a preview receipt, but the
-- final publish remains a separate explicit user action.

create extension if not exists "pgcrypto";

create table if not exists public.social_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  browser_session_id text,
  platform text not null
    check (platform in ('linkedin', 'twitter', 'x', 'instagram', 'threads')),
  content text not null,
  media_urls text[],
  status text not null default 'draft'
    check (status in ('draft', 'ready', 'published', 'failed', 'cancelled')),
  approval_id uuid references public.action_approvals(id) on delete set null,
  preview_screenshot_url text,
  published_url text,
  accessibility_tree_snapshot jsonb,
  error text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  cancelled_at timestamptz,
  constraint social_posts_content_not_blank check (length(trim(content)) > 0)
);

create index if not exists idx_social_posts_user_created
  on public.social_posts(user_id, created_at desc);

create index if not exists idx_social_posts_user_status
  on public.social_posts(user_id, status, created_at desc);

create index if not exists idx_social_posts_browser_session
  on public.social_posts(browser_session_id);

drop trigger if exists set_social_posts_updated_at on public.social_posts;
create trigger set_social_posts_updated_at
before update on public.social_posts
for each row execute function public.set_updated_at();

alter table public.social_posts enable row level security;

drop policy if exists "social_posts_select_own" on public.social_posts;
create policy "social_posts_select_own"
on public.social_posts for select
using (auth.uid() = user_id);

drop policy if exists "social_posts_insert_own" on public.social_posts;
drop policy if exists "social_posts_update_own" on public.social_posts;
drop policy if exists "social_posts_delete_own" on public.social_posts;

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
        and action_type in ('browser_open', 'job_apply', 'social_post_queue')
      )
    )
  limit 1;

  if matching_approval.id is null then
    raise exception 'approved % approval is required', expected_action_type;
  end if;

  return new;
end;
$$;
