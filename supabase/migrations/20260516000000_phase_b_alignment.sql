-- Phase B alignment: non-destructive compatibility schema.
-- Keeps existing tables intact while adding the canonical Phase B surfaces.

create extension if not exists pgcrypto;

-- Canonical queue names from the Phase B master spec.
alter table public.agent_job_queue
  add column if not exists state text default 'queued',
  add column if not exists locked_at timestamptz;

update public.agent_job_queue
set state = coalesce(state, status, 'queued')
where state is null;

create index if not exists agent_job_queue_state_idx
  on public.agent_job_queue(state, run_after);

-- Canonical tool-call evidence table. Existing duo_tool_calls is preserved.
create table if not exists public.agent_tool_calls (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  project_id uuid references public.duo_projects(id) on delete cascade,
  task_id uuid references public.duo_tasks(id) on delete set null,
  trace_id uuid,
  tool_name text not null,
  route_used text,
  attempt_number int default 1,
  status text not null default 'started'
    check (status in ('started','completed','failed','blocked','skipped')),
  input jsonb default '{}',
  output jsonb default '{}',
  failure_reason text,
  fallback_tool text,
  evidence jsonb default '{}',
  api_cost_gbp numeric default 0,
  started_at timestamptz default now(),
  completed_at timestamptz,
  created_at timestamptz default now()
);

alter table public.agent_tool_calls enable row level security;

drop policy if exists "Users read own agent tool calls" on public.agent_tool_calls;
create policy "Users read own agent tool calls" on public.agent_tool_calls for select
  using (auth.uid() = user_id);

create index if not exists agent_tool_calls_trace_idx
  on public.agent_tool_calls(trace_id, created_at desc);
create index if not exists agent_tool_calls_task_route_status_idx
  on public.agent_tool_calls(task_id, route_used, status);

-- Missing Phase B planning/coordination tables.
create table if not exists public.duo_questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  project_id uuid references public.duo_projects(id) on delete cascade not null,
  task_id uuid references public.duo_tasks(id) on delete set null,
  trace_id uuid,
  question text not null,
  reason text,
  status text default 'open' check (status in ('open','answered','dismissed')),
  answer text,
  answered_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.duo_blockers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  project_id uuid references public.duo_projects(id) on delete cascade not null,
  task_id uuid references public.duo_tasks(id) on delete set null,
  trace_id uuid,
  blocker_type text default 'unknown',
  description text not null,
  severity text default 'medium' check (severity in ('low','medium','high','critical')),
  status text default 'open' check (status in ('open','resolved','ignored')),
  resolution text,
  resolved_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.duo_access_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  project_id uuid references public.duo_projects(id) on delete cascade,
  task_id uuid references public.duo_tasks(id) on delete set null,
  trace_id uuid,
  platform text not null,
  requested_scope text[] default '{}',
  reason text,
  status text default 'requested' check (status in ('requested','granted','denied','expired')),
  expires_at timestamptz default (now() + interval '24 hours'),
  decided_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.duo_questions enable row level security;
alter table public.duo_blockers enable row level security;
alter table public.duo_access_requests enable row level security;

drop policy if exists "Users manage own duo questions" on public.duo_questions;
create policy "Users manage own duo questions" on public.duo_questions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage own duo blockers" on public.duo_blockers;
create policy "Users manage own duo blockers" on public.duo_blockers for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage own duo access requests" on public.duo_access_requests;
create policy "Users manage own duo access requests" on public.duo_access_requests for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists duo_questions_project_status_idx on public.duo_questions(project_id, status, created_at desc);
create index if not exists duo_blockers_project_status_idx on public.duo_blockers(project_id, status, created_at desc);
create index if not exists duo_access_requests_user_status_idx on public.duo_access_requests(user_id, status, created_at desc);

-- Connector secrets are service-role only. Do not expose token material via RLS.
alter table public.connector_secrets
  add column if not exists access_token_plaintext text,
  add column if not exists refresh_token_plaintext text,
  add column if not exists token_expires_at timestamptz;

drop policy if exists "Users read own connector secret refs" on public.connector_secrets;

