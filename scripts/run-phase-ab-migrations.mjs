/**
 * CubiQo Phase A/B Migration Runner
 * Runs all catch-up and Phase B foundation migrations against live Supabase DB.
 * Uses direct connection (port 5432) — not PgBouncer — for DDL safety.
 */

import { readFileSync } from 'node:fs';
import pg from 'pg';
const { Client } = pg;

function loadEnvFile(path) {
  try {
    const text = readFileSync(path, 'utf8');
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
      const index = trimmed.indexOf('=');
      const key = trimmed.slice(0, index);
      const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, '');
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch {
    // Optional env file.
  }
}

loadEnvFile(process.env.PHASE_AB_ENV_FILE || '.env.vercel.goodfeatureslegacy.local');
loadEnvFile('.env.local');

const databaseUrl = process.env.DATABASE_URL?.trim().replace(/^['"]|['"]$/g, '');
if (!databaseUrl) {
  throw new Error(
    'DATABASE_URL is required. Pull the branch env with `vercel env pull .env.vercel.goodfeatureslegacy.local --environment=preview --git-branch goodfeatureslegacy`.'
  );
}

const DB = {
  connectionString: databaseUrl,
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
// MIGRATION 6 — RGY schema additions
// user_ai_profile: rgy_ratio, rgy_dominance, rgy_trend
// capsule_briefings: color, keyword, intent
// ─────────────────────────────────────────────────────────────────────────────
const MIGRATION_6_RGY_SCHEMA = `
-- RGY behavioural fingerprint on user_ai_profile
ALTER TABLE public.user_ai_profile
  ADD COLUMN IF NOT EXISTS rgy_ratio      jsonb DEFAULT '{"green":0,"red":0,"yellow":0}',
  ADD COLUMN IF NOT EXISTS rgy_dominance  text  DEFAULT 'balanced',
  ADD COLUMN IF NOT EXISTS rgy_trend      text  DEFAULT 'stabilising';

-- RGY capsule fingerprint on capsule_briefings
ALTER TABLE public.capsule_briefings
  ADD COLUMN IF NOT EXISTS color    text DEFAULT 'yellow',
  ADD COLUMN IF NOT EXISTS keyword  text,
  ADD COLUMN IF NOT EXISTS intent   text;
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
// MIGRATION 7 — Profile extensions (Social identity + AI identity + onboarding)
// ─────────────────────────────────────────────────────────────────────────────
const MIGRATION_7_PROFILE_EXTENSIONS = `
-- Social Layer identity
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS age_range             text,
  ADD COLUMN IF NOT EXISTS cq_number             text,
  ADD COLUMN IF NOT EXISTS username              text,
  ADD COLUMN IF NOT EXISTS username_set          boolean     DEFAULT false,
  ADD COLUMN IF NOT EXISTS cubiqo_phone_number   text,
  ADD COLUMN IF NOT EXISTS phone_call_consent    boolean     DEFAULT false,
  ADD COLUMN IF NOT EXISTS sms_consent           boolean     DEFAULT false,
  ADD COLUMN IF NOT EXISTS cubiqo_email          text,
  ADD COLUMN IF NOT EXISTS email_briefing_consent boolean    DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_briefing_time   time,
  ADD COLUMN IF NOT EXISTS preferred_briefing_time time      DEFAULT '08:00';

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_cq_number_key' AND conrelid = 'public.profiles'::regclass) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_cq_number_key UNIQUE (cq_number);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_username_key' AND conrelid = 'public.profiles'::regclass) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_key UNIQUE (username);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS profiles_cq_number_idx ON public.profiles(cq_number) WHERE cq_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles(lower(username)) WHERE username IS NOT NULL;
`;

// ─────────────────────────────────────────────────────────────────────────────
// MIGRATION 8 — user_ai_profile RGY scoring + onboarding intake fields
// ─────────────────────────────────────────────────────────────────────────────
const MIGRATION_8_USER_AI_PROFILE_RGY = `
ALTER TABLE public.user_ai_profile
  ADD COLUMN IF NOT EXISTS rgy_score           numeric(5,2) DEFAULT 50.00,
  ADD COLUMN IF NOT EXISTS rgy_questioned_rate numeric(5,4) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS rgy_map             jsonb        DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS occupation          text,
  ADD COLUMN IF NOT EXISTS goal_domain         text,
  ADD COLUMN IF NOT EXISTS primary_drive_list  text[],
  ADD COLUMN IF NOT EXISTS interests           text[],
  ADD COLUMN IF NOT EXISTS global_constraints  jsonb        DEFAULT '{}';

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_ai_profile_rgy_dominance_check' AND conrelid = 'public.user_ai_profile'::regclass) THEN
    ALTER TABLE public.user_ai_profile ADD CONSTRAINT user_ai_profile_rgy_dominance_check CHECK (rgy_dominance IN ('green','red','yellow','balanced'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS user_ai_profile_rgy_score_idx ON public.user_ai_profile(rgy_score);
`;

// ─────────────────────────────────────────────────────────────────────────────
// MIGRATION 9 — Memory soft-delete
// ─────────────────────────────────────────────────────────────────────────────
const MIGRATION_9_MEMORY_SOFT_DELETE = `
ALTER TABLE public.memory_events
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE INDEX IF NOT EXISTS memory_events_active_idx
  ON public.memory_events(user_id, weight DESC, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS memory_events_purge_eligible_idx
  ON public.memory_events(deleted_at)
  WHERE deleted_at IS NOT NULL;
`;

// ─────────────────────────────────────────────────────────────────────────────
// MIGRATION 10 — Social layer (DMs, chatrooms, friends)
// ─────────────────────────────────────────────────────────────────────────────
const MIGRATION_10_SOCIAL_LAYER = `
CREATE TABLE IF NOT EXISTS public.cq_threads (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cq_thread_members (
  thread_id uuid REFERENCES public.cq_threads(id) ON DELETE CASCADE,
  user_id   uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  PRIMARY KEY (thread_id, user_id)
);
ALTER TABLE public.cq_thread_members ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cq_thread_members' AND policyname = 'Users read own thread memberships') THEN
    EXECUTE 'CREATE POLICY "Users read own thread memberships" ON public.cq_thread_members FOR SELECT USING (auth.uid() = user_id)';
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS cq_thread_members_user_idx ON public.cq_thread_members(user_id);

CREATE TABLE IF NOT EXISTS public.cq_messages (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id    uuid REFERENCES public.cq_threads(id) ON DELETE CASCADE NOT NULL,
  sender_id    uuid REFERENCES auth.users(id),
  message_type text NOT NULL CHECK (message_type IN ('text','file','audio','video')),
  content      text,
  storage_path text,
  reply_to_id  uuid REFERENCES public.cq_messages(id),
  read_at      timestamptz,
  delivered_at timestamptz DEFAULT now(),
  created_at   timestamptz DEFAULT now()
);
ALTER TABLE public.cq_messages ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cq_messages' AND policyname = 'Thread members read messages') THEN
    EXECUTE 'CREATE POLICY "Thread members read messages" ON public.cq_messages FOR SELECT USING (EXISTS (SELECT 1 FROM public.cq_thread_members WHERE thread_id = cq_messages.thread_id AND user_id = auth.uid()))';
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cq_messages' AND policyname = 'Users send own messages') THEN
    EXECUTE 'CREATE POLICY "Users send own messages" ON public.cq_messages FOR INSERT WITH CHECK (auth.uid() = sender_id AND EXISTS (SELECT 1 FROM public.cq_thread_members WHERE thread_id = cq_messages.thread_id AND user_id = auth.uid()))';
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS cq_messages_thread_created_idx ON public.cq_messages(thread_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.cq_chatrooms (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  slug         text UNIQUE,
  rgy_color    text NOT NULL CHECK (rgy_color IN ('green','red','yellow')),
  intent       text NOT NULL CHECK (intent IN ('socialize','collaborate','barter_trade')),
  topic_tag    text,
  description  text,
  member_count int DEFAULT 0,
  created_at   timestamptz DEFAULT now()
);
INSERT INTO public.cq_chatrooms (name, slug, rgy_color, intent, description) VALUES
  ('Green Socials',    'green-socials',    'green',  'socialize',    'Celebrate wins and connect with others on a high'),
  ('Green Builders',   'green-builders',   'green',  'collaborate',  'Find accountability partners and collaborators'),
  ('Green Marketplace','green-marketplace','green',  'barter_trade', 'Trade skills and services with momentum'),
  ('Yellow Commons',   'yellow-commons',   'yellow', 'socialize',    'Chat and find others in the middle ground'),
  ('Yellow Workshop',  'yellow-workshop',  'yellow', 'collaborate',  'Work through blockers with accountability'),
  ('Yellow Exchange',  'yellow-exchange',  'yellow', 'barter_trade', 'Swap help, advice, and micro-tasks'),
  ('Red Lounge',       'red-lounge',       'red',    'socialize',    'Honest space for hard days — no toxic positivity'),
  ('Red Squad',        'red-squad',        'red',    'collaborate',  'Find a recovery buddy to climb back together'),
  ('Red Rescue',       'red-rescue',       'red',    'barter_trade', 'Offer or receive small acts of help')
ON CONFLICT (slug) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.cq_chatroom_messages (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chatroom_id      uuid REFERENCES public.cq_chatrooms(id) ON DELETE CASCADE NOT NULL,
  sender_id        uuid REFERENCES auth.users(id),
  username_at_send text NOT NULL,
  content          text NOT NULL,
  reply_to_id      uuid REFERENCES public.cq_chatroom_messages(id),
  created_at       timestamptz DEFAULT now()
);
ALTER TABLE public.cq_chatroom_messages ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cq_chatroom_messages' AND policyname = 'Authenticated users read chatroom messages') THEN
    EXECUTE 'CREATE POLICY "Authenticated users read chatroom messages" ON public.cq_chatroom_messages FOR SELECT USING (auth.uid() IS NOT NULL)';
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cq_chatroom_messages' AND policyname = 'Users write own chatroom messages') THEN
    EXECUTE 'CREATE POLICY "Users write own chatroom messages" ON public.cq_chatroom_messages FOR INSERT WITH CHECK (auth.uid() = sender_id)';
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS cq_chatroom_messages_room_created_idx ON public.cq_chatroom_messages(chatroom_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.cq_friendships (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  addressee_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status       text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined','blocked')),
  thread_id    uuid REFERENCES public.cq_threads(id),
  created_at   timestamptz DEFAULT now(),
  responded_at timestamptz,
  CONSTRAINT cq_friendships_pair_unique UNIQUE (requester_id, addressee_id)
);
ALTER TABLE public.cq_friendships ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cq_friendships' AND policyname = 'Users manage own friendships') THEN
    EXECUTE 'CREATE POLICY "Users manage own friendships" ON public.cq_friendships FOR ALL USING (auth.uid() = requester_id OR auth.uid() = addressee_id)';
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS cq_friendships_addressee_status_idx ON public.cq_friendships(addressee_id, status) WHERE status = 'pending';
`;

// ─────────────────────────────────────────────────────────────────────────────
// MIGRATION 11 — Notifications system
// ─────────────────────────────────────────────────────────────────────────────
const MIGRATION_11_NOTIFICATIONS = `
CREATE TABLE IF NOT EXISTS public.notifications (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type                   text NOT NULL,
  title                  text NOT NULL,
  body                   text,
  action_url             text,
  action_label           text,
  secondary_action_url   text,
  secondary_action_label text,
  channel                text[] DEFAULT ARRAY['in_app'],
  read_at                timestamptz,
  actioned_at            timestamptz,
  created_at             timestamptz DEFAULT now(),
  expires_at             timestamptz
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Users read own notifications') THEN
    EXECUTE 'CREATE POLICY "Users read own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id)';
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Users update own notifications') THEN
    EXECUTE 'CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)';
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS notifications_user_unread_idx ON public.notifications(user_id, created_at DESC) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS notifications_user_created_idx ON public.notifications(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id       uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  preferences   jsonb DEFAULT '{}',
  dnd_start     time,
  dnd_end       time,
  briefing_call boolean DEFAULT false,
  urgent_call   boolean DEFAULT false,
  wakeup_call   boolean DEFAULT false,
  updated_at    timestamptz DEFAULT now()
);
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notification_preferences' AND policyname = 'Users manage own notification preferences') THEN
    EXECUTE 'CREATE POLICY "Users manage own notification preferences" ON public.notification_preferences FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)';
  END IF;
END $$;
`;

// ─────────────────────────────────────────────────────────────────────────────
// MIGRATION 12 — Proactive AI + Impact Layer
// ─────────────────────────────────────────────────────────────────────────────
const MIGRATION_12_PROACTIVE_AI = `
CREATE TABLE IF NOT EXISTS public.capsule_outcomes (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id       uuid REFERENCES public.duo_projects(id) ON DELETE SET NULL,
  user_id          uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  success_criteria text,
  outcome          text CHECK (outcome IN ('success','partial','stalled','abandoned')),
  completion_days  int,
  tasks_completed  int,
  tasks_stalled    int,
  primary_blocker  text,
  user_rating      int CHECK (user_rating BETWEEN 1 AND 5),
  ai_notes         text,
  created_at       timestamptz DEFAULT now()
);
ALTER TABLE public.capsule_outcomes ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'capsule_outcomes' AND policyname = 'Users read own capsule outcomes') THEN
    EXECUTE 'CREATE POLICY "Users read own capsule outcomes" ON public.capsule_outcomes FOR SELECT USING (auth.uid() = user_id)';
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS capsule_outcomes_user_idx ON public.capsule_outcomes(user_id, outcome, created_at DESC);

ALTER TABLE public.duo_projects
  ADD COLUMN IF NOT EXISTS success_metrics  jsonb,
  ADD COLUMN IF NOT EXISTS check_frequency  text DEFAULT 'weekly',
  ADD COLUMN IF NOT EXISTS success_status   text DEFAULT 'on_track',
  ADD COLUMN IF NOT EXISTS success_notes    text;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'duo_projects_success_status_check' AND conrelid = 'public.duo_projects'::regclass) THEN
    ALTER TABLE public.duo_projects ADD CONSTRAINT duo_projects_success_status_check CHECK (success_status IN ('on_track','at_risk','off_track','achieved','abandoned'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS duo_projects_success_status_idx ON public.duo_projects(user_id, success_status) WHERE success_status IN ('at_risk','off_track');

ALTER TABLE public.duo_tasks
  ADD COLUMN IF NOT EXISTS estimated_minutes_saved int;
`;

// ─────────────────────────────────────────────────────────────────────────────
// MIGRATION 13 — Feature profile extensions (RGY Chatrooms + MediaGen)
// ─────────────────────────────────────────────────────────────────────────────
const MIGRATION_13_FEATURE_PROFILE_EXTENSIONS = `
-- RGY Chatrooms: RED tier age gate flag (no raw DOB stored)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS red_tier_age_confirmed  boolean DEFAULT false;

-- MediaGen: uncensored local generation consent flag
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS uncensored_media_enabled boolean DEFAULT false;

-- cq_chatroom_members — explicit room membership join table
CREATE TABLE IF NOT EXISTS public.cq_chatroom_members (
  chatroom_id     uuid REFERENCES public.cq_chatrooms(id) ON DELETE CASCADE,
  user_id         uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at       timestamptz DEFAULT now(),
  location_opt_in boolean DEFAULT false,
  PRIMARY KEY (chatroom_id, user_id)
);
ALTER TABLE public.cq_chatroom_members ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cq_chatroom_members' AND policyname = 'Users manage own chatroom memberships') THEN
    EXECUTE 'CREATE POLICY "Users manage own chatroom memberships" ON public.cq_chatroom_members FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)';
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS cq_chatroom_members_room_idx ON public.cq_chatroom_members(chatroom_id);

-- cq_chatroom_reactions — emoji reactions on chatroom messages
CREATE TABLE IF NOT EXISTS public.cq_chatroom_reactions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid REFERENCES public.cq_chatroom_messages(id) ON DELETE CASCADE NOT NULL,
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  emoji      text NOT NULL CHECK (char_length(emoji) <= 8),
  created_at timestamptz DEFAULT now(),
  UNIQUE (message_id, user_id, emoji)
);
ALTER TABLE public.cq_chatroom_reactions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cq_chatroom_reactions' AND policyname = 'Authenticated users manage reactions') THEN
    EXECUTE 'CREATE POLICY "Authenticated users manage reactions" ON public.cq_chatroom_reactions FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() = user_id)';
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS cq_chatroom_reactions_msg_idx ON public.cq_chatroom_reactions(message_id);
`;

// ─────────────────────────────────────────────────────────────────────────────
// MIGRATION 7 — Phase B alignment (canonical state/tool-call tables)
// ─────────────────────────────────────────────────────────────────────────────
const MIGRATION_7_PHASE_B_ALIGNMENT = readFileSync(
  new URL('../supabase/migrations/20260516000000_phase_b_alignment.sql', import.meta.url),
  'utf8',
);

const MIGRATION_15_ONBOARDING = readFileSync(
  new URL('../supabase/migrations/20260520_onboarding.sql', import.meta.url),
  'utf8',
);

const MIGRATION_16_RGY_SYSTEM = readFileSync(
  new URL('../supabase/migrations/20260520_rgy_system.sql', import.meta.url),
  'utf8',
);

const MIGRATION_17_RGY_CHATROOMS = readFileSync(
  new URL('../supabase/migrations/20260520_rgy_chatrooms.sql', import.meta.url),
  'utf8',
);

const MIGRATION_18_NOTIFICATIONS_PUSH = readFileSync(
  new URL('../supabase/migrations/20260520_notifications_push.sql', import.meta.url),
  'utf8',
);

const MIGRATION_19_DUOMODE_FIDELITY = readFileSync(
  new URL('../supabase/migrations/20260520_duomode_fidelity.sql', import.meta.url),
  'utf8',
);

const MIGRATION_20_BYOD = readFileSync(
  new URL('../supabase/migrations/20260520_byod.sql', import.meta.url),
  'utf8',
);

const MIGRATION_21_SOCIAL_LAYER_EXT = readFileSync(
  new URL('../supabase/migrations/20260520_social_layer_ext.sql', import.meta.url),
  'utf8',
);

const MIGRATION_22_MEDIA_GEN = readFileSync(
  new URL('../supabase/migrations/20260520_media_gen.sql', import.meta.url),
  'utf8',
);

const MIGRATION_23_PLATFORM_ARCHITECTURE = readFileSync(
  new URL('../supabase/migrations/20260516_platform_architecture.sql', import.meta.url),
  'utf8',
);

const MIGRATION_24_CONNECTOR_REGISTRY = readFileSync(
  new URL('../supabase/migrations/20260515_connector_registry.sql', import.meta.url),
  'utf8',
);

const MIGRATION_25_USER_CONNECTORS_EXTENDED = readFileSync(
  new URL('../supabase/migrations/20260515_user_connectors_extended.sql', import.meta.url),
  'utf8',
);

const MIGRATION_26_EXTENSION_TABLES = readFileSync(
  new URL('../supabase/migrations/20260515_extension_tables.sql', import.meta.url),
  'utf8',
);

const MIGRATION_27_DUO_MODE_PATCH = readFileSync(
  new URL('../supabase/migrations/20260516_duo_mode_patch.sql', import.meta.url),
  'utf8',
);

const MIGRATION_28_PHASE_AB_PROD_COMPATIBILITY = readFileSync(
  new URL('../supabase/migrations/20260523010000_phase_ab_prod_compatibility.sql', import.meta.url),
  'utf8',
);

const MIGRATION_29_SECURITY_WATCHDOG = readFileSync(
  new URL('../supabase/migrations/20260520_security_watchdog.sql', import.meta.url),
  'utf8',
);

const MIGRATION_30_PHASE_AB_FEATURE_DB_HARDENING = readFileSync(
  new URL('../supabase/migrations/20260523011000_phase_ab_feature_db_hardening.sql', import.meta.url),
  'utf8',
);

// ─────────────────────────────────────────────────────────────────────────────
// Runner
// ─────────────────────────────────────────────────────────────────────────────

const MIGRATIONS = [
  { name: 'Migration 1  — Phase A catch-up (PA-01 to PA-04)',                                               sql: MIGRATION_1_PHASE_A_CATCHUP },
  { name: 'Migration 2  — Phase B consolidation (PB-S-01 to PB-S-04)',                                      sql: MIGRATION_2_PHASE_B_CONSOLIDATION },
  { name: 'Migration 3  — Phase B core tables (PB-01 to PB-13)',                                            sql: MIGRATION_3_PHASE_B_CORE },
  { name: 'Migration 4  — Phase B ops tables (PB-14 to PB-22)',                                             sql: MIGRATION_4_PHASE_B_OPS },
  { name: 'Migration 5  — duo_tasks status constraint (waiting_approval + ready)',                           sql: MIGRATION_5_DUO_TASKS_STATUS_CONSTRAINT },
  { name: 'Migration 6  — RGY schema (rgy_ratio/dominance/trend + capsule color/keyword/intent)',            sql: MIGRATION_6_RGY_SCHEMA },
  { name: 'Migration 7  — Phase B alignment (agent_job_queue.state + agent_tool_calls)',                     sql: MIGRATION_7_PHASE_B_ALIGNMENT },
  { name: 'Migration 8  — Profile extensions (cq_number, username, AI identity phone/email, age_range)',    sql: MIGRATION_7_PROFILE_EXTENSIONS },
  { name: 'Migration 9  — user_ai_profile RGY scoring (rgy_score, rgy_questioned_rate, rgy_map)',           sql: MIGRATION_8_USER_AI_PROFILE_RGY },
  { name: 'Migration 10 — Memory soft-delete (deleted_at + purge indexes)',                                  sql: MIGRATION_9_MEMORY_SOFT_DELETE },
  { name: 'Migration 11 — Social layer (cq_threads, cq_messages, cq_chatrooms, cq_friendships)',            sql: MIGRATION_10_SOCIAL_LAYER },
  { name: 'Migration 12 — Notifications (notifications + notification_preferences)',                         sql: MIGRATION_11_NOTIFICATIONS },
  { name: 'Migration 13 — Proactive AI (capsule_outcomes + duo_projects success cols + tasks impact)',      sql: MIGRATION_12_PROACTIVE_AI },
  { name: 'Migration 14 — Feature profile extensions (red_tier_age_confirmed, uncensored_media_enabled, cq_chatroom_members, cq_chatroom_reactions)', sql: MIGRATION_13_FEATURE_PROFILE_EXTENSIONS },
  { name: 'Migration 15 — Onboarding progress/events (Sprint 2)',                                            sql: MIGRATION_15_ONBOARDING },
  { name: 'Migration 16 — RGY operational status system (Sprint 2)',                                         sql: MIGRATION_16_RGY_SYSTEM },
  { name: 'Migration 17 — RGY chatroom snapshots/aggregates (Sprint 2)',                                     sql: MIGRATION_17_RGY_CHATROOMS },
  { name: 'Migration 18 — Notification API compatibility (Sprint 3)',                                        sql: MIGRATION_18_NOTIFICATIONS_PUSH },
  { name: 'Migration 19 — DuoMode fidelity checker tables (Sprint 3)',                                       sql: MIGRATION_19_DUOMODE_FIDELITY },
  { name: 'Migration 20 — BYOD Supabase connections (Sprint 6)',                                             sql: MIGRATION_20_BYOD },
  { name: 'Migration 21 — Social follow/feed/reactions extension (Sprint 6)',                                sql: MIGRATION_21_SOCIAL_LAYER_EXT },
  { name: 'Migration 22 — Media generation queue/cache (Sprint 6)',                                          sql: MIGRATION_22_MEDIA_GEN },
  { name: 'Migration 23 — Surface sessions/router/handoff compatibility (SA-01 to SA-04)',                  sql: MIGRATION_23_PLATFORM_ARCHITECTURE },
  { name: 'Migration 24 — Connector registry and seeded platform map (Apps Mapping)',                        sql: MIGRATION_24_CONNECTOR_REGISTRY },
  { name: 'Migration 25 — User connector extensions and service-role token storage (Apps Mapping)',          sql: MIGRATION_25_USER_CONNECTORS_EXTENDED },
  { name: 'Migration 26 — Extension sessions, instructions, and OAuth states (Apps Mapping)',                sql: MIGRATION_26_EXTENSION_TABLES },
  { name: 'Migration 27 — DuoMode B4 status/realtime patch and analytics events',                            sql: MIGRATION_27_DUO_MODE_PATCH },
  { name: 'Migration 28 — Phase A/B production compatibility patch',                                          sql: MIGRATION_28_PHASE_AB_PROD_COMPATIBILITY },
  { name: 'Migration 29 — Security watchdog tables and policies',                                             sql: MIGRATION_29_SECURITY_WATCHDOG },
  { name: 'Migration 30 — Phase A/B feature-level DB hardening',                                               sql: MIGRATION_30_PHASE_AB_FEATURE_DB_HARDENING },
];

async function run() {
  const client = new Client(DB);

  const target = new URL(databaseUrl);
  console.log(`Connecting to Supabase (${target.host})…`);
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
    'duo_outcomes', 'duo_tool_calls', 'agent_tool_calls', 'stream_events', 'duo_dashboard_widgets',
    'user_connectors', 'connector_secrets', 'tool_capabilities',
    'platform_automation_policy', 'tool_candidates', 'playbooks',
    'agent_job_queue', 'budget_policies', 'self_reports', 'self_heal_proposals',
    'security_events', 'duo_questions', 'duo_blockers', 'duo_access_requests',
    // Migrations 7–12
    'cq_threads', 'cq_thread_members', 'cq_messages',
    'cq_chatrooms', 'cq_chatroom_messages', 'cq_friendships',
    'notifications', 'notification_preferences', 'capsule_outcomes',
    // Migration 13
    'cq_chatroom_members', 'cq_chatroom_reactions',
    // Sprint 2 canonical features
    'onboarding_progress', 'onboarding_events',
    'rgy_status', 'rgy_transitions', 'rgy_rules',
    'chatroom_rgy_snapshots', 'chatroom_rgy_aggregates',
    // Sprint 3 canonical features
    'duo_acceptance_tests', 'duo_test_runs', 'duo_test_results',
    // Sprint 6 canonical features
    'byod_connections', 'byod_sync_log',
    'social_connections', 'social_activity_feed', 'social_reactions',
    'media_generations', 'media_generation_queue',
    // Platform Architecture SA-01 to SA-04
    'surface_sessions',
    // Apps Mapping connector framework
    'connector_registry', 'extension_instructions', 'extension_sessions', 'oauth_states',
    // Conversion engine analytics
    'analytics_events',
    // Security watchdog + consent audit
    'security_rate_limits', 'security_ip_blocklist', 'tracking_consent_events',
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
    ['agent_job_queue',     'state'],
    ['agent_tool_calls',    'route_used'],
    ['agent_tool_calls',    'api_cost_gbp'],
    ['duo_timeline_events', 'summary'],
    ['duo_timeline_events', 'trace_id'],
    ['action_approvals',    'preview_content'],
    ['action_approvals',    'project_id'],
    ['user_ai_profile',     'rgy_ratio'],
    ['user_ai_profile',     'rgy_dominance'],
    ['user_ai_profile',     'rgy_trend'],
    ['capsule_briefings',   'color'],
    ['capsule_briefings',   'keyword'],
    ['capsule_briefings',   'intent'],
    // Migrations 7–12 column checks
    ['profiles',            'cq_number'],
    ['profiles',            'username'],
    ['profiles',            'age_range'],
    ['profiles',            'cubiqo_phone_number'],
    ['profiles',            'preferred_briefing_time'],
    ['user_ai_profile',     'rgy_score'],
    ['user_ai_profile',     'rgy_questioned_rate'],
    ['user_ai_profile',     'rgy_map'],
    ['memory_events',       'deleted_at'],
    ['duo_projects',        'success_status'],
    ['duo_projects',        'success_metrics'],
    ['duo_tasks',           'estimated_minutes_saved'],
    // Migration 13 column checks
    ['profiles',            'red_tier_age_confirmed'],
    ['profiles',            'uncensored_media_enabled'],
    // Sprint 2 column checks
    ['profiles',            'onboarding_done'],
    ['profiles',            'age_range'],
    ['onboarding_progress', 'answer_data'],
    ['rgy_status',          'score'],
    ['rgy_status',          'evaluated_at'],
    ['rgy_transitions',     'triggered_at'],
    ['chatroom_rgy_snapshots', 'rgy_score'],
    ['chatroom_rgy_aggregates', 'health_score'],
    // Sprint 3 column checks
    ['notifications',       'dismissed_at'],
    ['notifications',       'metadata'],
    ['push_notifications',  'metadata'],
    ['duo_test_runs',      'overall_pass'],
    ['duo_test_results',   'duration_ms'],
    // Sprint 6 column checks
    ['byod_connections',   'encrypted_service_role_key'],
    ['byod_connections',   'encryption_iv'],
    ['byod_connections',   'encryption_tag'],
    ['byod_connections',   'key_version'],
    ['byod_sync_log',      'sync_type'],
    ['social_connections', 'last_interaction_at'],
    ['social_activity_feed', 'actor_id'],
    ['social_reactions',   'target_type'],
    ['media_generations',  'provider'],
    ['media_generations',  'storage_url'],
    ['media_generation_queue', 'generation_id'],
    ['media_generation_queue', 'run_after'],
    // Platform Architecture SA-01 to SA-04
    ['surface_sessions',   'last_heartbeat'],
    ['surface_sessions',   'capabilities'],
    ['duo_tasks',          'assigned_surface'],
    ['duo_tasks',          'requires_capabilities'],
    ['duo_tasks',          'user_constraint'],
    ['duo_projects',       'user_constraints'],
    ['user_ai_profile',    'global_constraints'],
    ['duo_artifacts',      'type'],
    ['duo_artifacts',      'produced_by'],
    ['duo_artifacts',      'consumed_by'],
    ['duo_artifacts',      'expires_at'],
    ['duo_artifacts',      'consumed_at'],
    // Apps Mapping connector framework
    ['connector_registry', 'adapter_type'],
    ['connector_registry', 'oauth_default_scopes'],
    ['user_connectors',    'adapter_type'],
    ['user_connectors',    'token_expires_at'],
    ['user_connectors',    'ob_item_id'],
    ['user_connectors',    'health_status'],
    ['connector_secrets',  'access_token_encrypted'],
    ['connector_secrets',  'api_key_encrypted'],
    ['extension_instructions', 'actions'],
    ['extension_sessions', 'token'],
    ['oauth_states',      'expires_at'],
    ['analytics_events',  'event_type'],
    ['analytics_events',  'anon_session_id'],
    ['security_rate_limits', 'identifier'],
    ['security_rate_limits', 'blocked_until'],
    ['security_ip_blocklist', 'ip_address'],
    ['security_ip_blocklist', 'reason'],
    ['tracking_consent_events', 'consent_state'],
    ['tracking_consent_events', 'consent_scope'],
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
