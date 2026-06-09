create extension if not exists pgcrypto;

create table if not exists public.byod_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  supabase_url text not null,
  encrypted_service_role_key text not null,
  encryption_iv text not null,
  encryption_tag text not null,
  key_version int default 1,
  verified_at timestamptz,
  schema_version text,
  status text not null default 'pending_verification'
    check (status in ('pending_verification','active','error','disconnected','pending','connected','unhealthy')),
  last_health_check_at timestamptz,
  health_check_failures int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.byod_connections enable row level security;

drop policy if exists "Users manage own BYOD connection" on public.byod_connections;
create policy "Users manage own BYOD connection"
  on public.byod_connections for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists byod_connections_status_idx
  on public.byod_connections(status, last_health_check_at)
  where status in ('active','connected','unhealthy');

create index if not exists byod_connections_health_idx
  on public.byod_connections(last_health_check_at)
  where status in ('active','connected');

create table if not exists public.byod_sync_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  connection_id uuid references public.byod_connections(id) on delete cascade,
  operation text not null,
  table_name text,
  row_count int,
  status text not null check (status in ('success','error','timeout')),
  error_message text,
  latency_ms int,
  created_at timestamptz default now()
);

alter table public.byod_sync_log enable row level security;

drop policy if exists "Users read own sync log" on public.byod_sync_log;
create policy "Users read own sync log"
  on public.byod_sync_log for select
  using (auth.uid() = user_id);

drop policy if exists "Service role inserts sync log" on public.byod_sync_log;
create policy "Service role inserts sync log"
  on public.byod_sync_log for insert
  with check (auth.role() = 'service_role');

create index if not exists byod_sync_log_user_idx
  on public.byod_sync_log(user_id, created_at desc);

create index if not exists byod_sync_log_errors_idx
  on public.byod_sync_log(user_id, status, created_at desc)
  where status = 'error';
