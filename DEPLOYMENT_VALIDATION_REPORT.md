# Deployment Validation Report
**Date**: 2026-02-24  
**Branch**: `main` (HEAD: `52d402c` — "Optimize 3D scene: reduce particles and remove external HDR assets to fix production crash")  
**Prepared by**: MO (Tech Architect / CTO)  
**Target environment**: `cubiqo.ai` (Vercel → Supabase Prod)

---

## ✅ Build & Tests — ALL PASSING

| Check | Status | Details |
|-------|--------|---------|
| **Next.js Build** | ✅ PASS | 156 API routes compiled, all pages rendered |
| **Unit / Integration Tests** | ✅ PASS | 2266 tests, 98 files, 0 failures (30 skipped = requires live server) |
| **Lint** | ⚠️ PRE-EXISTING | ESLint circular-config issue — CI already uses `continue-on-error: true`, no action needed |
| **NPM Audit** | ⚠️ PRE-EXISTING | 2 vulnerabilities (1 moderate, 1 high) — pre-existing, not introduced by recent PRs |

---

## 📋 Open PRs as of this audit

| PR | Title | Status | Notes |
|----|-------|--------|-------|
| **#196** (this PR) | Validate issues API integrations and DB dependencies | Draft | This investigation |
| **#197** | Fix coding panel and ensure tools integrations are functional | Draft WIP | Separate copilot session |

---

## 📦 Recently Merged PRs (validated)

| PR | Title | Merged | DB Schema Impact | API Impact |
|----|-------|--------|-----------------|------------|
| **#193** | Fix non-functional Social Army: broken GFXToolz API, simulated posting | ✅ 2026-02-24 | Uses existing `social_accounts`, `social_campaigns`, `content_queue` tables | Fixed `gfxtoolz.js`, `worker.ts`, `poster.ts`, `commander.js` — now real API calls |
| **#190** | Fix org website links in Work section | ✅ 2026-02-24 | None | Static content only (cpsite) |

---

## 🔴 PROD SUPABASE: Migrations to Apply

**These migrations exist in the repo but are NOT in `MASTER_PRODUCTION_SETUP.sql`.  
You must run them manually in the Supabase SQL Editor for `cubiqo.ai`.**

### 1. Spending Caps (REQUIRED for Admin Dashboard)
**File**: `supabase/migrations/20260223000001_spending_caps.sql`

Creates:
- `admin_spending_caps` — tracks spend per provider (anthropic, elevenlabs)
- `admin_usage_locks` — per-service lock switches (ai, database)
- Seeds defaults: anthropic cap=$200, elevenlabs cap=$200
- RLS: only `aditya@cubiqo.ai` and `admin@cubiqo.ai` can access

**Impact if missing**: Spending cap persistence will fall back to in-memory only (resets on server restart). Admin Cost dashboard will not persist data across restarts.

---

### 2. Wallet / Payments Schema (REQUIRED for Commerce)
**File**: `supabase/migrations/20260220000001_cubiqo_wallet_schema.sql`

Creates:
- `payments` table — QR-based escrow payments, supports `held/released/cancelled` status
- Indexes on `user_id`, `qr_code`, `status`
- RLS: users see own payments; recipients can scan QR codes

**Impact if missing**: Any commerce/wallet features will fail with table-not-found errors.

---

### 3. Job Hunt Schema (REQUIRED for Job Hunt Mode)
**File**: `supabase/migrations/20260218000002_job_hunt_schema.sql`

Creates:
- `job_hunt_profiles` — user job hunt configuration, resume, preferences
- `job_applications` — tracked job applications
- `job_hunt_activities` — activity log
- `job_hunt_questions` — interview prep questions
- References `profiles(id)` — requires `profiles` table to exist first

**API Routes that depend on this**:
- `GET/POST /api/job-hunt/applications`
- `GET /api/job-hunt/dashboard`
- `GET /api/job-hunt/resume`
- `GET /api/job-hunt/questions`
- `GET /api/job-hunt/reports`

**Impact if missing**: All `/api/job-hunt/*` routes will fail with DB errors.

---

## ✅ Tables Already in Prod (verified in MASTER_PRODUCTION_SETUP.sql)

These are present in the master setup and should already be in prod:

| Table(s) | Feature | Migration |
|----------|---------|-----------|
| `profiles`, `sessions`, `conversations`, `messages`, `events`, `memory` | Core | `20251124000001_initial_schema.sql` |
| `features_catalog`, `user_feature_toggles` | Feature Flags | `20260215000001_feature_flags.sql` |
| `social_accounts`, `social_campaigns`, `content_queue` | Social Army | `20260217000004_social_army_schema.sql` |
| `integration_health` | Admin Dashboard | `20260218000001_admin_dashboard_comprehensive.sql` |
| `cq_numbers`, `cq_friend_requests`, `cq_contacts`, `cq_messages` | CQ Messaging | MASTER_PRODUCTION_SETUP.sql |
| `founders_pass_applications` | Founders Pass | `20260215000001_founders_pass_schema.sql` |
| `self_heal_reports` | Self Heal | `20260215000001_self_heal_reports.sql` |

---

## 🔌 API Integration Status

### External APIs (require keys in Vercel env vars)

| Integration | Env Var(s) | Usage | Status |
|------------|-----------|-------|--------|
| **Supabase** | `NEXT_PUBLIC_SUPABASE_URL1`, `NEXT_PUBLIC_SUPABASE_ANON_KEY1`, `SUPABASE_SERVICE_ROLE_KEY1` | Core DB | Required — must be set |
| **Anthropic (Claude)** | `ANTHROPIC_API_KEY` | Primary AI model | Optional (BYO mode fallback) |
| **OpenAI** | `OPENAI_API_KEY` | Image generation (DALL-E 3) | Optional |
| **MiniMax** | `MINIMAX_KEY` or `MINIMAX_API_KEY` | Primary AI fallback | Optional |
| **Mistral** | `MISTRAL_API_KEY` | Second AI fallback | Optional |
| **Together AI** | `TOGETHER_API_KEY` | Third AI fallback | Optional |
| **ElevenLabs** | `ELEVENLABS_API_KEY` | Voice synthesis (TTS) | Optional |
| **Groq** | `GROQ_API_KEY` | Fast inference / Whisper STT | Optional |
| **OpenRouter** | `OPENROUTER_KEY` or `CUBIQO_UNIVERSAL_KEY` | Multi-provider routing | Optional |
| **Telegram** | `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME` | Bot webhook | Optional |
| **Shopify** | `SHOPIFY_STORE_DOMAIN`, `SHOPIFY_ADMIN_TOKEN`, `SHOPIFY_STOREFRONT_TOKEN` | Commerce | Optional |
| **Printify** | `PRINTIFY_API_KEY`, `PRINTIFY_SHOP_ID` | Print-on-demand | Optional |
| **GFXToolz** | `GFXTOOLZ_USER`, `GFXTOOLZ_PASS` | Social Army content gen | Optional (Social Army only) |
| **Redis** | `REDIS_URL` | Rate limiting / caching | Optional (falls back gracefully) |

> Note: Env vars in Vercel production use the `_1` suffix pattern (e.g. `NEXT_PUBLIC_SUPABASE_URL1`). The app handles both forms via `src/lib/config/env.ts`.

### Social Army (PR #193 Fix) — Verified
- ✅ `gfxtoolz.js`: Now uses real axios API calls with `GFXTOOLZ_USER`/`GFXTOOLZ_PASS`
- ✅ `worker.ts`: Calls real `postToSocial()` with credentials from DB
- ✅ `poster.ts`: Stubs now return `false` (not `true`) with clear "not implemented" logging
- ✅ `commander.js`: Fixed field name `type` (was `persona`), proper module loading
- ✅ Tests: 11 tests passing for social army

---

## 🚀 Deployment Checklist for Prod (cubiqo.ai)

### In Prod Supabase SQL Editor — Run these in order:

```sql
-- 1. Job Hunt Schema
-- Paste contents of: supabase/migrations/20260218000002_job_hunt_schema.sql

-- 2. Wallet / Payments Schema
-- Paste contents of: supabase/migrations/20260220000001_cubiqo_wallet_schema.sql

-- 3. Spending Caps
-- Paste contents of: supabase/migrations/20260223000001_spending_caps.sql
```

### In Vercel (cubiqo.ai project) — Verify these env vars:
- `NEXT_PUBLIC_SUPABASE_URL1` — Prod Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY1` — Prod Supabase Anon Key
- `SUPABASE_SERVICE_ROLE_KEY1` — Prod Supabase Service Role Key
- `ANTHROPIC_API_KEY` — Claude key (if using AI features)
- `ELEVENLABS_API_KEY` — Voice key (if using voice)
- `MINIMAX_KEY` — MiniMax key

### Vercel will auto-deploy when `main` branch is updated.

---

## ⚠️ Known Pre-Existing Issues (Not Blocking Deployment)

1. **ESLint circular config**: `npm run lint` crashes with circular JSON error. CI uses `continue-on-error: true`. Unrelated to this deployment.
2. **NPM 2 vulnerabilities**: `npm audit` shows 1 moderate + 1 high pre-existing vulnerabilities. Not introduced by recent changes.
3. **THREE.js Multiple Instances Warning**: Test output shows `THREE.WARNING: Multiple instances of Three.js being imported` in 3D component tests. This is a known dev/test warning, not a production issue.

---

## Summary

| | Status |
|-|--------|
| Build | ✅ Clean |
| All Tests | ✅ 2266 pass |
| Recent PRs validated | ✅ PR #193 (Social Army fix), PR #190 (website links) |
| DB migrations needed in Prod | ⚠️ **3 migrations** — see above |
| API integrations | ✅ All routes compile and pass tests |
| Blocking issues | ❌ None — safe to deploy |
