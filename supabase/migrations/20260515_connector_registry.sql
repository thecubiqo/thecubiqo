-- CubiQo Apps Mapping - connector registry and platform seed rows.

create table if not exists public.connector_registry (
  id uuid primary key default gen_random_uuid(),
  platform text unique not null,
  display_name text not null,
  description text,
  adapter_type text not null check (adapter_type in ('oauth2', 'api_key', 'open_banking', 'extension')),
  logo_url text,
  category text,
  phase int default 3,
  priority text default 'medium' check (priority in ('critical', 'high', 'medium', 'low')),
  oauth_auth_url text,
  oauth_token_url text,
  oauth_revoke_url text,
  oauth_client_id_env text,
  oauth_client_secret_env text,
  oauth_default_scopes text[] default '{}',
  oauth_pkce boolean default true,
  api_key_header_name text,
  api_key_header_prefix text,
  api_base_url text,
  ob_provider text,
  ob_products text[] default '{}',
  ext_capabilities text[] default '{}',
  ext_login_url text,
  detection_risk text default 'zero' check (detection_risk in ('zero', 'negligible', 'low', 'medium', 'high')),
  tos_risk boolean default false,
  never_automate_writes boolean default false,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

comment on table public.connector_registry is
  $$Platform connector configurations. Each row is one platform; new platforms are rows, not code.$$;

create index if not exists connector_registry_category_idx
  on public.connector_registry(category, phase, priority);
create index if not exists connector_registry_adapter_idx
  on public.connector_registry(adapter_type);

insert into public.connector_registry (
  platform, display_name, description, adapter_type, category, phase, priority,
  oauth_auth_url, oauth_token_url, oauth_client_id_env, oauth_client_secret_env,
  oauth_default_scopes, oauth_pkce, detection_risk
) values
('google', 'Google (Gmail + Calendar + Drive)',
 'Unified Google connector for Gmail, Calendar, Drive, Docs, and YouTube.',
 'oauth2', 'productivity', 1, 'critical',
 'https://accounts.google.com/o/oauth2/v2/auth', 'https://oauth2.googleapis.com/token',
 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET',
 ARRAY[
   'https://www.googleapis.com/auth/gmail.readonly',
   'https://www.googleapis.com/auth/gmail.send',
   'https://www.googleapis.com/auth/calendar',
   'https://www.googleapis.com/auth/drive.file',
   'https://www.googleapis.com/auth/documents'
 ], true, 'zero'),
('microsoft', 'Microsoft (Outlook + Teams + OneDrive)',
 'Microsoft Graph connector for Outlook, Teams, OneDrive, and Office files.',
 'oauth2', 'productivity', 1, 'critical',
 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
 'MICROSOFT_CLIENT_ID', 'MICROSOFT_CLIENT_SECRET',
 ARRAY['Mail.ReadWrite', 'Mail.Send', 'Calendars.ReadWrite', 'Files.ReadWrite', 'Chat.ReadWrite', 'offline_access', 'openid', 'profile'],
 true, 'zero'),
('slack', 'Slack',
 'Send and read messages, search channels, and support workflow coordination.',
 'oauth2', 'productivity', 1, 'critical',
 'https://slack.com/oauth/v2/authorize', 'https://slack.com/api/oauth.v2.access',
 'SLACK_CLIENT_ID', 'SLACK_CLIENT_SECRET',
 ARRAY['channels:read', 'channels:history', 'chat:write', 'users:read', 'search:read'],
 true, 'zero'),
('github', 'GitHub',
 'Read and work with repositories, issues, pull requests, Actions, and gists.',
 'oauth2', 'career', 1, 'critical',
 'https://github.com/login/oauth/authorize', 'https://github.com/login/oauth/access_token',
 'GITHUB_CLIENT_ID', 'GITHUB_CLIENT_SECRET',
 ARRAY['repo', 'read:user', 'user:email', 'workflow', 'gist'], false, 'zero'),
('linkedin', 'LinkedIn',
 'Profile, connections, and job search. Apply flows route through extension approval gates.',
 'oauth2', 'career', 1, 'critical',
 'https://www.linkedin.com/oauth/v2/authorization', 'https://www.linkedin.com/oauth/v2/accessToken',
 'LINKEDIN_CLIENT_ID', 'LINKEDIN_CLIENT_SECRET',
 ARRAY['r_liteprofile', 'r_emailaddress', 'r_basicprofile', 'r_jobs'], false, 'zero'),
('notion', 'Notion',
 'Read and write pages, databases, and blocks.',
 'oauth2', 'productivity', 1, 'high',
 'https://api.notion.com/v1/oauth/authorize', 'https://api.notion.com/v1/oauth/token',
 'NOTION_CLIENT_ID', 'NOTION_CLIENT_SECRET',
 ARRAY[]::text[], true, 'zero'),
('discord', 'Discord',
 'Send messages, read channels, and support community workflows.',
 'oauth2', 'productivity', 1, 'high',
 'https://discord.com/api/oauth2/authorize', 'https://discord.com/api/oauth2/token',
 'DISCORD_CLIENT_ID', 'DISCORD_CLIENT_SECRET',
 ARRAY['identify', 'email', 'guilds', 'bot', 'messages.read'], true, 'zero'),
('spotify', 'Spotify',
 'Playback, library, playlist, and podcast controls.',
 'oauth2', 'entertainment', 1, 'high',
 'https://accounts.spotify.com/authorize', 'https://accounts.spotify.com/api/token',
 'SPOTIFY_CLIENT_ID', 'SPOTIFY_CLIENT_SECRET',
 ARRAY['user-read-playback-state', 'user-modify-playback-state', 'user-read-currently-playing', 'playlist-modify-public', 'playlist-modify-private', 'user-library-read', 'user-library-modify'],
 true, 'zero'),
('shopify', 'Shopify',
 'Full store management for products, orders, customers, inventory, analytics, and reports.',
 'oauth2', 'ecommerce', 1, 'critical',
 '', '',
 'SHOPIFY_CLIENT_ID', 'SHOPIFY_CLIENT_SECRET',
 ARRAY['read_products', 'write_products', 'read_orders', 'write_orders', 'read_customers', 'read_inventory', 'write_inventory', 'read_analytics', 'read_reports'],
 false, 'zero'),
('ebay', 'eBay',
 'Listings, orders, messages, returns, and marketplace management.',
 'oauth2', 'ecommerce', 1, 'high',
 'https://auth.ebay.com/oauth2/authorize', 'https://api.ebay.com/identity/v1/oauth2/token',
 'EBAY_CLIENT_ID', 'EBAY_CLIENT_SECRET',
 ARRAY['https://api.ebay.com/oauth/api_scope', 'https://api.ebay.com/oauth/api_scope/sell.inventory'],
 true, 'zero'),
('coinbase', 'Coinbase',
 'Read crypto portfolio, balances, transactions, and price data.',
 'oauth2', 'crypto', 1, 'critical',
 'https://www.coinbase.com/oauth/authorize', 'https://api.coinbase.com/oauth/token',
 'COINBASE_CLIENT_ID', 'COINBASE_CLIENT_SECRET',
 ARRAY['wallet:user:read', 'wallet:accounts:read', 'wallet:transactions:read', 'wallet:prices:read'],
 true, 'zero'),
('youtube', 'YouTube',
 'Upload videos, manage channel, and read analytics. Shares Google OAuth credentials.',
 'oauth2', 'social', 1, 'high',
 'https://accounts.google.com/o/oauth2/v2/auth', 'https://oauth2.googleapis.com/token',
 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET',
 ARRAY['https://www.googleapis.com/auth/youtube', 'https://www.googleapis.com/auth/youtube.upload', 'https://www.googleapis.com/auth/yt-analytics.readonly'],
 true, 'zero')
on conflict (platform) do update set
  display_name = excluded.display_name,
  description = excluded.description,
  adapter_type = excluded.adapter_type,
  category = excluded.category,
  phase = excluded.phase,
  priority = excluded.priority,
  oauth_auth_url = excluded.oauth_auth_url,
  oauth_token_url = excluded.oauth_token_url,
  oauth_client_id_env = excluded.oauth_client_id_env,
  oauth_client_secret_env = excluded.oauth_client_secret_env,
  oauth_default_scopes = excluded.oauth_default_scopes,
  oauth_pkce = excluded.oauth_pkce,
  detection_risk = excluded.detection_risk,
  is_active = true,
  updated_at = now();

insert into public.connector_registry (
  platform, display_name, description, adapter_type, category, phase, priority,
  api_key_header_name, api_key_header_prefix, api_base_url, detection_risk
) values
('binance_us', 'Binance.US', 'Crypto portfolio, market data, and trading readiness.', 'api_key', 'crypto', 1, 'critical', 'X-MBX-APIKEY', null, 'https://api.binance.us', 'zero'),
('kraken', 'Kraken', 'Crypto balances, transaction history, and trading readiness.', 'api_key', 'crypto', 1, 'high', 'API-Key', null, 'https://api.kraken.com', 'zero'),
('indeed', 'Indeed', 'Job search read workflows. Apply flows route through extension approval gates.', 'api_key', 'career', 1, 'critical', 'Authorization', 'Bearer', 'https://apis.indeed.com', 'zero')
on conflict (platform) do update set
  display_name = excluded.display_name,
  description = excluded.description,
  adapter_type = excluded.adapter_type,
  category = excluded.category,
  phase = excluded.phase,
  priority = excluded.priority,
  api_key_header_name = excluded.api_key_header_name,
  api_key_header_prefix = excluded.api_key_header_prefix,
  api_base_url = excluded.api_base_url,
  detection_risk = excluded.detection_risk,
  is_active = true,
  updated_at = now();

insert into public.connector_registry (
  platform, display_name, description, adapter_type, category, phase, priority,
  ob_provider, ob_products, detection_risk
) values
('plaid', 'Plaid (Open Banking)',
 'Open Banking read access for US banks, brokerages, and investment accounts.',
 'open_banking', 'banking', 1, 'critical',
 'plaid', ARRAY['transactions', 'auth', 'investments', 'liabilities', 'identity'], 'zero')
on conflict (platform) do update set
  display_name = excluded.display_name,
  description = excluded.description,
  adapter_type = excluded.adapter_type,
  category = excluded.category,
  phase = excluded.phase,
  priority = excluded.priority,
  ob_provider = excluded.ob_provider,
  ob_products = excluded.ob_products,
  detection_risk = excluded.detection_risk,
  is_active = true,
  updated_at = now();

insert into public.connector_registry (
  platform, display_name, description, adapter_type, category, phase, priority,
  ext_capabilities, ext_login_url, detection_risk, never_automate_writes, tos_risk
) values
('linkedin_apply', 'LinkedIn Easy Apply', 'Apply to jobs in the user real browser session after approval.', 'extension', 'career', 2, 'critical', ARRAY['navigate', 'fill', 'click', 'extract'], 'https://www.linkedin.com/jobs/', 'negligible', true, false),
('indeed_apply', 'Indeed Apply', 'Submit applications through Indeed in the user real browser session after approval.', 'extension', 'career', 2, 'critical', ARRAY['navigate', 'fill', 'click', 'extract'], 'https://www.indeed.com/jobs', 'negligible', true, false),
('bumble', 'Bumble', 'Browse profiles, read matches, and draft messages. User sends.', 'extension', 'dating', 2, 'high', ARRAY['navigate', 'extract', 'read'], 'https://bumble.com/app', 'negligible', true, false),
('hinge', 'Hinge', 'Browse profiles, read likes, and draft messages. User sends.', 'extension', 'dating', 2, 'high', ARRAY['navigate', 'extract', 'read'], 'https://hinge.co/app', 'negligible', true, false),
('zillow', 'Zillow', 'Property search, saved listings, and showing request prep.', 'extension', 'property', 2, 'high', ARRAY['navigate', 'fill', 'click', 'extract'], 'https://www.zillow.com', 'negligible', false, false),
('redfin', 'Redfin', 'Property search, saved listings, and tour request prep.', 'extension', 'property', 2, 'high', ARRAY['navigate', 'fill', 'click', 'extract'], 'https://www.redfin.com', 'negligible', false, false),
('doordash', 'DoorDash', 'Food delivery flow in the user real session after approval.', 'extension', 'food', 2, 'high', ARRAY['navigate', 'fill', 'click', 'extract'], 'https://www.doordash.com', 'negligible', true, false),
('instacart', 'Instacart', 'Grocery ordering flow in the user real session after approval.', 'extension', 'food', 2, 'high', ARRAY['navigate', 'fill', 'click', 'extract'], 'https://www.instacart.com', 'negligible', true, false),
('facebook_marketplace', 'Facebook Marketplace', 'Browse, list, and message on Marketplace in the user real session.', 'extension', 'ecommerce', 2, 'high', ARRAY['navigate', 'fill', 'click', 'extract'], 'https://www.facebook.com/marketplace', 'low', false, false),
('cvs_pharmacy', 'CVS Pharmacy', 'Prescription read and refill preparation in user session.', 'extension', 'health', 2, 'high', ARRAY['navigate', 'fill', 'click', 'extract'], 'https://www.cvs.com/pharmacy', 'negligible', true, false),
('poshmark', 'Poshmark', 'List items, manage sales, and respond to offers.', 'extension', 'ecommerce', 2, 'high', ARRAY['navigate', 'fill', 'click', 'extract'], 'https://poshmark.com', 'negligible', false, false),
('netflix', 'Netflix', 'Browse, play, manage list, and read watch history.', 'extension', 'entertainment', 2, 'medium', ARRAY['navigate', 'click', 'extract'], 'https://www.netflix.com', 'negligible', false, false),
('ssa_portal', 'Social Security (SSA)', 'Check benefits, view earnings record, and prepare account tasks.', 'extension', 'government', 2, 'high', ARRAY['navigate', 'extract', 'read'], 'https://www.ssa.gov/myaccount/', 'negligible', true, false),
('venmo', 'Venmo', 'View balance and transaction history. Sending requires direct confirmation.', 'extension', 'transfers', 2, 'high', ARRAY['navigate', 'extract', 'read'], 'https://venmo.com', 'negligible', true, false)
on conflict (platform) do update set
  display_name = excluded.display_name,
  description = excluded.description,
  adapter_type = excluded.adapter_type,
  category = excluded.category,
  phase = excluded.phase,
  priority = excluded.priority,
  ext_capabilities = excluded.ext_capabilities,
  ext_login_url = excluded.ext_login_url,
  detection_risk = excluded.detection_risk,
  never_automate_writes = excluded.never_automate_writes,
  tos_risk = excluded.tos_risk,
  is_active = true,
  updated_at = now();

insert into public.connector_registry (
  platform, display_name, description, adapter_type, category, phase, priority,
  detection_risk, tos_risk, never_automate_writes
) values
('tinder', 'Tinder', 'Unofficial dating connector. Requires explicit ToS consent and user-controlled messaging.', 'api_key', 'dating', 3, 'high', 'medium', true, true),
('irs', 'IRS (US Tax)', 'Official IRS e-Services readiness for records and refund status.', 'api_key', 'government', 3, 'critical', 'zero', false, true),
('epic_mychart', 'Epic MyChart (Healthcare)', 'FHIR-based health records, appointments, and prescription readiness where supported.', 'oauth2', 'health', 3, 'critical', 'zero', false, true),
('upwork', 'Upwork', 'Search jobs, prepare proposals, and manage contracts.', 'oauth2', 'career', 3, 'high', 'zero', false, false)
on conflict (platform) do update set
  display_name = excluded.display_name,
  description = excluded.description,
  adapter_type = excluded.adapter_type,
  category = excluded.category,
  phase = excluded.phase,
  priority = excluded.priority,
  detection_risk = excluded.detection_risk,
  tos_risk = excluded.tos_risk,
  never_automate_writes = excluded.never_automate_writes,
  is_active = true,
  updated_at = now();
