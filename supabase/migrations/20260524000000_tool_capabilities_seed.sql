-- Migration: 20260524000000_tool_capabilities_seed.sql
-- Seeds tool_capabilities for the canonical Phase 1 platform set.
--
-- Source: CubiQo-Apps-Mapping-Reference.md §Master Platform Table + Phase B
--         decision-router.ts (needs these rows or every task falls back to manual).
--
-- Risk levels: low (safe to execute), medium (write reversible), high (final/irreversible).
-- requires_approval: true for any FINAL action (publish, send, deploy, post).
--
-- Idempotent — uses (platform, tool_name, capability) unique constraint.

insert into public.tool_capabilities (platform, tool_name, route, capability, risk_level, requires_approval, available, metadata) values
  -- Google (Gmail / Calendar / Drive / Docs)
  ('google', 'gmail', 'api', 'read_messages', 'low', false, true, '{"description":"Read inbox messages","scope":"gmail.readonly"}'::jsonb),
  ('google', 'gmail', 'api', 'draft_message', 'low', false, true, '{"description":"Create draft email","scope":"gmail.compose"}'::jsonb),
  ('google', 'gmail', 'api', 'send_message', 'high', true, true, '{"description":"Send email","scope":"gmail.send","final_action":true}'::jsonb),
  ('google', 'calendar', 'api', 'read_events', 'low', false, true, '{"description":"List calendar events","scope":"calendar.readonly"}'::jsonb),
  ('google', 'calendar', 'api', 'create_event', 'medium', true, true, '{"description":"Create calendar event","scope":"calendar.events"}'::jsonb),
  ('google', 'drive', 'api', 'read_files', 'low', false, true, '{"description":"List/read Drive files","scope":"drive.readonly"}'::jsonb),
  ('google', 'drive', 'api', 'create_file', 'medium', false, true, '{"description":"Create file in Drive","scope":"drive.file"}'::jsonb),

  -- Microsoft 365
  ('microsoft', 'outlook', 'api', 'read_messages', 'low', false, true, '{"description":"Read Outlook messages","scope":"Mail.Read"}'::jsonb),
  ('microsoft', 'outlook', 'api', 'send_message', 'high', true, true, '{"description":"Send Outlook email","scope":"Mail.Send","final_action":true}'::jsonb),
  ('microsoft', 'teams', 'api', 'send_message', 'medium', true, true, '{"description":"Post to Teams channel","scope":"ChannelMessage.Send"}'::jsonb),

  -- Slack
  ('slack', 'channels', 'api', 'list_channels', 'low', false, true, '{"description":"List workspace channels","scope":"channels:read"}'::jsonb),
  ('slack', 'channels', 'api', 'read_messages', 'low', false, true, '{"description":"Read channel history","scope":"channels:history"}'::jsonb),
  ('slack', 'channels', 'api', 'send_message', 'medium', true, true, '{"description":"Post message to channel","scope":"chat:write","final_action":true}'::jsonb),

  -- GitHub
  ('github', 'repos', 'api', 'list_repos', 'low', false, true, '{"description":"List user repositories","scope":"repo"}'::jsonb),
  ('github', 'repos', 'api', 'read_files', 'low', false, true, '{"description":"Read repo file contents","scope":"repo"}'::jsonb),
  ('github', 'issues', 'api', 'create_issue', 'medium', true, true, '{"description":"Create issue","scope":"repo","final_action":true}'::jsonb),
  ('github', 'pulls', 'api', 'create_pr', 'high', true, true, '{"description":"Open pull request","scope":"repo","final_action":true}'::jsonb),
  ('github', 'actions', 'api', 'list_workflows', 'low', false, true, '{"description":"List Actions workflows","scope":"workflow"}'::jsonb),

  -- LinkedIn (T1 read; T3 extension for apply)
  ('linkedin', 'profile', 'api', 'read_profile', 'low', false, true, '{"description":"Read own profile","scope":"r_liteprofile"}'::jsonb),
  ('linkedin', 'jobs', 'api', 'search_jobs', 'low', false, true, '{"description":"Search job listings","scope":"r_emailaddress"}'::jsonb),
  ('linkedin', 'easy_apply', 'extension', 'apply_to_job', 'high', true, true, '{"description":"Submit Easy Apply via real browser session","final_action":true,"detection_risk":"negligible"}'::jsonb),
  ('linkedin', 'posts', 'extension', 'create_post', 'high', true, true, '{"description":"Publish post","final_action":true}'::jsonb),

  -- Shopify
  ('shopify', 'products', 'api', 'list_products', 'low', false, true, '{"description":"List store products"}'::jsonb),
  ('shopify', 'products', 'api', 'create_product_draft', 'medium', false, true, '{"description":"Create product (draft)","scope":"write_products"}'::jsonb),
  ('shopify', 'products', 'api', 'publish_product', 'high', true, true, '{"description":"Publish product to storefront","final_action":true}'::jsonb),
  ('shopify', 'orders', 'api', 'list_orders', 'low', false, true, '{"description":"List orders"}'::jsonb),
  ('shopify', 'orders', 'api', 'fulfill_order', 'high', true, true, '{"description":"Fulfil order","final_action":true}'::jsonb),

  -- Printful / Printify (POD)
  ('printful', 'products', 'api', 'list_products', 'low', false, true, '{"description":"List POD catalogue"}'::jsonb),
  ('printful', 'orders', 'api', 'create_order_draft', 'medium', false, true, '{"description":"Create fulfilment order (draft)"}'::jsonb),
  ('printful', 'orders', 'api', 'confirm_order', 'high', true, true, '{"description":"Confirm fulfilment","final_action":true}'::jsonb),
  ('printify', 'products', 'api', 'list_products', 'low', false, true, '{"description":"List POD catalogue"}'::jsonb),
  ('printify', 'orders', 'api', 'create_order_draft', 'medium', false, true, '{"description":"Create fulfilment order (draft)"}'::jsonb),

  -- Notion
  ('notion', 'pages', 'api', 'read_page', 'low', false, true, '{"description":"Read Notion page"}'::jsonb),
  ('notion', 'pages', 'api', 'create_page', 'medium', false, true, '{"description":"Create Notion page"}'::jsonb),
  ('notion', 'databases', 'api', 'query_database', 'low', false, true, '{"description":"Query Notion DB"}'::jsonb),

  -- Discord
  ('discord', 'channels', 'api', 'send_message', 'medium', true, true, '{"description":"Send message to channel","final_action":true}'::jsonb),

  -- Plaid (Open Banking)
  ('plaid', 'accounts', 'open_banking', 'list_accounts', 'low', false, true, '{"description":"List linked bank accounts"}'::jsonb),
  ('plaid', 'transactions', 'open_banking', 'list_transactions', 'low', false, true, '{"description":"List bank transactions"}'::jsonb),
  ('plaid', 'investments', 'open_banking', 'list_holdings', 'low', false, true, '{"description":"List brokerage holdings"}'::jsonb),

  -- Crypto exchanges (API key)
  ('coinbase', 'portfolio', 'api', 'list_holdings', 'low', false, true, '{"description":"List crypto holdings"}'::jsonb),
  ('coinbase', 'trades', 'api', 'place_trade', 'high', true, true, '{"description":"Execute trade","final_action":true,"regulatory":"requires_per_trade_approval"}'::jsonb),
  ('binance_us', 'portfolio', 'api', 'list_holdings', 'low', false, true, '{"description":"List crypto holdings"}'::jsonb),

  -- Stripe (already built in Phase A)
  ('stripe', 'customers', 'api', 'list_customers', 'low', false, true, '{"description":"List customers"}'::jsonb),
  ('stripe', 'subscriptions', 'api', 'create_subscription', 'high', true, true, '{"description":"Create subscription","final_action":true}'::jsonb),

  -- eBay
  ('ebay', 'listings', 'api', 'list_listings', 'low', false, true, '{"description":"List your eBay listings"}'::jsonb),
  ('ebay', 'listings', 'api', 'create_listing_draft', 'medium', false, true, '{"description":"Create draft listing"}'::jsonb),
  ('ebay', 'listings', 'api', 'publish_listing', 'high', true, true, '{"description":"Publish listing","final_action":true}'::jsonb),

  -- Spotify
  ('spotify', 'library', 'api', 'list_playlists', 'low', false, true, '{"description":"List user playlists"}'::jsonb),
  ('spotify', 'playback', 'api', 'control_playback', 'low', false, true, '{"description":"Play/pause/skip"}'::jsonb),

  -- YouTube (Google)
  ('youtube', 'videos', 'api', 'list_videos', 'low', false, true, '{"description":"List uploaded videos"}'::jsonb),
  ('youtube', 'videos', 'api', 'upload_video', 'high', true, true, '{"description":"Upload video","final_action":true}'::jsonb),

  -- Amtrak (travel)
  ('amtrak', 'schedules', 'api', 'search_trains', 'low', false, true, '{"description":"Search train schedules"}'::jsonb),
  ('amtrak', 'booking', 'api', 'book_ticket', 'high', true, true, '{"description":"Book ticket","final_action":true,"payment":true}'::jsonb),

  -- Indeed (jobs)
  ('indeed', 'jobs', 'api', 'search_jobs', 'low', false, true, '{"description":"Search job postings"}'::jsonb),
  ('indeed', 'jobs', 'extension', 'apply_to_job', 'high', true, true, '{"description":"Submit application via real browser","final_action":true}'::jsonb),

  -- Internal capabilities (always available, no connector needed)
  ('internal', 'web_search', 'api', 'tavily_search', 'low', false, true, '{"description":"Tavily live web search"}'::jsonb),
  ('internal', 'browser', 'stagehand_browserbase', 'navigate_and_extract', 'medium', false, true, '{"description":"Stagehand DOM-aware browse"}'::jsonb),
  ('internal', 'browser', 'visible_browser', 'navigate_with_user', 'medium', false, true, '{"description":"User-present browser session"}'::jsonb),
  ('internal', 'memory', 'mcp', 'read_memory_events', 'low', false, true, '{"description":"Read user memory store"}'::jsonb),
  ('internal', 'media', 'api', 'generate_image', 'low', false, true, '{"description":"Generate image via Flux 2 Pro"}'::jsonb)
on conflict (platform, tool_name, capability) do update set
  route = excluded.route,
  risk_level = excluded.risk_level,
  requires_approval = excluded.requires_approval,
  available = excluded.available,
  metadata = excluded.metadata;

-- Extend platform_automation_policy with the rest of the canonical platform set.
insert into public.platform_automation_policy
  (platform, can_read, can_draft, can_write_with_approval, can_final_submit, prohibited_actions, metadata)
values
  ('google',    true, true,  true,  false, array['final_send_without_user_approval'],            '{"oauth":true,"final_actions_require_approval":true}'::jsonb),
  ('microsoft', true, true,  true,  false, array['final_send_without_user_approval'],            '{"oauth":true,"final_actions_require_approval":true}'::jsonb),
  ('slack',     true, true,  true,  false, array['mass_dm','final_publish_without_user_approval'], '{"oauth":true}'::jsonb),
  ('github',    true, true,  true,  false, array['force_push_to_main','final_submit_without_user_approval'], '{"oauth":true}'::jsonb),
  ('linkedin',  true, true,  false, false, array['mass_message','final_post_without_user_approval'],    '{"extension_required_for_writes":true}'::jsonb),
  ('plaid',     true, false, false, false, array['any_write_action'],                             '{"open_banking":true,"read_only":true}'::jsonb),
  ('coinbase',  true, true,  false, false, array['trade_without_user_approval'],                  '{"financial":true,"per_trade_approval":true}'::jsonb),
  ('binance_us', true, true, false, false, array['trade_without_user_approval'],                  '{"financial":true,"per_trade_approval":true}'::jsonb),
  ('stripe',    true, true,  true,  false, array['payment_without_user_approval'],                '{"financial":true}'::jsonb),
  ('notion',    true, true,  true,  false, array[]::text[],                                       '{"oauth":true}'::jsonb),
  ('discord',   true, true,  true,  false, array['mass_dm'],                                      '{"oauth":true}'::jsonb),
  ('printful',  true, true,  true,  false, array['fulfilment_without_user_approval'],             '{"oauth":true}'::jsonb),
  ('printify',  true, true,  true,  false, array['fulfilment_without_user_approval'],             '{"oauth":true}'::jsonb),
  ('ebay',      true, true,  true,  false, array['publish_listing_without_user_approval'],        '{"oauth":true}'::jsonb),
  ('spotify',   true, true,  true,  false, array[]::text[],                                       '{"oauth":true}'::jsonb),
  ('youtube',   true, true,  false, false, array['publish_without_user_approval'],                '{"oauth":true,"google_token":true}'::jsonb),
  ('amtrak',    true, true,  false, false, array['book_without_user_approval','payment'],         '{"financial":true}'::jsonb),
  ('indeed',    true, true,  false, false, array['apply_without_user_approval'],                  '{"extension_required_for_writes":true}'::jsonb)
on conflict (platform) do update set
  can_read = excluded.can_read,
  can_draft = excluded.can_draft,
  can_write_with_approval = excluded.can_write_with_approval,
  can_final_submit = excluded.can_final_submit,
  prohibited_actions = excluded.prohibited_actions,
  metadata = excluded.metadata,
  updated_at = now();
