-- CubiQo Phase A/B production compatibility patch.
-- Adds legacy push tables if an older prod DB missed the cowork gap migration,
-- and fills verification columns expected by the Phase A/B runner.

create extension if not exists pgcrypto;

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth_key text not null,
  user_agent text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'push_subscriptions'
      and policyname = 'Users own their push subscriptions'
  ) then
    create policy "Users own their push subscriptions"
      on public.push_subscriptions for all
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'push_subscriptions'
      and policyname = 'Service role can read all push subscriptions'
  ) then
    create policy "Service role can read all push subscriptions"
      on public.push_subscriptions for select
      using (auth.role() = 'service_role');
  end if;
end $$;

alter table public.push_subscriptions
  add column if not exists max_per_day int default 5,
  add column if not exists quiet_hours_start int default 22,
  add column if not exists quiet_hours_end int default 8,
  add column if not exists timezone text default 'UTC';

create index if not exists push_subscriptions_user_active_idx
  on public.push_subscriptions(user_id, active);

create table if not exists public.push_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  message text,
  action_url text,
  delivered boolean not null default false,
  read_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.push_notifications enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'push_notifications'
      and policyname = 'Users own their notifications'
  ) then
    create policy "Users own their notifications"
      on public.push_notifications for all
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'push_notifications'
      and policyname = 'Service role can insert notifications'
  ) then
    create policy "Service role can insert notifications"
      on public.push_notifications for insert
      with check (auth.role() = 'service_role');
  end if;
end $$;

alter table public.push_notifications
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create index if not exists push_notifications_user_unread_idx
  on public.push_notifications(user_id, delivered, created_at desc);

alter table public.byod_sync_log
  add column if not exists sync_type text;

update public.byod_sync_log
  set sync_type = operation
  where sync_type is null and operation is not null;

alter table public.social_connections
  add column if not exists last_interaction_at timestamptz;

alter table public.social_reactions
  add column if not exists target_type text;

update public.social_reactions
  set target_type = entity_type
  where target_type is null and entity_type is not null;

alter table public.media_generation_queue
  add column if not exists run_after timestamptz default now();

create index if not exists media_queue_run_after_idx
  on public.media_generation_queue(state, run_after)
  where state = 'queued';

comment on table public.connector_registry is
  $$Platform connector configurations. Each row is one platform; new platforms are rows, not code.$$;
