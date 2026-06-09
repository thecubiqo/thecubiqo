-- Migration: 20260512_permissions.sql
-- CREATE user_permissions (mic, camera, memory, location, push, tracking + grant timestamps)

create table if not exists public.user_permissions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  mic text default 'pending',
  camera text default 'pending',
  memory text default 'pending',
  location text default 'pending',
  push text default 'pending',
  tracking text default 'pending',
  mic_granted_at timestamptz,
  camera_granted_at timestamptz,
  memory_granted_at timestamptz,
  location_granted_at timestamptz,
  push_granted_at timestamptz,
  tracking_granted_at timestamptz,
  updated_at timestamptz default now()
);

alter table public.user_permissions enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Users manage own permissions') then
    create policy "Users manage own permissions"
      on public.user_permissions for all using (auth.uid() = user_id);
  end if;
end
$$;
