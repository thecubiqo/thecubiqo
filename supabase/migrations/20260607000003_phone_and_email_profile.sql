-- ============================================================
-- Migration: Phone + email verification post-signup
-- ============================================================
-- Adds phone_number, phone_verified, email_verified to profiles.
-- Phone OTP flow: Supabase sends OTP → user enters → mark verified.
-- Email is already captured at auth.users; this mirrors it to profiles
-- with a resend_count guard.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone_number text,
  ADD COLUMN IF NOT EXISTS phone_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS phone_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS email_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS email_resend_count int NOT NULL DEFAULT 0;

-- Basic format constraint on phone (E.164)
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_phone_format;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_phone_format
  CHECK (phone_number IS NULL OR phone_number ~ '^\+[1-9]\d{6,14}$');

-- User geofences table (for location capability)
CREATE TABLE IF NOT EXISTS public.user_geofences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  radius_metres int NOT NULL DEFAULT 500,
  on_enter text,
  on_exit text,
  active boolean NOT NULL DEFAULT true,
  last_state text CHECK (last_state IN ('inside', 'outside')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_geofences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own geofences" ON public.user_geofences;
CREATE POLICY "Users manage own geofences" ON public.user_geofences
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS user_geofences_user_id_idx ON public.user_geofences (user_id);
