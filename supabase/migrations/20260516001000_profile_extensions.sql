-- Migration: 20260516001000_profile_extensions.sql
-- Adds Social Layer identity columns, AI Identity (phone/email) columns,
-- and onboarding intake column (age_range) to the core profiles table.
-- All idempotent (ADD COLUMN IF NOT EXISTS).
-- Sources: CubiQo-Social-Layer.md, CubiQo-AV-Personality.md §10, CubiQo-Onboarding-FuncReq.md

-- ─────────────────────────────────────────────────────────────────────────────
-- § 1 — Onboarding intake
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.profiles
  -- Q1 from onboarding: age gate for content decisions (e.g. under-18 blocks certain content)
  ADD COLUMN IF NOT EXISTS age_range text;

-- ─────────────────────────────────────────────────────────────────────────────
-- § 2 — Social Layer identity
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.profiles
  -- CQ number: short, auto-assigned, human-readable address (e.g. CQ-4821-ALEX)
  -- Used as wallet address and friend-find handle. Unique per user.
  ADD COLUMN IF NOT EXISTS cq_number text,
  -- Public display name in chatrooms and friend search
  ADD COLUMN IF NOT EXISTS username text,
  -- Set to true once the user has confirmed their username (prevents auto-assign overwrite)
  ADD COLUMN IF NOT EXISTS username_set boolean DEFAULT false;

-- Add UNIQUE constraints separately so they fail gracefully if columns existed already
-- (UNIQUE can't use IF NOT EXISTS directly in older Postgres versions)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_cq_number_key' AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_cq_number_key UNIQUE (cq_number);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_username_key' AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_key UNIQUE (username);
  END IF;
END
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- § 3 — AI Identity: Phone (§10.1)
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.profiles
  -- Dedicated per-user Twilio phone number (e.g. +447700900123)
  -- Provisioned on first consent. Null until provisioned.
  ADD COLUMN IF NOT EXISTS cubiqo_phone_number text,
  -- User opted in to receive inbound/outbound calls via their CubiQo number
  ADD COLUMN IF NOT EXISTS phone_call_consent boolean DEFAULT false,
  -- User opted in to receive SMS via their CubiQo number
  ADD COLUMN IF NOT EXISTS sms_consent boolean DEFAULT false;

-- ─────────────────────────────────────────────────────────────────────────────
-- § 4 — AI Identity: Email (§10.2)
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.profiles
  -- Per-user CubiQo email address (e.g. alex-ai@cubiqo.ai)
  -- Generated on first email consent. Null until provisioned.
  ADD COLUMN IF NOT EXISTS cubiqo_email text,
  -- User opted in to receive daily email briefings
  ADD COLUMN IF NOT EXISTS email_briefing_consent boolean DEFAULT false,
  -- Time (in user's timezone) to send the daily briefing email
  ADD COLUMN IF NOT EXISTS email_briefing_time time;

-- ─────────────────────────────────────────────────────────────────────────────
-- § 5 — Morning briefing cron preference
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.profiles
  -- When the user wants their morning briefing notification
  ADD COLUMN IF NOT EXISTS preferred_briefing_time time DEFAULT '08:00';

-- ─────────────────────────────────────────────────────────────────────────────
-- Index: fast CQ number lookup (friend-find, wallet addressing)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS profiles_cq_number_idx
  ON public.profiles(cq_number)
  WHERE cq_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS profiles_username_idx
  ON public.profiles(lower(username))
  WHERE username IS NOT NULL;
