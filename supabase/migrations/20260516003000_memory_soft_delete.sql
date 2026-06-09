-- Migration: 20260516003000_memory_soft_delete.sql
-- Adds soft-delete support to memory_events.
-- Source: CubiQo-UI-Architecture.md Screen 11 — Memory Management
--
-- Design:
--   deleted_at IS NULL  → active, visible to user and AI
--   deleted_at IS NOT NULL → soft-deleted, hidden from standard queries
--   Permanent delete cron runs after 30-day grace period (job_name: 'memory_purge_expired')
--
-- All queries reading memory_events MUST add: WHERE deleted_at IS NULL

ALTER TABLE public.memory_events
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Partial index: only covers non-deleted rows (the 99%+ case)
-- Keeps the index small; the soft-deleted tail is ignored at query time
CREATE INDEX IF NOT EXISTS memory_events_active_idx
  ON public.memory_events(user_id, weight DESC, created_at DESC)
  WHERE deleted_at IS NULL;

-- Separate index for the purge cron: find all rows eligible for permanent deletion
-- (deleted >30 days ago)
CREATE INDEX IF NOT EXISTS memory_events_purge_eligible_idx
  ON public.memory_events(deleted_at)
  WHERE deleted_at IS NOT NULL;

-- Comment: the memory hard-delete cron query is:
--   DELETE FROM public.memory_events
--   WHERE deleted_at IS NOT NULL
--     AND deleted_at < now() - interval '30 days';
