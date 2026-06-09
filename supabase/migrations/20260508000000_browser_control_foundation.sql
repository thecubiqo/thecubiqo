-- V2 browser-control foundation for cq.ai.
-- This adds the isolated session container and browser_session_id audit metadata.
-- It does not enable hidden browser automation, job applications, posting, buying, or credential entry.

create extension if not exists pgcrypto;

alter table public.action_audit_logs
  add column if not exists browser_session_id uuid;

create table if not exists public.browser_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  approval_id uuid references public.action_approvals(id) on delete set null,
  status text not null default 'active'
    check (status in ('active', 'closing', 'closed', 'cancelled', 'failed')),
  target_url text not null,
  current_url text not null,
  allowed_origin text not null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  last_activity_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint browser_sessions_target_url_not_blank check (length(trim(target_url)) > 0),
  constraint browser_sessions_current_url_not_blank check (length(trim(current_url)) > 0),
  constraint browser_sessions_allowed_origin_not_blank check (length(trim(allowed_origin)) > 0)
);

alter table public.action_audit_logs
  drop constraint if exists action_audit_logs_browser_session_fk;

alter table public.action_audit_logs
  add constraint action_audit_logs_browser_session_fk
  foreign key (browser_session_id)
  references public.browser_sessions(id)
  on delete set null;

create index if not exists idx_browser_sessions_user_status
  on public.browser_sessions(user_id, status, created_at desc);

create index if not exists idx_action_audit_logs_browser_session
  on public.action_audit_logs(browser_session_id, created_at desc);

drop trigger if exists set_browser_sessions_updated_at on public.browser_sessions;
create trigger set_browser_sessions_updated_at
before update on public.browser_sessions
for each row execute function public.set_updated_at();

drop trigger if exists require_browser_sessions_approval on public.browser_sessions;
create trigger require_browser_sessions_approval
before insert on public.browser_sessions
for each row execute function public.require_v2_approved_action('browser_open');

create or replace function public.audit_action_approval_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.action_audit_logs (
      user_id,
      approval_id,
      browser_session_id,
      action_type,
      tool_name,
      status,
      message,
      input,
      result
    )
    values (
      new.user_id,
      new.id,
      nullif(new.payload->>'browser_session_id', '')::uuid,
      new.action_type,
      new.tool_name,
      'requested',
      'Approval requested',
      jsonb_build_object('title', new.title, 'risk_level', new.risk_level),
      '{}'::jsonb
    );
    return new;
  end if;

  if tg_op = 'UPDATE' and old.status is distinct from new.status then
    insert into public.action_audit_logs (
      user_id,
      approval_id,
      browser_session_id,
      action_type,
      tool_name,
      status,
      message,
      input,
      result
    )
    values (
      new.user_id,
      new.id,
      nullif(new.payload->>'browser_session_id', '')::uuid,
      new.action_type,
      new.tool_name,
      case
        when new.status in ('approved','denied','cancelled','completed','failed') then new.status
        else 'blocked'
      end,
      'Approval status changed to ' || new.status,
      jsonb_build_object('previous_status', old.status),
      jsonb_build_object('status', new.status)
    );
    return new;
  end if;

  return new;
end;
$$;

alter table public.browser_sessions enable row level security;

drop policy if exists "browser_sessions_select_own" on public.browser_sessions;
create policy "browser_sessions_select_own"
on public.browser_sessions for select
using (auth.uid() = user_id);

drop policy if exists "browser_sessions_insert_own" on public.browser_sessions;
drop policy if exists "browser_sessions_update_own" on public.browser_sessions;

-- Browser sessions are user-visible but server-controlled.
-- The app API uses the service role after checking a signed-in user, approval id,
-- action type, and browser_control capability. Direct client inserts/updates would
-- bypass the /api/actions/execute boundary, so no insert/update RLS policy is defined.
