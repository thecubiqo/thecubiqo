-- Migration 6: RGY schema additions
-- Adds behavioural fingerprint columns to user_ai_profile
-- and capsule fingerprint columns to capsule_briefings
-- Idempotent: uses ADD COLUMN IF NOT EXISTS throughout

-- RGY behavioural fingerprint on user_ai_profile
-- rgy_ratio:     rolling 30-day ratio of green/red/yellow signals
-- rgy_dominance: 'green' | 'red' | 'yellow' | 'balanced'
-- rgy_trend:     'stabilising' | 'shifting_red' | 'shifting_green' | 'disengaging'
ALTER TABLE public.user_ai_profile
  ADD COLUMN IF NOT EXISTS rgy_ratio      jsonb DEFAULT '{"green":0,"red":0,"yellow":0}',
  ADD COLUMN IF NOT EXISTS rgy_dominance  text  DEFAULT 'balanced',
  ADD COLUMN IF NOT EXISTS rgy_trend      text  DEFAULT 'stabilising';

-- RGY capsule fingerprint on capsule_briefings
-- color:   'green' | 'red' | 'yellow' — matches signals.color
-- keyword: primary keyword from the triggering signal
-- intent:  intent hint for staged data swap lookups
ALTER TABLE public.capsule_briefings
  ADD COLUMN IF NOT EXISTS color    text DEFAULT 'yellow',
  ADD COLUMN IF NOT EXISTS keyword  text,
  ADD COLUMN IF NOT EXISTS intent   text;
