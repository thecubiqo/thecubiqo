-- Phase A monetisation expansion: Stripe subscription state.

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  price_id text,
  status text not null default 'free'
    check (status in ('free','trialing','active','past_due','canceled','incomplete','incomplete_expired','unpaid','paused')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean default false,
  trial_end timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.subscriptions enable row level security;

drop policy if exists "Users read own subscription" on public.subscriptions;
create policy "Users read own subscription"
  on public.subscriptions
  for select
  using (auth.uid() = user_id);

create table if not exists public.billing_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  stripe_event_id text unique not null,
  event_type text not null,
  data jsonb default '{}',
  processed_at timestamptz default now()
);

create index if not exists billing_events_type_idx
  on public.billing_events(event_type, processed_at desc);
