-- ============================================================
-- Migration 8: Platform Architecture - Surface Sessions
-- 2026-05-16
-- ============================================================

-- SURFACE SESSIONS: live registry of every connected surface.
-- Upserted by each surface on every heartbeat. Surfaces offline > 60s
-- are excluded from routing in application code.
create table if not exists public.surface_sessions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references auth.users(id) on delete cascade not null,
  surface_type     text not null
    check (surface_type in ('web', 'desktop', 'mobile', 'extension', 'cloud_browser')),
  session_id       text not null,
  device_id        text,
  capabilities     jsonb not null default '{}',
  ollama_models    jsonb,
  last_heartbeat   timestamptz not null default now(),
  last_seen        timestamptz not null default now(),
  is_online        boolean not null default true,
  app_version      text,
  os_platform      text
    check (os_platform in ('macos', 'windows', 'linux', 'ios', 'android', 'web', null)),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (user_id, surface_type)
);

create index if not exists surface_sessions_user_online_idx
  on public.surface_sessions(user_id, is_online, last_heartbeat desc);

create index if not exists surface_sessions_session_id_idx
  on public.surface_sessions(session_id);

alter table public.surface_sessions enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'surface_sessions'
      and policyname = 'Users manage own surface sessions'
  ) then
    execute 'create policy "Users manage own surface sessions" on public.surface_sessions for all using (user_id = auth.uid()) with check (user_id = auth.uid())';
  end if;
end $$;

-- duo_tasks: add surface routing columns if Phase B DDL did not.
alter table public.duo_tasks
  add column if not exists assigned_surface text,
  add column if not exists requires_capabilities text[] default '{}',
  add column if not exists user_constraint text;

-- duo_projects: project-level surface/user constraints.
alter table public.duo_projects
  add column if not exists user_constraints jsonb default '{}';

-- user_ai_profile: global user-level constraints.
alter table public.user_ai_profile
  add column if not exists global_constraints jsonb default '{}';

-- duo_artifacts compatibility for cross-surface handoffs.
-- The existing Phase B schema uses artifact_type/title/content text. These
-- columns let the Surface Router read/write handoff records without breaking
-- existing artifact consumers.
alter table public.duo_artifacts
  add column if not exists type text,
  add column if not exists produced_by text,
  add column if not exists consumed_by text[] default '{}',
  add column if not exists expires_at timestamptz,
  add column if not exists consumed_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'duo_artifacts_surface_type_check'
      and conrelid = 'public.duo_artifacts'::regclass
  ) then
    alter table public.duo_artifacts
      add constraint duo_artifacts_surface_type_check
      check (type is null or type in ('file', 'text', 'json', 'image', 'url', 'handoff'));
  end if;
end $$;

create index if not exists duo_artifacts_handoff_idx
  on public.duo_artifacts(type, expires_at)
  where type = 'handoff';

create index if not exists duo_artifacts_handoff_consumed_idx
  on public.duo_artifacts(consumed_at)
  where type = 'handoff';
