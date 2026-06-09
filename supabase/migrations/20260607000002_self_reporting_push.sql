-- ============================================================
-- Migration: Self-reporting push infrastructure (P3)
-- ============================================================
-- Enables push-not-pull health alerts from the agent-worker cron.
-- The cron writes self_report_alert rows to notifications table.
-- New: budget_events.amount_gbp column (if missing), job_runs.job_name
--       column (if missing), and the dead_letter_jobs trace_id column.
-- ============================================================

-- 1. Ensure budget_events has amount_gbp (some deploys may have amount_usd only)
ALTER TABLE public.budget_events
  ADD COLUMN IF NOT EXISTS amount_gbp numeric(10, 6) NOT NULL DEFAULT 0;

-- 2. Ensure dead_letter_jobs has all columns the worker uses
ALTER TABLE public.dead_letter_jobs
  ADD COLUMN IF NOT EXISTS trace_id uuid,
  ADD COLUMN IF NOT EXISTS job_type text NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS error_history jsonb NOT NULL DEFAULT '[]';

-- 3. Ensure job_runs has every column the worker + health view reference
--    (older installs created job_runs without started_at/status).
ALTER TABLE public.job_runs
  ADD COLUMN IF NOT EXISTS job_name text NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'running',
  ADD COLUMN IF NOT EXISTS started_at timestamptz DEFAULT now();

-- 4. Index to speed up health-check queries
CREATE INDEX IF NOT EXISTS dead_letter_jobs_created_at_idx
  ON public.dead_letter_jobs (created_at DESC);

CREATE INDEX IF NOT EXISTS job_runs_status_started_at_idx
  ON public.job_runs (status, started_at DESC);

CREATE INDEX IF NOT EXISTS notifications_user_type_read_idx
  ON public.notifications (user_id, type, read_at, created_at DESC);

-- 5. RLS: ensure service-role can write self_report_alert notifications
--    (existing RLS on notifications allows insert via service_role by default)
--    This is a no-op if the policy already exists.

-- 6. Materialised view (optional, for /admin/cron-health dashboard)
--    Shows last 24h health snapshot. Refreshed by admin endpoint.
CREATE OR REPLACE VIEW public.cron_health_24h AS
SELECT
  'dead_letter'  AS check_name,
  COUNT(*)       AS count,
  MAX(created_at)AS last_seen
FROM public.dead_letter_jobs
WHERE created_at >= NOW() - INTERVAL '24 hours'
UNION ALL
SELECT
  'job_failures',
  COUNT(*),
  MAX(started_at)
FROM public.job_runs
WHERE status = 'failed'
  AND started_at >= NOW() - INTERVAL '24 hours'
UNION ALL
SELECT
  'expired_connectors',
  COUNT(*),
  NULL::timestamptz   -- user_connectors has no updated_at in all installs
FROM public.user_connectors
WHERE status = 'expired'
UNION ALL
SELECT
  'pending_approvals_4h',
  COUNT(*),
  MAX(created_at)
FROM public.duo_approvals
WHERE status = 'requested'
  AND created_at < NOW() - INTERVAL '4 hours';
