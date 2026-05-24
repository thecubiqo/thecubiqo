-- CubiQo Apps Mapping - extend user connectors and service-role secrets.

alter table public.user_connectors
  add column if not exists platform_id uuid references public.connector_registry(id),
  add column if not exists adapter_type text,
  add column if not exists token_expires_at timestamptz,
  add column if not exists expires_at timestamptz,
  add column if not exists refresh_token_encrypted text,
  add column if not exists ob_item_id text,
  add column if not exists ob_access_token_encrypted text,
  add column if not exists external_account_id text,
  add column if not exists last_health_check_at timestamptz,
  add column if not exists health_status text default 'unknown',
  add column if not exists health_error text,
  add column if not exists scopes text[] default '{}',
  add column if not exists metadata jsonb default '{}'::jsonb;

alter table public.user_connectors
  drop constraint if exists user_connectors_status_check;

alter table public.user_connectors
  add constraint user_connectors_status_check
  check (status in ('active','available','unavailable','needs_auth','expired','revoked','error','disconnected'));

alter table public.user_connectors
  drop constraint if exists user_connectors_health_status_check;

alter table public.user_connectors
  add constraint user_connectors_health_status_check
  check (health_status in ('healthy', 'degraded', 'broken', 'unknown'));

create index if not exists user_connectors_expires_idx
  on public.user_connectors(token_expires_at)
  where token_expires_at is not null;

create index if not exists user_connectors_user_platform_status_idx
  on public.user_connectors(user_id, platform, status);

alter table public.connector_secrets
  add column if not exists access_token_encrypted text,
  add column if not exists refresh_token_encrypted text,
  add column if not exists api_key_encrypted text,
  add column if not exists api_secret_encrypted text,
  add column if not exists ob_access_token_encrypted text,
  add column if not exists token_expires_at timestamptz,
  add column if not exists token_hint text;

alter table public.connector_secrets enable row level security;
drop policy if exists "Users read own connector secret refs" on public.connector_secrets;
drop policy if exists "Users manage own connector secrets" on public.connector_secrets;
drop policy if exists "No direct user access to connector secrets" on public.connector_secrets;
create policy "No direct user access to connector secrets"
  on public.connector_secrets for all
  using (false)
  with check (false);

create unique index if not exists connector_secrets_connector_id_key
  on public.connector_secrets(connector_id)
  where connector_id is not null;
