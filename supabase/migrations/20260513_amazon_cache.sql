-- Phase A monetisation expansion: Amazon PA API cache.
-- Server-side only cache for product card metadata. Product data is not user-owned.

create table if not exists public.amazon_product_cache (
  asin text primary key,
  title text not null,
  price_amount numeric,
  price_currency text default 'GBP',
  image_url text,
  rating numeric,
  review_count int,
  is_prime boolean default false,
  affiliate_url text not null,
  marketplace text default 'www.amazon.co.uk',
  cached_at timestamptz default now(),
  expires_at timestamptz default (now() + interval '6 hours')
);

create index if not exists amazon_cache_expires_idx
  on public.amazon_product_cache(expires_at);
