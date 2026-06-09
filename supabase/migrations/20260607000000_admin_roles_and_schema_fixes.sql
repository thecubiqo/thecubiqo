-- ============================================================
-- Migration: Admin roles table + schema fixes for approvals
-- ============================================================

-- 1. admin_roles table (blocks ALL admin auth without this)
create table if not exists public.admin_roles (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  role         text not null check (role in ('owner', 'admin', 'viewer')),
  granted_by   uuid references auth.users(id),
  granted_at   timestamptz not null default now(),
  revoked_at   timestamptz,
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create unique index if not exists admin_roles_user_role_active_idx
  on public.admin_roles (user_id, role)
  where revoked_at is null;

alter table public.admin_roles enable row level security;

-- Only admins can see admin_roles (service role bypasses RLS)
drop policy if exists "admin_roles: service role only" on public.admin_roles;
create policy "admin_roles: service role only"
  on public.admin_roles
  for all
  to authenticated
  using (false);

-- 2. duo_approvals: add reversible_window_seconds column (queried but missing)
alter table public.duo_approvals
  add column if not exists reversible_window_seconds integer not null default 0;

-- 3. duo_approvals: add on_reject_note column alias
--    The route selects 'on_reject_note' but DB has 'rejection_note'.
--    Add on_reject_note as the canonical column; keep rejection_note for backward compat.
alter table public.duo_approvals
  add column if not exists on_reject_note text;

-- Back-fill: copy existing rejection_note → on_reject_note
update public.duo_approvals
  set on_reject_note = rejection_note
  where rejection_note is not null and on_reject_note is null;

-- 4. memory_events: add 'crisis_signal' to the event_type constraint
--    (crisis_followup proactive trigger depends on this)
alter table public.memory_events
  drop constraint if exists memory_events_event_type_check;

alter table public.memory_events
  add constraint memory_events_event_type_check
  check (event_type in (
    'session_summary', 'goal_update', 'commitment', 'blocker',
    'outcome', 'episode', 'journal_insight', 'preference',
    'profile_correction', 'crisis_signal'
  ));

-- 5. self_heal_proposals: add if not yet created
create table if not exists public.self_heal_proposals (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references auth.users(id) on delete set null,
  source_job_run_id   uuid references public.job_runs(id) on delete set null,
  state               text not null default 'pending_approval'
                        check (state in ('pending_approval', 'approved', 'rejected', 'applied', 'abandoned')),
  title               text not null,
  summary             text,
  changed_files       text[] not null default '{}',
  test_plan           text[] not null default '{}',
  patch_diff          text,
  deployment_id       text,
  github_issue_url    text,
  severity            text not null default 'medium'
                        check (severity in ('critical', 'high', 'medium', 'low', 'none')),
  metadata            jsonb not null default '{}',
  decided_at          timestamptz,
  decided_by          uuid references auth.users(id),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

alter table public.self_heal_proposals enable row level security;

drop policy if exists "self_heal_proposals: admins read/write" on public.self_heal_proposals;
create policy "self_heal_proposals: admins read/write"
  on public.self_heal_proposals
  for all
  to authenticated
  using (
    exists (
      select 1 from public.admin_roles ar
      where ar.user_id = auth.uid()
        and ar.role in ('owner', 'admin')
        and ar.revoked_at is null
    )
  );

create index if not exists self_heal_proposals_state_idx
  on public.self_heal_proposals (state, created_at desc);
