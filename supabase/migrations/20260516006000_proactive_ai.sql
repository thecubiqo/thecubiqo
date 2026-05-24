-- Migration: 20260516006000_proactive_ai.sql
-- Adds ProactiveAI + Impact Layer schema:
--   1. capsule_outcomes  — post-completion evaluation table (NEW)
--   2. duo_projects      — success path columns (success_metrics, check_frequency,
--                          success_status, success_notes) [success_criteria already exists]
--   3. duo_tasks         — impact tracking column (estimated_minutes_saved)
-- Source: CubiQo-ProactiveAI-FuncReq.md §1 (success path), §4 (capsule outcomes)

-- ─────────────────────────────────────────────────────────────────────────────
-- § 1 — capsule_outcomes (new table)
-- Records post-capsule evaluation: was the project a success?
-- Written by the proactive AI worker after project closes (status = done/shot)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.capsule_outcomes (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Links back to the closed project
  project_id        uuid REFERENCES public.duo_projects(id) ON DELETE SET NULL,
  user_id           uuid REFERENCES auth.users(id) ON DELETE CASCADE,

  -- The success criteria as captured at project close (snapshot, not FK)
  success_criteria  text,

  -- AI-evaluated outcome
  outcome           text CHECK (outcome IN ('success', 'partial', 'stalled', 'abandoned')),

  -- Quantitative performance
  completion_days   int,        -- calendar days from created_at to closed_at
  tasks_completed   int,        -- tasks in status = 'completed' at close
  tasks_stalled     int,        -- tasks never reached 'completed'

  -- Root cause analysis
  primary_blocker   text,       -- AI-identified main reason if not 'success'

  -- User-facing feedback (shown in Memory screen and future impact dashboard)
  user_rating       int CHECK (user_rating BETWEEN 1 AND 5),
  ai_notes          text,       -- short narrative from CubiQo on what happened

  created_at        timestamptz DEFAULT now()
);

ALTER TABLE public.capsule_outcomes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own capsule outcomes" ON public.capsule_outcomes;
CREATE POLICY "Users read own capsule outcomes"
  ON public.capsule_outcomes FOR SELECT
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS capsule_outcomes_user_outcome_idx
  ON public.capsule_outcomes(user_id, outcome, created_at DESC);

CREATE INDEX IF NOT EXISTS capsule_outcomes_project_idx
  ON public.capsule_outcomes(project_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- § 2 — duo_projects: success path additions
-- Note: success_criteria already exists as text[] (from 20260514000000_phase_b_agentic_core.sql)
-- We add the remaining 4 success path columns here.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.duo_projects
  -- Measurable indicators for AI to evaluate progress against
  -- Shape: [{"metric": "revenue", "target": 1000, "unit": "GBP"}, ...]
  ADD COLUMN IF NOT EXISTS success_metrics   jsonb,

  -- How often the AI checks on project health
  ADD COLUMN IF NOT EXISTS check_frequency   text DEFAULT 'weekly',

  -- AI-assessed current trajectory (updated by proactive check-in worker)
  ADD COLUMN IF NOT EXISTS success_status    text DEFAULT 'on_track',

  -- Running AI commentary on why the status was assigned
  ADD COLUMN IF NOT EXISTS success_notes     text;

-- Add check constraint for success_status (idempotent via DO block)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'duo_projects_success_status_check'
      AND conrelid = 'public.duo_projects'::regclass
  ) THEN
    ALTER TABLE public.duo_projects
      ADD CONSTRAINT duo_projects_success_status_check
      CHECK (success_status IN ('on_track', 'at_risk', 'off_track', 'achieved', 'abandoned'));
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'duo_projects_check_frequency_check'
      AND conrelid = 'public.duo_projects'::regclass
  ) THEN
    ALTER TABLE public.duo_projects
      ADD CONSTRAINT duo_projects_check_frequency_check
      CHECK (check_frequency IN ('daily', 'weekly', 'milestone'));
  END IF;
END
$$;

-- Index for proactive AI worker: find at-risk and off-track projects to intervene on
CREATE INDEX IF NOT EXISTS duo_projects_success_status_idx
  ON public.duo_projects(user_id, success_status, updated_at DESC)
  WHERE success_status IN ('at_risk', 'off_track');

-- ─────────────────────────────────────────────────────────────────────────────
-- § 3 — duo_tasks: impact tracking
-- Estimated time saved is set by the AI when creating or completing a task.
-- Used by the impact layer to show cumulative time-saved in the user's dashboard.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.duo_tasks
  -- Minutes of user time this task saves vs. doing it manually
  -- Null = not estimated; 0 = no saving; positive = time saved
  ADD COLUMN IF NOT EXISTS estimated_minutes_saved int;

-- Index for impact dashboard aggregate query:
-- SELECT user_id, SUM(estimated_minutes_saved) FROM duo_tasks
-- WHERE status = 'completed' AND estimated_minutes_saved IS NOT NULL
-- GROUP BY user_id
CREATE INDEX IF NOT EXISTS duo_tasks_user_completed_savings_idx
  ON public.duo_tasks(user_id, estimated_minutes_saved)
  WHERE status IN ('completed', 'done') AND estimated_minutes_saved IS NOT NULL;
