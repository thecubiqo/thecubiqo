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
| P0 | Daily Journal | `src/app/journal/*`, `src/components/journal/*`, `DAILY_JOURNAL_*` docs | In progress | Port as a usable guided flow first; dedicated `journal_entries` schema can come later. |
| P1 | Runtime self-awareness | `src/lib/engine/*`, current `/api/converse` manifest | Partial | Extend model/tool/code awareness through tool layer. |
| P1 | Live search | `src/lib/engine/web-tools.ts` | Missing | Add search as a separate tool from browser control. |
| P1 | SettingsCube | `src/app/settings-cube/*`, `src/components/settings-cube/*` | Missing | Rebuild after RGY/side-panel state is stable. |
| P1 | RGY matching/keyword panel | `src/components/rgy/*`, RGY migrations | Partial | Current signal panel exists; port user-editable intents carefully. |
| P1 | Agent engine | `src/lib/engine/*`, `src/app/api/agents/*` | Missing | Reimplement concepts on modern tool layer; do not wholesale merge old loop. |
| P1 | Coder | `src/app/coder/*`, `CUBIQO_SELF_CODING_ENGINE.md` | Missing | Ambitious. Start as read-only project/code inspector, then sandboxed code actions. |
| P2 | Browser automation | `src/lib/browser/*`, `src/app/api/browser/*` | Missing | Use hosted browser/sandbox pattern; legacy Puppeteer is not Vercel-safe. |
| P2 | Chrome extension/side panel | `chrome-extension/*`, `public/clawdbot-chrome-extension.tar.gz` | Missing | Keep separate from web app; rebuild URL/permissions for QA. |
| P2 | CQ-to-CQ messaging/CQ number | `src/lib/cq-to-cq/*`, CQ migrations | Missing | Needs schema migration, identity rules, realtime UI. |
| P2 | Self-heal/NOC/self-reporting | `src/lib/self-heal/*`, admin routes, workflows | Missing | Start read-only status/reporting; repair actions need owner approval. |
| P2 | Job Hunt mode | `JOB_HUNT_MODE.md`, `src/app/api/job-hunt/dashboard/route.ts` | Missing | Likely portable as dashboard/tool workflow. |
| P2 | Marketing/social army/10x10 rule | `social-army/*`, `src/app/marketing/*`, `scripts/social-army-worker.ts` | Missing | Ambitious; requires accounts/API keys/browser worker. Start with planner/queue only. |
| P2 | Ecommerce business pack | `src/app/commerce-demo/*`, `src/app/coder/*` commerce stack refs | Missing | Mostly dashboard/integration catalog; real selling needs provider keys. |
| P3 | Wallet/crypto/QR delayed release | crosswalk evidence only | Missing | Keep out until payment/security design is approved. |
| P3 | Food/taxi/smart-home connectors | product spec only | Missing | Keep out until connector providers are selected. |
| P3 | Antivirus | security docs/workflows | Partial/aspirational | Existing work is security scanning, not true antivirus. Real malware scanning needs a service. |

## Cycle Log

### 1. Daily Journal

- Analysis: Legacy had a guided flow and richer schema, but current QA only has `profiles`, `conversation_events`, and `user_activity_keywords` provisioned.
- Fix: Implemented a usable guided journal page in the current QA shell. Guest entries save locally; signed-in entries sync to `conversation_events` with `rgy_intent = daily_journal`.
- Open question: Do we want a dedicated `journal_entries` table now, or keep journal entries in the existing memory/event stream until the dashboard work starts?

