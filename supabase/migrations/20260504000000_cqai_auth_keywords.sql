-- cq.ai production auth/profile and RGY activity keyword storage.
-- Apply this in the Supabase project used by cubiqo-repo before relying on
-- app-side profile sync or persisted RGY analytics.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_activity_keywords (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  color text not null check (color in ('green', 'yellow', 'red')),
  keyword text not null,
  source text not null default 'conversation',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.conversation_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  user_message text not null,
  assistant_response text,
  rgy_color text not null check (rgy_color in ('green', 'yellow', 'red')),
  rgy_intent text,
  keywords jsonb not null default '{"green":[],"yellow":[],"red":[]}'::jsonb,
  model_used text,
  created_at timestamptz not null default now()
);

create index if not exists idx_user_activity_keywords_user_created
  on public.user_activity_keywords(user_id, created_at desc);

create index if not exists idx_conversation_events_user_created
  on public.conversation_events(user_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do update
    set email = excluded.email,
        updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.user_activity_keywords enable row level security;
alter table public.conversation_events enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles for select
using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles for insert
with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "keywords_select_own" on public.user_activity_keywords;
create policy "keywords_select_own"
on public.user_activity_keywords for select
using (auth.uid() = user_id);

drop policy if exists "keywords_insert_own" on public.user_activity_keywords;
create policy "keywords_insert_own"
on public.user_activity_keywords for insert
with check (auth.uid() = user_id);

drop policy if exists "conversation_events_select_own" on public.conversation_events;
create policy "conversation_events_select_own"
on public.conversation_events for select
using (auth.uid() = user_id);

drop policy if exists "conversation_events_insert_own" on public.conversation_events;
create policy "conversation_events_insert_own"
on public.conversation_events for insert
with check (auth.uid() = user_id);
