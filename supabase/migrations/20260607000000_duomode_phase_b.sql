-- ============================================================
-- DuoMode Phase B — Universal Project Dashboard Schema
-- ============================================================

-- duo_projects: one per user goal/mission
create table if not exists public.duo_projects (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  title             text not null,
  goal              text not null,
  goal_type         text,                    -- metadata only (ecommerce_launch, career_move, etc)
  domain            text,                    -- commerce, health, career, social, etc
  success_criteria  text[],
  known_context     text[],
  risk_level        text default 'medium',   -- low / medium / high
  status            text default 'active'    -- active / paused / completed / archived
    check (status in ('active','paused','completed','archived')),
  cost_budget       numeric(10,4) default 0,
  cost_used         numeric(10,4) default 0,
  stop_requested_at timestamptz,
  completed_at      timestamptz,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

-- duo_tasks: task graph for a project
create table if not exists public.duo_tasks (
  id                  uuid primary key default gen_random_uuid(),
  project_id          uuid not null references public.duo_projects(id) on delete cascade,
  user_id             uuid not null references auth.users(id) on delete cascade,
  title               text not null,
  description         text,
  status              text default 'pending'
    check (status in ('pending','working','done','blocked','skipped')),
  depends_on          uuid[],               -- task IDs that must complete first
  selected_route      text,                 -- which tool/connector is being used
  risk_level          text default 'low'
    check (risk_level in ('low','medium','high')),
  requires_connector  text,                 -- e.g. 'google_drive', 'shopify'
  requires_approval   boolean default false,
  artifact_expected   boolean default false,
  evidence_required   boolean default false,
  tool_used           text,
  started_at          timestamptz,
  completed_at        timestamptz,
  sort_order          int default 0,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- duo_questions: what CubiQo needs to ask the user
create table if not exists public.duo_questions (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references public.duo_projects(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  task_id       uuid references public.duo_tasks(id) on delete set null,
  prompt        text not null,
  subtext       text,
  input_type    text default 'text'
    check (input_type in ('text','select','confirm','number','date')),
  options       text[],
  is_blocking   boolean default true,
  status        text default 'pending'
    check (status in ('pending','answered','skipped')),
  answer        text,
  answered_at   timestamptz,
  created_at    timestamptz default now()
);

-- duo_blockers: what is stopping progress
create table if not exists public.duo_blockers (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references public.duo_projects(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  task_id       uuid references public.duo_tasks(id) on delete set null,
  title         text not null,
  reason        text,
  blocker_type  text default 'unknown'
    check (blocker_type in ('missing_access','missing_info','approval_needed','external_dependency','error','unknown')),
  status        text default 'open'
    check (status in ('open','resolved','ignored')),
  resolved_at   timestamptz,
  created_at    timestamptz default now()
);

-- duo_access_requests: connector/permission needs
create table if not exists public.duo_access_requests (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null references public.duo_projects(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  task_id         uuid references public.duo_tasks(id) on delete set null,
  connector       text not null,            -- 'google_drive', 'shopify', 'github', etc
  scope           text[],                   -- required OAuth scopes
  reason          text,
  status          text default 'pending'
    check (status in ('pending','granted','denied','revoked')),
  granted_at      timestamptz,
  created_at      timestamptz default now()
);

-- duo_approvals: what needs user sign-off before CubiQo acts
create table if not exists public.duo_approvals (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null references public.duo_projects(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  task_id         uuid references public.duo_tasks(id) on delete set null,
  title           text not null,
  action_summary  text not null,            -- exact action CubiQo will take
  platform        text,                     -- shopify / gmail / vercel / etc
  payload_preview text,                     -- what will be sent/created/deleted
  risk_level      text default 'medium'
    check (risk_level in ('low','medium','high','critical')),
  is_reversible   boolean default true,
  if_approved     text,
  if_denied       text,
  expires_at      timestamptz,
  status          text default 'pending'
    check (status in ('pending','approved','denied','expired')),
  decided_at      timestamptz,
  created_at      timestamptz default now()
);

-- duo_artifacts: outputs CubiQo creates
create table if not exists public.duo_artifacts (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null references public.duo_projects(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  task_id         uuid references public.duo_tasks(id) on delete set null,
  title           text not null,
  artifact_type   text not null
    check (artifact_type in ('document','image','code','data','url','file','report','draft','plan')),
  content         text,                     -- inline content for small artifacts
  storage_path    text,                     -- Supabase storage path for large
  external_url    text,
  mime_type       text,
  metadata        jsonb default '{}'::jsonb,
  created_at      timestamptz default now()
);

-- duo_external_refs: external IDs/URLs/results from third-party systems
create table if not exists public.duo_external_refs (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null references public.duo_projects(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  task_id         uuid references public.duo_tasks(id) on delete set null,
  platform        text not null,
  ref_type        text not null,            -- 'job_listing', 'product_id', 'repo', etc
  external_id     text,
  external_url    text,
  title           text,
  snapshot        jsonb default '{}'::jsonb,
  fetched_at      timestamptz default now(),
  created_at      timestamptz default now()
);

-- duo_timeline_events: evidence/history — every significant event
create table if not exists public.duo_timeline_events (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null references public.duo_projects(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  task_id         uuid references public.duo_tasks(id) on delete set null,
  event_type      text not null
    check (event_type in ('task_started','task_done','task_blocked','question_asked','question_answered','approval_requested','approval_decided','artifact_created','access_granted','access_denied','agent_note','user_message','tool_call','cost_update','project_created','project_completed')),
  title           text not null,
  detail          text,
  metadata        jsonb default '{}'::jsonb,
  created_at      timestamptz default now()
);

-- duo_dashboard_widgets: drives what the frontend renders per project
create table if not exists public.duo_dashboard_widgets (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null references public.duo_projects(id) on delete cascade,
  slot            text not null,            -- 'goal','task_graph','questions','blockers','approvals','artifacts','timeline','metrics','access_requests','external_refs','cost'
  widget_type     text not null,            -- 'summary','dag','input_queue','connector_cards','artifact_gallery','kpi_strip','timeline_feed','cost_bar','approval_queue','blocker_list'
  title           text,
  config          jsonb default '{}'::jsonb,
  sort_order      int default 0,
  visible         boolean default true,
  created_at      timestamptz default now(),
  unique (project_id, slot)
);

-- agent_tool_calls: every tool call the agent makes — evidence + cost tracking
create table if not exists public.agent_tool_calls (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid references public.duo_projects(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  task_id         uuid references public.duo_tasks(id) on delete set null,
  tool_name       text not null,
  input           jsonb default '{}'::jsonb,
  output          jsonb default '{}'::jsonb,
  status          text default 'success'
    check (status in ('success','error','skipped')),
  duration_ms     int,
  cost            numeric(10,6) default 0,
  created_at      timestamptz default now()
);

-- agent_job_queue: background execution queue
create table if not exists public.agent_job_queue (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid references public.duo_projects(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  task_id         uuid references public.duo_tasks(id) on delete set null,
  job_type        text not null,
  payload         jsonb default '{}'::jsonb,
  status          text default 'queued'
    check (status in ('queued','running','done','failed','cancelled')),
  attempts        int default 0,
  max_attempts    int default 3,
  scheduled_for   timestamptz default now(),
  started_at      timestamptz,
  completed_at    timestamptz,
  error           text,
  created_at      timestamptz default now()
);

-- ============================================================
-- RLS
-- ============================================================

alter table public.duo_projects          enable row level security;
alter table public.duo_tasks             enable row level security;
alter table public.duo_questions         enable row level security;
alter table public.duo_blockers          enable row level security;
alter table public.duo_access_requests   enable row level security;
alter table public.duo_approvals         enable row level security;
alter table public.duo_artifacts         enable row level security;
alter table public.duo_external_refs     enable row level security;
alter table public.duo_timeline_events   enable row level security;
alter table public.duo_dashboard_widgets enable row level security;
alter table public.agent_tool_calls      enable row level security;
alter table public.agent_job_queue       enable row level security;

-- Users own their data
create policy "owner" on public.duo_projects          for all using (auth.uid() = user_id);
create policy "owner" on public.duo_tasks             for all using (auth.uid() = user_id);
create policy "owner" on public.duo_questions         for all using (auth.uid() = user_id);
create policy "owner" on public.duo_blockers          for all using (auth.uid() = user_id);
create policy "owner" on public.duo_access_requests   for all using (auth.uid() = user_id);
create policy "owner" on public.duo_approvals         for all using (auth.uid() = user_id);
create policy "owner" on public.duo_artifacts         for all using (auth.uid() = user_id);
create policy "owner" on public.duo_external_refs     for all using (auth.uid() = user_id);
create policy "owner" on public.duo_timeline_events   for all using (auth.uid() = user_id);
create policy "owner" on public.duo_dashboard_widgets for all using (
  project_id in (select id from public.duo_projects where user_id = auth.uid())
);
create policy "owner" on public.agent_tool_calls      for all using (auth.uid() = user_id);
create policy "owner" on public.agent_job_queue       for all using (auth.uid() = user_id);

-- ============================================================
-- Indexes
-- ============================================================

create index if not exists idx_duo_projects_user        on public.duo_projects(user_id, status, created_at desc);
create index if not exists idx_duo_tasks_project        on public.duo_tasks(project_id, status, sort_order);
create index if not exists idx_duo_questions_project    on public.duo_questions(project_id, status);
create index if not exists idx_duo_blockers_project     on public.duo_blockers(project_id, status);
create index if not exists idx_duo_approvals_project    on public.duo_approvals(project_id, status);
create index if not exists idx_duo_artifacts_project    on public.duo_artifacts(project_id, created_at desc);
create index if not exists idx_duo_timeline_project     on public.duo_timeline_events(project_id, created_at desc);
create index if not exists idx_duo_widgets_project      on public.duo_dashboard_widgets(project_id, sort_order);
create index if not exists idx_agent_tool_calls_project on public.agent_tool_calls(project_id, created_at desc);
create index if not exists idx_agent_job_queue_status   on public.agent_job_queue(status, scheduled_for);

-- ============================================================
-- updated_at triggers
-- ============================================================

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger set_duo_projects_updated_at  before update on public.duo_projects  for each row execute function public.set_updated_at();
create trigger set_duo_tasks_updated_at     before update on public.duo_tasks     for each row execute function public.set_updated_at();
