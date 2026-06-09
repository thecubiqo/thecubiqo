-- ─────────────────────────────────────────────────────────────────────────────
-- Defense-in-depth: enable RLS on 5 public tables that were exposed to the
-- anon/authenticated key. All application access goes through the service-role
-- admin client (which bypasses RLS), so enabling RLS does NOT change app
-- behavior — it only closes direct anon-key read/write of these tables, and
-- (where a user_id/owner exists) scopes any future client reads to the owner.
--
-- Verified before writing: none of these tables are queried by the browser/anon
-- Supabase client; all reads/writes happen in server routes via service role.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. cq_chatrooms — public room metadata, read ONLY through the API route (which
--    applies red-tier filtering). No direct client access → RLS, no policy.
ALTER TABLE public.cq_chatrooms ENABLE ROW LEVEL SECURITY;

-- 2. cq_threads — DM thread rows; access is gated via cq_thread_members in the
--    server route. No user_id on the row itself → RLS, no policy (server-only).
ALTER TABLE public.cq_threads ENABLE ROW LEVEL SECURITY;

-- 3. interventions_log — written by crons (service role); a user may read their
--    own intervention history.
ALTER TABLE public.interventions_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users read own interventions" ON public.interventions_log;
CREATE POLICY "Users read own interventions"
  ON public.interventions_log FOR SELECT
  USING (auth.uid() = user_id);

-- 4. market_watch_subscriptions — owned by a user; readable by that user.
--    Writes remain server-side (service role).
ALTER TABLE public.market_watch_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users read own market subscriptions" ON public.market_watch_subscriptions;
CREATE POLICY "Users read own market subscriptions"
  ON public.market_watch_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- 5. semantic_index — owner-scoped vector/index rows.
ALTER TABLE public.semantic_index ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owners read own semantic index" ON public.semantic_index;
CREATE POLICY "Owners read own semantic index"
  ON public.semantic_index FOR SELECT
  USING (owner_type = 'user' AND owner_id = auth.uid());
