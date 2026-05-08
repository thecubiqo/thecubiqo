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
- Browser/coder/write-agent actions
- Signal match route/button

Note: CQ-to-CQ is friend/contact messenger only. It is not the same thing as Signal match, RGY matching, or intent matching.

## Current Implementation In This Branch

- Added Supabase migration for `signals`.
- Added `/api/signals` for user-owned RGY signal create/list/update/delete.
- Added `/api/journal/guide` for guided-journal questions and LLM/local summary fallback.
- Updated conversation RGY output to return keyword, suggested intents, confirmed intents, and `matching_enabled: false`.
- Updated dashboard counts/features to expose only live/code-ready surfaces.
- Updated the right panel to show editable signal capsules and user-confirmed intent chips.
- Updated Daily Journal for quick intake -> Core guided journal -> 15-minute timer -> typed/speech-captured answers -> summary storage.
- Added `/api/agent` for CubiQo V1 agentic behavior: repo stack summary, route listing, repo search/read, runtime status, RGY classification, capability planning, dashboard summary, journal read/write-summary, RGY signal read/write, memory read/write-safe-summary, task plan creation, content brief creation, and blocked check reporting.
- Updated typed chat routing so text submissions enter `/api/agent` first. Simple conversational messages are delegated back to the existing converse path, while repo/self-check/capability/action-boundary requests stay on the V1 agentic route.
- Added V2 foundation APIs for approval requests/status, audit reads, tool settings, approved user tasks, in-app report schedules, and in-app daily reports.
- Added V2 foundation migration for `action_approvals`, `action_audit_logs`, `user_tool_settings`, `user_tasks`, `report_schedules`, and `daily_reports`.
- Added `/actions` as the V2 Action Console inside the CubiQo shell. It exposes only completed QA-backed actions: approval cards, approve/cancel, approved task creation, in-app report schedules, in-app self/daily reports, and audit viewing.
- Added `/api/actions/capabilities` as the V2 capability manifest. It marks active, read-only, and locked tools explicitly so incomplete workflows cannot look connected.
- Added `/api/actions/execute` as the generic V2 action boundary. Locked tools return `501`, write a blocked audit entry, and do not execute.
- Updated approval requests so non-end-to-end tools cannot receive fake approvals.
- Updated the main CubiQo response surface with a component-library based "What I checked" collapsible that shows V1 tool activity inside the existing window.
- Updated regression script to require `signals` table in addition to existing auth/journal tables.
- Removed the incomplete `/signal` route from the visible/routable app surface.

## V2 API-First Readiness Rule

- V2 must prefer API/provider integrations before custom engineering.
- Custom engineering is allowed only when no suitable API, managed connector, or sandbox/tool provider exists.
- CubiQo should own orchestration, approvals, audit logs, feature flags, user-owned state, and visibility.
- CubiQo should not custom-build job-board crawlers, social posting engines, payment rails, raw coder terminals, browser stealth layers, CRM systems, or worker farms unless the API/provider path fails a documented review.
- V2 write/action tools must stay hidden until approval UI, feature flags, audit logging, safe failure states, and regression tests exist.
- Browser/extension fallback is allowed only for user-visible, approved sessions with stop/cancel controls and domain boundaries.
- External account integrations require server-side token storage and must never show fake connected statuses.

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
| Add read-only repo inspection tool later | Closed for V1 | Implemented repo stack summary, route listing, repo search, safe file read, runtime status, and blocked check reporting. |
| Keep ElevenLabs path | Closed | `/api/voice-cue` reaches ElevenLabs config. |
| Verify prod is actually using ElevenLabs | Verified, blocked by quota | `https://www.cubiqo.ai/api/voice-cue` returns ElevenLabs quota error with configured voice/model. |
| Tune neutral/androgynous voice | Partially closed | Voice metadata is `River neutral/androgynous`, model `eleven_flash_v2_5`; final tuning waits for credits/listening QA. |
| Final voice of intelligence design after workflow stable | Deferred intentionally | Not part of this closure pass. |
| Keep incomplete legacy features hidden | Closed | Preview exposes `/`, `/app`, `/dashboard`, `/journal`; `/signal` returns `404`; Job Hunter/launcher/CQ/Social Army/BYO/camera/coder/browser write actions are not visible pages. |
| Agentic V1 read-only route | Closed | `/api/agent` returns `mode: agentic-read-only-v1`, `write_actions_enabled: false`, and tool trace. |
| V1 formal tool list | Closed | `/api/agent` exposes repo, runtime, check, journal, RGY signal, dashboard, memory, task plan, and content brief tools. |
| V1 dashboard summary | Closed | Signed-in local smoke returned `dashboard_summary: completed`. |
| V1 journal read/write-summary | Closed | Signed-in local smoke saved and read a user-owned journal summary. |
| V1 RGY signal read/write | Closed | Signed-in local smoke saved and read `green:career`; matching remains off until intent is confirmed. |
| V1 memory read/write-safe-summary | Closed | Signed-in local smoke saved and read user-owned safe memory without credential-like content. |
| V1 task plan creation | Closed | Local smoke created an in-session plan without persisting tasks. |
| V1 content brief creation | Closed | Local smoke created an in-session GFXTools/POD brief without external API calls. |
| Typed chat agent doorway | Closed | Text submissions call `/api/agent` first; simple chat delegates to converse, preserving existing conversational/voice behavior. |
| Agentic V1 UI activity | Closed | Main CubiQo response panel shows component-library "What I checked" collapsible when agent route is used. |
| Agent write/deploy boundary | Closed | `/api/agent` blocks write/deploy/post/send/apply/buy requests and states V2 approval/audit is required. |
| Agent regression boundary | Closed | `/api/agent` reports check execution as blocked in deployed/serverless runtime unless local checks are explicitly enabled. |
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
| Browser/job/POD/social/camera/coder execution | Deferred intentionally | Locked until provider/API/browser integrations, approval-specific UX, and regression tests exist. |

## V2 Security Review Notes

- Current V1 exposes no external write/action tools, no deploy tool, no browser control, and no arbitrary terminal.
- Current V1 allows only signed-in user-owned CubiQo state writes for journal summaries, RGY capsules, and safe memory summaries. External actions remain blocked or converted to planning until V2 approval cards exist.
- Required before any V2 action endpoint: explicit approval request/status, action audit log, action type permissions, feature flag, safe cancel path, and denied-action no-op test.
- Required before any external integration: server-side token storage, masked frontend display, missing-credential safe error, no fake connected state, and per-user ownership checks.
- Required before browser/extension use: user-visible active indicator, stop button, domain allowlist, session isolation, screenshot/log redaction, and no hidden automation.
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
- V2 Action Console: `/actions`, linked from the left tray and dashboard feature card.
- V2 Action Console now shows the capability boundary from the manifest instead of vague future-work text.
- Database triggers require matching approved approvals before task/report writes, so Supabase direct writes cannot bypass approval.
- Browser/job/social/POD/payment/camera/coder execution tools remain intentionally locked until their API/provider integrations and approval UX are ready.

Current blocker:

- No active Supabase schema blocker remains for the QA project. Base tables plus V2 approval/audit/task/report tables are applied and verified against `https://oszlufrjvibrdauuppzj.supabase.co`.
- Browser/job/social/POD/payment/camera/coder execution tools are intentionally locked in the capability manifest until their provider integrations and action-specific approval UX are ready.

## Regression Gate Before Push

Commands:

```bash
node -c api/converse.js
npm run typecheck
npm run build
npm run verify:cqai
```

Latest result:

- `node -c api/converse.js`: pass
- `npm run typecheck`: pass
- `npm run build`: pass; routes expose `/`, `/app`, `/actions`, `/auth/callback`, `/dashboard`, `/journal`, and API routes only. `/signal` is not routable.
- `npm run build`: known warning remains for `/api/agent` because V1 repo inspection performs runtime filesystem reads. This is intentional for read-only self-inspection and should be watched before production promotion.
- Local route smoke on `127.0.0.1:3037`: `/`, `/app`, `/dashboard`, `/journal`, and `/actions` returned `200`.
- `npm run verify:cqai`: pass against QA Supabase. The verifier now uses admin-created confirmed test users only and does not send public signup/magic-link emails.
- E2E save/read/delete: pass for authenticated `journal_entries` and `signals`.
- RLS denial: pass; anonymous writes to `journal_entries` and `signals` are denied.
- Voice cue route: verified wired to ElevenLabs config (`River neutral/androgynous`, `eleven_flash_v2_5`) but audio generation is currently blocked by ElevenLabs quota; route returns `elevenlabs_error` when the key is present and provider fails.

## Preview Deployment

Preview URL: https://cubiqo-repo-gpau5cw4o-cubiqo-projects-d7156840.vercel.app

Deployment ID: `dpl_6rqeG6swC14iHFQScQHUbBB8YSBv`

Preview smoke:

- `/`: 200
- `/app`: 200
- `/actions`: 200
- `/dashboard`: 200
- `/journal`: 200
- `/api/actions/capabilities`: 200, returned 7 active, 4 read-only, and 16 locked capabilities.
- `/api/diagnostics`: 200, Supabase configured and `profiles` reachable.
- `/api/journal/guide`: summary response returned
- `/api/converse`: RGY returned `green`, keyword `build`, `matching_enabled: false`
- `/api/voice-cue`: returns `elevenlabs_error` due ElevenLabs quota, with configured neutral/androgynous voice metadata
- Authenticated V2 preview smoke: pass; `task_write` approval returned `201`; `browser_open` approval returned `501`; `browser_open` execution returned `501`; active generic `task_write` execution returned `409` with dedicated endpoint boundary; audit logs returned blocked attempts.
- Preview env fix: goodfeatureslegacy preview now has Supabase public/server env vars scoped to Preview (`goodfeatureslegacy`) only. No production env was changed.

Latest local V1 agent smoke on `127.0.0.1:3033`:

- Stack/routes question: `200`, answered from inspected repo facts, trace included `repo_stack_summary`.
- Write/deploy request: `200`, blocked with `approval_boundary`, `write_actions_enabled: false`.
- Regression request: `200`, reported `run_check: blocked` in runtime and did not pretend to run tests.
- Job/startup/business/ecomm planning request: covered by V1 `capability_plan`; it does not claim live job lookup, apply, publish, post, outreach, market-source lookup, or investor/customer messaging until V2 tools exist.
- Expanded capability smoke: job, startup/business growth, ecomm/POD, research, browser/extension, social/affiliate, shopping/life connectors, CQ friend messenger, wallet/payments, ops/security, coder/studio, and camera/biometrics/voice all route to `capability_plan`.
- Boundary smoke: immediate write/deploy requests still return `approval_boundary: blocked`; immediate regression execution still returns `run_check: blocked`.

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
- Run-check boundary: passed; `run_check` reported blocked in the server runtime instead of pretending tests ran.
- Test user was admin-created with `@example.invalid`, no public signup/magic-link email was sent, and cleanup was attempted.

Latest V2 capability boundary smoke on `127.0.0.1:3040`:

- `/api/actions/capabilities`: passed; returned 7 active, 4 read-only, and 16 locked capabilities.
- Active approval path: passed; `task_write` approval request returned `201`.
- Fake approval prevention: passed; `browser_open` approval request returned `501`, `approvalCreated: false`.
- Locked execution boundary: passed; `/api/actions/execute` for `browser_open` returned `501`, `executed: false`.
- Active generic execution boundary: passed; `/api/actions/execute` for `task_write` returned `409` and pointed callers to the dedicated endpoint.
- Audit log: passed; blocked attempts were recorded in user-owned audit logs.

Prod voice check:

- `https://www.cubiqo.ai/api/voice-cue`: reaches ElevenLabs and returns a quota error with `River neutral/androgynous` / `eleven_flash_v2_5`. Current prod code labels provider as `none`, while this branch labels the same condition as `elevenlabs_error`.

Resolved schema blocker:

- `journal_entries` exists and is reachable.
- `signals` exists and is reachable.
- `profiles`, `user_activity_keywords`, and `conversation_events` exist and are reachable.
- V2 tables exist and are reachable: `action_approvals`, `action_audit_logs`, `user_tool_settings`, `user_tasks`, `report_schedules`, `daily_reports`.
- V2 approval-gated writes passed: denied actions do not execute, approved task writes execute, report schedule/report writes execute, and user-forged audit inserts are denied.

Do not push this branch for review unless this contract stays current and regression remains green.
