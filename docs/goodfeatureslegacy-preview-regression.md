# goodfeatureslegacy Preview Contract

Date: 2026-05-07
Branch: `goodfeatureslegacy`
Production branches: leave `origin/QA`, `origin/main`, and prod-track untouched except explicit bugfix work.

## Visible UI Surfaces

- Landing screen: existing CubiQo landing/particle experience remains the entry point.
- Main CubiQo shell: voice/text input, left tray controls, right RGY panel, current visual state machine.
- Auth entry: sign in/sign up UI remains available through the left tray.
- Dashboard: shows only durable surfaces and counts: account, conversations, RGY signals/legacy keywords, journals.
- Daily Journal: quick intake first, then a 15-minute Core-guided session with typed or browser speech-captured answers, then summary save.
- RGY panel: MVP capsule only: color + keyword + optional confirmed intent.

## V2 UI Reality

- Job hunt, social distribution, and business/POD work stay inside CubiQo's existing chat and approval cards.
- The only additional durable V2 surfaces are:
  - Job tracker panel: Supabase-backed table of applications, statuses, resume version, cover letter version, and approval id.
  - Content calendar view: Supabase-backed view of scheduled, posted, failed, and pending-approval content.
  - Daily/weekly report delivery in the existing CubiQo chat.
- No separate agent dashboard is required for V2.
- No incomplete workflow buttons should be shown for job submission, browser execution, posting, platform analytics, or provider writes until the exact approval path and provider integration are tested.

## RGY MVP Contract

- Capsule fields: `color`, `keyword`, `intent`.
- Valid colors: `green`, `yellow`, `red`.
- Valid intents: `socialize`, `collaborate`, `trade`.
- Intent can be pending, suggested, ambiguous, or confirmed.
- No matching happens until the user confirms one or more intents.
- Red itself is the restricted/adult-gated signal. There is no extra visible risk label.
- The right panel must not show fake rooms, fake match counts, CQ claims, or generic status tags.

## Hidden Until End-to-End Complete

- Job Hunter
- Website launcher
- Ecomm launchpad
- CQ-to-CQ
- Social Army 10/10/10
- BYO keys
- Biometrics/camera awareness
- Self-healer/full reporting
- Browser workflows beyond the Stagehand demo/action container, coder/write-agent actions
- Signal match route/button

Note: CQ-to-CQ is friend/contact messenger only. It is not the same thing as Signal match, RGY matching, or intent matching.

## Current Implementation In This Branch

- Added Supabase migration for `signals`.
- Added `/api/signals` for user-owned RGY signal create/list/update/delete.
- Added `/api/rgy/classify` for the RGY mode-reader classifier: safety layer first, taxonomy lookup before LLM, LLM fallback only when taxonomy is unclear, and server-side signal creation only.
- Tightened `signals` schema for the classifier contract: `signal_id`, `matching_enabled`, `confidence`, `shown_in_panel`, `editable_by_user`, `corrected_at`, and `raw_input`.
- Tightened signal RLS so anonymous and direct authenticated browser/client inserts are denied; server routes create signals after validating the user.
- Added `/api/journal/guide` for guided-journal questions and LLM/local summary fallback.
- Updated conversation RGY output to return keyword, suggested intents, confirmed intents, and `matching_enabled: false`.
- Updated dashboard counts/features to expose only live/code-ready surfaces.
- Updated the right panel to show editable signal capsules and user-confirmed intent chips.
- Updated Daily Journal for quick intake -> Core guided journal -> 15-minute timer -> typed/speech-captured answers -> summary storage.
- Added `/api/agent` for CubiQo V1 agentic behavior: repo stack summary, route listing, repo search/read, runtime status, RGY classification, capability planning, dashboard summary, journal read/write-summary, RGY signal read/write, memory read/write-safe-summary, task plan creation, and content brief creation. CubiQo does not run workspace commands at runtime.
- Updated typed chat routing so text submissions enter `/api/agent` first. Simple conversational messages are delegated back to the existing converse path, while repo/self-check/capability/action-boundary requests stay on the V1 agentic route.
- Added V2 foundation APIs for approval requests/status, audit reads, tool settings, approved user tasks, in-app report schedules, and in-app daily reports.
- Added V2 foundation migration for `action_approvals`, `action_audit_logs`, `user_tool_settings`, `user_tasks`, `report_schedules`, and `daily_reports`.
- Added `/actions` as the V2 Action Console inside the CubiQo shell. It exposes only completed QA-backed actions: approval cards, approve/cancel, approved task creation, in-app report schedules, in-app self/daily reports, and audit viewing.
- Added `/api/actions/capabilities` as the V2 capability manifest. It marks active, read-only, and locked tools explicitly so incomplete workflows cannot look connected.
- Added `/api/actions/execute` as the generic V2 action boundary. Locked tools return `501`, write a blocked audit entry, and do not execute.
- Added Stagehand/Browserbase browser automation through the existing `/api/actions/execute` boundary: approved `browser_open` creates an isolated Browserbase session, approved `browser_act`/click/type/extract/screenshot run through Stagehand, and every browser audit row carries `browser_session_id` when a session exists.
- Added hard browser guardrails: prod/QA targets, payment/billing/checkout, `send_email`, autonomous social publish, and deploy are blocked with non-overridable audit entries. Untrusted URLs require an extra warning confirmation before navigation.
- Added signed browser visual receipts: screenshots are uploaded to Supabase Storage and returned to the client only as 1-hour signed URLs.
- Added `/api/actions/browser-demo` as the first safe real browser workflow: approval -> example.com open -> accessibility-tree extraction -> signed screenshot -> audit -> session close.
- Added the active `/api/actions/capabilities` parent capability `browser_control`; browser action approvals are only requestable while that manifest marks the control plane active.
- Added a visible active browser session strip and Stop session button in `/actions`. Stop closes the user-owned Stagehand session through `/api/actions/execute` and writes a cancel audit row.
- Added browser audit debug UI: failed browser actions can show the captured accessibility snapshot under "What the browser saw"; successful screenshots appear as signed visual receipt links.
- Added V2 job application workflow tools through `/api/actions/execute`: approved `job_search_save` stores extracted LinkedIn/Indeed/Dice listings, approved `job_application_prepare` creates an exact review card payload, and approved `job_application_submit_approved` marks the prepared package approved for visible submission without auto-submitting externally.
- Added user-owned, server-controlled Supabase tables `job_listings` and `job_application_reviews`. Users can read their own rows; direct browser-client inserts/updates are denied so approval/audit cannot be bypassed.
- Added job workflow UI inside `/actions`: saved jobs, application review cards, and approval cards remain in the same CubiQo Action Console.
- Added V2 job profile and resume versioning tools through `/api/actions/execute`: approved `job_profile_write` creates/updates the user job profile after a preview card, and approved `resume_version_write` appends named resume versions after a diff/preview card.
- Added user-owned, server-controlled Supabase tables `job_profiles` and `resume_versions`. Users can read their own profile/resume versions; direct browser-client writes are denied so the approval/audit boundary remains mandatory.
- Added job profile and resume version UI inside `/actions`: profile context and append-only resume versions remain in the same CubiQo Action Console.
- Added V2 POD business connector layer through `/api/actions/execute`: read-only GFXTools/Shopify/Printify connector status, approved `pod_design_brief_create`, and approved `gfxtools_job_create` payload preparation.
- Added user-owned, server-controlled Supabase tables `pod_design_briefs` and `gfxtools_jobs`. Users can read their own rows; direct browser-client writes are denied so approval/audit cannot be bypassed.
- Added POD connector, design brief, and GFXTools payload UI inside `/actions`. Connector status never shows connected unless a real server-side verification path exists.
- Added V2 social content pipeline through `/api/actions/execute`: read-only social connector state, approved `social_post_prepare`, and approved `social_post_schedule_approved`.
- Added user-owned, server-controlled Supabase tables `social_content_drafts`, `social_distribution_rules`, `social_scheduled_posts`, and `social_post_fire_logs`. Users can read their own rows; direct browser-client writes are denied so approval/audit cannot be bypassed.
- Upgraded the V2 POD connector layer with first-class asset handoff: `gfx_assets`, `asset_ready_events`, `shopify_product_preparations`, and `printify_design_preparations`.
- Added approved `gfxtools_asset_resize`, `shopify_product_prepare`, and `printify_design_prepare` actions. All route through `/api/actions/execute`, require an approved action card, and write audit rows.
- Tightened the social pipeline contract: `social_post_prepare` now starts from a ready GFX asset with populated platform variants and an `asset_ready` event. Pending or failed assets are blocked.
- Added social connector, draft, distribution rule, scheduled post, and fire-log UI inside `/actions`. Connector status never shows connected unless real provider verification exists, and missing credentials create blocked logs rather than fake posts.
- Added V2 Shopify/POD operations schema for full commerce state: server-only connector secrets, Shopify store connections, fulfillment provider manifests, Shopify products, provider designs, provider syncs, collections, inventory, order/analytics summaries, AfterShip snapshots, bundles, marketplace status, and commerce handoff events.
- Added V2 Shopify/POD operations tools through `/api/actions/execute`: `shopify_store_connect`, `shopify_store_status`, `shopify_product_create`, `shopify_product_publish`, `shopify_product_update`, `shopify_product_archive`, `fulfilment_provider_read`, `pod_provider_connect`, `design_create`, `product_sync`, `provider_product_status`, collection tools, inventory tools, orders/analytics reads, AfterShip reads, bundles, and marketplace status reads.
- Added Shopify/POD operations UI inside `/actions`: approved product creation/publish/archive, direct POD design creation, provider sync, collection creation, inventory adjustment, bundle creation, Shopify products, fulfillment provider manifest, and commerce handoff events.
- Connector safety rule is enforced in the operations layer: credentials stay server-side; missing credentials return disconnected or blocked states; Shopify-app POD providers are read/routing-only; direct API providers are Printify, Printful, and Gelato; AfterShip is read-only in V2.
- Updated approval requests so non-end-to-end tools cannot receive fake approvals.
- Updated the main CubiQo response surface with a component-library based "What I checked" collapsible that shows V1 tool activity inside the existing window.
- Removed CubiQo runtime command execution. V1 no longer exposes `run_check`, no longer reads from the repo `scripts` directory, and no longer reports package scripts as product capability.
- Removed old legacy helper scripts for frontend build, db debug/setup, Supabase probing, and Social Army verification from the branch. The remaining `scripts/verify-cqai-e2e.mjs` is a Codex regression harness, not a CubiQo runtime dependency.
- Updated the regression verifier to require `signals` table in addition to existing auth/journal tables.
- Removed the incomplete `/signal` route from the visible/routable app surface.

## V2 API-First Readiness Rule

- V2 must prefer API/provider integrations before custom engineering.
- Custom engineering is allowed only when no suitable API, managed connector, or sandbox/tool provider exists.
- CubiQo should own orchestration, approvals, audit logs, feature flags, user-owned state, and visibility.
- CubiQo should not custom-build job-board crawlers, social posting engines, payment rails, raw coder terminals, browser stealth layers, CRM systems, or worker farms unless the API/provider path fails a documented review.
- V2 write/action tools must stay hidden until approval UI, feature flags, audit logging, safe failure states, and regression tests exist.
- Browser/extension fallback is allowed only for user-visible, approved sessions with stop/cancel controls and domain boundaries.
- External account integrations require server-side token storage and must never show fake connected statuses.

## V2 Job Hunt Additions To Prompt Scope

- Per user job-search profile, CubiQo should support a managed 12-hour scan schedule after approval.
- Supported target sources: LinkedIn, Indeed, Dice, Workday, Greenhouse, Lever, ZipRecruiter, and Wellfound, using compliant APIs/connectors first.
- Each JD must be scored against the saved profile and base resume; only roles above the user-set threshold are surfaced.
- For each matched role, CubiQo should pull full JD text where permitted, generate a tailored resume version, and generate a role-specific cover letter.
- Resume and cover-letter outputs are append-only Supabase versions; the base resume is never overwritten.
- Complex company-site forms use browser control only after approval, pre-fill from saved profile, screenshot every step to the audit log, and flag custom essays or salary fields for user input.
- Application tracking stores company, role, JD URL, resume version, cover letter version, applied_at, status, and approval_id.
- Status flow: `applied` -> `response` -> `interview` -> `offer` -> `rejected` -> `withdrawn`.
- Daily reports include a pipeline summary.
- CubiQo never applies or submits without an approval card and approval audit record.

## V2 Social Calendar Additions To Prompt Scope

- Weekly content calendars should be built from active Shopify products, ready GFXTools assets, and user-set posting frequency/platforms.
- Calendar state is stored in Supabase and rendered in the content calendar view.
- Batch approval should surface the full week in one approval card.
- The user can approve all, edit individual posts, or remove individual posts before scheduling fires.
- Weekly reporting should pull platform analytics where connected: impressions, engagement, reach, and top post.
- Weekly report output should be plain language and include a recommendation for the best-performing content type.
- Missing platform credentials or missing GFXTools ready assets block scheduling/reporting truthfully; no fake connected state and no fake analytics.

## Closure Checklist

- Supabase `journal_entries`: closed; table exists, RLS exists, authenticated create/read/delete passes.
- Supabase `signals`: closed; table exists, RLS exists, authenticated create/read/delete passes.
- RGY PDF MVP: closed for MVP; visible capsule is color + keyword + optional confirmed intent.
- Red restricted/adult flag: closed; red is the restricted signal and no separate visible risk label is shown.
- Right panel: closed for MVP; active signal, keyword edit, intent chips, and delete are visible; fake match/CQ surfaces are removed.
- Generic status tags: closed; no bottom state tags or generic status tag UI are part of this branch contract.
- Journal quick intake: closed.
- Core guided journal: closed for MVP; timer is 15 minutes and Core asks guided questions.
- Journal listening: closed for browser-supported speech recognition; speech appends into the active answer and typed fallback remains.
- Journal summary/store: closed for simple LLM/local summary and Supabase/local storage save.
- Repo self-inspection: closed for V1 read-only; `/api/agent` inspects repo facts and refuses write/deploy/external actions.
- Voice QA: partially closed; ElevenLabs cue path is wired and should be verified per deployment, final CubiQo voice design remains later.
- Incomplete legacy features hidden: closed; unfinished product pages/routes remain hidden or unroutable.

## Line-Item Test Checklist

| Requirement | Status | Test / Evidence |
| --- | --- | --- |
| Fix Supabase schema gap | Closed | `npm run verify:cqai` passes; `journal_entries` and `signals` reachable. |
| Apply/verify `journal_entries` | Closed | Regression table check passes; authenticated journal insert/read/delete passes. |
| Add RGY signals table from deck | Closed | `signals` migration applied; regression table check passes. |
| Confirm RLS and E2E save/read work | Closed | Regression verifies anonymous journal/signal inserts denied and authenticated CRUD passes. |
| Make RGY match PDF MVP | Closed for MVP | `/api/converse` returns color, keyword, suggested/confirmed intents, and `matching_enabled: false`. |
| Zone + Keyword + Intent | Closed | Right panel and API use color/keyword/intent capsule fields. |
| Red itself is adult/restricted flag | Closed | Red classification sets age gate; no extra visible risk field/label in right panel. |
| Right panel active signal/keyword/intent/edit/delete | Closed | `frontend/src/App.js` right panel renders editable keyword input, intent chips, and delete button. |
| No generic status tags | Closed | No bottom generic state/status tag UI is part of the branch contract. |
| Keep quick intake as step 1 | Closed | Journal prompt 1 is Quick Intake. |
| Move user into Core landing/session after intake | Closed for MVP | `Start Core` advances from intake into Core questions. |
| Core runs guided 15-minute journal | Closed | Journal timer initializes to `15 * 60` and renders `MM:SS`. |
| It asks | Closed | Core has three guided prompts after intake. |
| It listens | Closed for browser-supported speech | Browser `SpeechRecognition` captures final transcript into the active answer; typed fallback remains. |
| It summarizes | Closed | `/api/journal/guide` returns structured summary via OpenAI when available, local fallback otherwise. |
| It stores notes | Closed | Journal save posts to `/api/journal`; regression verifies Supabase CRUD. |
| Simple LLM first, no special journaling API | Closed | Uses `/api/journal/guide` with OpenAI env when available and local fallback. |
| Replace fake/self-status with real repo self-inspection | Closed for V1 | `/api/agent` uses read-only repo tools and deterministic fallback facts from inspected files. |
| CubiQo should not answer from FAQ | Closed | Self/stack/route answers come from repo inspection, not FAQ text. |
| Add read-only repo inspection tool later | Closed for V1 | Implemented repo stack summary, route listing, repo search, safe file read, and runtime status. CubiQo does not run workspace commands. |
| Keep ElevenLabs path | Closed | `/api/voice-cue` reaches ElevenLabs config. |
| Verify prod is actually using ElevenLabs | Verified, blocked by quota | `https://www.cubiqo.ai/api/voice-cue` returns ElevenLabs quota error with configured voice/model. |
| Tune neutral/androgynous voice | Partially closed | Voice metadata is `River neutral/androgynous`, model `eleven_flash_v2_5`; final tuning waits for credits/listening QA. |
| Final voice of intelligence design after workflow stable | Deferred intentionally | Not part of this closure pass. |
| Keep incomplete legacy features hidden | Closed | Preview exposes `/`, `/app`, `/dashboard`, `/journal`; `/signal` returns `404`; Job Hunter/launcher/CQ/Social Army/BYO/camera/coder/browser write actions are not visible pages. |
| Agentic V1 read-only route | Closed | `/api/agent` returns `mode: agentic-read-only-v1`, `write_actions_enabled: false`, and tool trace. |
| V1 formal tool list | Closed | `/api/agent` exposes repo, runtime, journal, RGY signal, dashboard, memory, task plan, and content brief tools. Runtime command execution is not exposed. |
| V1 dashboard summary | Closed | Signed-in local smoke returned `dashboard_summary: completed`. |
| V1 journal read/write-summary | Closed | Signed-in local smoke saved and read a user-owned journal summary. |
| V1 RGY signal read/write | Closed | Signed-in local smoke saved and read `green:career`; matching remains off until intent is confirmed. |
| V1 memory read/write-safe-summary | Closed | Signed-in local smoke saved and read user-owned safe memory without credential-like content. |
| V1 task plan creation | Closed | Local smoke created an in-session plan without persisting tasks. |
| V1 content brief creation | Closed | Local smoke created an in-session GFXTools/POD brief without external API calls. |
| Typed chat agent doorway | Closed | Text submissions call `/api/agent` first; simple chat delegates to converse, preserving existing conversational/voice behavior. |
| Agentic V1 UI activity | Closed | Main CubiQo response panel shows component-library "What I checked" collapsible when agent route is used. |
| Agent write/deploy boundary | Closed | `/api/agent` blocks write/deploy/post/send/apply/buy requests and states V2 approval/audit is required. |
| Agent regression boundary | Closed | `/api/agent` does not execute workspace commands. Codex runs regression outside the product runtime and records results here. |
| Job Hunt capability readiness | Closed for V1 planning | Capability map covers job context, resume strategy, new posting lookup requirements, one-button easy apply, employer-site applications, approval/audit, and required V2 browser/API tools. |
| Startup/business growth readiness | Closed for V1 planning | Capability map covers market need, customer discovery, revenue generation, investor narratives, idea brainstorming, competitor research, sales/marketing, selected AI-app workflows, and POD/ecomm when relevant. |
| Ecomm/POD capability readiness | Closed for V1 planning | Ecomm/POD remains a business-growth subcase covering fashion brand decisions, POD setup, Shopify/Printify/Printful/GFXTools requirements, sales/marketing planning, and required V2 connector/action tools. |
| Contextual functional understanding | Closed for V1 planning | Capability map covers career, startup/business growth, ecomm/POD, personal routine, memory, daily reports, and permission-gated future actions. |
| Research capability readiness | Closed for V1 planning | Capability map covers research briefs, source needs, live lookup requirements, citations, and source ledger needs. |
| Browser/extension readiness | Closed for V1 planning | Capability map covers browser sessions, extension need, form workflows, approval points, screenshots/log redaction, and domain/session controls. |
| Social/affiliate readiness | Closed for V1 planning | Capability map covers campaign planning, 10/10/10 requirements, GFXTools, affiliate context, and post approval/audit needs. |
| Shopping/life connectors readiness | Closed for V1 planning | Capability map covers shopping, food, taxi, calendar, email, and smart-home connectors as V2 approved actions. |
| CQ-to-CQ messenger readiness | Closed for V1 planning | Capability map covers CQ identity, friend/contact add, direct messages, realtime, presence, and block/report requirements. It is not coupled to RGY or Signal match. |
| Wallet/payment readiness | Closed for V1 planning | Capability map covers wallet, crypto, QR release, Stripe separation, ledger, dispute, and compliance requirements. |
| Ops/security/self-report readiness | Closed for V1 planning | Capability map covers self-reporting, diagnostics, cron/reporting, health checks, and repair approval requirements. |
| Coder/studio readiness | Closed for V1 planning | Capability map covers read-only code inspection now and recommends a managed API/sandbox/tooling path for V2 writes instead of a custom unrestricted coder terminal. |
| Camera/biometrics/voice readiness | Closed for V1 planning | Capability map covers camera, passkeys/WebAuthn, proactive voice, interruption settings, DND, and sensor privacy controls. |
| V2 API-first rule | Closed for planning | Capability map now includes preferred V2 path per domain and global rule: API/provider first, custom engineering only as fallback. |
| V2 capability manifest | Closed | `/api/actions/capabilities` lists active, read-only, and locked tools with requirements. |
| V2 fake approval prevention | Closed | `/api/actions/approvals` blocks non-end-to-end tools; locked tools cannot be approved. |
| V2 locked execution boundary | Closed | `/api/actions/execute` returns `501` and writes blocked audit logs for locked tools. |
| V2 active action visibility | Closed | `/actions` renders active/read-only/locked capability states from the manifest. |
| Browser control parent capability | Closed | `/api/actions/capabilities` exposes active `browser_control`; browser actions are approved through the existing action boundary. |
| Stagehand dependency | Closed | `@browserbasehq/stagehand` is installed directly; Puppeteer, Playwright, and Selenium were not added as direct app dependencies. |
| Stagehand wrapper | Closed | `src/app/api/_lib/stagehand-client.ts` owns the raw Stagehand instance and exports only typed open/act/extract/screenshot/close helpers. |
| Browser session manager | Closed | `browser_sessions` tracks user-owned active/cancelled/closed sessions with mode, target/current URL, allowed origin, heartbeat timestamps, provider session id, metadata, and RLS. |
| Browser open boundary | Closed | `browser_open` requires a requested/approved approval card before `/api/actions/execute` creates a real Stagehand Browserbase session. |
| Browser act/extract/screenshot boundary | Closed | Each action requires its own approval and matching active `browser_session_id`; execution runs through Stagehand and writes audit. |
| Browser URL allowlist | Closed | `example.com`, LinkedIn, Indeed, Dice, Wellfound, Greenhouse, and Lever are allowlisted; unlisted domains require secondary confirmation and suspicious URL audit. |
| Browser hard stops | Closed | Prod/QA target URLs, payments/billing/checkout, email send, autonomous social publish, and deploy are blocked regardless of approval/capability flags. |
| Browser audit session ID | Closed | `action_audit_logs.browser_session_id` is populated for session-scoped browser approval/audit rows. |
| Browser screenshot receipt | Closed | `browser_screenshot` stores private Supabase Storage screenshots and returns only a 1-hour signed URL. |
| Browser accessibility debug | Closed | Stagehand action failures capture an accessibility snapshot to `action_audit_logs.accessibility_tree_snapshot`; `/actions` renders it in an expandable debug panel. |
| Browser stop/cancel button | Closed | `/actions` shows a visible active-session strip with Stop session, routed through `/api/actions/execute`. |
| Safe browser demo | Closed | `/api/actions/browser-demo` creates an approval card, opens example.com, extracts visible content, stores a screenshot receipt, audits the run, and closes the session. |
| Job search save | Closed for V2 foundation | Approved `job_search_save` saves LinkedIn, Indeed, and Dice extracted listings to `job_listings` through `/api/actions/execute`. |
| Job application prepare | Closed for V2 foundation | Approved `job_application_prepare` creates a review card showing the exact candidate/job/cover letter/answers payload before submission approval. |
| Job application submit approved | Closed for V2 foundation | Approved `job_application_submit_approved` marks a prepared package approved for visible submission and audits it; it does not auto-submit to job boards. |
| Job workflow RLS | Closed | Anonymous and direct client writes are denied for `job_listings` and `job_application_reviews`; server-boundary writes pass after approval. |
| Job profile write | Closed for V2 foundation | Approved `job_profile_write` creates/updates user-owned target roles, skills, experience, locations, work modes, and salary context through `/api/actions/execute` after a preview card. |
| Resume version write | Closed for V2 foundation | Approved `resume_version_write` appends named resume versions through `/api/actions/execute`; existing versions are never overwritten. |
| Profile/resume RLS | Closed | Anonymous and direct client writes are denied for `job_profiles` and `resume_versions`; server-boundary writes pass after approval and resume append behavior is verified. |
| POD connector status | Closed for V2 foundation | `/api/actions/execute?pod_state=1` returns GFXTools, Shopify, and Printify state from server-side configuration only. Missing credentials return `disconnected`; configured but unverified credentials return `configured_unverified`, never fake connected. |
| POD design brief create | Closed for V2 foundation | Approved `pod_design_brief_create` saves structured creative brief data to `pod_design_briefs` through `/api/actions/execute`. |
| GFXTools job create | Closed for V2 foundation | Approved `gfxtools_job_create` prepares and saves a provider payload in `gfxtools_jobs`; no external API call is performed in this step. |
| POD/GFX RLS | Closed | Anonymous and direct client writes are denied for `pod_design_briefs` and `gfxtools_jobs`; server-boundary writes pass after approval. |
| Social connector status | Closed for V2 foundation | `/api/actions/execute?social_state=1` returns LinkedIn, Instagram, X/Twitter, TikTok, Facebook, and Pinterest state from server-side configuration only. Missing credentials return `disconnected`; configured but unverified credentials return `configured_unverified`, never fake connected. |
| Social post prepare | Closed for V2 foundation | Approved `social_post_prepare` generates platform-aware drafts from an approved asset URL or GFXTools output and saves them to `social_content_drafts`. |
| Social cadence/schedule | Closed for V2 foundation | Approved `social_post_schedule_approved` creates user-configurable interval/platform/variant rules, scheduled post rows, and blocked fire logs when credentials are missing. |
| Social workflow RLS | Closed | Anonymous and direct client writes are denied for `social_content_drafts`, `social_distribution_rules`, `social_scheduled_posts`, and `social_post_fire_logs`; server-boundary writes pass after approval. |
| GFX asset records | Closed for V2 foundation | Approved GFXTools flow saves structured `gfx_assets` rows with `asset_id`, `asset_url`, `asset_type`, dimensions, status, and connector state. Missing or failed connector output is stored as failed, not faked as ready. |
| GFX platform variants | Closed for V2 foundation | Approved `gfxtools_asset_resize` populates Instagram, LinkedIn, X, TikTok, and Facebook variant records and emits an `asset_ready` event. |
| Shopify product preparation | Closed for V2 foundation | Approved `shopify_product_prepare` saves a Shopify product payload from a ready asset. Missing credentials produce blocked/disconnected state; no fake connected status. |
| Printify design preparation | Closed for V2 foundation | Approved `printify_design_prepare` saves a Printify design/template payload from a ready asset. Missing credentials produce blocked/disconnected state; no fake connected status. |
| Asset-to-social handoff | Closed | Social draft preparation requires `asset_id` plus `asset_ready` event. Pending/failed assets and direct URL-only handoff are blocked in the action path. |
| Shopify store connect/status | Closed for V2 foundation | `shopify_store_connect` validates/stores credentials server-side only when connector encryption is configured; `shopify_store_status` returns real state and counts or disconnected/blocked state. QA schema is applied and table reachability passes. |
| Shopify product create | Closed for V2 foundation | Approved `shopify_product_create` creates/prepares a draft product from a ready asset and selected provider; missing Shopify credentials create blocked local state, not fake external success. |
| Shopify product lifecycle | Closed for V2 foundation | Approved publish/update/archive actions require preview cards, write audit rows, and publish emits `product_published` event. |
| POD provider management | Closed for V2 foundation | `fulfilment_provider_read` returns direct API providers plus Shopify-app provider manifest; app providers are routing-only, direct providers require server-side credentials. |
| Direct POD design/sync | Closed for V2 foundation | Approved `design_create` targets Printify/Printful/Gelato only; approved `product_sync` records provider-to-Shopify sync state without fake provider ids. |
| Collections/inventory | Closed for V2 foundation | Approved collection create/assign and inventory update record before/after state through `/api/actions/execute`. |
| Orders/analytics read-only | Closed for V2 foundation | Order and analytics reads store aggregate-only summaries and no raw customer PII. |
| AfterShip read-only | Closed for V2 foundation | `aftership_connect` stores server-side credentials when encrypted; tracking/returns reads are read-only snapshots. |
| Bundles/marketplaces | Closed for V2 foundation | Bundle create requires approval; marketplace status remains read-only in V2. |
| Live browser/POD/social/camera/coder execution | Deferred intentionally | Locked until provider/API/browser runtime integrations, action-specific approval UX, and regression tests exist. |

## V2 Security Review Notes

- Current V1 exposes no external write/action tools, no deploy tool, no live browser runtime, and no arbitrary terminal.
- Current V1 allows only signed-in user-owned CubiQo state writes for journal summaries, RGY capsules, and safe memory summaries. External actions remain blocked or converted to planning until V2 approval cards exist.
- Required before any V2 action endpoint: explicit approval request/status, action audit log, action type permissions, feature flag, safe cancel path, and denied-action no-op test.
- Required before any external integration: server-side token storage, masked frontend display, missing-credential safe error, no fake connected state, and per-user ownership checks.
- Required before live browser/extension use: user-visible active indicator, stop button, domain allowlist, session isolation, screenshot/log redaction, and no hidden automation. The current branch implements the visible session/audit container first.
- Required before coder/studio write mode: managed sandbox/API tool layer, allowlisted commands, no raw production terminal, patch preview, approve/cancel, and audit log.

## V2 Foundation Implemented In Code

- `approval_request` / `approval_status`: `/api/actions/approvals`.
- `action_audit_log`: `/api/actions/audit` read endpoint; write is server/trigger controlled so users cannot forge audit logs.
- Per-tool enable/disable controls: `/api/tools/settings`.
- `task_write`: `/api/tasks`, create requires an approved `task_write` approval.
- `cron_schedule_create`: `/api/reports/schedules`, creates in-app report schedules only and requires approval.
- `self_report_create` / `daily_report_send`: `/api/reports/daily`, creates or stores in-app reports only and requires approval.
- V2 capability manifest: `/api/actions/capabilities`, lists all active/read-only/locked tools and requirements.
- V2 generic action boundary: `/api/actions/execute`, blocks locked tools with `501` and writes a blocked audit log.
- V2 browser session manager: `/api/actions/execute`, `browser_sessions`, and `action_audit_logs.browser_session_id`. This opens/tracks/stops isolated browser workflow containers and records approved browser intents only.
- V2 job workflow tools: `/api/actions/execute`, `job_listings`, and `job_application_reviews`. This saves extracted job listings, prepares application review cards, and approves packages for visible submission only.
- V2 job profile/resume tools: `/api/actions/execute`, `job_profiles`, and `resume_versions`. This stores approved career profile context and append-only resume versions in Supabase only.
- V2 POD business connector tools: `/api/actions/execute`, `pod_design_briefs`, `gfxtools_jobs`, `gfx_assets`, `asset_ready_events`, `shopify_product_preparations`, and `printify_design_preparations`. This reports read-only connector state, stores approved POD creative briefs, submits approved GFXTools jobs when configured, stores asset status truthfully, creates platform variants, and prepares Shopify/Printify payloads.
- V2 Shopify/POD operations tools: `/api/actions/execute`, `commerce_connector_secrets`, `shopify_store_connections`, `fulfillment_provider_statuses`, `shopify_products`, `provider_designs`, `provider_product_syncs`, `shopify_collections`, `shopify_inventory_*`, `shopify_order_summaries`, `aftership_*`, `shopify_analytics_snapshots`, `shopify_bundles`, `marketplace_status_snapshots`, and `commerce_events`. This keeps credentials server-side, blocks missing providers truthfully, and emits commerce handoff events for later social/daily-report use.
- V2 social content/distribution tools: `/api/actions/execute`, `social_content_drafts`, `social_distribution_rules`, `social_scheduled_posts`, and `social_post_fire_logs`. This prepares platform-aware draft variants, stores approved cadence rules, records scheduled post rows, and blocks missing-credential platforms truthfully without client-side platform API calls.
- V2 Action Console: `/actions`, linked from the left tray and dashboard feature card.
- V2 Action Console now shows the capability boundary from the manifest instead of vague future-work text.
- Database triggers require matching approved approvals before task/report writes, so Supabase direct writes cannot bypass approval.
- Live browser/job/social/POD/payment/camera/coder external execution tools remain intentionally locked until their API/provider integrations and approval UX are ready. The current social layer prepares/schedules internal state only and performs no platform posting.

Current blocker:

- No active Supabase schema blocker remains for the QA project. Base tables plus V2 approval/audit/task/report/browser/job/profile/resume/POD/social/commerce tables are applied and verified against `https://oszlufrjvibrdauuppzj.supabase.co`.
- Live browser/job external submission/POD external call/social platform posting/payment/camera/coder execution tools are intentionally locked or blocked unless their provider integrations, credentials, and action-specific approval UX are present.

## Regression Gate Before Push

Commands:

```bash
node -c src/server/legacy/converse.cjs
npm run typecheck
npm run build
npm run verify:cqai
```

Latest result:

- `node -c src/server/legacy/converse.cjs`: pass
- `npm run typecheck`: pass
- `npm run build`: pass; routes expose `/`, `/app`, `/actions`, `/auth/callback`, `/dashboard`, `/journal`, and API routes only. `/signal` is not routable.
- `npm run build`: known warning remains for `/api/agent` because V1 repo inspection performs runtime filesystem reads. This is intentional for read-only self-inspection and should be watched before production promotion.
- Local route smoke on `127.0.0.1:3037`: `/`, `/app`, `/dashboard`, `/journal`, and `/actions` returned `200`.
- `npm run verify:cqai`: pass against QA Supabase. The verifier now checks the Shopify/POD operations tables in addition to the prior V2 schema.
- E2E save/read/delete: pass for authenticated `journal_entries` and `signals`.
- RLS denial: pass; anonymous writes to `journal_entries` and `signals` are denied.
- V2 job profile/resume regression: pass; `job_profiles` and `resume_versions` are reachable, anonymous/direct client writes are denied, approved server-boundary writes pass, and two resume versions can coexist without overwrite.
- V2 POD connector regression: pass; `pod_design_briefs` and `gfxtools_jobs` are reachable, anonymous/direct client writes are denied, approved server-boundary writes pass, connector status does not fake connected state, and GFXTools preparation keeps `externalCallPerformed = false`.
- V2 social distribution regression: pass; `social_content_drafts`, `social_distribution_rules`, `social_scheduled_posts`, and `social_post_fire_logs` are reachable, anonymous/direct client writes are denied, approved server-boundary writes pass, schedule cadence is user-configurable, missing platform credentials produce blocked logs, and external platform calls remain false.
- V2 POD asset regression: pass; `gfx_assets`, `asset_ready_events`, `shopify_product_preparations`, and `printify_design_preparations` are reachable. Anonymous/direct client writes are denied, service-boundary writes with approval pass, and social draft creation is tied to ready asset handoff state.
- V2 Shopify/POD operations regression: pass; `commerce_connector_secrets`, `shopify_store_connections`, `fulfillment_provider_statuses`, `shopify_products`, `provider_designs`, `provider_product_syncs`, `shopify_collections`, `shopify_collection_assignments`, `shopify_inventory_levels`, `shopify_inventory_adjustments`, `shopify_order_summaries`, `aftership_connections`, `aftership_tracking_snapshots`, `aftership_return_snapshots`, `shopify_analytics_snapshots`, `shopify_bundles`, `marketplace_status_snapshots`, and `commerce_events` are reachable in QA.
- Voice cue route: verified wired to ElevenLabs config (`River neutral/androgynous`, `eleven_flash_v2_5`) but audio generation is currently blocked by ElevenLabs quota; route returns `elevenlabs_error` when the key is present and provider fails.
- RGY classifier migration: applied to QA Supabase via `20260510050000_rgy_classifier_contract.sql`.
- RGY classifier acceptance smoke: pass on local preview. Covered `yoga`, `I want to build a startup`, `movie night with friends`, `looking for someone to hang out with`, `adult apps nearby`, crisis override, hard block, user-confirmed matching, multi-intent confirmation, keyword edit/user correction, anonymous rejection, and cross-user isolation.

## Preview Deployment

Preview URL: https://cubiqo-repo-8vpxguwv2-cubiqo-projects-d7156840.vercel.app

Deployment ID: `dpl_2XNrw9ozh4eMnKhYrPbmY6phSS6s`

Preview smoke:

- `/`: 200
- `/app`: 200
- `/actions`: 200
- `/dashboard`: 200
- `/journal`: 200
- `/api/actions/capabilities`: 200, returned 14 active, 4 read-only, and 11 locked capabilities; `browser_control` and `browser_open` are active.
- `/api/diagnostics`: 200, Supabase configured and `profiles` reachable.
- `/api/journal/guide`: summary response returned
- `/api/converse`: RGY returned `green`, keyword `build`, `matching_enabled: false`
- `/api/voice-cue`: returns `elevenlabs_error` due ElevenLabs quota, with configured neutral/androgynous voice metadata
- Authenticated V2 preview smoke: previous pass covered `task_write` approval, locked-tool execution boundary, and audit reads. Browser-control foundation is now additionally covered by local authenticated smoke and QA Supabase RLS checks.
- Preview env fix: goodfeatureslegacy preview now has Supabase public/server env vars scoped to Preview (`goodfeatureslegacy`) only. No production env was changed.

Latest local V1 agent smoke on `127.0.0.1:3033`:

- Stack/routes question: `200`, answered from inspected repo facts, trace included `repo_stack_summary`.
- Write/deploy request: `200`, blocked with `approval_boundary`, `write_actions_enabled: false`.
- Regression request: `200`, reported `workspace_check_boundary: blocked` in runtime and did not pretend to run tests.
- Job/startup/business/ecomm planning request: covered by V1 `capability_plan`; it does not claim live job lookup, apply, publish, post, outreach, market-source lookup, or investor/customer messaging until V2 tools exist.
- Expanded capability smoke: job, startup/business growth, ecomm/POD, research, browser/extension, social/affiliate, shopping/life connectors, CQ friend messenger, wallet/payments, ops/security, coder/studio, and camera/biometrics/voice all route to `capability_plan`.
- Boundary smoke: immediate write/deploy requests still return `approval_boundary: blocked`; immediate regression execution returns `workspace_check_boundary: blocked`.

Latest runtime-command cleanup smoke on `127.0.0.1:3041`:

- Test/regression request: passed; `/api/agent` returned `workspace_check_boundary: blocked` and stated CubiQo does not run workspace commands.
- Stack/routes question: passed; `/api/agent` answered from repo dependencies and routes without exposing package scripts.
- Tool list: passed; `run_check` is no longer listed in `tools_available`.

Latest typed-agent doorway smoke on `127.0.0.1:3034`:

- Simple typed chat: `/api/agent` returned `mode: conversation-via-agent-v1`, trace `conversation_router: completed`, preserving the existing converse path.
- Repo/stack question: `/api/agent` returned `mode: agentic-read-only-v1`, trace `repo_stack_summary: completed`.
- Job hunt planning: `/api/agent` returned `mode: agentic-read-only-v1`, trace `capability_plan: completed`.
- Write/deploy request: `/api/agent` returned `mode: agentic-read-only-v1`, trace `approval_boundary: blocked`, `write_actions_enabled: false`.

Latest capability correction smoke on `127.0.0.1:3035`:

- Startup/business helper: `/api/agent` mapped to `Startup + Revenue + Business Growth` and `Research + Knowledge Work`.
- CQ messenger: `/api/agent` mapped to `CQ-to-CQ Friend Messenger`; this is friend/contact messaging only and not RGY/Signal matching.
- Coder/studio: `/api/agent` mapped to `Coder + Studio + Builder` and recommends managed API/sandbox tooling before write access.

Latest V2 API-first smoke on `127.0.0.1:3036`:

- Multi-domain V2 prompt mapped to job, startup/business, research, browser, social, and coder domains.
- `/api/agent` remained `agentic-read-only-v1` with `write_actions_enabled: false`.
- Capability fallback response now includes the preferred V2 path before required tools, so CubiQo leads with API/provider integrations instead of custom engineering.

Latest V1 formal tool smoke on `127.0.0.1:3038`:

- Stack/routes question: passed; `/api/agent` answered from inspected repo files/routes and returned the full V1 tool list.
- `dashboard_summary`: passed with a signed-in test user.
- `rgy_signal_write`: passed; saved `green:career` with matching off until intent confirmation.
- `rgy_signal_read`: passed; read the saved capsule as color + keyword + optional/confirmed intent.
- `memory_write_safe_summary`: passed; saved user-owned safe memory summary only.
- `memory_read`: passed; read recent user-owned memory and did not invent profile facts.
- `journal_write_summary`: passed; saved a user-owned journal summary.
- `journal_read`: passed; read the saved journal summary.
- `content_brief_create`: passed; created an in-session GFXTools/POD brief and did not call external APIs.
- `task_plan_create`: passed; created an in-session task plan and did not persist tasks.
- `capability_plan`: passed for job hunt/easy apply/employer-site application planning.
- Write/deploy boundary: passed; `approval_boundary` blocked deployment and external writes.
- Workspace check boundary: passed; CubiQo reported blocked in the server runtime instead of pretending tests ran.
- Test user was admin-created with `@example.invalid`, no public signup/magic-link email was sent, and cleanup was attempted.

Latest V2 capability boundary smoke on `127.0.0.1:3040`:

- `/api/actions/capabilities`: passed; returned 7 active, 4 read-only, and 16 locked capabilities.
- Active approval path: passed; `task_write` approval request returned `201`.
- Fake approval prevention: passed; `browser_open` approval request returned `501`, `approvalCreated: false`.
- Locked execution boundary: passed; `/api/actions/execute` for `browser_open` returned `501`, `executed: false`.
- Active generic execution boundary: passed; `/api/actions/execute` for `task_write` returned `409` and pointed callers to the dedicated endpoint.
- Audit log: passed; blocked attempts were recorded in user-owned audit logs.

Latest browser-control foundation smoke on `127.0.0.1:3044`:

- `/api/actions/capabilities`: passed; `browser_control` returned active.
- `/api/actions/execute` without approval: passed; `browser_open` returned `403` and did not create a session.
- `browser_open` approval card: passed; requested and approved before execution.
- Approved `browser_open` execution: passed; created a user-owned `browser_sessions` row.
- Approved `browser_click` execution: passed; recorded click intent against the active `browser_session_id` without hidden browser execution.
- Stop session: passed; `browser_close` cancelled the active session through `/api/actions/execute`.
- Audit: passed; `browser_open`, `browser_click`, and `browser_close` audit rows included the same `browserSessionId`.

Latest job workflow foundation smoke on `127.0.0.1:3045`:

- `/api/actions/capabilities`: passed; `browser_control`, `job_search_save`, `job_application_prepare`, and `job_application_submit_approved` returned active.
- `/api/actions/execute` without approval: passed; `job_search_save` returned `403`.
- Approved `job_search_save`: passed; saved three extracted listings across LinkedIn, Indeed, and Dice.
- Approved `job_application_prepare`: passed; created a review card with exact job, candidate, resume summary, cover letter, answers, and target URL payload.
- Approved `job_application_submit_approved`: passed; review became `approved_for_submission` and `performedExternalSubmission` stayed `false`.
- `/api/actions/execute?job_state=1`: passed; returned user-owned saved jobs and review cards.
- Audit: passed; completed audit rows existed for `job_search_save`, `job_application_prepare`, and `job_application_submit_approved`.

Latest Stagehand/Browserbase live smoke on `127.0.0.1:3032`:

- Vercel env: Browserbase values added to Development and Preview branch `goodfeatureslegacy`; Production was not touched.
- Local env: `.env.local` has Browserbase project/key and `SUPABASE_STORAGE_BUCKET=browser-screenshots`; `.env.local` remains uncommitted.
- `/api/actions/browser-demo`: passed; created pending approval, required explicit approval, opened a real Browserbase/Stagehand session, navigated to `https://example.com`, extracted the title/paragraph, uploaded a screenshot receipt to Supabase Storage, returned a signed URL, and closed the session.
- Schema compatibility: passed; browser-open approvals no longer pre-write `browser_session_id` before the matching `browser_sessions` row exists, preserving the audit FK.
- Stagehand model: passed with default `openai/gpt-4.1-mini`; override is documented as `STAGEHAND_MODEL_NAME`.

Hosted goodfeatureslegacy preview smoke:

- Preview URL: `https://cubiqo-repo-pbjxcf3ua-cubiqo-projects-d7156840.vercel.app`.
- `/api/actions/capabilities`: passed; hosted preview returns the V2 action manifest, with `browser_open`, `browser_extract`, `browser_screenshot`, and `browser_act` active.
- `/actions`: passed; hosted preview returns HTTP 200.
- `/api/actions/browser-demo`: passed; pending approval returned HTTP 202, approval update returned HTTP 200, approved execution returned HTTP 200 with `executed: true`.
- Browser session proof: `browser_session_id=7c0ecd8e-9f33-45fa-bf0c-e7cfb304d206`; extracted `Example Domain` content from `https://example.com`.
- Screenshot proof: signed Supabase Storage URL returned from `browser-screenshots/7c0ecd8e-9f33-45fa-bf0c-e7cfb304d206/1778410720348.png`.
- Audit proof: `action_audit_logs` contains completed `browser_demo` and `browser_close` rows with the same `browser_session_id`; `browser_demo` row has the screenshot URL.
- Hard stop proof: hosted `send_email` action returned HTTP 403 and wrote `blocked_email_send` to the audit log.

Live DB migration status:

- `20260510000000_stagehand_browser_automation.sql` applied to `https://oszlufrjvibrdauuppzj.supabase.co`.
- Verified durable columns: `action_approvals.browser_session_id`, `requires_user_confirmation`, `user_confirmation_state`, `warning_message`; `action_audit_logs.browser_session_id`, `accessibility_tree_snapshot`, `block_reason`, `screenshot_url`; `browser_sessions.session_mode`, `last_active_at`, `expired_at`, `provider_session_id`.
- Legacy root `api/` functions moved to `src/server/legacy` so Vercel preview routes `/api/actions/*` to the Next.js App Router handlers instead of the old voice cue function.

Prod voice check:

- `https://www.cubiqo.ai/api/voice-cue`: reaches ElevenLabs and returns a quota error with `River neutral/androgynous` / `eleven_flash_v2_5`. Current prod code labels provider as `none`, while this branch labels the same condition as `elevenlabs_error`.

Resolved schema blocker:

- `journal_entries` exists and is reachable.
- `signals` exists and is reachable.
- `profiles`, `user_activity_keywords`, and `conversation_events` exist and are reachable.
- V2 tables exist and are reachable: `action_approvals`, `action_audit_logs`, `user_tool_settings`, `user_tasks`, `report_schedules`, `daily_reports`.
- V2 approval-gated writes passed: denied actions do not execute, approved task writes execute, report schedule/report writes execute, and user-forged audit inserts are denied.
- V2 browser foundation passed: anonymous browser session writes are denied, direct user browser session writes are denied even after approval, server-boundary insert with an approved `browser_open` passes, and `browser_sessions` is reachable in QA Supabase.
- V2 job workflow foundation passed: `job_listings` and `job_application_reviews` are reachable, anonymous/direct client writes are denied, server-boundary writes pass after approval, and approved application package state keeps `external_submission_performed = false`.

Latest job_apply workflow smoke on `127.0.0.1:3032`:

- Supabase migration `20260510000001_job_apply_workflow.sql` applied to the goodfeatureslegacy QA database; `job_applications` is reachable with user-owned read RLS and server-boundary writes only.
- `/api/actions/capabilities`: passed; `job_apply`, `browser_open`, `browser_extract`, `browser_screenshot`, and `browser_act` are active. `send_email`, `social_post_publish`, `deploy`, `payment`, and `linkedin_automation` remain locked or hard-stopped.
- `job_apply` approval card: passed; approval now reserves `browser_session_id` on the approval row and keeps it out of approval payload so the DB audit trigger does not require a browser session before approval exists.
- Platform flag gate: passed; LinkedIn apply returned `403 platform_not_enabled` while `JOB_APPLY_LINKEDIN_ENABLED` is not set.
- Session integrity: passed; mismatched `browser_session_id` returned `403 session_hijack_attempt`.
- Hard stop regression: passed; `send_email` still returned `403 blocked_email_send`.
- Suspicious URL warning: passed; non-allowlisted job URL created a pending second-confirmation approval and first approval captured `secondaryConfirmationComplete: true`.
- Ghost session expiry: passed; stale persistent browser session auto-closed and recorded expiry before browser extraction ran.
- `job_apply` browser-session anchor: passed; an approved `job_apply` row can now create a persistent `browser_sessions` row, so platform-enabled apply workflows will not fail the `browser_open` trigger at session creation.
- `/actions`: passed; page returned HTTP 200 and includes job apply approval/tracker UI states.
- Final submit safety: implemented as a separate `/api/actions/job-apply/confirm` route. Platform scripts stop at review/ready-to-submit and do not click final submit; the user confirmation button is the only path to final submit.

Do not push this branch for review unless this contract stays current and regression remains green.
