-- ─────────────────────────────────────────────────────────────────────────────
-- Read pointers — unread count support for DM threads + chatrooms
-- ─────────────────────────────────────────────────────────────────────────────

-- DM threads: track last-read position per member
ALTER TABLE public.cq_thread_members
  ADD COLUMN IF NOT EXISTS last_read_at timestamptz;

-- Chatrooms: track last-read position per member
ALTER TABLE public.cq_chatroom_members
  ADD COLUMN IF NOT EXISTS last_read_at timestamptz;

-- Index for fast unread count queries
CREATE INDEX IF NOT EXISTS cq_messages_thread_created_unread_idx
  ON public.cq_messages (thread_id, created_at)
  WHERE read_at IS NULL;

CREATE INDEX IF NOT EXISTS cq_chatroom_messages_room_created_idx
  ON public.cq_chatroom_messages (chatroom_id, created_at);
