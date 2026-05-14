-- Expand duo_tasks.status check constraint to include Phase B approval-flow values.
-- Phase B worker sets status to 'waiting_approval' (task paused for user decision)
-- and 'ready' (approval granted, task cleared to resume).
-- The original constraint from 20260513010000_phase_b_agentic_foundation.sql only
-- covered: pending | running | completed | failed | skipped | blocked

-- Drop the existing constraint (idempotent — no-op if already dropped/renamed)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'duo_tasks_status_check'
      AND conrelid = 'public.duo_tasks'::regclass
  ) THEN
    ALTER TABLE public.duo_tasks DROP CONSTRAINT duo_tasks_status_check;
  END IF;
END $$;

-- Re-add with the full Phase B status set
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
