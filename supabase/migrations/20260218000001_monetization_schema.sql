-- Subscription & Monetization Schema

-- 1. Subscription Tiers (Config)
create table if not exists subscription_tiers (
  id text primary key, -- 'free', 'pro', 'commander', 'general'
  name text not null,
  price_monthly integer default 0, -- in cents
  features jsonb default '{}'::jsonb,
  is_active boolean default true
);

-- Seed Default Tiers
insert into subscription_tiers (id, name, price_monthly, features) values
  ('free', 'Free Tier', 0, '{"maxtokens": 10000, "voice_hours": 0, "social_accounts": 0}'),
  ('pro', 'Pro User', 2900, '{"maxtokens": -1, "voice_hours": 10, "social_accounts": 1}'),
  ('commander', 'Commander', 49900, '{"maxtokens": -1, "voice_hours": -1, "social_accounts": 10}'),
  ('general', 'General', 199900, '{"maxtokens": -1, "voice_hours": -1, "social_accounts": 100}')
on conflict (id) do nothing;

-- 2. User Subscriptions (State)
create table if not exists user_subscriptions (
  user_id uuid references auth.users(id) primary key,
  tier_id text references subscription_tiers(id) default 'free',
  stripe_customer_id text,
  stripe_subscription_id text,
  credits_video_balance int default 0, -- For one-off generations
  status text default 'active', -- active, past_due, canceled
  current_period_end timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. Enable RLS
alter table user_subscriptions enable row level security;

-- Policies
create policy "Users can view own subscription" 
  on user_subscriptions for select 
  using (auth.uid() = user_id);

-- Function to check permission (for use in triggers/apps)
create or replace function check_feature_access(user_uuid uuid, feature_key text)
returns boolean as $$
declare
  user_tier text;
  tier_features jsonb;
begin
  select tier_id into user_tier from user_subscriptions where user_id = user_uuid;
  select features into tier_features from subscription_tiers where id = user_tier;
  
  -- Simple check: if key exists and is truthy
  return (tier_features->>feature_key)::text is distinct from '0' and (tier_features->>feature_key) is not null;
end;
$$ language plpgsql security definer;
