alter table if exists public.shopify_store_connections
  add column if not exists default_product_tags text[] not null default array[]::text[],
  add column if not exists default_product_price numeric(10, 2),
  add column if not exists default_product_title text,
  add column if not exists default_collection_title text;

comment on column public.shopify_store_connections.default_product_tags is
  'Per-store product tags. Empty means no automatic tags; CubiQo source code must not inject platform branding.';

comment on column public.shopify_store_connections.default_product_price is
  'Optional per-store default product price used only when a product payload does not provide variants or price.';

comment on column public.shopify_store_connections.default_product_title is
  'Optional per-store neutral fallback title. Source code must not reference user-specific brands or stores.';

comment on column public.shopify_store_connections.default_collection_title is
  'Optional per-store neutral fallback collection title.';
