-- Phase B: Durable Agentic Foundation.
-- Introduces Duo Projects, Task Graphs, Traceability, and Agentic Credits.

-- 1. Duo Projects: The grouping container for durable goals
create table if not exists public.duo_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  trace_id uuid not null default gen_random_uuid(),
  title text not null,
  domain text not null,
  status text not null default 'planning'
    check (status in ('planning', 'working', 'paused', 'blocked', 'done', 'failed')),
  success_criteria text[] default '{}',
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.duo_projects enable row level security;

create policy "Users manage own duo projects"
  on public.duo_projects for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 2. Duo Tasks: Individual steps in a task graph (DAG)
create table if not exists public.duo_tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.duo_projects(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  trace_id uuid not null,
  title text not null,
  description text,
  status text not null default 'pending'
    check (status in ('pending', 'running', 'completed', 'failed', 'skipped', 'blocked')),
  route_preference text[], -- e.g. ['api', 'mcp', 'browser']
  assigned_route text,      -- chosen by decision router
  dependencies uuid[] default '{}', -- IDs of other duo_tasks
  approval_required boolean default false,
  evidence jsonb default '{}', -- screenshots, raw logs, tool output
  result text,
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.duo_tasks enable row level security;

create policy "Users manage own duo tasks"
  on public.duo_tasks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 3. Duo Timeline Events: Audit trail for project progress
create table if not exists public.duo_timeline_events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.duo_projects(id) on delete cascade,
  trace_id uuid not null,
  event_type text not null, -- 'task_start', 'tool_call', 'approval_request', 'status_change'
  message text not null,
  payload jsonb default '{}',
  created_at timestamptz default now()
);

alter table public.duo_timeline_events enable row level security;

create policy "Users read own duo timeline"
  on public.duo_timeline_events for select
  using (exists (
    select 1 from public.duo_projects where id = project_id and user_id = auth.uid()
  ));

-- 4. Agentic Credits (Fair-Use Implementation)
create table if not exists public.agent_credits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance numeric(10,2) default 0,
  last_topup_at timestamptz,
  updated_at timestamptz default now()
);

alter table public.agent_credits enable row level security;

create policy "Users read own credits"
  on public.agent_credits for select
  using (auth.uid() = user_id);

create table if not exists public.credit_usage_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  trace_id uuid,
  amount numeric(10,2) not null,
  reason text not null, -- 'llm_call', 'browserbase_session', 'task_execution'
  created_at timestamptz default now()
);

alter table public.credit_usage_log enable row level security;

create policy "Users read own usage log"
  on public.credit_usage_log for select
  using (auth.uid() = user_id);

-- 5. Tracing Integration: Adding trace_id to existing audit tables
alter table public.action_approvals add column if not exists trace_id uuid;
alter table public.action_audit_logs add column if not exists trace_id uuid;
alter table public.api_usage_events add column if not exists trace_id uuid;

-- 6. Indexes for Phase B
create index if not exists duo_tasks_project_idx on public.duo_tasks(project_id, status);
create index if not exists duo_tasks_trace_idx on public.duo_tasks(trace_id);
create index if not exists duo_timeline_project_idx on public.duo_timeline_events(project_id, created_at desc);
create index if not exists action_approvals_trace_idx on public.action_approvals(trace_id);
create index if not exists action_audit_logs_trace_idx on public.action_audit_logs(trace_id);
create index if not exists api_usage_events_trace_idx on public.api_usage_events(trace_id);
