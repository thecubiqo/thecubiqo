-- Runtime configuration cleanup for goodfeatureslegacy.
-- This migration intentionally excludes proactive-intelligence tables.

create table if not exists public.safety_patterns (
  id uuid primary key default gen_random_uuid(),
  pattern_type text not null check (pattern_type in ('crisis', 'hard_block', 'age_gate')),
  pattern text not null,
  flags text not null default 'i',
  active boolean not null default true,
  priority integer not null default 0,
  created_at timestamptz not null default now()
);

insert into public.safety_patterns (pattern_type, pattern, flags, priority)
values
  ('crisis', '\bkill myself\b', 'i', 10),
  ('crisis', '\bsuicide\b', 'i', 10),
  ('crisis', '\bend my life\b', 'i', 10),
  ('crisis', '\bself[-\s]?harm\b', 'i', 10),
  ('crisis', '\bi want to die\b', 'i', 9),
  ('crisis', '\bwant to die\b', 'i', 9),
  ('hard_block', '\billegal drugs?\b', 'i', 10),
  ('hard_block', '\bdrug trafficking\b', 'i', 10),
  ('hard_block', '\bmake (?:a )?bomb\b', 'i', 10),
  ('hard_block', '\bweapon trafficking\b', 'i', 10),
  ('hard_block', '\bcredit card fraud\b', 'i', 10),
  ('hard_block', '\bchild\.porn\b', 'i', 10),
  ('hard_block', '\bcsam\b', 'i', 10),
  ('age_gate', '\badult\b', 'i', 5),
  ('age_gate', '\bexplicit\b', 'i', 5),
  ('age_gate', '\bnsfw\b', 'i', 5),
  ('age_gate', '\bhookup\b', 'i', 4),
  ('age_gate', '\bage[-\s]?gated\b', 'i', 4),
  ('age_gate', '\brestricted\b', 'i', 4),
  ('age_gate', '\badult apps?\b', 'i', 5),
  ('age_gate', '\badult content\b', 'i', 5),
  ('age_gate', '\bgrindr\b', 'i', 5),
  ('age_gate', '\btinder\b', 'i', 5)
on conflict do nothing;

create index if not exists safety_patterns_active_type_idx
  on public.safety_patterns (active, pattern_type, priority desc);

create table if not exists public.capability_overrides (
  capability text primary key,
  status text,
  approval_required boolean,
  endpoint text,
  notes text,
  updated_at timestamptz not null default now()
);

alter table public.push_subscriptions
  add column if not exists max_per_day integer default 5,
  add column if not exists quiet_hours_start integer default 22,
  add column if not exists quiet_hours_end integer default 8,
  add column if not exists timezone text default 'UTC';
