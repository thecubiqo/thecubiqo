-- ============================================================
-- Migration: Draft phase in task execution + permission enforcement
-- ============================================================

-- 1. Add 'draft' to duo_tasks status enum
--    Postgres enums require ADD VALUE; cannot use ALTER TABLE check constraint swap
--    because check constraints on text columns are easier to change.
--    The current schema uses a text column with a check — add draft to it.

ALTER TABLE public.duo_tasks
  DROP CONSTRAINT IF EXISTS duo_tasks_status_check;

ALTER TABLE public.duo_tasks
  ADD CONSTRAINT duo_tasks_status_check
  CHECK (status IN (
    'pending', 'ready', 'running',
    'draft',           -- NEW: draft artifact produced, awaiting user review
    'waiting_user', 'waiting_approval',
    'completed', 'failed', 'skipped', 'blocked'
  ));

-- 2. Add approval_type 'draft_review' to duo_approvals
ALTER TABLE public.duo_approvals
  DROP CONSTRAINT IF EXISTS duo_approvals_approval_type_check;

ALTER TABLE public.duo_approvals
  ADD CONSTRAINT duo_approvals_approval_type_check
  CHECK (approval_type IN (
    'external_action',
    'draft_review',    -- NEW: user reviews draft before write phase
    'budget_override',
    'data_deletion',
    'permission_grant'
  ));

-- 3. Add metadata column to duo_approvals for artifact links
ALTER TABLE public.duo_approvals
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}';

-- 4. Add 'draft' artifact_type to duo_artifacts
ALTER TABLE public.duo_artifacts
  DROP CONSTRAINT IF EXISTS duo_artifacts_artifact_type_check;

-- (most schemas use unconstrained text for artifact_type — skip if column is free text)

-- 5. Ensure user_permissions has all columns for enforcement
ALTER TABLE public.user_permissions
  ADD COLUMN IF NOT EXISTS browser_access text NOT NULL DEFAULT 'pending'
    CHECK (browser_access IN ('granted', 'denied', 'pending')),
  ADD COLUMN IF NOT EXISTS file_access text NOT NULL DEFAULT 'pending'
    CHECK (file_access IN ('granted', 'denied', 'pending')),
  ADD COLUMN IF NOT EXISTS external_app_access text NOT NULL DEFAULT 'pending'
    CHECK (external_app_access IN ('granted', 'denied', 'pending')),
  ADD COLUMN IF NOT EXISTS browser_access_granted_at timestamptz,
  ADD COLUMN IF NOT EXISTS file_access_granted_at timestamptz,
  ADD COLUMN IF NOT EXISTS external_app_access_granted_at timestamptz;

-- 6. Index to speed up permission lookups in hot paths
CREATE INDEX IF NOT EXISTS user_permissions_user_id_idx
  ON public.user_permissions (user_id);
