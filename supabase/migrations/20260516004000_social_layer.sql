-- Migration: 20260516004000_social_layer.sql
-- Creates all Social Layer tables: DMs, chatrooms, and friend connections.
-- Source: CubiQo-Social-Layer.md §2–4
--
-- Table creation order (respects foreign-key dependencies):
--   1. cq_threads (parent for DM containers)
--   2. cq_thread_members (junction: thread ↔ user)
--   3. cq_messages (messages inside a thread)
--   4. cq_chatrooms (canonical RGY community rooms)
--   5. cq_chatroom_messages (messages inside a chatroom)
--   6. cq_friendships (friend graph with status machine)

-- ─────────────────────────────────────────────────────────────────────────────
-- § 1 — Direct Message Threads
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.cq_threads (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);
-- No RLS needed on cq_threads itself — access controlled through cq_thread_members

-- ─────────────────────────────────────────────────────────────────────────────
-- § 2 — Thread Members
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.cq_thread_members (
  thread_id   uuid REFERENCES public.cq_threads(id) ON DELETE CASCADE,
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at   timestamptz DEFAULT now(),
  PRIMARY KEY (thread_id, user_id)
);
ALTER TABLE public.cq_thread_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own thread memberships" ON public.cq_thread_members;
CREATE POLICY "Users read own thread memberships"
  ON public.cq_thread_members FOR SELECT
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS cq_thread_members_user_idx
  ON public.cq_thread_members(user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- § 3 — Direct Messages
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.cq_messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id       uuid REFERENCES public.cq_threads(id) ON DELETE CASCADE NOT NULL,
  sender_id       uuid REFERENCES auth.users(id),
  message_type    text NOT NULL
                    CHECK (message_type IN ('text', 'file', 'audio', 'video')),
  content         text,                       -- text content or file caption
  storage_path    text,                       -- Supabase Storage path for file/audio/video
  reply_to_id     uuid REFERENCES public.cq_messages(id),
  read_at         timestamptz,
  delivered_at    timestamptz DEFAULT now(),
  created_at      timestamptz DEFAULT now()
);
ALTER TABLE public.cq_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Thread members read messages" ON public.cq_messages;
CREATE POLICY "Thread members read messages"
  ON public.cq_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.cq_thread_members
      WHERE cq_thread_members.thread_id = cq_messages.thread_id
        AND cq_thread_members.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users send own messages" ON public.cq_messages;
CREATE POLICY "Users send own messages"
  ON public.cq_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.cq_thread_members
      WHERE cq_thread_members.thread_id = cq_messages.thread_id
        AND cq_thread_members.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS cq_messages_thread_created_idx
  ON public.cq_messages(thread_id, created_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- § 4 — RGY Community Chatrooms (9 canonical rooms + expandable)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.cq_chatrooms (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  rgy_color     text NOT NULL CHECK (rgy_color IN ('green', 'red', 'yellow')),
  intent        text NOT NULL CHECK (intent IN ('socialize', 'collaborate', 'barter_trade')),
  topic_tag     text,               -- optional e.g. 'fitness', 'startups', 'finance'
  description   text,
  member_count  int DEFAULT 0,      -- denormalised for display, refreshed by trigger/cron
  created_at    timestamptz DEFAULT now()
);
-- Public read: any authenticated user can see room metadata

-- Seed the 9 canonical rooms (idempotent via ON CONFLICT DO NOTHING on name)
ALTER TABLE public.cq_chatrooms ADD COLUMN IF NOT EXISTS slug text UNIQUE;

INSERT INTO public.cq_chatrooms (name, slug, rgy_color, intent, description)
VALUES
  -- GREEN rooms
  ('Green Socials',     'green-socials',     'green', 'socialize',    'Celebrate wins, share good vibes, and connect with others on a high'),
  ('Green Builders',    'green-builders',    'green', 'collaborate',  'Find accountability partners, co-founders, and collaborators for active projects'),
  ('Green Marketplace', 'green-marketplace', 'green', 'barter_trade', 'Trade skills and services — you have momentum, others want to buy in'),
  -- YELLOW rooms
  ('Yellow Commons',    'yellow-commons',    'yellow', 'socialize',   'Chat, ask questions, and find others navigating the middle ground'),
  ('Yellow Workshop',   'yellow-workshop',   'yellow', 'collaborate',  'Work through blockers together — accountability and structured focus'),
  ('Yellow Exchange',   'yellow-exchange',   'yellow', 'barter_trade', 'Swap help, advice, and micro-tasks in either direction'),
  -- RED rooms
  ('Red Lounge',        'red-lounge',        'red', 'socialize',      'Honest space for hard days — no toxic positivity, just real talk'),
  ('Red Squad',         'red-squad',         'red', 'collaborate',    'Find a recovery buddy or accountability partner to climb back together'),
  ('Red Rescue',        'red-rescue',        'red', 'barter_trade',   'Offer or receive small acts of help — low stakes, high impact')
ON CONFLICT (slug) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- § 5 — Chatroom Messages
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.cq_chatroom_messages (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chatroom_id      uuid REFERENCES public.cq_chatrooms(id) ON DELETE CASCADE NOT NULL,
  sender_id        uuid REFERENCES auth.users(id),
  -- Snapshot the username at send time so history stays accurate even if user renames
  username_at_send text NOT NULL,
  content          text NOT NULL,
  reply_to_id      uuid REFERENCES public.cq_chatroom_messages(id),
  created_at       timestamptz DEFAULT now()
);
ALTER TABLE public.cq_chatroom_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users read chatroom messages" ON public.cq_chatroom_messages;
CREATE POLICY "Authenticated users read chatroom messages"
  ON public.cq_chatroom_messages FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users write own chatroom messages" ON public.cq_chatroom_messages;
CREATE POLICY "Users write own chatroom messages"
  ON public.cq_chatroom_messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE INDEX IF NOT EXISTS cq_chatroom_messages_room_created_idx
  ON public.cq_chatroom_messages(chatroom_id, created_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- § 6 — Friend Graph
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.cq_friendships (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id  uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  addressee_id  uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status        text NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')),
  -- When accepted, the thread_id links to the DM thread auto-created for this pair
  thread_id     uuid REFERENCES public.cq_threads(id),
  created_at    timestamptz DEFAULT now(),
  responded_at  timestamptz,
  -- Prevent duplicate requests in either direction
  CONSTRAINT cq_friendships_pair_unique UNIQUE (requester_id, addressee_id)
);
ALTER TABLE public.cq_friendships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own friendships" ON public.cq_friendships;
CREATE POLICY "Users manage own friendships"
  ON public.cq_friendships FOR ALL
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE INDEX IF NOT EXISTS cq_friendships_addressee_status_idx
  ON public.cq_friendships(addressee_id, status)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS cq_friendships_requester_idx
  ON public.cq_friendships(requester_id, status);
