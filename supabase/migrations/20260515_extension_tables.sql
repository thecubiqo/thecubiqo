-- CubiQo Apps Mapping - extension session and instruction tables.

create table if not exists public.extension_instructions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  platform text not null,
  actions jsonb not null default '[]',
  status text not null default 'queued' check (status in ('queued', 'running', 'completed', 'failed', 'expired')),
  result jsonb default '{}',
  error text,
  created_at timestamptz default now(),
  expires_at timestamptz not null default (now() + interval '5 minutes')
);

alter table public.extension_instructions enable row level security;

drop policy if exists "Users read own extension instructions" on public.extension_instructions;
create policy "Users read own extension instructions"
  on public.extension_instructions for select
  using (auth.uid() = user_id);

create index if not exists ext_inst_user_status_idx
  on public.extension_instructions(user_id, status, expires_at);

create table if not exists public.extension_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  token text unique not null,
  created_at timestamptz default now(),
  expires_at timestamptz default (now() + interval '30 days'),
  last_seen_at timestamptz
);

alter table public.extension_sessions enable row level security;

drop policy if exists "No direct user access to extension sessions" on public.extension_sessions;
create policy "No direct user access to extension sessions"
  on public.extension_sessions for all
  using (false)
  with check (false);

create unique index if not exists extension_sessions_user_id_key
  on public.extension_sessions(user_id);

create table if not exists public.oauth_states (
  state text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  platform text not null,
  created_at timestamptz default now(),
  expires_at timestamptz not null default (now() + interval '10 minutes')
);

alter table public.oauth_states enable row level security;

drop policy if exists "No direct user access to oauth states" on public.oauth_states;
create policy "No direct user access to oauth states"
  on public.oauth_states for all
  using (false)
  with check (false);

create index if not exists oauth_states_expires_idx on public.oauth_states(expires_at);
