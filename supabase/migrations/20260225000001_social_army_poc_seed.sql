-- Social Army: POC Seed — 100 accounts across 10 platforms × 10 personas
-- Each platform gets 10 accounts covering all 5 persona types (2 each)
-- Credentials are placeholder — replace via Admin > Social Army > Accounts

-- Twitter (10 accounts)
insert into social_accounts (platform, username, persona_type, status) values
  ('twitter', 'cubiqo_dev1',      'builder',      'active'),
  ('twitter', 'cubiqo_dev2',      'builder',      'active'),
  ('twitter', 'cubiqo_guru1',     'guru',         'active'),
  ('twitter', 'cubiqo_guru2',     'guru',         'active'),
  ('twitter', 'cubiqo_phil1',     'philosopher',  'active'),
  ('twitter', 'cubiqo_phil2',     'philosopher',  'active'),
  ('twitter', 'cubiqo_art1',      'artist',       'active'),
  ('twitter', 'cubiqo_art2',      'artist',       'active'),
  ('twitter', 'cubiqo_meme1',     'memer',        'active'),
  ('twitter', 'cubiqo_meme2',     'memer',        'active')
on conflict do nothing;

-- TikTok (10 accounts)
insert into social_accounts (platform, username, persona_type, status) values
  ('tiktok', 'cubiqo_dev1',      'builder',      'active'),
  ('tiktok', 'cubiqo_dev2',      'builder',      'active'),
  ('tiktok', 'cubiqo_guru1',     'guru',         'active'),
  ('tiktok', 'cubiqo_guru2',     'guru',         'active'),
  ('tiktok', 'cubiqo_phil1',     'philosopher',  'active'),
  ('tiktok', 'cubiqo_phil2',     'philosopher',  'active'),
  ('tiktok', 'cubiqo_art1',      'artist',       'active'),
  ('tiktok', 'cubiqo_art2',      'artist',       'active'),
  ('tiktok', 'cubiqo_meme1',     'memer',        'active'),
  ('tiktok', 'cubiqo_meme2',     'memer',        'active')
on conflict do nothing;

-- LinkedIn (10 accounts)
insert into social_accounts (platform, username, persona_type, status) values
  ('linkedin', 'cubiqo-dev1@cubiqo.ai',      'builder',      'active'),
  ('linkedin', 'cubiqo-dev2@cubiqo.ai',      'builder',      'active'),
  ('linkedin', 'cubiqo-guru1@cubiqo.ai',     'guru',         'active'),
  ('linkedin', 'cubiqo-guru2@cubiqo.ai',     'guru',         'active'),
  ('linkedin', 'cubiqo-phil1@cubiqo.ai',     'philosopher',  'active'),
  ('linkedin', 'cubiqo-phil2@cubiqo.ai',     'philosopher',  'active'),
  ('linkedin', 'cubiqo-art1@cubiqo.ai',      'artist',       'active'),
  ('linkedin', 'cubiqo-art2@cubiqo.ai',      'artist',       'active'),
  ('linkedin', 'cubiqo-meme1@cubiqo.ai',     'memer',        'active'),
  ('linkedin', 'cubiqo-meme2@cubiqo.ai',     'memer',        'active')
on conflict do nothing;

-- Instagram (10 accounts)
insert into social_accounts (platform, username, persona_type, status) values
  ('instagram', 'cubiqo.dev1',      'builder',      'active'),
  ('instagram', 'cubiqo.dev2',      'builder',      'active'),
  ('instagram', 'cubiqo.guru1',     'guru',         'active'),
  ('instagram', 'cubiqo.guru2',     'guru',         'active'),
  ('instagram', 'cubiqo.phil1',     'philosopher',  'active'),
  ('instagram', 'cubiqo.phil2',     'philosopher',  'active'),
  ('instagram', 'cubiqo.art1',      'artist',       'active'),
  ('instagram', 'cubiqo.art2',      'artist',       'active'),
  ('instagram', 'cubiqo.meme1',     'memer',        'active'),
  ('instagram', 'cubiqo.meme2',     'memer',        'active')
on conflict do nothing;

-- YouTube (10 accounts)
insert into social_accounts (platform, username, persona_type, status) values
  ('youtube', 'cubiqo.dev1@gmail.com',      'builder',      'active'),
  ('youtube', 'cubiqo.dev2@gmail.com',      'builder',      'active'),
  ('youtube', 'cubiqo.guru1@gmail.com',     'guru',         'active'),
  ('youtube', 'cubiqo.guru2@gmail.com',     'guru',         'active'),
  ('youtube', 'cubiqo.phil1@gmail.com',     'philosopher',  'active'),
  ('youtube', 'cubiqo.phil2@gmail.com',     'philosopher',  'active'),
  ('youtube', 'cubiqo.art1@gmail.com',      'artist',       'active'),
  ('youtube', 'cubiqo.art2@gmail.com',      'artist',       'active'),
  ('youtube', 'cubiqo.meme1@gmail.com',     'memer',        'active'),
  ('youtube', 'cubiqo.meme2@gmail.com',     'memer',        'active')
on conflict do nothing;

-- Reddit (10 accounts)
insert into social_accounts (platform, username, persona_type, status) values
  ('reddit', 'cubiqo_dev1',      'builder',      'active'),
  ('reddit', 'cubiqo_dev2',      'builder',      'active'),
  ('reddit', 'cubiqo_guru1',     'guru',         'active'),
  ('reddit', 'cubiqo_guru2',     'guru',         'active'),
  ('reddit', 'cubiqo_phil1',     'philosopher',  'active'),
  ('reddit', 'cubiqo_phil2',     'philosopher',  'active'),
  ('reddit', 'cubiqo_art1',      'artist',       'active'),
  ('reddit', 'cubiqo_art2',      'artist',       'active'),
  ('reddit', 'cubiqo_meme1',     'memer',        'active'),
  ('reddit', 'cubiqo_meme2',     'memer',        'active')
on conflict do nothing;

-- Pinterest (10 accounts)
insert into social_accounts (platform, username, persona_type, status) values
  ('pinterest', 'cubiqo.dev1@cubiqo.ai',      'builder',      'active'),
  ('pinterest', 'cubiqo.dev2@cubiqo.ai',      'builder',      'active'),
  ('pinterest', 'cubiqo.guru1@cubiqo.ai',     'guru',         'active'),
  ('pinterest', 'cubiqo.guru2@cubiqo.ai',     'guru',         'active'),
  ('pinterest', 'cubiqo.phil1@cubiqo.ai',     'philosopher',  'active'),
  ('pinterest', 'cubiqo.phil2@cubiqo.ai',     'philosopher',  'active'),
  ('pinterest', 'cubiqo.art1@cubiqo.ai',      'artist',       'active'),
  ('pinterest', 'cubiqo.art2@cubiqo.ai',      'artist',       'active'),
  ('pinterest', 'cubiqo.meme1@cubiqo.ai',     'memer',        'active'),
  ('pinterest', 'cubiqo.meme2@cubiqo.ai',     'memer',        'active')
on conflict do nothing;

-- Threads (10 accounts)
insert into social_accounts (platform, username, persona_type, status) values
  ('threads', 'cubiqo.dev1',      'builder',      'active'),
  ('threads', 'cubiqo.dev2',      'builder',      'active'),
  ('threads', 'cubiqo.guru1',     'guru',         'active'),
  ('threads', 'cubiqo.guru2',     'guru',         'active'),
  ('threads', 'cubiqo.phil1',     'philosopher',  'active'),
  ('threads', 'cubiqo.phil2',     'philosopher',  'active'),
  ('threads', 'cubiqo.art1',      'artist',       'active'),
  ('threads', 'cubiqo.art2',      'artist',       'active'),
  ('threads', 'cubiqo.meme1',     'memer',        'active'),
  ('threads', 'cubiqo.meme2',     'memer',        'active')
on conflict do nothing;

-- Facebook (10 accounts)
insert into social_accounts (platform, username, persona_type, status) values
  ('facebook', 'cubiqo.dev1@cubiqo.ai',      'builder',      'active'),
  ('facebook', 'cubiqo.dev2@cubiqo.ai',      'builder',      'active'),
  ('facebook', 'cubiqo.guru1@cubiqo.ai',     'guru',         'active'),
  ('facebook', 'cubiqo.guru2@cubiqo.ai',     'guru',         'active'),
  ('facebook', 'cubiqo.phil1@cubiqo.ai',     'philosopher',  'active'),
  ('facebook', 'cubiqo.phil2@cubiqo.ai',     'philosopher',  'active'),
  ('facebook', 'cubiqo.art1@cubiqo.ai',      'artist',       'active'),
  ('facebook', 'cubiqo.art2@cubiqo.ai',      'artist',       'active'),
  ('facebook', 'cubiqo.meme1@cubiqo.ai',     'memer',        'active'),
  ('facebook', 'cubiqo.meme2@cubiqo.ai',     'memer',        'active')
on conflict do nothing;

-- Discord (10 webhooks — one per server/channel)
-- password_encrypted = the Discord Webhook URL for each server
insert into social_accounts (platform, username, persona_type, status) values
  ('discord', 'cubiqo-builders-1',   'builder',      'active'),
  ('discord', 'cubiqo-builders-2',   'builder',      'active'),
  ('discord', 'cubiqo-gurus-1',      'guru',         'active'),
  ('discord', 'cubiqo-gurus-2',      'guru',         'active'),
  ('discord', 'cubiqo-thinkers-1',   'philosopher',  'active'),
  ('discord', 'cubiqo-thinkers-2',   'philosopher',  'active'),
  ('discord', 'cubiqo-artists-1',    'artist',       'active'),
  ('discord', 'cubiqo-artists-2',    'artist',       'active'),
  ('discord', 'cubiqo-memes-1',      'memer',        'active'),
  ('discord', 'cubiqo-memes-2',      'memer',        'active')
on conflict do nothing;
