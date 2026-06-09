create extension if not exists "pgcrypto";

alter table if exists public.action_approvals
  add column if not exists browser_session_id uuid;

alter table if exists public.action_approvals
  add column if not exists requires_user_confirmation boolean not null default false;

alter table if exists public.action_approvals
  add column if not exists user_confirmation_state text not null default 'not_required';

alter table if exists public.action_approvals
  add column if not exists warning_message text;

create index if not exists action_approvals_browser_session_id_idx
  on public.action_approvals(browser_session_id);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'action_approvals_user_confirmation_state_check'
      and conrelid = 'public.action_approvals'::regclass
  ) then
    alter table public.action_approvals
      add constraint action_approvals_user_confirmation_state_check
      check (user_confirmation_state in ('not_required', 'pending', 'confirmed'));
  end if;
end $$;

alter table if exists public.action_audit_logs
  add column if not exists accessibility_tree_snapshot jsonb;

alter table if exists public.action_audit_logs
  add column if not exists block_reason text;

alter table if exists public.action_audit_logs
  add column if not exists screenshot_url text;

alter table if exists public.browser_sessions
  add column if not exists session_mode text not null default 'disposable';

alter table if exists public.browser_sessions
  add column if not exists last_active_at timestamptz not null default now();

alter table if exists public.browser_sessions
  add column if not exists expired_at timestamptz;

alter table if exists public.browser_sessions
  add column if not exists provider_session_id text;

create index if not exists browser_sessions_last_active_at_idx
  on public.browser_sessions(last_active_at);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'browser_sessions_session_mode_check'
      and conrelid = 'public.browser_sessions'::regclass
  ) then
    alter table public.browser_sessions
      add constraint browser_sessions_session_mode_check
      check (session_mode in ('disposable', 'persistent'));
  end if;
end $$;

alter table if exists public.browser_sessions enable row level security;

drop policy if exists "browser_sessions_insert_own" on public.browser_sessions;
drop policy if exists "browser_sessions_update_own" on public.browser_sessions;
drop policy if exists "browser_sessions_delete_own" on public.browser_sessions;

drop policy if exists "browser_sessions_select_own" on public.browser_sessions;
create policy "browser_sessions_select_own"
on public.browser_sessions
for select
using (auth.uid() = user_id);

