/**
 * CubiQo Phase A/B Migration Runner
 * Runs all catch-up and Phase B foundation migrations against live Supabase DB.
 * Uses direct connection (port 5432) — not PgBouncer — for DDL safety.
 */

import pg from 'pg';
const { Client } = pg;

// Primary: Supabase session-mode pooler (resolves in Bash sandbox; fine for DDL)
// Port 5432 = session mode (supports DDL, multi-statement), 6543 = transaction mode
const DB = {
  host: 'aws-1-us-east-1.pooler.supabase.com',
  port: 5432,
  user: 'postgres.oszlufrjvibrdauuppzj',
  password: 'Codex@shared26',
  database: 'postgres',
  ssl: { rejectUnauthorized: false },
};

// ─────────────────────────────────────────────────────────────────────────────
// MIGRATION 1 — Phase A catch-up
// ─────────────────────────────────────────────────────────────────────────────
const MIGRATION_1_PHASE_A_CATCHUP = `
-- PA-01: memory_events — add missing columns
ALTER TABLE public.memory_events
  ADD COLUMN IF NOT EXISTS metadata       jsonb   DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS confidence     numeric DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS source         text    DEFAULT 'assistant',
  ADD COLUMN IF NOT EXISTS user_confirmed boolean DEFAULT false;

-- PA-02: signals — add missing columns
ALTER TABLE public.signals
  ADD COLUMN IF NOT EXISTS capsule_status          text,
  ADD COLUMN IF NOT EXISTS classification_metadata jsonb DEFAULT '{}';

-- PA-03: api_usage_events — add cost_gbp
ALTER TABLE public.api_usage_events
  ADD COLUMN IF NOT EXISTS cost_gbp numeric DEFAULT 0;

-- PA-04: job_runs — create if missing
CREATE TABLE IF NOT EXISTS public.job_runs (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name        text        NOT NULL,
  status          text        NOT NULL,
  duration_ms     int,
  error           text,
  metadata        jsonb       DEFAULT '{}',
  ran_at          timestamptz DEFAULT now(),
  idempotency_key text        UNIQUE
);
ALTER TABLE public.job_runs ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'job_runs' AND policyname = 'No direct user access to job_runs'
  ) THEN
    EXECUTE 'CREATE POLICY "No direct user access to job_runs" ON public.job_runs FOR ALL USING (false)';
  END IF;
END $$;
`;

// ─────────────────────────────────────────────────────────────────────────────
// MIGRATION 2 — Phase B schema consolidation
// ─────────────────────────────────────────────────────────────────────────────
const MIGRATION_2_PHASE_B_CONSOLIDATION = `
-- PB-S-01: duo_projects — add canonical columns
ALTER TABLE public.duo_projects
  ADD COLUMN IF NOT EXISTS trace_id            uuid,
  ADD COLUMN IF NOT EXISTS goal                text,
  ADD COLUMN IF NOT EXISTS goal_interpretation jsonb        DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS domain              text,
  ADD COLUMN IF NOT EXISTS success_criteria    jsonb        DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS constraints         jsonb        DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS risk_level          text         DEFAULT 'low',
  ADD COLUMN IF NOT EXISTS playbook_id         uuid,
  ADD COLUMN IF NOT EXISTS api_cost_gbp        numeric      DEFAULT 0,
  ADD COLUMN IF NOT EXISTS budget_gate_gbp     numeric      DEFAULT 10,
  ADD COLUMN IF NOT EXISTS verbosity           text         DEFAULT 'summary',
  ADD COLUMN IF NOT EXISTS workflow_run_id     text,
  ADD COLUMN IF NOT EXISTS capsule_id          uuid,
  ADD COLUMN IF NOT EXISTS signal_id           uuid,
  ADD COLUMN IF NOT EXISTS closed_at           timestamptz,
  ADD COLUMN IF NOT EXISTS user_id             uuid;

-- Data migration: preserve title → goal
UPDATE public.duo_projects SET goal = title WHERE goal IS NULL AND title IS NOT NULL;

-- RLS on duo_projects (add if missing)
ALTER TABLE public.duo_projects ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'duo_projects' AND policyname = 'Users manage own projects'
  ) THEN
    EXECUTE 'CREATE POLICY "Users manage own projects" ON public.duo_projects FOR ALL USING (auth.uid() = user_id)';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS duo_projects_user_status_idx ON public.duo_projects(user_id, status);

-- PB-S-02: duo_tasks — add canonical columns
ALTER TABLE public.duo_tasks
  ADD COLUMN IF NOT EXISTS trace_id           uuid,
  ADD COLUMN IF NOT EXISTS depends_on_tasks   uuid[]      DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS selected_route     text,
  ADD COLUMN IF NOT EXISTS fallback_route     text,
  ADD COLUMN IF NOT EXISTS connector_platform text,
  ADD COLUMN IF NOT EXISTS approval_required  boolean     DEFAULT false,
  ADD COLUMN IF NOT EXISTS risk_level         text        DEFAULT 'low',
  ADD COLUMN IF NOT EXISTS idempotency_key    text,
  ADD COLUMN IF NOT EXISTS can_parallelize    boolean     DEFAULT false,
  ADD COLUMN IF NOT EXISTS evidence           jsonb       DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS timeout_minutes    int         DEFAULT 15,
  ADD COLUMN IF NOT EXISTS attempts           int         DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_attempts       int         DEFAULT 3,
  ADD COLUMN IF NOT EXISTS last_error         text,
  ADD COLUMN IF NOT EXISTS updated_at         timestamptz DEFAULT now();

-- Data migration: route_preference → selected_route
UPDATE public.duo_tasks SET selected_route = route_preference
  WHERE selected_route IS NULL AND route_preference IS NOT NULL;

-- Backfill idempotency_key for existing rows
UPDATE public.duo_tasks
  SET idempotency_key = project_id::text || ':task:' || id::text
  WHERE idempotency_key IS NULL;

-- Add unique constraint on idempotency_key (only if not already there)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'duo_tasks_idempotency_key_key'
  ) THEN
    ALTER TABLE public.duo_tasks ADD CONSTRAINT duo_tasks_idempotency_key_key UNIQUE (idempotency_key);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS duo_tasks_project_status_idx ON public.duo_tasks(project_id, status);

-- PB-S-03: duo_timeline_events — add canonical columns
ALTER TABLE public.duo_timeline_events
  ADD COLUMN IF NOT EXISTS trace_id     uuid,
  ADD COLUMN IF NOT EXISTS task_id      uuid,
  ADD COLUMN IF NOT EXISTS event_type   text,
  ADD COLUMN IF NOT EXISTS summary      text,
  ADD COLUMN IF NOT EXISTS metadata     jsonb   DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS api_cost_gbp numeric DEFAULT 0;

-- Data migration: message → summary, payload → metadata
UPDATE public.duo_timeline_events SET summary  = message WHERE summary IS NULL AND message IS NOT NULL;
UPDATE public.duo_timeline_events SET metadata = payload  WHERE (metadata = '{}' OR metadata IS NULL) AND payload IS NOT NULL;

-- PB-S-04: action_approvals — extend for Phase B Duo linkage
ALTER TABLE public.action_approvals
  ADD COLUMN IF NOT EXISTS trace_id                  uuid,
  ADD COLUMN IF NOT EXISTS project_id                uuid,
  ADD COLUMN IF NOT EXISTS task_id                   uuid,
  ADD COLUMN IF NOT EXISTS preview_content           text,
  ADD COLUMN IF NOT EXISTS reversible                boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS reversible_window_seconds int,
  ADD COLUMN IF NOT EXISTS on_reject_note            text    DEFAULT 'Draft kept, nothing sent.',
  ADD COLUMN IF NOT EXISTS depends_on_approval       uuid;

CREATE INDEX IF NOT EXISTS action_approvals_project_idx ON public.action_approvals(project_id);
CREATE INDEX IF NOT EXISTS action_approvals_trace_idx   ON public.action_approvals(trace_id);
`;

// ─────────────────────────────────────────────────────────────────────────────
// MIGRATION 3 — Phase B core tables
// ─────────────────────────────────────────────────────────────────────────────
const MIGRATION_3_PHASE_B_CORE = `
-- PB-01: duo_task_edges
CREATE TABLE IF NOT EXISTS public.duo_task_edges (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   uuid NOT NULL REFERENCES public.duo_projects(id)  ON DELETE CASCADE,
  from_task_id uuid NOT NULL REFERENCES public.duo_tasks(id)     ON DELETE CASCADE,
  to_task_id   uuid NOT NULL REFERENCES public.duo_tasks(id)     ON DELETE CASCADE,
  UNIQUE (from_task_id, to_task_id)
);
ALTER TABLE public.duo_task_edges ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'duo_task_edges' AND policyname = 'Users manage own task edges') THEN
    EXECUTE 'CREATE POLICY "Users manage own task edges" ON public.duo_task_edges FOR ALL USING (EXISTS (SELECT 1 FROM public.duo_projects p WHERE p.id = project_id AND p.user_id = auth.uid()))';
  END IF;
END $$;

-- PB-02: duo_artifacts
CREATE TABLE IF NOT EXISTS public.duo_artifacts (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  trace_id      uuid        NOT NULL,
  project_id    uuid        NOT NULL REFERENCES public.duo_projects(id) ON DELETE CASCADE,
  task_id       uuid,
  artifact_type text        NOT NULL,
  title         text        NOT NULL,
  content       text,
  storage_path  text,
  url           text,
  kept_on_shot  boolean     DEFAULT true,
  created_at    timestamptz DEFAULT now()
);
ALTER TABLE public.duo_artifacts ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'duo_artifacts' AND policyname = 'Users manage own artifacts') THEN
    EXECUTE 'CREATE POLICY "Users manage own artifacts" ON public.duo_artifacts FOR ALL USING (EXISTS (SELECT 1 FROM public.duo_projects p WHERE p.id = project_id AND p.user_id = auth.uid()))';
  END IF;
END $$;

-- PB-03: duo_external_refs
CREATE TABLE IF NOT EXISTS public.duo_external_refs (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  trace_id    uuid        NOT NULL,
  project_id  uuid        NOT NULL REFERENCES public.duo_projects(id) ON DELETE CASCADE,
  task_id     uuid,
  platform    text        NOT NULL,
  ref_type    text        NOT NULL,
  external_id text        NOT NULL,
  url         text,
  created_at  timestamptz DEFAULT now()
);
ALTER TABLE public.duo_external_refs ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'duo_external_refs' AND policyname = 'Users manage own external refs') THEN
    EXECUTE 'CREATE POLICY "Users manage own external refs" ON public.duo_external_refs FOR ALL USING (EXISTS (SELECT 1 FROM public.duo_projects p WHERE p.id = project_id AND p.user_id = auth.uid()))';
  END IF;
END $$;

-- PB-04: duo_outcomes
CREATE TABLE IF NOT EXISTS public.duo_outcomes (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  trace_id         uuid        NOT NULL,
  project_id       uuid        NOT NULL REFERENCES public.duo_projects(id) ON DELETE CASCADE,
  user_id          uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  outcome          text        NOT NULL,
  summary          text        NOT NULL,
  memory_written   boolean     DEFAULT false,
  playbook_updated boolean     DEFAULT false,
  created_at       timestamptz DEFAULT now()
);
ALTER TABLE public.duo_outcomes ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'duo_outcomes' AND policyname = 'Users read own outcomes') THEN
    EXECUTE 'CREATE POLICY "Users read own outcomes" ON public.duo_outcomes FOR SELECT USING (auth.uid() = user_id)';
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'duo_outcomes' AND policyname = 'Service role manages outcomes') THEN
    EXECUTE 'CREATE POLICY "Service role manages outcomes" ON public.duo_outcomes FOR ALL USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- PB-05: duo_dashboard_widgets
CREATE TABLE IF NOT EXISTS public.duo_dashboard_widgets (
  id          uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  uuid    NOT NULL REFERENCES public.duo_projects(id) ON DELETE CASCADE,
  slot        text    NOT NULL,
  widget_type text    NOT NULL,
  config      jsonb   DEFAULT '{}',
  sort_order  int     DEFAULT 0,
  visible     boolean DEFAULT true
);
ALTER TABLE public.duo_dashboard_widgets ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'duo_dashboard_widgets' AND policyname = 'Users manage own widgets') THEN
    EXECUTE 'CREATE POLICY "Users manage own widgets" ON public.duo_dashboard_widgets FOR ALL USING (EXISTS (SELECT 1 FROM public.duo_projects p WHERE p.id = project_id AND p.user_id = auth.uid()))';
  END IF;
END $$;

-- PB-06: duo_tool_calls
CREATE TABLE IF NOT EXISTS public.duo_tool_calls (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  trace_id        uuid        NOT NULL,
  project_id      uuid        REFERENCES public.duo_projects(id) ON DELETE CASCADE,
  task_id         uuid        REFERENCES public.duo_tasks(id)    ON DELETE CASCADE,
  route_used      text        NOT NULL,
  tool_name       text,
  platform        text,
  idempotency_key text,
  status          text        NOT NULL DEFAULT 'running',
  input_summary   text,
  result_summary  text,
  external_id     text,
  latency_ms      int,
  api_cost_gbp    numeric     DEFAULT 0,
  failure_reason  text,
  fallback_tool   text,
  started_at      timestamptz DEFAULT now(),
  completed_at    timestamptz,
  created_at      timestamptz DEFAULT now()
);
ALTER TABLE public.duo_tool_calls ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'duo_tool_calls' AND policyname = 'Users read own tool calls') THEN
    EXECUTE 'CREATE POLICY "Users read own tool calls" ON public.duo_tool_calls FOR SELECT USING (EXISTS (SELECT 1 FROM public.duo_projects p WHERE p.id = project_id AND p.user_id = auth.uid()))';
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'duo_tool_calls' AND policyname = 'Service role manages tool calls') THEN
    EXECUTE 'CREATE POLICY "Service role manages tool calls" ON public.duo_tool_calls FOR ALL USING (true) WITH CHECK (true)';
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS duo_tool_calls_trace_idx ON public.duo_tool_calls(trace_id);
CREATE INDEX IF NOT EXISTS duo_tool_calls_task_idx  ON public.duo_tool_calls(task_id);

-- PB-07: stream_events
CREATE TABLE IF NOT EXISTS public.stream_events (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  trace_id   uuid        NOT NULL,
  project_id uuid        NOT NULL REFERENCES public.duo_projects(id) ON DELETE CASCADE,
  event_type text        NOT NULL,
  payload    jsonb       DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.stream_events ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'stream_events' AND policyname = 'Users subscribe to own project streams') THEN
    EXECUTE 'CREATE POLICY "Users subscribe to own project streams" ON public.stream_events FOR SELECT USING (EXISTS (SELECT 1 FROM public.duo_projects p WHERE p.id = project_id AND p.user_id = auth.uid()))';
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'stream_events' AND policyname = 'Service role inserts stream events') THEN
    EXECUTE 'CREATE POLICY "Service role inserts stream events" ON public.stream_events FOR INSERT WITH CHECK (true)';
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS stream_events_project_created_idx ON public.stream_events(project_id, created_at DESC);

-- PB-08: user_connectors
CREATE TABLE IF NOT EXISTS public.user_connectors (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform             text        NOT NULL,
  category             text        NOT NULL,
  label                text,
  external_account_id  text,
  status               text        NOT NULL DEFAULT 'needs_auth',
  auth_type            text        NOT NULL DEFAULT 'oauth',
  scopes               jsonb       DEFAULT '[]',
  last_health_check_at timestamptz,
  expires_at           timestamptz,
  metadata             jsonb       DEFAULT '{}',
  created_at           timestamptz DEFAULT now()
);
-- Expression-based unique constraint must use an index (coalesce not allowed inline)
CREATE UNIQUE INDEX IF NOT EXISTS user_connectors_unique_idx
  ON public.user_connectors (user_id, platform, coalesce(external_account_id, 'default'));
ALTER TABLE public.user_connectors ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_connectors' AND policyname = 'Users manage own connectors') THEN
    EXECUTE 'CREATE POLICY "Users manage own connectors" ON public.user_connectors FOR ALL USING (auth.uid() = user_id)';
  END IF;
END $$;

-- PB-09: connector_secrets
CREATE TABLE IF NOT EXISTS public.connector_secrets (
  id                      uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  connector_id            uuid        NOT NULL UNIQUE REFERENCES public.user_connectors(id) ON DELETE CASCADE,
  encrypted_access_token  text,
  encrypted_refresh_token text,
  token_expires_at        timestamptz,
  encryption_key_id       text        DEFAULT 'default',
  created_at              timestamptz DEFAULT now(),
  updated_at              timestamptz DEFAULT now()
);
ALTER TABLE public.connector_secrets ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'connector_secrets' AND policyname = 'No user access to connector secrets') THEN
    EXECUTE 'CREATE POLICY "No user access to connector secrets" ON public.connector_secrets FOR ALL USING (false)';
  END IF;
END $$;

-- PB-10: tool_capabilities
CREATE TABLE IF NOT EXISTS public.tool_capabilities (
  id                 uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  platform           text    NOT NULL,
  action             text    NOT NULL,
  route_type         text    NOT NULL,
  risk_level         text    DEFAULT 'low',
  dry_run_supported  boolean DEFAULT false,
  requires_approval  boolean DEFAULT false,
  rate_limit_per_sec numeric DEFAULT 1.0,
  description        text,
  UNIQUE (platform, action, route_type)
);
ALTER TABLE public.tool_capabilities ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tool_capabilities' AND policyname = 'Public read on tool_capabilities') THEN
    EXECUTE 'CREATE POLICY "Public read on tool_capabilities" ON public.tool_capabilities FOR SELECT USING (true)';
  END IF;
END $$;

-- PB-11: platform_automation_policy
CREATE TABLE IF NOT EXISTS public.platform_automation_policy (
  id                  uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  platform            text    UNIQUE NOT NULL,
  headless_allowed    boolean DEFAULT true,
  bot_detection_risk  text    DEFAULT 'low',
  api_available       boolean DEFAULT false,
  mcp_available       boolean DEFAULT false,
  stagehand_preferred boolean DEFAULT false,
  notes               text
);
ALTER TABLE public.platform_automation_policy ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'platform_automation_policy' AND policyname = 'Public read on platform_automation_policy') THEN
    EXECUTE 'CREATE POLICY "Public read on platform_automation_policy" ON public.platform_automation_policy FOR SELECT USING (true)';
  END IF;
END $$;

INSERT INTO public.platform_automation_policy (platform, headless_allowed, bot_detection_risk, api_available, stagehand_preferred)
VALUES
  ('shopify',   true,  'low',      true,  false),
  ('github',    true,  'low',      true,  false),
  ('vercel',    true,  'low',      true,  false),
  ('linkedin',  false, 'critical', false, true),
  ('instagram', false, 'critical', false, true),
  ('twitter',   false, 'high',     true,  true),
  ('printify',  true,  'low',      true,  false),
  ('canva',     true,  'medium',   false, true)
ON CONFLICT (platform) DO NOTHING;

-- PB-12: tool_candidates
CREATE TABLE IF NOT EXISTS public.tool_candidates (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  trace_id         uuid,
  user_id          uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name             text        NOT NULL,
  website          text,
  user_goal        text,
  api_docs_url     text,
  oauth_supported  boolean,
  mcp_available    boolean,
  browser_only     boolean,
  setup_needed     jsonb       DEFAULT '[]',
  first_safe_test  text,
  risks            jsonb       DEFAULT '[]',
  approved_by_user boolean     DEFAULT false,
  status           text        DEFAULT 'pending',
  created_at       timestamptz DEFAULT now()
);
ALTER TABLE public.tool_candidates ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tool_candidates' AND policyname = 'Users manage own tool candidates') THEN
    EXECUTE 'CREATE POLICY "Users manage own tool candidates" ON public.tool_candidates FOR ALL USING (auth.uid() = user_id)';
  END IF;
END $$;

-- PB-13: playbooks
CREATE TABLE IF NOT EXISTS public.playbooks (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  domain              text        NOT NULL,
  goal_pattern        text        NOT NULL,
  default_steps       jsonb       DEFAULT '[]',
  required_connectors jsonb       DEFAULT '[]',
  risk_notes          jsonb       DEFAULT '[]',
  approval_gates      jsonb       DEFAULT '[]',
  research_required   boolean     DEFAULT false,
  success_rate        numeric     DEFAULT 0.5,
  avg_completion_days numeric,
  use_count           int         DEFAULT 0,
  last_reviewed_at    timestamptz DEFAULT now(),
  UNIQUE (domain, goal_pattern)
);
ALTER TABLE public.playbooks ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'playbooks' AND policyname = 'Public read on playbooks') THEN
    EXECUTE 'CREATE POLICY "Public read on playbooks" ON public.playbooks FOR SELECT USING (true)';
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'playbooks' AND policyname = 'Service role manages playbooks') THEN
    EXECUTE 'CREATE POLICY "Service role manages playbooks" ON public.playbooks FOR ALL USING (true) WITH CHECK (true)';
  END IF;
END $$;

INSERT INTO public.playbooks (domain, goal_pattern, research_required)
VALUES
  ('ecommerce', 'pod-product-launch',  true),
  ('marketing', 'content-calendar',    false),
  ('research',  'deep-research',       true),
  ('general',   'ai-model-comparison', false),
  ('career',    'job-search',          true),
  ('startup',   'landing-page-mvp',    false)
ON CONFLICT (domain, goal_pattern) DO NOTHING;
`;

// ─────────────────────────────────────────────────────────────────────────────
// MIGRATION 4 — Phase B ops tables
// ─────────────────────────────────────────────────────────────────────────────
const MIGRATION_4_PHASE_B_OPS = `
-- PB-14: agent_job_queue
CREATE TABLE IF NOT EXISTS public.agent_job_queue (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  trace_id        uuid        NOT NULL,
  project_id      uuid        REFERENCES public.duo_projects(id) ON DELETE CASCADE,
  task_id         uuid,
  job_type        text        NOT NULL,
  payload         jsonb       DEFAULT '{}',
  state           text        NOT NULL DEFAULT 'queued',
  idempotency_key text        UNIQUE NOT NULL,
  run_after       timestamptz DEFAULT now(),
  locked_at       timestamptz,
  locked_by       text,
  attempts        int         DEFAULT 0,
  max_attempts    int         DEFAULT 3,
  last_error      text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS job_queue_state_run_after_idx ON public.agent_job_queue(state, run_after)
  WHERE state IN ('queued', 'failed');
ALTER TABLE public.agent_job_queue ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'agent_job_queue' AND policyname = 'No direct user access to job queue') THEN
    EXECUTE 'CREATE POLICY "No direct user access to job queue" ON public.agent_job_queue FOR ALL USING (false)';
  END IF;
END $$;

-- PB-15: agent_worker_leases
CREATE TABLE IF NOT EXISTS public.agent_worker_leases (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id    text        NOT NULL UNIQUE,
  job_id       uuid        REFERENCES public.agent_job_queue(id),
  leased_at    timestamptz DEFAULT now(),
  heartbeat_at timestamptz DEFAULT now(),
  expires_at   timestamptz DEFAULT (now() + interval '2 minutes')
);
ALTER TABLE public.agent_worker_leases ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'agent_worker_leases' AND policyname = 'No direct user access to worker leases') THEN
    EXECUTE 'CREATE POLICY "No direct user access to worker leases" ON public.agent_worker_leases FOR ALL USING (false)';
  END IF;
END $$;

-- PB-16: dead_letter_jobs
CREATE TABLE IF NOT EXISTS public.dead_letter_jobs (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  trace_id        uuid,
  original_job_id uuid,
  job_type        text,
  payload         jsonb,
  error_history   jsonb       DEFAULT '[]',
  dead_at         timestamptz DEFAULT now()
);
ALTER TABLE public.dead_letter_jobs ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'dead_letter_jobs' AND policyname = 'No direct user access to dead letter queue') THEN
    EXECUTE 'CREATE POLICY "No direct user access to dead letter queue" ON public.dead_letter_jobs FOR ALL USING (false)';
  END IF;
END $$;

-- PB-17: budget_policies
CREATE TABLE IF NOT EXISTS public.budget_policies (
  id          uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid    REFERENCES auth.users(id) ON DELETE CASCADE,
  policy_type text    NOT NULL,
  provider    text,
  limit_gbp   numeric NOT NULL DEFAULT 5.0,
  hard_stop   boolean DEFAULT true,
  created_at  timestamptz DEFAULT now()
);
-- Expression-based unique constraint must use an index (coalesce not allowed inline)
CREATE UNIQUE INDEX IF NOT EXISTS budget_policies_unique_idx
  ON public.budget_policies (user_id, policy_type, coalesce(provider, 'all'));
ALTER TABLE public.budget_policies ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'budget_policies' AND policyname = 'Users manage own budget policies') THEN
    EXECUTE 'CREATE POLICY "Users manage own budget policies" ON public.budget_policies FOR ALL USING (auth.uid() = user_id)';
  END IF;
END $$;

-- PB-18: budget_events
CREATE TABLE IF NOT EXISTS public.budget_events (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  trace_id   uuid,
  project_id uuid,
  user_id    uuid,
  provider   text,
  tool_name  text,
  cost_gbp   numeric     NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.budget_events ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'budget_events' AND policyname = 'No direct user access to budget events') THEN
    EXECUTE 'CREATE POLICY "No direct user access to budget events" ON public.budget_events FOR ALL USING (false)';
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS budget_events_user_created_idx ON public.budget_events(user_id, created_at DESC);

-- PB-19: resource_locks
CREATE TABLE IF NOT EXISTS public.resource_locks (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_type  text        NOT NULL,
  resource_id    text        NOT NULL,
  locked_by_task uuid,
  locked_at      timestamptz DEFAULT now(),
  expires_at     timestamptz DEFAULT (now() + interval '10 minutes'),
  UNIQUE (resource_type, resource_id)
);
ALTER TABLE public.resource_locks ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'resource_locks' AND policyname = 'No direct user access to resource locks') THEN
    EXECUTE 'CREATE POLICY "No direct user access to resource locks" ON public.resource_locks FOR ALL USING (false)';
  END IF;
END $$;

-- PB-20: self_reports
CREATE TABLE IF NOT EXISTS public.self_reports (
  id                       uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  report_date              date        NOT NULL UNIQUE,
  cron_summary             jsonb       DEFAULT '{}',
  api_cost_by_provider     jsonb       DEFAULT '{}',
  active_projects          int         DEFAULT 0,
  completed_projects       int         DEFAULT 0,
  shot_projects            int         DEFAULT 0,
  failed_tasks             int         DEFAULT 0,
  connector_health         jsonb       DEFAULT '{}',
  error_spikes             jsonb       DEFAULT '[]',
  open_self_heal_proposals int         DEFAULT 0,
  generated_at             timestamptz DEFAULT now()
);
ALTER TABLE public.self_reports ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'self_reports' AND policyname = 'No direct user access to self_reports') THEN
    EXECUTE 'CREATE POLICY "No direct user access to self_reports" ON public.self_reports FOR ALL USING (false)';
  END IF;
END $$;

-- PB-21: self_heal_proposals
CREATE TABLE IF NOT EXISTS public.self_heal_proposals (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_type   text        NOT NULL,
  severity     text        NOT NULL,
  diagnosis    text        NOT NULL,
  proposed_fix text        NOT NULL,
  branch_name  text,
  diff_summary text,
  test_result  text,
  state        text        NOT NULL DEFAULT 'pending_approval',
  created_at   timestamptz DEFAULT now(),
  resolved_at  timestamptz
);
ALTER TABLE public.self_heal_proposals ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'self_heal_proposals' AND policyname = 'No direct user access to self_heal_proposals') THEN
    EXECUTE 'CREATE POLICY "No direct user access to self_heal_proposals" ON public.self_heal_proposals FOR ALL USING (false)';
  END IF;
END $$;

-- PB-22: security_events
CREATE TABLE IF NOT EXISTS public.security_events (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  trace_id     uuid,
  project_id   uuid,
  user_id      uuid,
  event_type   text        NOT NULL,
  severity     text        NOT NULL,
  description  text,
  action_taken text        NOT NULL,
  created_at   timestamptz DEFAULT now()
);
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'security_events' AND policyname = 'No direct user access to security events') THEN
    EXECUTE 'CREATE POLICY "No direct user access to security events" ON public.security_events FOR ALL USING (false)';
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS security_events_user_created_idx ON public.security_events(user_id, created_at DESC);
`;

// ─────────────────────────────────────────────────────────────────────────────
// MIGRATION 5 — duo_tasks status constraint (add waiting_approval + ready)
// ─────────────────────────────────────────────────────────────────────────────
const MIGRATION_5_DUO_TASKS_STATUS_CONSTRAINT = `
-- Drop existing constraint (idempotent)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'duo_tasks_status_check'
      AND conrelid = 'public.duo_tasks'::regclass
  ) THEN
    ALTER TABLE public.duo_tasks DROP CONSTRAINT duo_tasks_status_check;
  END IF;
END $$;

-- Re-add with full Phase B status set
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'duo_tasks_status_check'
      AND conrelid = 'public.duo_tasks'::regclass
  ) THEN
    ALTER TABLE public.duo_tasks
      ADD CONSTRAINT duo_tasks_status_check
      CHECK (status IN (
        'pending',
        'running',
        'completed',
        'failed',
        'skipped',
        'blocked',
        'waiting_approval',
        'ready'
      ));
  END IF;
END $$;
`;

// ─────────────────────────────────────────────────────────────────────────────
// SQL statement splitter — handles $$ dollar-quoted blocks correctly
// ─────────────────────────────────────────────────────────────────────────────

function splitStatements(sql) {
  const statements = [];
  let current = '';
  let inDollarQuote = false;
  let dollarTag = '';
  let i = 0;

  while (i < sql.length) {
    // Detect start/end of dollar-quoted string (e.g. $$ or $tag$)
    if (!inDollarQuote && sql[i] === '$') {
      // Find the matching closing $
      const end = sql.indexOf('$', i + 1);
      if (end !== -1) {
        const tag = sql.slice(i, end + 1); // e.g. '$$' or '$body$'
        inDollarQuote = true;
        dollarTag = tag;
        current += tag;
        i = end + 1;
        continue;
      }
    } else if (inDollarQuote) {
      // Look for the closing dollar tag
      if (sql.startsWith(dollarTag, i)) {
        current += dollarTag;
        i += dollarTag.length;
        inDollarQuote = false;
        dollarTag = '';
        continue;
      }
    }

    if (!inDollarQuote && sql[i] === ';') {
      const stmt = current.trim();
      if (stmt.length > 0) statements.push(stmt + ';');
      current = '';
      i++;
      continue;
    }

    current += sql[i];
    i++;
  }
  const stmt = current.trim();
  if (stmt.length > 0) statements.push(stmt);
  return statements;
}

// ─────────────────────────────────────────────────────────────────────────────
// Runner
// ─────────────────────────────────────────────────────────────────────────────

const MIGRATIONS = [
  { name: 'Migration 1 — Phase A catch-up (PA-01 to PA-04)',                    sql: MIGRATION_1_PHASE_A_CATCHUP },
  { name: 'Migration 2 — Phase B consolidation (PB-S-01 to PB-S-04)',           sql: MIGRATION_2_PHASE_B_CONSOLIDATION },
  { name: 'Migration 3 — Phase B core tables (PB-01 to PB-13)',                 sql: MIGRATION_3_PHASE_B_CORE },
  { name: 'Migration 4 — Phase B ops tables (PB-14 to PB-22)',                  sql: MIGRATION_4_PHASE_B_OPS },
  { name: 'Migration 5 — duo_tasks status constraint (waiting_approval + ready)', sql: MIGRATION_5_DUO_TASKS_STATUS_CONSTRAINT },
];

async function run() {
  const client = new Client(DB);

  console.log('Connecting to Supabase (session-mode pooler)…');
  await client.connect();
  console.log('Connected.\n');

  for (const { name, sql } of MIGRATIONS) {
    console.log(`▶ Running: ${name}`);
    const statements = splitStatements(sql).filter(s => s.replace(/;$/, '').trim().length > 0);
    let failed = 0;
    for (const stmt of statements) {
      try {
        await client.query(stmt);
      } catch (err) {
        failed++;
        const preview = stmt.replace(/\s+/g, ' ').slice(0, 80);
        console.error(`  ⚠  Statement failed: ${err.message.split('\n')[0]}`);
        console.error(`     SQL: ${preview}…`);
      }
    }
    if (failed === 0) {
      console.log(`  ✅ Done (${statements.length} statements)\n`);
    } else {
      console.log(`  ⚠  Done with ${failed} warning(s) out of ${statements.length} statements\n`);
    }
  }

  // Verify key tables exist
  console.log('─── Verification ───────────────────────────────');
  const CHECK_TABLES = [
    'job_runs', 'duo_task_edges', 'duo_artifacts', 'duo_external_refs',
    'duo_outcomes', 'duo_tool_calls', 'stream_events', 'duo_dashboard_widgets',
    'user_connectors', 'connector_secrets', 'tool_capabilities',
    'platform_automation_policy', 'tool_candidates', 'playbooks',
    'agent_job_queue', 'budget_policies', 'self_reports', 'self_heal_proposals',
    'security_events',
  ];

  const { rows } = await client.query(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = ANY($1)`,
    [CHECK_TABLES]
  );
  const found = new Set(rows.map(r => r.tablename));

  for (const t of CHECK_TABLES) {
    console.log(`  ${found.has(t) ? '✅' : '❌'} ${t}`);
  }

  // Verify new columns on key tables
  console.log('\n─── Column checks ──────────────────────────────');
  const COL_CHECKS = [
    ['memory_events',       'confidence'],
    ['memory_events',       'source'],
    ['signals',             'capsule_status'],
    ['api_usage_events',    'cost_gbp'],
    ['duo_projects',        'goal'],
    ['duo_projects',        'trace_id'],
    ['duo_projects',        'verbosity'],
    ['duo_tasks',           'selected_route'],
    ['duo_tasks',           'idempotency_key'],
    ['duo_timeline_events', 'summary'],
    ['duo_timeline_events', 'trace_id'],
    ['action_approvals',    'preview_content'],
    ['action_approvals',    'project_id'],
  ];

  const { rows: colRows } = await client.query(
    `SELECT table_name, column_name FROM information_schema.columns
     WHERE table_schema = 'public'
     AND (table_name, column_name) = ANY(
       SELECT unnest($1::text[]), unnest($2::text[])
     )`,
    [COL_CHECKS.map(c => c[0]), COL_CHECKS.map(c => c[1])]
  );
  const foundCols = new Set(colRows.map(r => `${r.table_name}.${r.column_name}`));
  for (const [t, c] of COL_CHECKS) {
    console.log(`  ${foundCols.has(`${t}.${c}`) ? '✅' : '❌'} ${t}.${c}`);
  }

  await client.end();
  console.log('\nDone.');
}

run().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
