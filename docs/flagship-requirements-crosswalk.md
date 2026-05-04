# CubiQo Flagship Requirements Crosswalk

Date: 2026-05-04

## Source Of Truth

This crosswalk treats the pasted `CUBIQO - Flagship` spec as the product source of truth for QA and future production.

The core product definition is:
- CubiQo is the primary voice/text assistant and orchestration entry point.
- RGY color/voice is UI-level operational signaling only.
- Side Panel and SettingsCube are first-class surfaces.
- RGY routing is CubiQo-scoped and backend/model selection is not controlled by color.
- Keywords are session/context hints, not stored profiles and not hard routing commands.
- Browser, connectors, chat/match, payments, BYO, self-heal, and CQ-to-CQ are product capabilities around the assistant.

## Current QA State

Implemented or partially implemented in the current QA baseline:
- Conversational text endpoint at `/api/converse`.
- OpenAI-backed responses using the configured OpenAI credential.
- ElevenLabs-backed speech after switching to a working voice.
- RGY classification and keyword tracking in the current chat flow.
- Subtler RGY UI feedback and voice-state synchronization work.
- Supabase auth/profile/keyword/event tables provisioned by migration.
- End-to-end verifier for auth table provisioning, conversation, model use, and RGY classification.
- Runtime manifest/self-awareness so CubiQo can answer basic questions about its current app/runtime.

Not yet implemented in the current QA baseline:
- Legacy premium Side Panel.
- SettingsCube voice/admin surface.
- CQ-to-CQ identity, CQ handle, friend requests, messages, or calls.
- Production browser automation.
- Browser extension connection.
- Self-heal/NOC dashboards.
- BYO API key UI.
- Passkeys/OAuth beyond the current Supabase baseline.
- Wallet/crypto/QR delayed-release flow.
- Food, taxi, calendar, email, smart-home connectors.
- Full agentic multi-step tool loop.

## Legacy Evidence Found

### Flagship Assistant / Agentic Core

Legacy evidence:
- `src/lib/engine/agent.ts`
- `src/lib/engine/bootstrap.ts`
- `src/lib/engine/tools.ts`
- `src/lib/engine/router.ts`
- `src/lib/engine/session.ts`
- `src/app/api/agents/*`
- `CUBIQO_SELF_CODING_ENGINE.md`
- `memory/PRD.md`

Status:
- The legacy branches had a real custom agent framework with Henry, Dev, Writer, Tester, Marketing, Animator, and Business agents.
- It included tool calling, session history, subagent messaging, workspaces, web tools, Git/file tools, and aspirational self-coding flows.

Use now:
- Salvage the product concepts and tool boundaries.
- Do not wholesale merge the old agent loop. Replace the generic loop with a modern agent framework.

### RGY / Color / Voice / Keywords

Legacy evidence:
- `supabase/migrations/20260218000001_rgy_intelligent_matching.sql`
- `supabase/migrations/20260218000200_rgy_capsules_and_matching.sql`
- `src/components/rgy/*`
- `src/components/RGYColorSelector.tsx`
- `src/components/RGYIntentKeywordList.tsx`
- `RGY_MATCHING.md`
- `keywords-panel-rgy-implementation.md`
- `ANSWERS_FROM_TEAM.md`

Status:
- Legacy had RGY matching, geofence concepts, intent keywords, rooms/capsules, and keyword panels.
- Current QA has lighter RGY classification and keyword tracking but not the full Side Panel implementation.

Use now:
- Keep the pasted spec's correction: RGY color is UI/voice signaling, not model selection.
- Port keyword panels and matching concepts only after the current auth/profile identity is stable.

### Side Panel

Legacy evidence:
- `src/app/side-panel/page.tsx`
- `src/components/cq/SidePanel.tsx`
- `src/components/cq/ChatWindow.tsx`
- `src/components/cq/MessageInput.tsx`
- `src/components/cq/FriendsList.tsx`
- `chrome-extension/sidepanel.html`
- `chrome-extension/sidepanel.js`

Status:
- The old code had a side panel and CQ messaging UI foundation.
- The Chrome extension side panel embedded CubiQo in an iframe and relayed browser-control messages.

Use now:
- Recreate the current flagship QA panel from the CubiQo Flagship spec rather than trying to revive one legacy screen exactly.
- Reuse CQ panel logic where it helps, but restyle to the Apple-like premium direction.

### SettingsCube

Legacy evidence:
- `src/app/settings-cube/page.tsx`
- `src/components/settings-cube/*`
- `src/lib/settings-cube/commands.ts`
- `src/lib/settings-cube/types.ts`

Status:
- SettingsCube existed as a concept and implementation surface for voice/admin configuration.
- Legacy command examples included color locking and configuration updates.

Use now:
- Port after the RGY keyword panel is stable.
- Keep the pasted spec rule: users can lock color plus associated voice, but cannot mix voice/color semantics.

### Browser Automation And Extension

Legacy evidence:
- `src/lib/browser/browser-service.ts`
- `src/app/api/browser/route.ts`
- `src/lib/engine/browser-tool.ts`
- `chrome-extension/manifest.json`
- `chrome-extension/service-worker.js`
- `chrome-extension/content-script.js`
- `tests/chrome-extension.test.ts`
- `supabase/migrations/20260217000001_browser_sessions_and_actions.sql`
- `supabase/migrations/20260217000002_browser_consent_records.sql`

Status:
- Legacy had both server-side Puppeteer control and a Chrome extension bridge.
- The extension could observe active page context and relay click/type/screenshot/extract actions.
- The legacy iframe pointed to localhost and needs QA/prod URL rebuilds.

Use now:
- For QA production browser automation, use a hosted browser provider such as Browserbase with Playwright/Stagehand-style tools.
- Keep the extension as a separate "user's own browser" capability, useful for active-tab context and approved browser control.
- Do not run local Puppeteer directly in Vercel serverless.

### Live Search

Legacy evidence:
- `src/lib/engine/web-tools.ts`

Status:
- Legacy had Brave Search API support and cleaned web fetch through Jina reader.

Use now:
- Brave API is search, not browser control.
- Browser automation is different: it opens pages, clicks, fills forms, screenshots, downloads, and observes state.
- CubiQo should expose both as separate tools: `web_search` and `browser_session`.

### Self-Heal / Self-Reporting / NOC

Legacy evidence:
- `src/lib/self-heal/*`
- `src/app/api/admin/self-heal/*`
- `src/app/api/cron/self-heal/route.ts`
- `.github/workflows/self-heal-cron.yml`
- `.github/workflows/activity-monitor.yml`
- `.github/workflows/deployment-monitor.yml`
- `src/app/admin/noc/page.tsx`
- `supabase/migrations/20260215000001_self_heal_reports.sql`
- `supabase/migrations/20260219000001_monitoring_events.sql`

Status:
- Legacy had reporting, diagnostics, repair concepts, NOC/admin views, and monitoring tables.
- Some diagnostics were placeholder-like and need hardening.

Use now:
- Start with read-only `/api/ops/status` and signed event logs.
- Add repair only for conservative, auditable tasks.

### Security / Antivirus-Like Layers

Legacy evidence:
- `.github/workflows/security.yml`
- `src/lib/security/link-scanner.ts`
- `src/lib/security/fraud-detection.ts`
- `src/lib/security/rate-limit.ts`
- `src/lib/security/headers.ts`

Status:
- Legacy had dependency scanning, CodeQL, secret scanning, license checking, link scanning, fraud heuristics, rate limits, and security headers.
- No true runtime antivirus engine such as ClamAV was found.

Use now:
- Keep these as security layers.
- If file scanning becomes a product requirement, add a real malware scanning service separately.

### CQ-to-CQ Messaging / CQ Number

Legacy evidence:
- `supabase/migrations/20260215000002_cq_system.sql`
- `supabase/migrations/20260218000001_cubiqo_communication_fields.sql`
- `src/lib/cq-to-cq/*`
- `src/types/cq.ts`
- `src/hooks/useDirectMessages.ts`
- `src/components/cq/*`

Status:
- Legacy had CQ handles, friend requests, direct messages, realtime subscriptions, voice-delivered flags, and WebRTC call scaffolding.
- Generated `cubiqo_phone` values were branded placeholders, not carrier-provisioned numbers.

Use now:
- Restore after auth/profile provisioning is stable in QA.
- Treat real SMS/phone as a later provider-backed integration.

### BYO, Auth, Passkeys, Connectors, Wallet

Legacy evidence:
- BYO: `src/app/api/byo/*`, `src/components/byo/BYOSettings.tsx`, `src/hooks/useBYO.ts`, `src/lib/byo/*`
- Auth/magic link: `src/app/auth/*`, `src/components/auth/*`, `src/lib/email/templates/magic-link.ts`
- Passkeys: `src/app/api/auth/webauthn/*`, `src/lib/webauthn.ts`, `src/lib/webauthn/config.ts`
- Wallet: `supabase/migrations/20260220000001_cubiqo_wallet_schema.sql`, `src/lib/finance/wallet-service.ts`
- Connectors: Google OAuth/calendar, verbal command service files, smart-home schema references, taxi/food architecture docs

Status:
- Legacy had meaningful scaffolding across these areas.
- Current QA only has the first Supabase auth/database layer.

Use now:
- Port by capability, not branch.
- Start with BYO and auth/passkeys before high-risk payment and real-world transaction tools.

## Recommended Architecture

### Framework Choice

Recommended hybrid:
- Use OpenAI Agents SDK or Vercel AI SDK for the generic agent loop: tools, multi-step execution, guardrails, handoffs, tracing, and sessions.
- Keep CubiQo-specific orchestration in-house: RGY, CQ identity, CQ-to-CQ, Side Panel, SettingsCube, voice rules, consent, self-reporting, and product governance.

Why:
- A framework can flip CubiQo from chat-only to tool-using agentic behavior.
- A framework will not magically understand CubiQo's product language, CQ number system, RGY rules, side panels, or consent policy.
- The in-house layer is the product moat.

### Backend Shape

Keep the current QA baseline Node/Vercel-first for now:
- `frontend/` remains the QA UI.
- `api/converse.js` becomes a gateway into an agent runner.
- Supabase remains auth/data/event storage.
- OpenAI and ElevenLabs remain configured by environment variables.
- Browser automation becomes a separate provider-backed service/tool.

Do not move to Python just to be agentic.

Python can be useful later for:
- isolated code execution workers
- data science tools
- malware/file scanning adapters
- long-running back-office jobs

But the current app, deployment, and legacy UI direction are JavaScript/TypeScript-heavy, so a TypeScript agent layer is the least disruptive QA path.

## QA Closure Path

Phase 1: Stabilize current QA
- Keep auth, Supabase tables, OpenAI, ElevenLabs, and RGY verifier passing.
- Add `/api/ops/status`.
- Add `self_inspect` as a safe tool available to CubiQo.
- Add visible Side Panel shell with RGY keyword bands and voice-state sync.

Phase 2: Add first agentic tools
- `runtime_status`
- `self_inspect`
- `web_search`
- `web_fetch`
- `rgy_classifier`
- `keyword_feedback`

Phase 3: Add browser safely
- Use hosted browser sessions for QA automation.
- Add explicit user approval before click/type/submit/payment actions.
- Keep Brave/search separate from browser control.
- Rebuild extension URL/config for `qa.cubiqo.ai` and `www.qa.cubiqo.ai` after DNS is live.

Phase 4: Restore CubiQo product systems
- SettingsCube.
- CQ identity and messaging.
- BYO keys.
- Passkeys/OAuth.
- NOC/self-reporting.
- RGY matching and geofence.

Phase 5: High-risk capabilities
- Taxi/food actions.
- Smart-home actions.
- Wallet/crypto/QR delayed release.
- Coding mode with sandbox and founder/admin gate.

## Immediate Decision

The best approach is not "legacy merge" and not "buy an API and everything becomes agentic."

The best approach is:
1. Keep current QA stable.
2. Port legacy product features surgically.
3. Add an agent framework for the multi-step/tool loop.
4. Use hosted browser automation for production browser sessions.
5. Treat CQ identity, RGY, Side Panel, SettingsCube, voice, consent, and self-reporting as CubiQo-owned engineering.
