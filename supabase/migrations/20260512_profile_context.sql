-- Migration: 20260512_profile_context.sql
-- ALTER profiles: language_preference, script_preference, timezone, city, country,
-- display_name, voice_preference, primary_goal, goal_domain, onboarding_done,
-- onboarding_summary, daily_context, last_seen_at, visit_count, subscription_tier,
-- active_device_id, referral_code, referred_by

alter table public.profiles
  add column if not exists display_name text,
  add column if not exists voice_preference text default 'text',
  add column if not exists timezone text default 'UTC',
  add column if not exists city text,
  add column if not exists country text,
  add column if not exists language_preference text default 'en',
  add column if not exists script_preference text default 'latin',
  add column if not exists location_permission text default 'pending',
  add column if not exists camera_permission text default 'pending',
  add column if not exists last_seen_at timestamptz,
  add column if not exists visit_count int default 0,
  add column if not exists primary_goal text,
  add column if not exists goal_domain text,
  add column if not exists onboarding_done boolean default false,
  add column if not exists onboarding_summary text,
  add column if not exists daily_context text,
  add column if not exists subscription_tier text default 'free',
  add column if not exists active_device_id text,
  add column if not exists referral_code text unique,
  add column if not exists referred_by uuid;
