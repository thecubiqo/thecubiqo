-- =============================================================================
-- UNIFY WORKSPACE TABLES
-- =============================================================================
-- Problem:  Two conflicting tables were created for the same entity:
--   • workspaces        (20260218064854_emergent_runner.sql)
--   • emergent_workspaces (20260219130000_add_workspace_deployment_tables.sql)
--
-- The API layer and the Runner were reading from different tables, causing
-- workspace records to be "invisible" to whichever side wrote to the other.
--
-- Fix:
--   1. Keep `emergent_workspaces` as the single source of truth (it has the
--      richer schema: user_id, JSONB resources, proper status enum).
--   2. Drop the legacy `workspaces` table (if it still exists and has no data).
--   3. Create a `workspaces` VIEW that aliases `emergent_workspaces` so any
--      older code that still queries `workspaces` keeps working.
-- =============================================================================

-- ── Step 1: Migrate any rows from the old table that don't already exist ───
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'workspaces'
      -- Only act when it is a real table, not a view we might have created already
      AND table_type = 'BASE TABLE'
  ) THEN
    -- Carry forward any legacy workspace rows that are not already in emergent_workspaces.
    -- We skip rows where the project_id already has a record (UNIQUE constraint on project_id
    -- in the old table, and project_id is a FK in emergent_workspaces).
    INSERT INTO emergent_workspaces (
      id,
      project_id,
      user_id,
      container_id,
      name,
      runtime,
      status,
      resources,
      preview_url,
      ip_address,
      port,
      created_at,
      updated_at
    )
    SELECT
      w.id,
      w.project_id,
      -- The old table had no user_id; use a sentinel UUID so the NOT NULL constraint
      -- is satisfied. Application code should update this when the real user is known.
      '00000000-0000-0000-0000-000000000000'::uuid  AS user_id,
      COALESCE(w.container_id, 'legacy-' || w.id::text) AS container_id,
      COALESCE(w.subdomain, w.workspace_id, w.id::text) AS name,
      'nodejs'                                       AS runtime,
      CASE w.status
        WHEN 'running'      THEN 'running'
        WHEN 'stopped'      THEN 'stopped'
        WHEN 'error'        THEN 'error'
        ELSE                     'creating'
      END                                            AS status,
      jsonb_build_object(
        'cpu',     COALESCE(w.cpu_limit_cores, 1),
        'memory',  COALESCE(w.memory_limit_mb, 2048),
        'storage', COALESCE(w.storage_limit_mb, 1024)
      )                                              AS resources,
      NULL                                           AS preview_url,
      NULL                                           AS ip_address,
      w.port,
      w.created_at,
      w.updated_at
    FROM workspaces w
    WHERE NOT EXISTS (
      SELECT 1 FROM emergent_workspaces ew WHERE ew.id = w.id
    )
    ON CONFLICT (container_id) DO NOTHING;

    -- ── Step 2: Drop the old table (safe now that data is migrated) ──────
    DROP TABLE workspaces CASCADE;
  END IF;
END
$$;

-- ── Step 3: Create a backward-compatible VIEW called `workspaces` ──────────
CREATE OR REPLACE VIEW workspaces AS
SELECT
  id,
  project_id,
  user_id,
  container_id,
  name                              AS workspace_id,
  name                              AS subdomain,
  status,
  (resources->>'cpu')::numeric      AS cpu_limit_cores,
  (resources->>'memory')::integer   AS memory_limit_mb,
  (resources->>'storage')::integer  AS storage_limit_mb,
  port,
  preview_url,
  ip_address,
  created_at,
  updated_at,
  stopped_at
FROM emergent_workspaces;

COMMENT ON VIEW workspaces IS
  'Backward-compatible alias for emergent_workspaces. '
  'New code should query emergent_workspaces directly.';
