# Legacy Feature Migration Queue

Date: 2026-05-06
Branch: `QA/lagacy_feature_branch`

## Working Rule

Each feature moves through:

1. Analyze legacy code and current QA fit.
2. Fix/reshape the feature for the current stack.
3. Merge into `QA/lagacy_feature_branch`.
4. Run build, typecheck, integration, UAT smoke, and regression.
5. Mark done or block with the reason.

## Current Stack

- Current QA: Next.js App Router, TypeScript-enabled root, React 19, Supabase, Vercel, OpenAI/AI SDK tool layer, legacy React shell mounted client-side.
- Legacy strongest branches: `origin/production`, `origin/staging0217`, `origin/staging-environment`, `origin/backup-main-20260215-224930`, `origin/preview`, `origin/ui/energy-cube-staging`.
- Older experimental stack: CRA/Vite fragments, standalone extension folders, Puppeteer server browser, custom agent engine, Supabase migrations, social-army worker package.

## Feature Inventory

| Priority | Feature | Legacy Evidence | Current Status | Migration Decision |
|---|---|---|---|---|
| P0 | QA launch/auth/RGY/voice baseline | current branch + `codex/cubiqo-ai-clean-baseline` | Done | Keep as foundation. |
| P0 | Left panel essentials | Current QA, legacy dashboard/journal docs | Done | Theme, sign-in, journal CTA, and CubiQo size are present. |
| P0 | Daily Journal | `src/app/journal/*`, `src/components/journal/*`, `DAILY_JOURNAL_*` docs | Code ready / DB pending | Guided flow, API, local fallback, history basics, and migration SQL are ready; Supabase needs the new migration applied. |
| P1 | Dashboard basics / legacy console | `src/app/dashboard/*`, `DashboardStats`, admin dashboard docs | Live shell | `/dashboard` now tracks account stats, journal fallback, and all legacy modules with gates. |
| P1 | Runtime self-awareness | `src/lib/engine/*`, current `/api/converse` manifest | Partial | Extend model/tool/code awareness through tool layer. |
| P1 | Live search | `src/lib/engine/web-tools.ts` | Missing | Add search as a separate tool from browser control. |
| P1 | SettingsCube | `src/app/settings-cube/*`, `src/components/settings-cube/*` | Missing | Rebuild after RGY/side-panel state is stable. |
| P1 | RGY matching/keyword panel | `src/components/rgy/*`, RGY migrations | Partial | Signal panel UI is live; backend matching/consent/geofence remain. |
| P1 | Agent engine | `src/lib/engine/*`, `src/app/api/agents/*` | Missing | Reimplement concepts on modern tool layer; do not wholesale merge old loop. |
| P1 | Coder | `src/app/coder/*`, `CUBIQO_SELF_CODING_ENGINE.md` | Missing | Ambitious. Start as read-only project/code inspector, then sandboxed code actions. |
| P2 | Browser automation | `src/lib/browser/*`, `src/app/api/browser/*` | Missing | Use hosted browser/sandbox pattern; legacy Puppeteer is not Vercel-safe. |
| P2 | Chrome extension/side panel | `chrome-extension/*`, `public/clawdbot-chrome-extension.tar.gz` | Missing | Keep separate from web app; rebuild URL/permissions for QA. |
| P2 | CQ-to-CQ messaging/CQ number | `src/lib/cq-to-cq/*`, CQ migrations | Missing | Needs schema migration, identity rules, realtime UI. |
| P2 | Self-heal/NOC/self-reporting | `src/lib/self-heal/*`, admin routes, workflows | Missing | Start read-only status/reporting; repair actions need owner approval. |
| P2 | Job Hunt mode | `JOB_HUNT_MODE.md`, `src/app/api/job-hunt/dashboard/route.ts` | Missing | Likely portable as dashboard/tool workflow. |
| P2 | Marketing/social army/10x10 rule | `social-army/*`, `src/app/marketing/*`, `scripts/social-army-worker.ts` | Missing | Ambitious; requires accounts/API keys/browser worker. Start with planner/queue only. |
| P2 | Ecommerce business pack | `src/app/commerce-demo/*`, `src/app/coder/*` commerce stack refs | Missing | Mostly dashboard/integration catalog; real selling needs provider keys. |
| P2 | Biometrics / camera awareness | `src/components/auth/Biometric*`, `src/components/multimodal/CameraPreview.tsx`, `src/lib/multimodal/camera.ts` | Missing | Consent-gated only. Port after auth/privacy boundaries are explicit. |
| P3 | Wallet/crypto/QR delayed release | crosswalk evidence only | Missing | Keep out until payment/security design is approved. |
| P3 | Food/taxi/smart-home connectors | product spec only | Missing | Keep out until connector providers are selected. |
| P3 | Antivirus | security docs/workflows | Partial/aspirational | Existing work is security scanning, not true antivirus. Real malware scanning needs a service. |

## Cycle Log

### 1. Daily Journal

- Analysis: Legacy had a guided flow and richer schema, but current QA only has `profiles`, `conversation_events`, and `user_activity_keywords` provisioned.
- Fix: Implemented a usable guided journal page in the current QA shell. Guest entries save locally; signed-in entries sync through `/api/journal`.
- Backend: Added `journal_entries` schema, RLS policies, authenticated GET/POST API, and `conversation_events.metadata` for journal traceability. Migration file is `supabase/migrations/20260506000000_daily_journal.sql`; application is blocked until we have a valid Supabase pooler URL or SQL editor run because the current direct DB host is IPv6-only from this environment.
- Open question: Do we want daily journal email summaries now, or wait until dashboard basics are in?

### 2. Intelligent Chat & Match Signal Panel

- Analysis: Legacy had RGY rooms, intent keywords, CQ-to-CQ, and opportunity matching, but the full matching schema is not yet in current QA.
- Fix: Port the right panel into a useful signal surface: selected RGY band glows, other bands dim, keywords become signal cards, and match spaces show Socialize / Collaborate / Trade affordances with a private CQ-to-CQ placeholder.
- Boundary: This is UI/intent capture only. Real public matching still needs Supabase schema, consent gates, geofence rules, and realtime CQ identity.
- Verification: Build, typecheck, CQAI regression, and browser UAT passed.

### 3. Dashboard Basics / Legacy Feature Console

- Analysis: Legacy has many partially complete modules. Bulk merge would import broken routes, unsafe server browser code, and provider-key assumptions.
- Fix: Added `/dashboard` as the current-stack control surface for transferable legacy work: account state, conversation count, keyword count, journal count/local fallback, and feature cards for job hunter, launchpad, ecommerce, social army, agent engine, coder, browser, self-heal, biometrics, and camera awareness.
- Backend: Added `/api/dashboard` for authenticated stats and feature status. It intentionally reports `journalMigrationPending` until `journal_entries` exists in Supabase.
- Boundary: This moves the modules into QA as visible, gated workstreams. It does not claim provider-backed flows are end-to-end until their schemas, secrets, consent, and sandboxing are finished.

### 4. Completion Matrix + Job Hunt Scope

- Analysis: The moved QA legacy dashboard is a tracking surface, not proof that every legacy module is complete.
- Fix: Added `docs/legacy-feature-completion-matrix.md` with complete, code-ready, gated, and not-moved status.
- Job Hunt: Added `docs/job-hunt-compliant-agent-scope.md`. Scope is a compliant job application copilot with user review and visible browser handoff, not an undetected bot or detection-evasion system.
- Boundary: LinkedIn/Indeed/Dice-style direct automation must use official/allowed paths or explicit user handoff. No stealth, CAPTCHA bypass, proxy evasion, browser fingerprint spoofing, or mass automated apply.

### 5. Phase 1 Auth + Supabase Sanity

- Analysis: Supabase URL/anon configuration and profile/RLS migration already existed, but dashboard was visible to guests and magic-link callback routing was missing from the current Next shell.
- Fix: Added magic-link auth from the CubiQo auth modal, added `/auth/callback`, protected `/dashboard` with a sign-in-required state, and added a regression guard that checks frontend files for server-only secret names.
- Boundary: Service role remains server-side only. Current automated regression still fails on the already-known missing `journal_entries` migration until Supabase DB access is unblocked.

