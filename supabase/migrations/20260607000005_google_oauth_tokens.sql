-- ============================================================
-- Migration: Ensure google_oauth_tokens exists (idempotent)
-- ============================================================
-- The Google connector (gmail/calendar + OAuth callback) reads/writes this
-- table, but it was never migrated into this environment. Recreate it to match
-- the canonical definition (20260510070000). Tokens are encrypted at rest by
-- the application layer (see src/app/api/connectors/google/_token.ts).

CREATE TABLE IF NOT EXISTS public.google_oauth_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  google_email text,
  access_token text NOT NULL,
  refresh_token text,
  expires_at timestamptz NOT NULL,
  scopes text[] NOT NULL DEFAULT '{}',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.google_oauth_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users own their Google tokens" ON public.google_oauth_tokens;
CREATE POLICY "Users own their Google tokens"
  ON public.google_oauth_tokens FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can read Google tokens" ON public.google_oauth_tokens;
CREATE POLICY "Service role can read Google tokens"
  ON public.google_oauth_tokens FOR SELECT
  USING (true);
