create table if not exists public.platform_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.platform_settings enable row level security;

drop policy if exists "platform_settings_authenticated_read" on public.platform_settings;
create policy "platform_settings_authenticated_read"
on public.platform_settings
for select
to authenticated
using (true);

-- No client write policy is intentionally defined. Platform defaults are
-- updated through migrations/admin tooling, and per-store overrides remain on
-- each user's Shopify connection row.

insert into public.platform_settings (key, value, description)
values (
  'commerce_defaults',
  '{
    "product_title": "New Product",
    "collection_title": "New Collection",
    "bundle_title": "New Bundle",
    "product_tags": [],
    "product_price": null
  }'::jsonb,
  'Neutral fallback commerce defaults. User store settings and action payloads override these values.'
)
on conflict (key) do update set
  value = excluded.value,
  description = excluded.description,
  updated_at = now();
