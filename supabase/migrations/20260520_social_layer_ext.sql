create extension if not exists pgcrypto;

create table if not exists public.social_connections (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references auth.users(id) on delete cascade,
  following_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'active' check (status in ('active','blocked','muted','pending')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (follower_id, following_id),
  check (follower_id != following_id)
);

alter table public.social_connections enable row level security;

drop policy if exists "Users manage own follows" on public.social_connections;
create policy "Users manage own follows"
  on public.social_connections for all
  using (auth.uid() = follower_id)
  with check (auth.uid() = follower_id);

drop policy if exists "Users see who follows them" on public.social_connections;
create policy "Users see who follows them"
  on public.social_connections for select
  using (auth.uid() = following_id);

create index if not exists social_connections_follower_idx
  on public.social_connections(follower_id, status);

create index if not exists social_connections_following_idx
  on public.social_connections(following_id, status);

create table if not exists public.social_activity_feed (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  actor_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  entity_id uuid,
  entity_type text,
  preview_text text,
  rgy_color text check (rgy_color in ('green','yellow','red')),
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  expires_at timestamptz default (now() + interval '30 days')
);

alter table public.social_activity_feed enable row level security;

drop policy if exists "Users read own feed" on public.social_activity_feed;
create policy "Users read own feed"
  on public.social_activity_feed for select
  using (auth.uid() = user_id);

drop policy if exists "Service role manages feed" on public.social_activity_feed;
create policy "Service role manages feed"
  on public.social_activity_feed for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create index if not exists social_feed_user_time_idx
  on public.social_activity_feed(user_id, created_at desc);

create index if not exists social_feed_expiry_idx
  on public.social_activity_feed(expires_at)
  where expires_at is not null;

create table if not exists public.social_reactions (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid not null,
  entity_type text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  reaction text not null check (char_length(reaction) <= 24),
  created_at timestamptz default now(),
  unique (entity_id, entity_type, user_id, reaction)
);

alter table public.social_reactions enable row level security;

drop policy if exists "Any authenticated user reads reactions" on public.social_reactions;
create policy "Any authenticated user reads reactions"
  on public.social_reactions for select
  using (auth.uid() is not null);

drop policy if exists "Users manage own reactions" on public.social_reactions;
create policy "Users manage own reactions"
  on public.social_reactions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists social_reactions_entity_idx
  on public.social_reactions(entity_id, entity_type);

create index if not exists social_reactions_user_idx
  on public.social_reactions(user_id, created_at desc);
