-- ─────────────────────────────────────────────────────────────────────────────
-- 1. HARD RULE: red signals require age confirmation (DB backstop)
--    Even if an application code path forgets the check, the DB rejects any
--    color='red' signal whose owning profile is not red_tier_age_confirmed.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.enforce_red_signal_age_gate()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.color = 'red' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = NEW.user_id
        AND p.red_tier_age_confirmed = true
    ) THEN
      RAISE EXCEPTION 'red signals require age confirmation (red_tier_age_confirmed)'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_red_signal_age_gate ON public.signals;
CREATE TRIGGER trg_enforce_red_signal_age_gate
  BEFORE INSERT OR UPDATE ON public.signals
  FOR EACH ROW EXECUTE FUNCTION public.enforce_red_signal_age_gate();

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Unread / preview summaries — single round-trip, index-backed.
--    Replaces unbounded "fetch every message then count in JS" route logic.
-- ─────────────────────────────────────────────────────────────────────────────

-- DM threads: latest message preview + unread count (messages from the peer,
-- not yet read) per thread. Uses cq_messages_thread_created_unread_idx.
CREATE OR REPLACE FUNCTION public.get_thread_summaries(p_user_id uuid, p_thread_ids uuid[])
RETURNS TABLE (thread_id uuid, last_preview text, last_at timestamptz, unread_count bigint)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT t.tid,
         lm.content,
         lm.created_at,
         COALESCE(uc.cnt, 0)
  FROM unnest(p_thread_ids) AS t(tid)
  LEFT JOIN LATERAL (
    SELECT content, created_at
    FROM public.cq_messages m
    WHERE m.thread_id = t.tid
    ORDER BY m.created_at DESC
    LIMIT 1
  ) lm ON true
  LEFT JOIN LATERAL (
    SELECT count(*)::bigint AS cnt
    FROM public.cq_messages m
    WHERE m.thread_id = t.tid
      AND m.read_at IS NULL
      AND m.sender_id IS DISTINCT FROM p_user_id
  ) uc ON true;
$$;

-- Chatrooms: latest activity + unread count (messages after this member's
-- last_read_at, not authored by them) per room.
CREATE OR REPLACE FUNCTION public.get_chatroom_summaries(p_user_id uuid, p_room_ids uuid[])
RETURNS TABLE (chatroom_id uuid, last_at timestamptz, unread_count bigint)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT r.rid,
         lm.created_at,
         COALESCE(uc.cnt, 0)
  FROM unnest(p_room_ids) AS r(rid)
  LEFT JOIN LATERAL (
    SELECT created_at
    FROM public.cq_chatroom_messages m
    WHERE m.chatroom_id = r.rid
    ORDER BY m.created_at DESC
    LIMIT 1
  ) lm ON true
  LEFT JOIN LATERAL (
    SELECT count(*)::bigint AS cnt
    FROM public.cq_chatroom_messages m
    LEFT JOIN public.cq_chatroom_members mem
      ON mem.chatroom_id = r.rid AND mem.user_id = p_user_id
    WHERE m.chatroom_id = r.rid
      AND m.sender_id IS DISTINCT FROM p_user_id
      AND (mem.last_read_at IS NULL OR m.created_at > mem.last_read_at)
  ) uc ON true;
$$;
