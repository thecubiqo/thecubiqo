-- Migration 13: Feature profile extensions
-- RGY Chatrooms: red_tier_age_confirmed, cq_chatroom_members, cq_chatroom_reactions
-- MediaGen: uncensored_media_enabled
-- Run after: 20260516004000_social_layer.sql (migration 10)

-- ──────────────────────────────────────────────────────────────────────────────
-- Profile feature flags
-- ──────────────────────────────────────────────────────────────────────────────

-- RED tier chatroom age gate (no raw DOB stored — only this boolean)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS red_tier_age_confirmed boolean DEFAULT false;

-- MediaGen uncensored local generation consent
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS uncensored_media_enabled boolean DEFAULT false;

-- ──────────────────────────────────────────────────────────────────────────────
-- cq_chatroom_members — join table for explicit room membership
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cq_chatroom_members (
  chatroom_id     uuid REFERENCES public.cq_chatrooms(id) ON DELETE CASCADE,
  user_id         uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at       timestamptz DEFAULT now(),
  location_opt_in boolean DEFAULT false,
  PRIMARY KEY (chatroom_id, user_id)
);

ALTER TABLE public.cq_chatroom_members ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'cq_chatroom_members'
      AND policyname = 'Users manage own chatroom memberships'
  ) THEN
    EXECUTE '
      CREATE POLICY "Users manage own chatroom memberships"
        ON public.cq_chatroom_members
        FOR ALL
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id)
    ';
  END IF;
END $$;

-- Index for room membership lookups
CREATE INDEX IF NOT EXISTS cq_chatroom_members_room_idx
  ON public.cq_chatroom_members(chatroom_id);

-- ──────────────────────────────────────────────────────────────────────────────
-- cq_chatroom_reactions — emoji reactions on chatroom messages
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cq_chatroom_reactions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid REFERENCES public.cq_chatroom_messages(id) ON DELETE CASCADE NOT NULL,
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  emoji      text NOT NULL CHECK (char_length(emoji) <= 8),
  created_at timestamptz DEFAULT now(),
  UNIQUE (message_id, user_id, emoji)
);

ALTER TABLE public.cq_chatroom_reactions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'cq_chatroom_reactions'
      AND policyname = 'Authenticated users manage reactions'
  ) THEN
    EXECUTE '
      CREATE POLICY "Authenticated users manage reactions"
        ON public.cq_chatroom_reactions
        FOR ALL
        USING (auth.uid() IS NOT NULL)
        WITH CHECK (auth.uid() = user_id)
    ';
  END IF;
END $$;

-- Index for fast reaction count queries per message
CREATE INDEX IF NOT EXISTS cq_chatroom_reactions_msg_idx
  ON public.cq_chatroom_reactions(message_id);
