-- CubiQo Sprint 3 - DuoMode fidelity and acceptance test tables.
-- Source of truth: CubiQo-DuoMode-Fidelity-Runbook.md + CubiQo-DuoMode-Fidelity-DB.md.

create extension if not exists pgcrypto;

create table if not exists public.duo_acceptance_tests (
  test_id text primary key,
  category text not null,
  criterion text not null,
  test_type text not null default 'automated'
    check (test_type in ('automated', 'manual', 'semi-automated')),
  verification_query text,
  expected_result text,
  active boolean not null default true,
  priority text not null default 'high' check (priority in ('high', 'medium', 'low')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.duo_acceptance_tests enable row level security;

drop policy if exists "Authenticated users read Duo acceptance tests" on public.duo_acceptance_tests;
create policy "Authenticated users read Duo acceptance tests"
on public.duo_acceptance_tests
for select
using (auth.uid() is not null);

drop policy if exists "Service role manages Duo acceptance tests" on public.duo_acceptance_tests;
create policy "Service role manages Duo acceptance tests"
on public.duo_acceptance_tests
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

insert into public.duo_acceptance_tests (test_id, category, criterion, test_type, priority) values
  ('AT-01', 'task_graph', 'Task graph renders from duo_tasks rows with correct status badges', 'automated', 'high'),
  ('AT-02', 'task_graph', 'Dependency edges display correctly - blocked tasks show dependencies', 'automated', 'high'),
  ('AT-03', 'realtime', 'Task status updates propagate to board within 2 seconds via Realtime', 'automated', 'high'),
  ('AT-04', 'approval_gate', 'Approval card shows verbatim preview - never truncated', 'manual', 'high'),
  ('AT-05', 'approval_gate', 'Approve action updates duo_approvals.status and resumes task', 'automated', 'high'),
  ('AT-06', 'approval_gate', 'Deny action shows on_reject_note and sets task to cancelled', 'automated', 'high'),
  ('AT-07', 'approval_gate', 'Expired approval (>24h) shows expired state and cannot be approved', 'automated', 'medium'),
  ('AT-08', 'question_flow', 'Question card appears for awaiting_user tasks with expiry countdown', 'automated', 'high'),
  ('AT-09', 'question_flow', 'Answer submission writes to question_answer and resumes task', 'automated', 'high'),
  ('AT-10', 'artifact_display', 'Code artifacts display with syntax highlighting', 'manual', 'medium'),
  ('AT-11', 'artifact_display', 'HTML artifacts render in sandboxed iframe with sanitisation', 'automated', 'high'),
  ('AT-12', 'artifact_display', 'Image artifacts display with storage_path resolved to signed URL', 'automated', 'high'),
  ('AT-13', 'board_state', 'Board snapshot restores on page reload within 1 second', 'automated', 'high'),
  ('AT-14', 'board_state', 'Session disconnect and reconnect resumes SSE stream correctly', 'automated', 'high'),
  ('AT-15', 'budget_gate', 'Project pauses when api_cost_gbp >= budget_gate_gbp', 'automated', 'high'),
  ('AT-16', 'budget_gate', 'User sees cost display and can update budget cap', 'manual', 'medium'),
  ('AT-17', 'error_handling', 'Failed task shows error_message and retry option', 'automated', 'high'),
  ('AT-18', 'error_handling', 'Dead-letter task shows final failed state with no retry button', 'automated', 'medium'),
  ('AT-19', 'task_graph', 'Can_parallelize tasks show parallel execution indicator', 'automated', 'low'),
  ('AT-20', 'board_state', 'Project completion triggers duo_outcomes row creation', 'automated', 'high')
on conflict (test_id) do nothing;

create table if not exists public.duo_test_runs (
  id uuid primary key default gen_random_uuid(),
  run_label text,
  project_id uuid references public.duo_projects(id) on delete cascade,
  triggered_by text default 'ci' check (triggered_by in ('ci', 'manual', 'cron')),
  environment text default 'staging' check (environment in ('staging', 'production', 'local')),
  overall_pass boolean,
  pass_count int not null default 0,
  fail_count int not null default 0,
  skip_count int not null default 0,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.duo_test_runs enable row level security;

drop policy if exists "Users read own Duo fidelity runs" on public.duo_test_runs;
create policy "Users read own Duo fidelity runs"
on public.duo_test_runs
for select
using (
  exists (
    select 1 from public.duo_projects p
    where p.id = duo_test_runs.project_id
      and p.user_id = auth.uid()
  )
);

drop policy if exists "Service role manages Duo fidelity runs" on public.duo_test_runs;
create policy "Service role manages Duo fidelity runs"
on public.duo_test_runs
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

create table if not exists public.duo_test_results (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references public.duo_test_runs(id) on delete cascade not null,
  test_id text references public.duo_acceptance_tests(test_id) not null,
  status text not null check (status in ('pass', 'fail', 'skip', 'error')),
  tester text,
  notes text,
  error_detail text,
  duration_ms int,
  tested_at timestamptz not null default now(),
  unique (run_id, test_id)
);

alter table public.duo_test_results enable row level security;

drop policy if exists "Users read own Duo fidelity results" on public.duo_test_results;
create policy "Users read own Duo fidelity results"
on public.duo_test_results
for select
using (
  exists (
    select 1
    from public.duo_test_runs r
    join public.duo_projects p on p.id = r.project_id
    where r.id = duo_test_results.run_id
      and p.user_id = auth.uid()
  )
);

drop policy if exists "Service role manages Duo fidelity results" on public.duo_test_results;
create policy "Service role manages Duo fidelity results"
on public.duo_test_results
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

create index if not exists duo_test_runs_label_idx
  on public.duo_test_runs(run_label, started_at desc);

create index if not exists duo_test_runs_project_idx
  on public.duo_test_runs(project_id, started_at desc);

create index if not exists duo_test_results_run_idx
  on public.duo_test_results(run_id, status);

create index if not exists duo_test_results_test_idx
  on public.duo_test_results(test_id, tested_at desc);
