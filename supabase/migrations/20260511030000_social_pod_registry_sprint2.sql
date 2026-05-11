create extension if not exists "pgcrypto";

create table if not exists public.social_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null,
  account_label text,
  account_handle text,
  status text not null default 'active',
  connection_type text not null default 'browser_or_api',
  scopes text[] not null default array[]::text[],
  metadata jsonb not null default '{}'::jsonb,
  connected_at timestamptz not null default now(),
  last_used_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint social_accounts_platform_check check (
    platform in ('linkedin', 'x', 'instagram', 'threads', 'tiktok', 'facebook', 'pinterest')
  ),
  constraint social_accounts_status_check check (
    status in ('active', 'paused', 'revoked', 'expired', 'failed')
  ),
  constraint social_accounts_connection_type_check check (
    connection_type in ('browser', 'api', 'oauth', 'manual', 'browser_or_api')
  )
);

create unique index if not exists social_accounts_user_platform_handle_idx
  on public.social_accounts (user_id, platform, coalesce(account_handle, ''));

create index if not exists social_accounts_user_platform_status_idx
  on public.social_accounts (user_id, platform, status);

alter table public.social_accounts enable row level security;

drop policy if exists "social_accounts_select_own" on public.social_accounts;
create policy "social_accounts_select_own"
on public.social_accounts
for select
using (auth.uid() = user_id);

-- No client insert/update/delete policy is intentionally defined.
-- Connections are created and changed only through server-side connector routes.

create table if not exists public.pod_providers (
  id uuid primary key default gen_random_uuid(),
  provider text not null unique,
  label text not null,
  status text not null default 'active',
  connection_type text not null,
  api_url text,
  dashboard_url_template text,
  shopify_app_url text,
  supports_product_types text[] not null default array[]::text[],
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pod_providers_status_check check (
    status in ('active', 'inactive', 'deprecated')
  ),
  constraint pod_providers_connection_type_check check (
    connection_type in ('direct_api', 'shopify_app', 'manual')
  )
);

alter table public.pod_providers enable row level security;

drop policy if exists "pod_providers_authenticated_read" on public.pod_providers;
create policy "pod_providers_authenticated_read"
on public.pod_providers
for select
to authenticated
using (true);

-- No client write policy is intentionally defined. Provider registry rows are
-- maintained through migrations/admin tooling, never by browser clients.

insert into public.pod_providers (
  provider,
  label,
  status,
  connection_type,
  api_url,
  dashboard_url_template,
  shopify_app_url,
  supports_product_types,
  metadata
) values
  ('printify', 'Printify', 'active', 'direct_api', 'https://api.printify.com/v1', 'https://printify.com/app/products/{provider_product_id}', null, array['apparel','home','accessories'], '{"credential_source":"server_secret"}'::jsonb),
  ('printful', 'Printful', 'active', 'direct_api', 'https://api.printful.com', 'https://www.printful.com/dashboard/default/products/{provider_product_id}', null, array['apparel','home','accessories'], '{"credential_source":"server_secret"}'::jsonb),
  ('gelato', 'Gelato', 'active', 'direct_api', 'https://api.gelato.com/v4', 'https://dashboard.gelato.com/products/{provider_product_id}', null, array['apparel','paper','wall-art'], '{"credential_source":"server_secret"}'::jsonb),
  ('apliiq', 'Apliiq', 'active', 'shopify_app', null, null, 'https://apps.shopify.com/apliiq', array['apparel','hoodie','shirt','hat'], '{"routing":"shopify_app"}'::jsonb),
  ('customcat', 'CustomCat', 'active', 'shopify_app', null, null, 'https://apps.shopify.com/customcat-fulfillment', array['apparel','drinkware','home'], '{"routing":"shopify_app"}'::jsonb),
  ('teelaunch', 'Teelaunch', 'active', 'shopify_app', null, null, 'https://apps.shopify.com/teelaunch-1', array['apparel','home','accessories'], '{"routing":"shopify_app"}'::jsonb),
  ('shineon', 'ShineOn', 'active', 'shopify_app', null, null, 'https://apps.shopify.com/shineon', array['jewelry','gift'], '{"routing":"shopify_app"}'::jsonb),
  ('spreadconnect', 'Spreadconnect', 'active', 'shopify_app', null, null, 'https://apps.shopify.com/spreadconnect', array['apparel','accessories'], '{"routing":"shopify_app"}'::jsonb),
  ('only_caps', 'Only Caps', 'active', 'shopify_app', null, null, 'https://apps.shopify.com/only-caps', array['hat','cap'], '{"routing":"shopify_app"}'::jsonb),
  ('cjdropshipping', 'CJdropshipping', 'active', 'manual', null, null, null, array['dropshipping'], '{"routing":"manual"}'::jsonb),
  ('zendrop', 'Zendrop', 'active', 'manual', null, null, null, array['dropshipping'], '{"routing":"manual"}'::jsonb)
on conflict (provider) do update set
  label = excluded.label,
  status = excluded.status,
  connection_type = excluded.connection_type,
  api_url = excluded.api_url,
  dashboard_url_template = excluded.dashboard_url_template,
  shopify_app_url = excluded.shopify_app_url,
  supports_product_types = excluded.supports_product_types,
  metadata = excluded.metadata,
  updated_at = now();
