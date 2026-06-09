-- Phase B canonical agentic core.
-- Reconciles the earlier prototype duo_* tables with the Phase B operator spec.

create extension if not exists vector;

-- ─────────────────────────────────────────────────────────────────────────────
-- Existing table reconciliation
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.duo_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  trace_id uuid not null default gen_random_uuid(),
  title text,
  domain text,
  status text not null default 'planning',
  success_criteria text[] default '{}',
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.duo_projects drop constraint if exists duo_projects_status_check;
alter table public.duo_projects
  add column if not exists goal text,
  add column if not exists goal_interpretation jsonb default '{}',
  add column if not exists constraints jsonb default '{}',
  add column if not exists risk_level text default 'low',
  add column if not exists playbook_id uuid,
  add column if not exists workflow_run_id text,
  add column if not exists api_cost_gbp numeric default 0,
  add column if not exists budget_gate_gbp numeric default 5,
  add column if not exists verbosity text default 'normal',
  add column if not exists shot_reason text,
  add column if not exists shot_at timestamptz,
  add column if not exists completed_at timestamptz,
  add column if not exists closed_at timestamptz;

alter table public.duo_projects
  add constraint duo_projects_status_check
  check (status in ('planning', 'working', 'paused', 'blocked', 'waiting_user', 'waiting_approval', 'done', 'failed', 'shot'));

create table if not exists public.duo_tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.duo_projects(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  trace_id uuid not null,
  title text not null,
  description text,
  status text not null default 'pending',
  route_preference text[],
  assigned_route text,
  dependencies uuid[] default '{}',
  approval_required boolean default false,
  evidence jsonb default '{}',
  result text,
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.duo_tasks drop constraint if exists duo_tasks_status_check;
alter table public.duo_tasks
  add column if not exists selected_route text,
  add column if not exists fallback_route text,
  add column if not exists connector_platform text,
  add column if not exists risk_level text default 'low',
  add column if not exists idempotency_key text,
  add column if not exists can_parallelize boolean default false,
  add column if not exists attempts int default 0,
  add column if not exists max_attempts int default 3,
  add column if not exists last_error text,
  add column if not exists completed_at timestamptz,
  add column if not exists preferred_route text;

alter table public.duo_tasks
  add constraint duo_tasks_status_check
  check (status in ('pending', 'ready', 'running', 'waiting_user', 'waiting_approval', 'completed', 'failed', 'skipped', 'blocked'));

create table if not exists public.duo_timeline_events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.duo_projects(id) on delete cascade,
  trace_id uuid not null,
  event_type text not null,
  message text,
  payload jsonb default '{}',
  created_at timestamptz default now()
);

alter table public.duo_timeline_events
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists task_id uuid references public.duo_tasks(id) on delete set null,
  add column if not exists description text,
  add column if not exists metadata jsonb default '{}',
  add column if not exists api_cost_gbp numeric default 0;

-- Existing Phase A tables used by Phase B tracing/costs.
alter table if exists public.action_approvals
  add column if not exists trace_id uuid,
  add column if not exists project_id uuid references public.duo_projects(id) on delete set null,
  add column if not exists task_id uuid references public.duo_tasks(id) on delete set null;

alter table if exists public.action_audit_logs
  add column if not exists trace_id uuid,
  add column if not exists project_id uuid references public.duo_projects(id) on delete set null,
  add column if not exists task_id uuid references public.duo_tasks(id) on delete set null;

alter table if exists public.api_usage_events
  add column if not exists trace_id uuid,
  add column if not exists project_id uuid references public.duo_projects(id) on delete set null,
  add column if not exists task_id uuid references public.duo_tasks(id) on delete set null,
  add column if not exists cost_gbp numeric default 0;

alter table if exists public.memory_events
  add column if not exists metadata jsonb default '{}',
  add column if not exists confidence numeric default 1,
  add column if not exists source text default 'cubiqo',
  add column if not exists user_confirmed boolean default false;

alter table if exists public.signals
  add column if not exists capsule_status text default 'draft',
  add column if not exists classification_metadata jsonb default '{}';

-- ─────────────────────────────────────────────────────────────────────────────
-- Core task graph, approvals, evidence, streaming, outcomes
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.duo_task_edges (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.duo_projects(id) on delete cascade not null,
  from_task_id uuid references public.duo_tasks(id) on delete cascade not null,
  to_task_id uuid references public.duo_tasks(id) on delete cascade not null,
  edge_type text default 'blocks',
  created_at timestamptz default now(),
  unique(project_id, from_task_id, to_task_id)
);

alter table public.duo_task_edges
  add column if not exists project_id uuid references public.duo_projects(id) on delete cascade,
  add column if not exists from_task_id uuid references public.duo_tasks(id) on delete cascade,
  add column if not exists to_task_id uuid references public.duo_tasks(id) on delete cascade,
  add column if not exists edge_type text default 'blocks',
  add column if not exists created_at timestamptz default now();

create table if not exists public.duo_approvals (
  id uuid primary key default gen_random_uuid(),
  action_approval_id uuid references public.action_approvals(id) on delete set null,
  user_id uuid references auth.users(id) on delete cascade not null,
  project_id uuid references public.duo_projects(id) on delete cascade not null,
  task_id uuid references public.duo_tasks(id) on delete cascade,
  trace_id uuid not null,
  status text not null default 'requested' check (status in ('requested','approved','rejected','expired','completed','failed')),
  approval_type text not null default 'external_action',
  preview_content text not null,
  platform text,
  endpoint text,
  recipient text,
  risk_level text default 'medium',
  reversible boolean default false,
  warning_message text,
  rejection_note text,
  expires_at timestamptz default (now() + interval '24 hours'),
  decided_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.duo_artifacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  project_id uuid references public.duo_projects(id) on delete cascade not null,
  task_id uuid references public.duo_tasks(id) on delete set null,
  trace_id uuid not null,
  artifact_type text not null,
  title text not null,
  content text,
  storage_path text,
  mime_type text,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

alter table public.duo_artifacts
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists project_id uuid references public.duo_projects(id) on delete cascade,
  add column if not exists task_id uuid references public.duo_tasks(id) on delete set null,
  add column if not exists trace_id uuid,
  add column if not exists artifact_type text,
  add column if not exists title text,
  add column if not exists content text,
  add column if not exists storage_path text,
  add column if not exists mime_type text,
  add column if not exists metadata jsonb default '{}';

create table if not exists public.duo_external_refs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  project_id uuid references public.duo_projects(id) on delete cascade not null,
  task_id uuid references public.duo_tasks(id) on delete set null,
  trace_id uuid not null,
  ref_type text not null,
  platform text,
  external_id text,
  url text,
  title text,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

alter table public.duo_external_refs
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists project_id uuid references public.duo_projects(id) on delete cascade,
  add column if not exists task_id uuid references public.duo_tasks(id) on delete set null,
  add column if not exists trace_id uuid,
  add column if not exists ref_type text,
  add column if not exists platform text,
  add column if not exists external_id text,
  add column if not exists url text,
  add column if not exists title text,
  add column if not exists metadata jsonb default '{}';

create table if not exists public.duo_tool_calls (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  project_id uuid references public.duo_projects(id) on delete cascade,
  task_id uuid references public.duo_tasks(id) on delete set null,
  trace_id uuid not null,
  tool_name text not null,
  route text,
  status text not null default 'started' check (status in ('started','completed','failed','blocked','skipped')),
  input jsonb default '{}',
  output jsonb default '{}',
  error text,
  api_cost_gbp numeric default 0,
  started_at timestamptz default now(),
  completed_at timestamptz
);

alter table public.duo_tool_calls
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists project_id uuid references public.duo_projects(id) on delete cascade,
  add column if not exists task_id uuid references public.duo_tasks(id) on delete set null,
  add column if not exists trace_id uuid,
  add column if not exists tool_name text,
  add column if not exists route text,
  add column if not exists status text default 'started',
  add column if not exists input jsonb default '{}',
  add column if not exists output jsonb default '{}',
  add column if not exists error text,
  add column if not exists api_cost_gbp numeric default 0,
  add column if not exists started_at timestamptz default now(),
  add column if not exists completed_at timestamptz;

create table if not exists public.duo_dashboard_widgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  project_id uuid references public.duo_projects(id) on delete cascade not null,
  widget_type text not null,
  title text not null,
  data jsonb default '{}',
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.duo_dashboard_widgets
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists project_id uuid references public.duo_projects(id) on delete cascade,
  add column if not exists widget_type text,
  add column if not exists title text,
  add column if not exists data jsonb default '{}',
  add column if not exists sort_order int default 0,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

create table if not exists public.stream_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  project_id uuid references public.duo_projects(id) on delete cascade,
  task_id uuid references public.duo_tasks(id) on delete set null,
  trace_id uuid,
  event_type text not null,
  payload jsonb default '{}',
  created_at timestamptz default now()
);

alter table public.stream_events
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists project_id uuid references public.duo_projects(id) on delete cascade,
  add column if not exists task_id uuid references public.duo_tasks(id) on delete set null,
  add column if not exists trace_id uuid,
  add column if not exists event_type text,
  add column if not exists payload jsonb default '{}',
  add column if not exists created_at timestamptz default now();

create table if not exists public.duo_outcomes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  project_id uuid references public.duo_projects(id) on delete cascade not null,
  trace_id uuid not null,
  outcome text not null check (outcome in ('success','partial','failed','shot','abandoned')),
  summary text not null,
  evidence jsonb default '{}',
  memory_event_id uuid references public.memory_events(id) on delete set null,
  created_at timestamptz default now()
);

alter table public.duo_outcomes
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists project_id uuid references public.duo_projects(id) on delete cascade,
  add column if not exists trace_id uuid,
  add column if not exists outcome text,
  add column if not exists summary text,
  add column if not exists evidence jsonb default '{}',
  add column if not exists memory_event_id uuid references public.memory_events(id) on delete set null,
  add column if not exists created_at timestamptz default now();

-- ─────────────────────────────────────────────────────────────────────────────
-- Connectors, routing policy, playbooks
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.user_connectors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  platform text not null,
  status text not null default 'unavailable' check (status in ('available','unavailable','needs_auth','expired','revoked','error')),
  auth_type text default 'oauth',
  scopes text[] default '{}',
  metadata jsonb default '{}',
  last_checked_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, platform)
);

create table if not exists public.connector_secrets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  connector_id uuid references public.user_connectors(id) on delete cascade,
  platform text not null,
  secret_ref text not null,
  status text default 'active',
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.connector_secrets
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists connector_id uuid references public.user_connectors(id) on delete cascade,
  add column if not exists platform text,
  add column if not exists secret_ref text,
  add column if not exists status text default 'active',
  add column if not exists metadata jsonb default '{}',
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

create table if not exists public.tool_capabilities (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  tool_name text not null,
  route text not null,
  capability text not null,
  risk_level text default 'low',
  requires_approval boolean default false,
  available boolean default true,
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  unique(platform, tool_name, capability)
);

create table if not exists public.platform_automation_policy (
  platform text primary key,
  can_read boolean default true,
  can_draft boolean default true,
  can_write_with_approval boolean default false,
  can_final_submit boolean default false,
  prohibited_actions text[] default '{}',
  metadata jsonb default '{}',
  updated_at timestamptz default now()
);

alter table public.platform_automation_policy
  add column if not exists platform text,
  add column if not exists can_read boolean default true,
  add column if not exists can_draft boolean default true,
  add column if not exists can_write_with_approval boolean default false,
  add column if not exists can_final_submit boolean default false,
  add column if not exists prohibited_actions text[] default '{}',
  add column if not exists metadata jsonb default '{}',
  add column if not exists updated_at timestamptz default now();

create unique index if not exists platform_automation_policy_platform_uidx
  on public.platform_automation_policy(platform);

create table if not exists public.tool_candidates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  platform text not null,
  tool_name text,
  reason text,
  status text default 'candidate' check (status in ('candidate','approved','rejected','implemented')),
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.playbooks (
  id uuid primary key default gen_random_uuid(),
  domain text not null,
  name text not null,
  description text,
  trigger_keywords text[] default '{}',
  task_template jsonb default '{}',
  run_count int default 0,
  success_count int default 0,
  success_rate numeric default 0,
  active boolean default true,
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(domain, name)
);

alter table public.playbooks
  add column if not exists domain text,
  add column if not exists name text,
  add column if not exists description text,
  add column if not exists trigger_keywords text[] default '{}',
  add column if not exists task_template jsonb default '{}',
  add column if not exists run_count int default 0,
  add column if not exists success_count int default 0,
  add column if not exists success_rate numeric default 0,
  add column if not exists active boolean default true,
  add column if not exists metadata jsonb default '{}',
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

update public.playbooks
set name = coalesce(name, goal_pattern, domain || ' playbook'),
    description = coalesce(description, risk_notes::text),
    trigger_keywords = coalesce(trigger_keywords, string_to_array(coalesce(goal_pattern, domain, 'general'), ' ')),
    run_count = coalesce(run_count, use_count, 0)
where name is null;

create unique index if not exists playbooks_domain_name_uidx
  on public.playbooks(domain, name);

alter table public.playbooks
  alter column goal_pattern drop not null,
  alter column default_steps drop not null,
  alter column required_connectors drop not null,
  alter column risk_notes drop not null,
  alter column approval_gates drop not null,
  alter column research_required drop not null;

-- ─────────────────────────────────────────────────────────────────────────────
-- Durable runtime, budgets, locks, ops
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.agent_job_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  project_id uuid references public.duo_projects(id) on delete cascade,
  task_id uuid references public.duo_tasks(id) on delete cascade,
  trace_id uuid,
  job_type text not null,
  status text not null default 'queued' check (status in ('queued','running','completed','failed','dead','cancelled')),
  payload jsonb default '{}',
  idempotency_key text,
  run_after timestamptz default now(),
  attempts int default 0,
  max_attempts int default 3,
  last_error text,
  locked_by text,
  locked_until timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.agent_job_queue
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists project_id uuid references public.duo_projects(id) on delete cascade,
  add column if not exists task_id uuid references public.duo_tasks(id) on delete cascade,
  add column if not exists trace_id uuid,
  add column if not exists job_type text,
  add column if not exists status text,
  add column if not exists payload jsonb default '{}',
  add column if not exists idempotency_key text,
  add column if not exists run_after timestamptz default now(),
  add column if not exists attempts int default 0,
  add column if not exists max_attempts int default 3,
  add column if not exists last_error text,
  add column if not exists locked_by text,
  add column if not exists locked_until timestamptz,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

update public.agent_job_queue
set status = coalesce(status, state, 'queued')
where status is null;

create unique index if not exists agent_job_queue_idempotency_idx
  on public.agent_job_queue(idempotency_key)
  where idempotency_key is not null;

create table if not exists public.agent_worker_leases (
  id uuid primary key default gen_random_uuid(),
  worker_id text not null,
  job_id uuid references public.agent_job_queue(id) on delete cascade,
  lease_until timestamptz not null,
  heartbeat_at timestamptz default now(),
  created_at timestamptz default now()
);

alter table public.agent_worker_leases
  add column if not exists worker_id text,
  add column if not exists job_id uuid references public.agent_job_queue(id) on delete cascade,
  add column if not exists lease_until timestamptz,
  add column if not exists heartbeat_at timestamptz default now(),
  add column if not exists created_at timestamptz default now();

create table if not exists public.dead_letter_jobs (
  id uuid primary key default gen_random_uuid(),
  original_job_id uuid,
  user_id uuid,
  project_id uuid,
  task_id uuid,
  trace_id uuid,
  job_type text,
  payload jsonb default '{}',
  error text,
  attempts int,
  created_at timestamptz default now()
);

alter table public.dead_letter_jobs
  add column if not exists original_job_id uuid,
  add column if not exists user_id uuid,
  add column if not exists project_id uuid,
  add column if not exists task_id uuid,
  add column if not exists trace_id uuid,
  add column if not exists job_type text,
  add column if not exists payload jsonb default '{}',
  add column if not exists error text,
  add column if not exists attempts int,
  add column if not exists created_at timestamptz default now();

create table if not exists public.budget_policies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  scope text not null default 'user',
  daily_limit_gbp numeric default 5,
  project_limit_gbp numeric default 5,
  task_limit_gbp numeric default 1,
  hard_stop boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, scope)
);

alter table public.budget_policies
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists scope text default 'user',
  add column if not exists daily_limit_gbp numeric default 5,
  add column if not exists project_limit_gbp numeric default 5,
  add column if not exists task_limit_gbp numeric default 1,
  add column if not exists hard_stop boolean default true,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

create table if not exists public.budget_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  project_id uuid references public.duo_projects(id) on delete cascade,
  task_id uuid references public.duo_tasks(id) on delete set null,
  trace_id uuid,
  event_type text not null,
  amount_gbp numeric default 0,
  reason text,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

alter table public.budget_events
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists project_id uuid references public.duo_projects(id) on delete cascade,
  add column if not exists task_id uuid references public.duo_tasks(id) on delete set null,
  add column if not exists trace_id uuid,
  add column if not exists event_type text,
  add column if not exists amount_gbp numeric default 0,
  add column if not exists reason text,
  add column if not exists metadata jsonb default '{}',
  add column if not exists created_at timestamptz default now();

create table if not exists public.resource_locks (
  id uuid primary key default gen_random_uuid(),
  resource_key text not null unique,
  holder text not null,
  expires_at timestamptz not null,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

create table if not exists public.job_runs (
  id uuid primary key default gen_random_uuid(),
  job_name text not null,
  status text not null default 'running',
  idempotency_key text unique,
  started_at timestamptz default now(),
  finished_at timestamptz,
  metadata jsonb default '{}',
  error text
);

create table if not exists public.self_reports (
  id uuid primary key default gen_random_uuid(),
  report_date date not null,
  status text not null default 'ready',
  summary text not null,
  metrics jsonb default '{}',
  created_at timestamptz default now(),
  unique(report_date)
);

alter table public.self_reports
  add column if not exists report_date date,
  add column if not exists status text default 'ready',
  add column if not exists summary text,
  add column if not exists metrics jsonb default '{}',
  add column if not exists created_at timestamptz default now();

create table if not exists public.self_heal_proposals (
  id uuid primary key default gen_random_uuid(),
  source_job_run_id uuid references public.job_runs(id) on delete set null,
  trace_id uuid,
  branch_name text not null,
  state text not null default 'pending_approval' check (state in ('pending_approval','approved','rejected','applied','abandoned')),
  title text not null,
  summary text not null,
  changed_files text[] default '{}',
  test_plan text[] default '{}',
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.security_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  project_id uuid references public.duo_projects(id) on delete set null,
  task_id uuid references public.duo_tasks(id) on delete set null,
  trace_id uuid,
  event_type text not null,
  severity text default 'info',
  message text not null,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Codebase awareness tables
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.repo_index_runs (
  id uuid primary key default gen_random_uuid(),
  repo text not null,
  branch text,
  commit_sha text,
  status text not null default 'running',
  files_indexed int default 0,
  error text,
  started_at timestamptz default now(),
  finished_at timestamptz
);

create table if not exists public.repo_index_files (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references public.repo_index_runs(id) on delete cascade,
  repo text not null,
  path text not null,
  hash text,
  language text,
  summary text,
  metadata jsonb default '{}',
  indexed_at timestamptz default now(),
  unique(repo, path)
);

create table if not exists public.semantic_index (
  id uuid primary key default gen_random_uuid(),
  owner_type text not null,
  owner_id uuid,
  content text not null,
  embedding vector(1536),
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.duo_projects enable row level security;
alter table public.duo_tasks enable row level security;
alter table public.duo_timeline_events enable row level security;
alter table public.duo_task_edges enable row level security;
alter table public.duo_approvals enable row level security;
alter table public.duo_artifacts enable row level security;
alter table public.duo_external_refs enable row level security;
alter table public.duo_tool_calls enable row level security;
alter table public.duo_dashboard_widgets enable row level security;
alter table public.stream_events enable row level security;
alter table public.duo_outcomes enable row level security;
alter table public.user_connectors enable row level security;
alter table public.connector_secrets enable row level security;
alter table public.budget_policies enable row level security;
alter table public.budget_events enable row level security;

drop policy if exists "Users manage own duo projects" on public.duo_projects;
create policy "Users manage own duo projects" on public.duo_projects for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage own duo tasks" on public.duo_tasks;
create policy "Users manage own duo tasks" on public.duo_tasks for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users read own duo timeline" on public.duo_timeline_events;
create policy "Users read own duo timeline" on public.duo_timeline_events for select
  using (exists (select 1 from public.duo_projects p where p.id = project_id and p.user_id = auth.uid()));

drop policy if exists "Users read own duo edges" on public.duo_task_edges;
create policy "Users read own duo edges" on public.duo_task_edges for select
  using (exists (select 1 from public.duo_projects p where p.id = project_id and p.user_id = auth.uid()));

drop policy if exists "Users manage own duo approvals" on public.duo_approvals;
create policy "Users manage own duo approvals" on public.duo_approvals for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage own duo artifacts" on public.duo_artifacts;
create policy "Users manage own duo artifacts" on public.duo_artifacts for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage own duo refs" on public.duo_external_refs;
create policy "Users manage own duo refs" on public.duo_external_refs for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users read own duo tool calls" on public.duo_tool_calls;
create policy "Users read own duo tool calls" on public.duo_tool_calls for select
  using (auth.uid() = user_id);

drop policy if exists "Users read own duo widgets" on public.duo_dashboard_widgets;
create policy "Users read own duo widgets" on public.duo_dashboard_widgets for select
  using (auth.uid() = user_id);

drop policy if exists "Users read own stream events" on public.stream_events;
create policy "Users read own stream events" on public.stream_events for select
  using (auth.uid() = user_id);

drop policy if exists "Users manage own duo outcomes" on public.duo_outcomes;
create policy "Users manage own duo outcomes" on public.duo_outcomes for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage own connectors" on public.user_connectors;
create policy "Users manage own connectors" on public.user_connectors for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users read own connector secret refs" on public.connector_secrets;
create policy "Users read own connector secret refs" on public.connector_secrets for select
  using (auth.uid() = user_id);

drop policy if exists "Users manage own budget policies" on public.budget_policies;
create policy "Users manage own budget policies" on public.budget_policies for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users read own budget events" on public.budget_events;
create policy "Users read own budget events" on public.budget_events for select
  using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Indexes and seed policy rows
-- ─────────────────────────────────────────────────────────────────────────────

create index if not exists duo_projects_user_status_idx on public.duo_projects(user_id, status, created_at desc);
create index if not exists duo_projects_trace_idx on public.duo_projects(trace_id);
create index if not exists duo_tasks_project_idx on public.duo_tasks(project_id, status);
create index if not exists duo_tasks_trace_idx on public.duo_tasks(trace_id);
create index if not exists duo_task_edges_project_idx on public.duo_task_edges(project_id);
create index if not exists duo_timeline_project_idx on public.duo_timeline_events(project_id, created_at desc);
create index if not exists duo_tool_calls_trace_idx on public.duo_tool_calls(trace_id, created_at desc);
create index if not exists stream_events_project_idx on public.stream_events(project_id, created_at desc);
create index if not exists agent_job_queue_status_idx on public.agent_job_queue(status, run_after);
create index if not exists budget_events_user_created_idx on public.budget_events(user_id, created_at desc);
create index if not exists action_approvals_trace_idx on public.action_approvals(trace_id);
create index if not exists action_approvals_project_task_idx on public.action_approvals(project_id, task_id);

insert into public.platform_automation_policy
  (platform, can_read, can_draft, can_write_with_approval, can_final_submit, prohibited_actions, metadata)
values
  ('email', true, true, true, false, array['final_send_without_user_approval'], '{"final_actions_require_approval":true}'::jsonb),
  ('social', true, true, true, false, array['final_publish_without_user_approval'], '{"final_actions_require_approval":true}'::jsonb),
  ('shopify', true, true, true, false, array['payment','checkout','final_publish_without_user_approval'], '{"final_actions_require_approval":true}'::jsonb),
  ('browser', true, true, false, false, array['payment','checkout','final_submit_without_user_approval'], '{"headless_low_risk_only":true}'::jsonb),
  ('general', true, true, false, false, array['payment','checkout'], '{}'::jsonb)
on conflict (platform) do update set
  can_read = excluded.can_read,
  can_draft = excluded.can_draft,
  can_write_with_approval = excluded.can_write_with_approval,
  can_final_submit = excluded.can_final_submit,
  prohibited_actions = excluded.prohibited_actions,
  metadata = excluded.metadata,
  updated_at = now();

insert into public.playbooks (domain, name, description, trigger_keywords, task_template)
values
  ('general', 'Research then plan', 'Default safe project path: clarify, research, draft plan, ask approval for external work.', array['research','plan','launch','build'], '{"tasks":["Clarify success criteria","Research current options","Draft execution plan","Prepare approval-gated next action"]}'::jsonb),
  ('ecommerce', 'Store launch helper', 'Plan and prepare ecommerce setup without final publishing or payment actions.', array['shopify','store','printify','product','pod'], '{"tasks":["Check product/store context","Research constraints","Draft launch checklist","Prepare approval-gated store action"]}'::jsonb),
  ('career', 'Application helper', 'Prepare job materials and actions with final submit approval.', array['job','career','resume','cv','application'], '{"tasks":["Read career profile","Match opportunity","Draft tailored material","Request final submit approval"]}'::jsonb)
on conflict (domain, name) do nothing;
