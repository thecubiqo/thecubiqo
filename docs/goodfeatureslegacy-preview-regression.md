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
- Added `/api/agent` for CubiQo V1 read-only agentic behavior: repo stack summary, route listing, repo search/read, runtime status, RGY classification, capability planning, and blocked check reporting.
- Updated typed chat routing so text submissions enter `/api/agent` first. Simple conversational messages are delegated back to the existing converse path, while repo/self-check/capability/action-boundary requests stay on the V1 agentic route.
- Updated the main CubiQo response surface with a component-library based "What I checked" collapsible that shows V1 tool activity inside the existing window.
- Updated regression script to require `signals` table in addition to existing auth/journal tables.
- Removed the incomplete `/signal` route from the visible/routable app surface.

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
- `npm run build`: pass; routes expose `/`, `/app`, `/auth/callback`, `/dashboard`, `/journal`, and API routes only. `/signal` is not routable.
- `npm run build`: known warning remains for `/api/agent` because V1 repo inspection performs runtime filesystem reads. This is intentional for read-only self-inspection and should be watched before production promotion.
- Local route smoke on `127.0.0.1:3110`: `/`, `/app`, `/dashboard`, `/journal` returned `200`; `/signal` returned `404`.
- `npm run verify:cqai`: pass.
- E2E save/read/delete: pass for authenticated `journal_entries` and `signals`.
- RLS denial: pass; anonymous writes to `journal_entries` and `signals` are denied.
- Voice cue route: verified wired to ElevenLabs config (`River neutral/androgynous`, `eleven_flash_v2_5`) but audio generation is currently blocked by ElevenLabs quota; route returns `elevenlabs_error` when the key is present and provider fails.

## Preview Deployment

Preview URL: https://cubiqo-repo-dmvgdkydt-cubiqo-projects-d7156840.vercel.app

Deployment ID: `dpl_BC5NTqF5ZKjTU49iiyh9Cx31Q4nQ`

Preview smoke:

- `/`: 200
- `/app`: 200
- `/dashboard`: 200
- `/journal`: 200
- `/signal`: 404
- `/api/journal/guide`: summary response returned
- `/api/converse`: RGY returned `green`, keyword `build`, `matching_enabled: false`
- `/api/voice-cue`: returns `elevenlabs_error` due ElevenLabs quota, with configured neutral/androgynous voice metadata

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

Prod voice check:

- `https://www.cubiqo.ai/api/voice-cue`: reaches ElevenLabs and returns a quota error with `River neutral/androgynous` / `eleven_flash_v2_5`. Current prod code labels provider as `none`, while this branch labels the same condition as `elevenlabs_error`.

Resolved schema blocker:

- `journal_entries` exists and is reachable.
- `signals` exists and is reachable.

Do not push this branch for review unless this contract stays current and regression remains green.
