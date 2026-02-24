-- Persistence for Spending Caps
create table if not exists admin_spending_caps (
  provider text primary key, -- 'anthropic', 'elevenlabs', 'openai'
  spent numeric default 0,
  cap numeric not null,
  month_start timestamptz default date_trunc('month', now()),
  last_updated timestamptz default now()
);

-- Usage Locks
create table if not exists admin_usage_locks (
  service text primary key, -- 'ai', 'database'
  is_locked boolean default false,
  updated_at timestamptz default now()
);

-- Seed defaults
insert into admin_spending_caps (provider, cap) values
  ('anthropic', 200),
  ('elevenlabs', 200)
on conflict do nothing;

insert into admin_usage_locks (service) values
  ('ai'),
  ('database')
on conflict do nothing;

-- Enable RLS (Admin Only)
alter table admin_spending_caps enable row level security;
alter table admin_usage_locks enable row level security;

-- Policy: Only founders can see/edit these
create policy "Founders can manage spending"
  on admin_spending_caps
  for all
  using (
    auth.jwt() ->> 'email' in ('aditya@cubiqo.ai', 'admin@cubiqo.ai')
  );

create policy "Founders can manage usage locks"
  on admin_usage_locks
  for all
  using (
    auth.jwt() ->> 'email' in ('aditya@cubiqo.ai', 'admin@cubiqo.ai')
  );
