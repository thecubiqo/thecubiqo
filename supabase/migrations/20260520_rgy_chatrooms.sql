-- CubiQo Sprint 2 - RGY chatroom snapshots and aggregates.
-- Source of truth: CubiQo-RGY-Chatrooms-Runbook.md + CubiQo-RGY-Chatrooms-DB.md.

create extension if not exists pgcrypto;

create table if not exists public.chatroom_rgy_snapshots (
  id uuid primary key default gen_random_uuid(),
  chatroom_id uuid references public.cq_chatrooms(id) on delete cascade not null,
  participant_id uuid references auth.users(id) on delete cascade not null,
  rgy_status text not null check (rgy_status in ('green', 'yellow', 'red')),
  rgy_score numeric(5,2) default 50,
  captured_at timestamptz not null default now(),
  session_end timestamptz,
  metadata jsonb not null default '{}'::jsonb
);

alter table public.chatroom_rgy_snapshots
  add column if not exists rgy_score numeric(5,2) default 50,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.chatroom_rgy_snapshots enable row level security;

drop policy if exists "Users read own chatroom RGY snapshots" on public.chatroom_rgy_snapshots;
create policy "Users read own chatroom RGY snapshots"
on public.chatroom_rgy_snapshots
for select
using (
  auth.uid() = participant_id
  or exists (
    select 1 from public.cq_chatroom_members m
    where m.chatroom_id = chatroom_rgy_snapshots.chatroom_id
      and m.user_id = auth.uid()
  )
);

drop policy if exists "Service role manages chatroom RGY snapshots" on public.chatroom_rgy_snapshots;
create policy "Service role manages chatroom RGY snapshots"
on public.chatroom_rgy_snapshots
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

create index if not exists chatroom_rgy_snapshots_room_idx
  on public.chatroom_rgy_snapshots(chatroom_id, captured_at desc);

create index if not exists chatroom_rgy_snapshots_participant_idx
  on public.chatroom_rgy_snapshots(participant_id, captured_at desc);

create index if not exists chatroom_rgy_snapshots_active_idx
  on public.chatroom_rgy_snapshots(chatroom_id)
  where session_end is null;

create table if not exists public.chatroom_rgy_aggregates (
  chatroom_id uuid primary key references public.cq_chatrooms(id) on delete cascade,
  green_count int not null default 0,
  yellow_count int not null default 0,
  red_count int not null default 0,
  total_active int generated always as (green_count + yellow_count + red_count) stored,
  total_participants int not null default 0,
  dominant_rgy text not null default 'yellow' check (dominant_rgy in ('green', 'yellow', 'red')),
  dominant_status text not null default 'yellow' check (dominant_status in ('green', 'yellow', 'red')),
  health_score int not null default 50 check (health_score between 0 and 100),
  updated_at timestamptz not null default now()
);

alter table public.chatroom_rgy_aggregates
  add column if not exists total_participants int not null default 0,
  add column if not exists dominant_status text not null default 'yellow',
  add column if not exists health_score int not null default 50;

alter table public.chatroom_rgy_aggregates enable row level security;

drop policy if exists "Authenticated users read chatroom RGY aggregates" on public.chatroom_rgy_aggregates;
create policy "Authenticated users read chatroom RGY aggregates"
on public.chatroom_rgy_aggregates
for select
using (auth.uid() is not null);

drop policy if exists "Service role manages chatroom RGY aggregates" on public.chatroom_rgy_aggregates;
create policy "Service role manages chatroom RGY aggregates"
on public.chatroom_rgy_aggregates
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');
