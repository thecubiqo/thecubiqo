-- Migration: 20260516002000_user_ai_profile_rgy_scoring.sql
-- Adds RGY scoring columns and onboarding intake fields to user_ai_profile.
-- Also backfills missing structured profile columns from the full spec.
-- Sources: CubiQo-RGY-System.md §5, CubiQo-Onboarding-FuncReq.md §2, CubiQo-Master-Reference.md

-- ─────────────────────────────────────────────────────────────────────────────
-- § 1 — RGY Composite Scoring (canonical three computed values)
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.user_ai_profile
  -- rgy_score: composite engagement health score 0–100
  -- Formula: (green_ratio × 100) − (red_ratio × 25)
  -- 100 = fully green, 75 = balanced, 50 = default/new user, 0 = fully red
  ADD COLUMN IF NOT EXISTS rgy_score numeric(5,2) DEFAULT 50.00,

  -- rgy_questioned_rate: proportion of AI color assignments that user disagreed with
  -- 0.0 = full agreement, 1.0 = user overrides every classification
  -- High value (>0.3) triggers "recalibrate persona" intervention
  ADD COLUMN IF NOT EXISTS rgy_questioned_rate numeric(5,4) DEFAULT 0.00,

  -- rgy_map: per-activity RGY self-assignments from Onboarding Q7 + Memory screen
  -- JSON shape: { "gym": "green", "client calls": "yellow", "admin": "red" }
  ADD COLUMN IF NOT EXISTS rgy_map jsonb DEFAULT '{}';

-- ─────────────────────────────────────────────────────────────────────────────
-- § 2 — Full RGY distribution fields (used by classifier and dashboard)
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.user_ai_profile
  -- Rolling distribution snapshot, refreshed by rgy-scorer cron
  -- Shape: { "green": 0.52, "red": 0.18, "yellow": 0.30 }
  ADD COLUMN IF NOT EXISTS rgy_ratio jsonb DEFAULT '{"green":0.33,"red":0.33,"yellow":0.34}',
  -- Dominant colour for quick dashboard rendering
  ADD COLUMN IF NOT EXISTS rgy_dominance text DEFAULT 'balanced',
  -- Trend for AV tone-of-voice decisions
  ADD COLUMN IF NOT EXISTS rgy_trend text DEFAULT 'stabilising';

-- ─────────────────────────────────────────────────────────────────────────────
-- § 3 — Onboarding intake fields (Onboarding Q2–Q6 → user_ai_profile)
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.user_ai_profile
  -- Q2: occupation category (Business Owner, Student, Employee, Freelancer, etc.)
  ADD COLUMN IF NOT EXISTS occupation text,
  -- Q3: primary focus domain (Health & Fitness, Work & Career, Finance, etc.)
  ADD COLUMN IF NOT EXISTS goal_domain text,
  -- Q4: multi-select primary drives (e.g. ['money', 'freedom', 'purpose'])
  ADD COLUMN IF NOT EXISTS primary_drive_list text[],
  -- Q6: interest tags (e.g. ['football', 'cars', 'cooking'])
  ADD COLUMN IF NOT EXISTS interests text[];

-- ─────────────────────────────────────────────────────────────────────────────
-- § 4 — Routing constraints (for decision router in DuoMode)
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.user_ai_profile
  -- Global constraints applied to ALL tasks for this user
  -- Shape: { "local_only": true, "no_shell": false, "no_browser": false }
  ADD COLUMN IF NOT EXISTS global_constraints jsonb DEFAULT '{}';

-- ─────────────────────────────────────────────────────────────────────────────
-- § 5 — Constraints: rgy_trend check
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_ai_profile_rgy_dominance_check'
      AND conrelid = 'public.user_ai_profile'::regclass
  ) THEN
    ALTER TABLE public.user_ai_profile
      ADD CONSTRAINT user_ai_profile_rgy_dominance_check
      CHECK (rgy_dominance IN ('green', 'red', 'yellow', 'balanced'));
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_ai_profile_rgy_trend_check'
      AND conrelid = 'public.user_ai_profile'::regclass
  ) THEN
    ALTER TABLE public.user_ai_profile
      ADD CONSTRAINT user_ai_profile_rgy_trend_check
      CHECK (rgy_trend IN ('stabilising', 'shifting_red', 'shifting_green', 'disengaging'));
  END IF;
END
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Index: fast score lookup for proactive AI intervention queries
-- ─────────────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS user_ai_profile_rgy_score_idx
  ON public.user_ai_profile(rgy_score);

CREATE INDEX IF NOT EXISTS user_ai_profile_questioned_rate_idx
  ON public.user_ai_profile(rgy_questioned_rate)
  WHERE rgy_questioned_rate > 0.2;
