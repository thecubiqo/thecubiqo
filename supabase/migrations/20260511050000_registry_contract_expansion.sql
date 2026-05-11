alter table public.social_accounts
drop constraint if exists social_accounts_platform_check;

alter table public.social_accounts
add constraint social_accounts_platform_check check (
  platform in (
    'linkedin',
    'x',
    'instagram',
    'threads',
    'tiktok',
    'facebook',
    'pinterest',
    'youtube',
    'reddit',
    'bluesky'
  )
);

update public.pod_providers
set metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
  'registry_contract_version', 'sprint3-contract-expansion',
  'supportsAutomation', connection_type = 'direct_api'
)
where provider in (
  'printify',
  'printful',
  'gelato',
  'apliiq',
  'customcat',
  'teelaunch',
  'shineon',
  'spreadconnect',
  'only_caps',
  'cjdropshipping',
  'zendrop'
);
