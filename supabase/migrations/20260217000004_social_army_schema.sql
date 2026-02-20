-- Social Army Tables

-- 1. Social Accounts (The Soldiers)
create table if not exists social_accounts (
  id uuid default gen_random_uuid() primary key,
  platform text not null check (platform in ('twitter', 'tiktok', 'linkedin', 'instagram', 'youtube', 'reddit', 'pinterest', 'threads', 'facebook', 'discord')),
  username text not null,
  password_encrypted text, -- store securely or use reference to vault
  persona_type text check (persona_type in ('builder', 'guru', 'philosopher', 'artist', 'memer')),
  status text default 'active' check (status in ('active', 'limited', 'banned', 'offline')),
  last_posted_at timestamptz,
  created_at timestamptz default now()
);

-- 2. Campaigns (The Orders)
create table if not exists social_campaigns (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  seed_topic text not null,
  status text default 'draft' check (status in ('draft', 'running', 'paused', 'completed')),
  total_posts_target int default 0,
  created_at timestamptz default now()
);

-- 3. Content Queue (The Ammo)
create table if not exists content_queue (
  id uuid default gen_random_uuid() primary key,
  campaign_id uuid references social_campaigns(id),
  target_account_id uuid references social_accounts(id),
  content_type text check (content_type in ('video', 'image', 'text')),
  generation_status text default 'pending' check (generation_status in ('pending', 'processing', 'ready', 'failed', 'posted')),
  asset_url text,
  caption text,
  scheduled_for timestamptz,
  posted_at timestamptz,
  created_at timestamptz default now()
);

-- Enable RLS
alter table social_accounts enable row level security;
alter table social_campaigns enable row level security;
alter table content_queue enable row level security;

-- Policies (Admin only for now)
create policy "Admins can view social accounts" on social_accounts for select using (auth.role() = 'authenticated');
create policy "Admins can manage social accounts" on social_accounts for all using (auth.role() = 'authenticated');

create policy "Admins can view campaigns" on social_campaigns for select using (auth.role() = 'authenticated');
create policy "Admins can manage campaigns" on social_campaigns for all using (auth.role() = 'authenticated');

create policy "Admins can view content queue" on content_queue for select using (auth.role() = 'authenticated');
create policy "Admins can manage content queue" on content_queue for all using (auth.role() = 'authenticated');
