create table if not exists public.security_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  session_id uuid,
  event_type text not null,
  severity text not null default 'medium'
    check (severity in ('low', 'medium', 'high', 'critical')),
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

alter table public.security_events
  add column if not exists ip_address text,
  add column if not exists user_agent text,
  add column if not exists surface_type text,
  add column if not exists file_path text,
  add column if not exists file_hash text,
  add column if not exists payload jsonb default '{}',
  add column if not exists action_taken text,
  add column if not exists resolved boolean default false,
  add column if not exists resolved_at timestamptz,
  add column if not exists resolved_by text;

alter table public.security_events enable row level security;

drop policy if exists "Users read own security events" on public.security_events;
create policy "Users read own security events"
  on public.security_events for select
  using (auth.uid() = user_id);

drop policy if exists "Service role inserts security events" on public.security_events;
create policy "Service role inserts security events"
  on public.security_events for insert
  with check (auth.role() = 'service_role');

drop policy if exists "Service role updates security events" on public.security_events;
create policy "Service role updates security events"
  on public.security_events for update
  using (auth.role() = 'service_role');

create index if not exists security_events_user_idx
  on public.security_events(user_id, created_at desc)
  where user_id is not null;
create index if not exists security_events_severity_idx
  on public.security_events(severity, created_at desc)
  where resolved = false;
create index if not exists security_events_type_idx
  on public.security_events(event_type, created_at desc);

create table if not exists public.security_rate_limits (
  id uuid primary key default gen_random_uuid(),
  identifier text not null,
  identifier_type text not null check (identifier_type in ('user', 'ip', 'route', 'composite')),
  window_start timestamptz not null,
  window_end timestamptz not null,
  count int default 1,
  limit_value int not null,
  blocked_until timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (identifier, window_start)
);

alter table public.security_rate_limits enable row level security;

drop policy if exists "No direct user access to security rate limits" on public.security_rate_limits;
create policy "No direct user access to security rate limits"
  on public.security_rate_limits for all
  using (false);

create index if not exists rate_limits_identifier_window_idx
  on public.security_rate_limits(identifier, window_start desc);
create index if not exists rate_limits_blocked_idx
  on public.security_rate_limits(blocked_until)
  where blocked_until is not null;
create index if not exists rate_limits_expiry_idx
  on public.security_rate_limits(window_end);

create table if not exists public.security_ip_blocklist (
  id uuid primary key default gen_random_uuid(),
  ip_address text not null unique,
  reason text not null,
  blocked_at timestamptz default now(),
  expires_at timestamptz,
  block_count int default 1,
  last_event_id uuid references public.security_events(id),
  created_by text default 'auto' check (created_by in ('auto', 'admin'))
);

alter table public.security_ip_blocklist enable row level security;

drop policy if exists "No direct user access to security ip blocklist" on public.security_ip_blocklist;
create policy "No direct user access to security ip blocklist"
  on public.security_ip_blocklist for all
  using (false);

create index if not exists ip_blocklist_expires_idx
  on public.security_ip_blocklist(expires_at)
  where expires_at is not null;
create index if not exists ip_blocklist_ip_idx
  on public.security_ip_blocklist(ip_address);
