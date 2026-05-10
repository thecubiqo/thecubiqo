create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.store_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null,
  shop_domain text,
  access_token text not null,
  scope text,
  status text not null default 'active',
  metadata jsonb not null default '{}'::jsonb,
  connected_at timestamptz not null default now(),
  last_used_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint store_connections_platform_valid check (platform in ('shopify', 'printify')),
  constraint store_connections_status_valid check (status in ('active', 'revoked', 'expired', 'failed')),
  constraint store_connections_user_platform_shop_unique unique (user_id, platform, shop_domain)
);

create unique index if not exists idx_store_connections_user_platform_shop
  on public.store_connections(user_id, platform, coalesce(shop_domain, ''));

create index if not exists idx_store_connections_user_status
  on public.store_connections(user_id, platform, status);

drop trigger if exists set_store_connections_updated_at on public.store_connections;
create trigger set_store_connections_updated_at
before update on public.store_connections
for each row execute function public.set_updated_at();

alter table public.store_connections enable row level security;

-- No direct client SELECT policy is intentionally created for store_connections.
-- Access tokens live in this table; metadata is exposed only through server routes
-- that strip access_token from every response.
drop policy if exists "store_connections_select_own" on public.store_connections;
drop policy if exists "store_connections_insert_own" on public.store_connections;
drop policy if exists "store_connections_update_own" on public.store_connections;
drop policy if exists "store_connections_delete_own" on public.store_connections;

create table if not exists public.connector_oauth_states (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null,
  state text not null unique,
  shop_domain text,
  redirect_uri text,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now(),
  constraint connector_oauth_states_platform_valid check (platform in ('shopify'))
);

create index if not exists idx_connector_oauth_states_state
  on public.connector_oauth_states(state);

alter table public.connector_oauth_states enable row level security;
drop policy if exists "connector_oauth_states_select_own" on public.connector_oauth_states;
drop policy if exists "connector_oauth_states_insert_own" on public.connector_oauth_states;
drop policy if exists "connector_oauth_states_update_own" on public.connector_oauth_states;
drop policy if exists "connector_oauth_states_delete_own" on public.connector_oauth_states;

create table if not exists public.pod_products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  approval_id uuid references public.action_approvals(id) on delete set null,
  shopify_product_id text,
  printify_product_id text,
  title text,
  description text,
  print_provider_id text,
  blueprint_id text,
  media_assets text[] not null default array[]::text[],
  shop_domain text,
  status text not null default 'draft',
  product_payload jsonb not null default '{}'::jsonb,
  preview_payload jsonb not null default '{}'::jsonb,
  publish_approval_id uuid references public.action_approvals(id) on delete set null,
  published_at timestamptz,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pod_products_status_valid check (status in ('draft', 'ready', 'published', 'archived', 'failed'))
);

create index if not exists idx_pod_products_user_created
  on public.pod_products(user_id, created_at desc);

drop trigger if exists set_pod_products_updated_at on public.pod_products;
create trigger set_pod_products_updated_at
before update on public.pod_products
for each row execute function public.set_updated_at();

alter table public.pod_products enable row level security;

drop policy if exists "pod_products_select_own" on public.pod_products;
create policy "pod_products_select_own"
on public.pod_products for select
using (auth.uid() = user_id);

drop policy if exists "pod_products_insert_own" on public.pod_products;
drop policy if exists "pod_products_update_own" on public.pod_products;
drop policy if exists "pod_products_delete_own" on public.pod_products;
