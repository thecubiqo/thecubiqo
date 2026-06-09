create extension if not exists "pgcrypto";

create table if not exists public.commerce_connector_secrets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  connection_type text not null default 'direct_api',
  store_url text,
  secret_ciphertext text,
  secret_iv text,
  secret_tag text,
  secret_hint text,
  status text not null default 'configured_unverified',
  metadata jsonb not null default '{}'::jsonb,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shopify_store_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  approval_id uuid references public.action_approvals(id) on delete set null,
  store_url text not null,
  status text not null default 'configured_unverified',
  plan text,
  product_counts jsonb not null default '{"active":0,"draft":0,"archived":0}'::jsonb,
  shopify_shop_id text,
  last_error text,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, store_url)
);

create table if not exists public.fulfillment_provider_statuses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  status text not null default 'not_installed',
  connection_type text not null,
  shopify_app_url text,
  supports_product_types text[] not null default array[]::text[],
  metadata jsonb not null default '{}'::jsonb,
  checked_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider)
);

create table if not exists public.shopify_products (
  product_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  approval_id uuid references public.action_approvals(id) on delete set null,
  shopify_id text,
  title text not null,
  description text not null default '',
  seo_description text,
  asset_id uuid references public.gfx_assets(id) on delete set null,
  fulfillment_provider text not null,
  variants jsonb not null default '[]'::jsonb,
  tags text[] not null default array[]::text[],
  collections text[] not null default array[]::text[],
  status text not null default 'draft',
  sync_status text not null default 'prepared',
  product_payload jsonb not null default '{}'::jsonb,
  provider_product_id text,
  external_call_performed boolean not null default false,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

create table if not exists public.provider_designs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  approval_id uuid references public.action_approvals(id) on delete set null,
  asset_id uuid references public.gfx_assets(id) on delete set null,
  provider text not null,
  provider_product_id text,
  status text not null default 'prepared',
  design_payload jsonb not null default '{}'::jsonb,
  preview_card jsonb not null default '{}'::jsonb,
  external_call_performed boolean not null default false,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.provider_product_syncs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  approval_id uuid references public.action_approvals(id) on delete set null,
  provider_design_id uuid references public.provider_designs(id) on delete cascade,
  shopify_product_id uuid references public.shopify_products(product_id) on delete set null,
  provider text not null,
  status text not null default 'prepared',
  sync_payload jsonb not null default '{}'::jsonb,
  external_call_performed boolean not null default false,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shopify_collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  approval_id uuid references public.action_approvals(id) on delete set null,
  shopify_collection_id text,
  title text not null,
  collection_type text not null default 'manual',
  rules jsonb not null default '{}'::jsonb,
  status text not null default 'prepared',
  external_call_performed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shopify_collection_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  approval_id uuid references public.action_approvals(id) on delete set null,
  collection_id uuid references public.shopify_collections(id) on delete cascade,
  product_id uuid references public.shopify_products(product_id) on delete cascade,
  status text not null default 'prepared',
  external_call_performed boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.shopify_inventory_levels (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid references public.shopify_products(product_id) on delete set null,
  variant_id text,
  sku text,
  inventory_quantity integer not null default 0,
  source text not null default 'local_snapshot',
  checked_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.shopify_inventory_adjustments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  approval_id uuid references public.action_approvals(id) on delete set null,
  product_id uuid references public.shopify_products(product_id) on delete set null,
  variant_id text,
  before_quantity integer,
  after_quantity integer not null,
  status text not null default 'prepared',
  external_call_performed boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.shopify_order_summaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date_range jsonb not null default '{}'::jsonb,
  open_count integer not null default 0,
  fulfilled_count integer not null default 0,
  cancelled_count integer not null default 0,
  revenue numeric(12,2) not null default 0,
  fulfilment_rate numeric(5,2) not null default 0,
  top_products jsonb not null default '[]'::jsonb,
  source text not null default 'local_aggregate',
  created_at timestamptz not null default now()
);

create table if not exists public.aftership_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  approval_id uuid references public.action_approvals(id) on delete set null,
  status text not null default 'configured_unverified',
  secret_hint text,
  verified_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create table if not exists public.aftership_tracking_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  shipment_count integer not null default 0,
  statuses jsonb not null default '[]'::jsonb,
  source text not null default 'aftership_read_only',
  created_at timestamptz not null default now()
);

create table if not exists public.aftership_return_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  open_return_count integer not null default 0,
  statuses jsonb not null default '[]'::jsonb,
  source text not null default 'aftership_read_only',
  created_at timestamptz not null default now()
);

create table if not exists public.shopify_analytics_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date_range jsonb not null default '{}'::jsonb,
  revenue numeric(12,2) not null default 0,
  sessions integer not null default 0,
  conversion_rate numeric(5,2) not null default 0,
  top_products jsonb not null default '[]'::jsonb,
  source text not null default 'aggregate_only',
  created_at timestamptz not null default now()
);

create table if not exists public.shopify_bundles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  approval_id uuid references public.action_approvals(id) on delete set null,
  title text not null,
  product_ids uuid[] not null default array[]::uuid[],
  pricing jsonb not null default '{}'::jsonb,
  status text not null default 'prepared',
  external_call_performed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.marketplace_status_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  marketplaces jsonb not null default '[]'::jsonb,
  source text not null default 'shopify_marketplace_connect_read_only',
  created_at timestamptz not null default now()
);

create table if not exists public.commerce_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  asset_id uuid references public.gfx_assets(id) on delete set null,
  product_id uuid references public.shopify_products(product_id) on delete set null,
  provider text,
  approval_id uuid references public.action_approvals(id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_shopify_products_user_created on public.shopify_products(user_id, created_at desc);
create index if not exists idx_provider_designs_user_created on public.provider_designs(user_id, created_at desc);
create index if not exists idx_commerce_events_user_created on public.commerce_events(user_id, created_at desc);
create index if not exists idx_commerce_events_type_created on public.commerce_events(event_type, created_at desc);
create unique index if not exists idx_commerce_connector_secrets_user_provider_store on public.commerce_connector_secrets(user_id, provider, coalesce(store_url, ''));

alter table public.commerce_connector_secrets enable row level security;
alter table public.shopify_store_connections enable row level security;
alter table public.fulfillment_provider_statuses enable row level security;
alter table public.shopify_products enable row level security;
alter table public.provider_designs enable row level security;
alter table public.provider_product_syncs enable row level security;
alter table public.shopify_collections enable row level security;
alter table public.shopify_collection_assignments enable row level security;
alter table public.shopify_inventory_levels enable row level security;
alter table public.shopify_inventory_adjustments enable row level security;
alter table public.shopify_order_summaries enable row level security;
alter table public.aftership_connections enable row level security;
alter table public.aftership_tracking_snapshots enable row level security;
alter table public.aftership_return_snapshots enable row level security;
alter table public.shopify_analytics_snapshots enable row level security;
alter table public.shopify_bundles enable row level security;
alter table public.marketplace_status_snapshots enable row level security;
alter table public.commerce_events enable row level security;
