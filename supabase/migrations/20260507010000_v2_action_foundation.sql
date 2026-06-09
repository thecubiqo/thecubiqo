-- V2 approved-action foundation for cq.ai.
-- This migration adds user-owned approval, audit, task, and report state.
-- It does not enable browser control, external posting, payments, or deploy actions.

create extension if not exists pgcrypto;

create table if not exists public.action_approvals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  action_type text not null,
  tool_name text not null,
  status text not null default 'requested'
    check (status in ('requested', 'approved', 'denied', 'cancelled', 'expired', 'completed', 'failed')),
  title text not null,
  summary text not null,
  payload jsonb not null default '{}'::jsonb,
  risk_level text not null default 'low'
    check (risk_level in ('low', 'medium', 'high')),
  expires_at timestamptz not null default (now() + interval '30 minutes'),
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint action_approvals_action_type_not_blank check (length(trim(action_type)) > 0),
  constraint action_approvals_tool_name_not_blank check (length(trim(tool_name)) > 0),
  constraint action_approvals_title_not_blank check (length(trim(title)) > 0),
  constraint action_approvals_summary_not_blank check (length(trim(summary)) > 0)
);

create table if not exists public.action_audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  approval_id uuid references public.action_approvals(id) on delete set null,
  action_type text not null,
  tool_name text not null,
  status text not null
    check (status in ('requested', 'approved', 'denied', 'cancelled', 'blocked', 'completed', 'failed')),
  message text not null,
  input jsonb not null default '{}'::jsonb,
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint action_audit_logs_action_type_not_blank check (length(trim(action_type)) > 0),
  constraint action_audit_logs_tool_name_not_blank check (length(trim(tool_name)) > 0),
  constraint action_audit_logs_message_not_blank check (length(trim(message)) > 0)
);

create table if not exists public.user_tool_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tool_name text not null,
  enabled boolean not null default false,
  action_types text[] not null default '{}'::text[],
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_tool_settings_tool_name_not_blank check (length(trim(tool_name)) > 0),
  constraint user_tool_settings_unique_tool unique (user_id, tool_name)
);

create table if not exists public.user_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  approval_id uuid references public.action_approvals(id) on delete set null,
  title text not null,
  notes text,
  status text not null default 'open'
    check (status in ('open', 'in_progress', 'done', 'cancelled')),
  due_at timestamptz,
  source text not null default 'cubiqo_v2',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_tasks_title_not_blank check (length(trim(title)) > 0)
);

create table if not exists public.report_schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  approval_id uuid references public.action_approvals(id) on delete set null,
  name text not null,
  cadence text not null default 'daily'
    check (cadence in ('daily', 'weekly')),
  delivery_method text not null default 'in_app'
    check (delivery_method in ('in_app')),
  status text not null default 'active'
    check (status in ('active', 'paused', 'cancelled')),
  timezone text not null default 'America/New_York',
  next_run_at timestamptz,
  summary_scope text[] not null default array['journal','signals','tasks']::text[],
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint report_schedules_name_not_blank check (length(trim(name)) > 0)
);

create table if not exists public.daily_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  approval_id uuid references public.action_approvals(id) on delete set null,
  schedule_id uuid references public.report_schedules(id) on delete set null,
  title text not null default 'Daily CubiQo Report',
  content text not null,
  status text not null default 'ready'
    check (status in ('draft', 'ready', 'sent_in_app', 'failed')),
  period_start timestamptz,
  period_end timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint daily_reports_content_not_blank check (length(trim(content)) > 0)
);

create index if not exists idx_action_approvals_user_created
  on public.action_approvals(user_id, created_at desc);

create index if not exists idx_action_approvals_user_status
  on public.action_approvals(user_id, status, created_at desc);

create index if not exists idx_action_audit_logs_user_created
  on public.action_audit_logs(user_id, created_at desc);

create index if not exists idx_user_tasks_user_status
  on public.user_tasks(user_id, status, created_at desc);

create index if not exists idx_report_schedules_user_status
  on public.report_schedules(user_id, status, created_at desc);

create index if not exists idx_daily_reports_user_created
  on public.daily_reports(user_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_action_approvals_updated_at on public.action_approvals;
create trigger set_action_approvals_updated_at
before update on public.action_approvals
for each row execute function public.set_updated_at();

drop trigger if exists set_user_tool_settings_updated_at on public.user_tool_settings;
create trigger set_user_tool_settings_updated_at
before update on public.user_tool_settings
for each row execute function public.set_updated_at();

drop trigger if exists set_user_tasks_updated_at on public.user_tasks;
create trigger set_user_tasks_updated_at
before update on public.user_tasks
for each row execute function public.set_updated_at();

drop trigger if exists set_report_schedules_updated_at on public.report_schedules;
create trigger set_report_schedules_updated_at
before update on public.report_schedules
for each row execute function public.set_updated_at();

drop trigger if exists set_daily_reports_updated_at on public.daily_reports;
create trigger set_daily_reports_updated_at
before update on public.daily_reports
for each row execute function public.set_updated_at();

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
    )
  limit 1;

  if matching_approval.id is null then
    raise exception 'approved % approval is required', expected_action_type;
  end if;

  return new;
end;
$$;

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

drop trigger if exists audit_action_approval_insert on public.action_approvals;
create trigger audit_action_approval_insert
after insert on public.action_approvals
for each row execute function public.audit_action_approval_change();

drop trigger if exists audit_action_approval_update on public.action_approvals;
create trigger audit_action_approval_update
after update of status on public.action_approvals
for each row execute function public.audit_action_approval_change();

drop trigger if exists require_user_tasks_approval on public.user_tasks;
create trigger require_user_tasks_approval
before insert on public.user_tasks
for each row execute function public.require_v2_approved_action('task_write');

drop trigger if exists require_report_schedules_approval on public.report_schedules;
create trigger require_report_schedules_approval
before insert on public.report_schedules
for each row execute function public.require_v2_approved_action('cron_schedule_create');

drop trigger if exists require_daily_reports_approval on public.daily_reports;
create trigger require_daily_reports_approval
before insert on public.daily_reports
for each row execute function public.require_v2_approved_action('self_report_create');

alter table public.action_approvals enable row level security;
alter table public.action_audit_logs enable row level security;
alter table public.user_tool_settings enable row level security;
alter table public.user_tasks enable row level security;
alter table public.report_schedules enable row level security;
alter table public.daily_reports enable row level security;

drop policy if exists "action_approvals_select_own" on public.action_approvals;
create policy "action_approvals_select_own"
on public.action_approvals for select
using (auth.uid() = user_id);

drop policy if exists "action_approvals_insert_own" on public.action_approvals;
create policy "action_approvals_insert_own"
on public.action_approvals for insert
with check (auth.uid() = user_id);

drop policy if exists "action_approvals_update_own" on public.action_approvals;
create policy "action_approvals_update_own"
on public.action_approvals for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "action_audit_logs_select_own" on public.action_audit_logs;
create policy "action_audit_logs_select_own"
on public.action_audit_logs for select
using (auth.uid() = user_id);

drop policy if exists "action_audit_logs_insert_own" on public.action_audit_logs;

drop policy if exists "user_tool_settings_select_own" on public.user_tool_settings;
create policy "user_tool_settings_select_own"
on public.user_tool_settings for select
using (auth.uid() = user_id);

drop policy if exists "user_tool_settings_insert_own" on public.user_tool_settings;
create policy "user_tool_settings_insert_own"
on public.user_tool_settings for insert
with check (auth.uid() = user_id);

drop policy if exists "user_tool_settings_update_own" on public.user_tool_settings;
create policy "user_tool_settings_update_own"
on public.user_tool_settings for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "user_tasks_select_own" on public.user_tasks;
create policy "user_tasks_select_own"
on public.user_tasks for select
using (auth.uid() = user_id);

drop policy if exists "user_tasks_insert_own" on public.user_tasks;
create policy "user_tasks_insert_own"
on public.user_tasks for insert
with check (auth.uid() = user_id);

drop policy if exists "user_tasks_update_own" on public.user_tasks;
create policy "user_tasks_update_own"
on public.user_tasks for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "report_schedules_select_own" on public.report_schedules;
create policy "report_schedules_select_own"
on public.report_schedules for select
using (auth.uid() = user_id);

drop policy if exists "report_schedules_insert_own" on public.report_schedules;
create policy "report_schedules_insert_own"
on public.report_schedules for insert
with check (auth.uid() = user_id);

drop policy if exists "report_schedules_update_own" on public.report_schedules;
create policy "report_schedules_update_own"
on public.report_schedules for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "daily_reports_select_own" on public.daily_reports;
create policy "daily_reports_select_own"
on public.daily_reports for select
using (auth.uid() = user_id);

drop policy if exists "daily_reports_insert_own" on public.daily_reports;
create policy "daily_reports_insert_own"
on public.daily_reports for insert
with check (auth.uid() = user_id);

drop policy if exists "daily_reports_update_own" on public.daily_reports;
create policy "daily_reports_update_own"
on public.daily_reports for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
