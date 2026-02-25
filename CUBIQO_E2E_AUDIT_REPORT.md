# 🔍 CUBIQO — COMPREHENSIVE END-TO-END AUDIT REPORT
**Date**: 2026-02-25  
**Scope**: Full codebase audit — 146 API routes, 47 DB migrations, 27+ integrations  
**Author**: Antigravity Audit Engine

---

## TABLE OF CONTENTS
1. [Executive Verdict](#executive-verdict)
2. [Social Army — Full Audit](#social-army)
3. [Emergent Studio (Coding Panel) — Full Audit](#emergent-studio)
4. [Startup-Friendly Integrations (Shopify/Printify)](#startup-integrations)
5. [Environment Variables — Complete Inventory](#env-variables)
6. [API Key Dependencies — What's Wired vs Stub](#api-keys)
7. [Database Schema vs Code — Gap Analysis](#db-gaps)
8. [Security Loose Ends](#security)
9. [Feature-by-Feature Verdict](#feature-verdict)
10. [Prioritized Action Items](#action-items)

---

## 1. EXECUTIVE VERDICT <a id="executive-verdict"></a>

| Category | Status | Score |
|----------|--------|-------|
| **Core Chat AI** | ✅ Fully Functional | 9/10 |
| **Auth (Magic Link + Passkeys)** | ✅ Works E2E | 8/10 |
| **Social Army** | 🟡 Backend Complete, Deployment Partially Working | 6/10 |
| **Emergent Studio (Coding Panel)** | 🔴 UI Exists, Backend is ALL Stubs | 2/10 |
| **Shopify/Printify Integrations** | 🟡 Client Code Written, Not Connected | 4/10 |
| **Stripe/Monetization** | 🟡 Routes Exist, Needs Real Keys | 5/10 |
| **Browser Automation (Verbal Cmds)** | 🔴 Service Files Written, Runtime NOT Wired | 2/10 |
| **Onboarding Flow** | 🔴 UI Only, Nothing Persists | 1/10 |

**Bottom Line**: CubiQo has a **solid chat-first core** with impressive fallback orchestration (MiniMax → OpenAI → Mixtral → Llama → Claude → OpenRouter). Auth, Journal, Memory, RGY, BYO Mode, and Admin Dashboard are production-ready. However, **~40% of the feature surface area consists of TODO stubs** wrapped in beautiful UI. The Social Army is the closest "advanced feature" to being production-ready but needs proxy infrastructure and credential setup.

---

## 2. SOCIAL ARMY — FULL AUDIT <a id="social-army"></a>

### Architecture Overview
```
social-army/
├── src/
│   ├── worker.ts          ← Main daemon (polls content_queue every 5s)
│   ├── content-engine.ts  ← Content generation pipeline (GFXToolz → Gemini → OpenAI → Templates)
│   ├── poster.ts          ← Puppeteer-based social posting (Twitter, LinkedIn)
│   ├── gfxtoolz.js        ← GFXToolz.ai API wrapper (image/video generation)
│   ├── commander.js        ← Campaign management CLI
│   └── interactor.js       ← Engagement bot (likes, follows, retweets)
├── config/
│   └── brand-context.json ← Persona definitions and tone guide
├── Dockerfile             ← Railway deployment container
└── package.json
```

### What WORKS ✅
| Component | Status | Details |
|-----------|--------|---------|
| `worker.ts` — Main Loop | ✅ Functional | Polls `content_queue` every 5s, processes pending items |
| `content-engine.ts` — Generation | ✅ Complete Pipeline | GFXToolz (primary) → Gemini API → OpenAI → Template fallback |
| Content Queue DB schema | ✅ Tables Exist | `social_campaigns`, `social_accounts`, `content_queue` tables in Supabase |
| Admin UI (`/admin/social-army`) | ✅ Live UI | Shows campaigns, persona grid, live queue feed with Supabase Realtime |
| Campaign Launch | ✅ Creates Campaigns | "Start Campaign" button inserts into `social_campaigns` and auto-generates queue items |
| Asset Upload | ✅ Supabase Storage | Generated images uploaded to `social-assets` bucket |
| Dockerfile | ✅ Ready | `FROM node:18-slim` + Puppeteer dependencies |

### What's BROKEN / MISSING 🔴
| Component | Issue | Severity |
|-----------|-------|----------|
| **No Proxy Rotation** | `poster.ts` launches Puppeteer with raw IP — immediate platform ban risk | 🔴 CRITICAL |
| **Twitter Posting** | Uses CSS selectors (`div[aria-label="Tweet text"]`) that change frequently | 🟡 FRAGILE |
| **Instagram Posting** | Returns `false` — "not yet implemented" | 🔴 STUB |
| **TikTok Posting** | Returns `false` — "not yet implemented" | 🔴 STUB |
| **Account Credentials** | `password_encrypted` field exists but no encryption/decryption utility connected | 🔴 GAP |
| **No Social Accounts Seeded** | Zero rows in `social_accounts` table — worker has nothing to post to | 🔴 NO DATA |
| **GFXToolz Credentials** | `GFX_TOOLZ_USER` and `GFX_TOOLZ_PASS` not in any `.env.local` | 🟡 MISSING |
| **Railway Deployment** | Worker designed for Railway but no `railway.toml` with env vars | 🟡 CONFIG |

### Required ENV Variables for Social Army
```env
# In social-army/.env
NEXT_PUBLIC_SUPABASE_URL=       # ✅ Shared with main app
SUPABASE_SERVICE_ROLE_KEY=       # ✅ Shared with main app
GFX_TOOLZ_USER=                  # 🔴 MISSING — Primary content engine
GFX_TOOLZ_PASS=                  # 🔴 MISSING — Primary content engine
GEMINI_API_KEY=                  # 🟡 Fallback text generation
OPENAI_API_KEY=                  # 🟡 Fallback text + DALL-E image generation
SOCIAL_ARMY_STATUS=ON            # ✅ Kill switch
```

### Verdict
**Social Army is 70% functional** — the generation pipeline and queue system work, but there's no actual posting happening because: (a) no social accounts are configured, (b) no proxy rotation exists, and (c) Instagram/TikTok posting is stubbed.

---

## 3. EMERGENT STUDIO (CODING PANEL) — FULL AUDIT <a id="emergent-studio"></a>

### Architecture Overview
```
src/lib/emergent/
├── orchestrator.ts                ← WorldOrchestrator (central brain)
├── agent-types.ts                 ← Type definitions for all agents
├── subagents/
│   ├── image-agent.ts             ← 🔴 TODO: Returns placeholder image
│   ├── integration-agent.ts       ← 🟡 Partial implementation
│   ├── media-agent.ts             ← 🔴 TODO stub
│   └── testing-agent.ts           ← 🔴 TODO: "Implement actual test execution"
├── integrations/
│   ├── commerce.ts                ← 🟡 ShopifyManager + PrintifyManager (mock logic)
│   ├── business-suite.ts          ← 🟡 10-integration "Profit Stack" (all mocked)
│   ├── playbook-executor.ts       ← Schema-driven action execution
│   ├── playbook-schema.ts         ← Playbook type definitions
│   └── webhook-bridge.ts          ← Webhook receiver shell
├── security/                      ← Sandbox isolation policies
├── runner/                        ← Container execution environment
└── automation/                    ← Script runner framework
```

### API Routes — All Stubs
| Route | Method | Status | Code Reality |
|-------|--------|--------|-------------|
| `/api/emergent/deploy` | POST | 🔴 STUB | `// TODO: Implement Vercel deployment` — returns fake deployment ID |
| `/api/emergent/deploy` | GET | 🔴 STUB | `// TODO: Query deployment status` — always returns "pending" |
| `/api/emergent/terminal` | GET | 🔴 NOT IMPL | Returns 501 "WebSocket terminal requires dedicated server" |
| `/api/emergent/terminal` | POST | 🔴 STUB | `// TODO: Implement command execution` — echoes back command text |
| `/api/emergent/files` | GET | 🔴 STUB | `// TODO: Read file from workspace container` — returns placeholder |
| `/api/emergent/files` | POST | 🔴 STUB | `// TODO: Write file to workspace container` |
| `/api/emergent/files` | DELETE | 🔴 STUB | `// TODO: Delete file from workspace container` |
| `/api/emergent/analytics` | POST | 🔴 STUB | `// TODO: Insert event into emergent_analytics_events` |
| `/api/emergent/analytics` | GET | 🔴 STUB | `// TODO: Query analytics` |
| `/api/emergent/projects` | GET/POST | 🟡 Exists | DB-backed project CRUD |
| `/api/emergent/secrets` | GET/POST | 🟡 Exists | Encrypted secrets storage |
| `/api/emergent/workspaces` | GET/POST | 🟡 Exists | Workspace creation |

### Sub-Agents — All TODO
| Agent | File | Status |
|-------|------|--------|
| Image Agent | `image-agent.ts` | 🔴 Returns `placehold.co` URL, no real DALL-E/SD call |
| Testing Agent | `testing-agent.ts` | 🔴 `// TODO: Implement actual test execution` |
| Media Agent | `media-agent.ts` | 🔴 Stub |
| Integration Agent | `integration-agent.ts` | 🟡 Partial — routes to commerce module |

### UI Pages
| Route | File | Status |
|-------|------|--------|
| `/studio` | `src/app/studio/page.tsx` | 🟡 324 bytes — basic scaffold |
| `/dev-console` | `src/app/dev-console/page.tsx` | 🟡 2.9KB — terminal UI present but no backend |
| `/launchpad` | `src/app/launchpad/page.tsx` | 🟡 Project launcher UI |

### Verdict
**Emergent Studio is ~15% functional.** The database schema exists (4 emergent migrations), projects/secrets/workspaces CRUD works, but the core value proposition — **code execution, file I/O, deployment, and terminal** — is entirely TODO stubs. This is the feature with the **largest gap between UI promise and backend reality**.

---

## 4. STARTUP-FRIENDLY INTEGRATIONS <a id="startup-integrations"></a>

### The "Business in a Box" Stack

#### Shopify Integration
| Component | File | Status |
|-----------|------|--------|
| **ShopifyClient** | `src/integrations/shopify/client.ts` | ✅ **Complete API wrapper** — getProducts, createProduct, updateProduct, deleteProduct, getOrders, createWebhook, listWebhooks |
| **Shopify Types** | `src/integrations/shopify/types.ts` | ✅ Full type definitions |
| **Shopify Webhooks** | `src/integrations/shopify/webhooks.ts` | ✅ Webhook handler structure |
| **OAuth Flow** | `src/lib/founders-pass/oauth.ts` | ✅ Shopify-specific OAuth with store domain |
| **Connection** | — | 🔴 **NOT CONNECTED** — No API route calls ShopifyClient |

**What's needed to activate Shopify:**
```env
SHOPIFY_CLIENT_ID=         # Register at https://partners.shopify.com
SHOPIFY_CLIENT_SECRET=
OAUTH_ENCRYPTION_KEY=      # For encrypted token storage (32-byte hex)
```

#### Printify Integration
| Component | File | Status |
|-----------|------|--------|
| **PrintifyClient** | `src/integrations/printify/client.ts` | ✅ **Complete API wrapper** — getShops, getProducts, createProduct, getOrders |
| **Printify Sync** | `src/integrations/printify/sync.ts` | ✅ Product sync logic |
| **Printify Types** | `src/integrations/printify/types.ts` | ✅ Full type definitions |
| **Connection** | — | 🔴 **NOT CONNECTED** — No API route calls PrintifyClient |

**What's needed to activate Printify:**
```env
PRINTIFY_CLIENT_ID=        # Register at https://printify.com/developers
PRINTIFY_CLIENT_SECRET=
```

#### Other Commerce Integrations (ALL MOCKED)
From `business-suite.ts` — these are **manager class stubs** that log to console but make no real API calls:

| Integration | Class | Status | Description |
|-------------|-------|--------|-------------|
| **Apliiq** | `ApliiqManager` | 🔴 Mock | High-end streetwear with custom labels |
| **Through6** | `Through6Manager` | 🔴 Mock | Full-print Cut & Sew |
| **Prodigi** | `ProdigiManager` | 🔴 Mock | Global fine art fulfillment |
| **Klaviyo** | `KlaviyoManager` | 🔴 Mock | Email marketing automation |
| **TikTok Shop** | `TikTokShopManager` | 🔴 Mock | Viral sales channel |
| **Meta Ads** | `MetaAdsManager` | 🔴 Mock | Ad spend tracking |
| **Gorgias** | `GorgiasManager` | 🔴 Mock | AI customer support |
| **ReCharge** | `ReChargeManager` | 🔴 Mock | Subscription billing |
| **Faire** | `FaireManager` | 🔴 Mock | Wholesale marketplace |
| **ProfitOS** | `ProfitOS` | ✅ Works | Pure math — no API needed |

#### Stripe Integration
| Component | File | Status |
|-----------|------|--------|
| **Stripe Client** | `src/lib/stripe.ts` | 🟡 Uses fallback dummy key: `sk_test_dummy_key_for_build` |
| **Checkout Route** | `/api/stripe/checkout` | ✅ Complete logic — creates customer, session |
| **Portal Route** | `/api/stripe/portal` | ✅ Billing portal redirect |
| **Webhook Route** | `/api/stripe/webhook` | ✅ Handles `checkout.session.completed`, subscription updates |
| **DB Tables** | `user_subscriptions` | ✅ Migration exists |

**What's needed to activate Stripe:**
```env
STRIPE_SECRET_KEY=              # 🔴 NOT in .env.example!
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=  # 🔴 NOT in .env.example!
STRIPE_WEBHOOK_SECRET=          # ✅ In .env.local (dummy)
```
⚠️ **Critical**: `STRIPE_SECRET_KEY` is hardcoded as `'sk_test_dummy_key_for_build'` in `stripe.ts` — this means Stripe is initialized at build time but will fail on any real API call.

---

## 5. ENVIRONMENT VARIABLES — COMPLETE INVENTORY <a id="env-variables"></a>

### ✅ REQUIRED (App Won't Function Without These)
| Variable | Purpose | Status in Vercel Prod |
|----------|---------|----------------------|
| `NEXT_PUBLIC_SUPABASE_URL` (or `_URL1`) | Supabase project URL | ✅ Set |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or `_KEY1`) | Supabase anon key | ✅ Set |
| `SUPABASE_SERVICE_ROLE_KEY` (or `_KEY1`) | Supabase admin key | ✅ Set |

### 🟡 IMPORTANT (Features Degraded Without These)
| Variable | Feature | Fallback if Missing |
|----------|---------|---------------------|
| `MINIMAX_KEY` / `MINIMAX_API_KEY` | Primary chat AI | Skips to OpenAI |
| `OPENAI_API_KEY` | Chat fallback + Image gen | Skips to Mixtral |
| `MISTRAL_API_KEY` | Second fallback | Skips to Llama |
| `TOGETHER_API_KEY` | Third fallback (Llama) | Skips to Claude |
| `ANTHROPIC_API_KEY` | Claude Haiku (final) | Skips to OpenRouter |
| `CUBIQO_UNIVERSAL_KEY` | OpenRouter (absolute final) | Returns mock response |
| `ELEVENLABS_API_KEY` | Text-to-Speech | Voice disabled |
| `RESEND_API_KEY` | Email (magic links, reports) | Auth emails fail |
| `ENCRYPTION_KEY` | OAuth token encryption | OAuth fails |
| `OAUTH_ENCRYPTION_KEY` | Founders Pass OAuth | Founders OAuth fails |
| `CRON_SECRET` | Cron job auth | Self-heal crons fail |
| `SELF_HEAL_SECRET` | Self-heal report signing | Reports unsigned |

### 🟡 INTEGRATION-SPECIFIC
| Variable | Integration | Needed When |
|----------|-------------|-------------|
| `GROQ_API_KEY` | Whisper STT | Voice input via Groq |
| `GOOGLE_AI_API_KEY` | Gemini models | Alternative AI provider |
| `OPENROUTER_API_KEY` | Multi-model routing | OpenRouter access |
| `GITHUB_CLIENT_ID` / `_SECRET` | GitHub OAuth | Founders Pass GitHub |
| `NEXT_PUBLIC_VERCEL_CLIENT_ID` / `VERCEL_CLIENT_SECRET` | Vercel OAuth | Emergent deployments |
| `GMAIL_CLIENT_ID` / `_SECRET` | Gmail OAuth | Email integration |
| `SHOPIFY_CLIENT_ID` / `_SECRET` | Shopify OAuth | Commerce |
| `PRINTIFY_CLIENT_ID` / `_SECRET` | Printify OAuth | Print-on-demand |
| `PRINTFUL_CLIENT_ID` / `_SECRET` | Printful OAuth | Print-on-demand |
| `STRIPE_CLIENT_ID` / `_SECRET` | Stripe Connect OAuth | Marketplace |
| `UBER_CLIENT_ID` / `_SECRET` | Uber OAuth | Ride booking |
| `GFX_TOOLZ_USER` / `_PASS` | GFXToolz.ai | Social Army content |
| `STRIPE_SECRET_KEY` | Stripe payments | ⚠️ NOT IN .env.example! |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe client | ⚠️ NOT IN .env.example! |

### ⚠️ MISSING FROM `.env.example` (But Referenced in Code)
| Variable | Where Used | Fix |
|----------|-----------|-----|
| `STRIPE_SECRET_KEY` | `src/lib/stripe.ts` line 3 | Add to .env.example |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `src/lib/stripe-client.ts` line 7 | Add to .env.example |
| `GEMINI_API_KEY` | `social-army/src/content-engine.ts` | Add to social-army/.env.example |
| `NEXT_PUBLIC_ELEVENLABS_API_KEY` | `src/lib/config/env.ts` line 34 (alt) | Already has `ELEVENLABS_API_KEY` |
| `NEXT_PUBLIC_RESCUE_PIN` | `src/app/rescue/page.tsx` | **DELETE this feature** |

---

## 6. API KEY DEPENDENCIES <a id="api-keys"></a>

### Chat AI Fallback Chain (Fully Wired ✅)
```
MiniMax (MINIMAX_KEY)
  ↓ fail
OpenAI GPT-4o (OPENAI_API_KEY)
  ↓ fail
Mixtral (MISTRAL_API_KEY)
  ↓ fail
Llama via Together AI (TOGETHER_API_KEY)
  ↓ fail
Claude Haiku (ANTHROPIC_API_KEY)
  ↓ fail
OpenRouter (CUBIQO_UNIVERSAL_KEY)
  ↓ fail
Mock Response (hardcoded)
```
**This is excellent.** 6-level fallback with spending caps ($200/mo for Anthropic), rate limiting (100 req/hr for MiniMax), sensitive content classification, and BYO key support. **This is production-grade.**

### Voice Pipeline (Partially Wired)
| Component | Key | Status |
|-----------|-----|--------|
| STT (Speech-to-Text) | `GROQ_API_KEY` | ✅ Whisper via Groq — works |
| TTS (Text-to-Speech) | `ELEVENLABS_API_KEY` | ✅ ElevenLabs — works when key present |
| Music Generation | Suno/Udio API | 🔴 **NOT WIRED** — `audio-score-service.ts` has no API connection |

---

## 7. DATABASE SCHEMA vs CODE — GAP ANALYSIS <a id="db-gaps"></a>

### 47 Migrations — Tables Created
| Table | Migration | Code Using It | Status |
|-------|-----------|---------------|--------|
| `profiles` | initial | ✅ Everywhere | ✅ |
| `sessions` | initial | ✅ Chat | ✅ |
| `messages` | initial | ✅ Chat | ✅ |
| `journal_entries` | 20260215 | ✅ Journal | ✅ |
| `feature_flags` | 20260215 | ✅ Founders Pass | ✅ |
| `conscious_memories` | 20260215 | ✅ Journey Memory | ✅ |
| `self_heal_reports` | 20260215 | ✅ Self-Heal | ✅ |
| `webauthn_credentials` | 20260215 | ✅ Passkeys | ✅ |
| `admin_audit_log` | 20260215 | ✅ Admin | ✅ |
| `browser_sessions` | 20260217 | 🔴 **Never written to** | GAP |
| `browser_actions` | 20260217 | 🔴 **Never written to** | GAP |
| `browser_consent_records` | 20260217 | 🔴 **Never written to** | GAP |
| `social_campaigns` | 20260217 | ✅ Social Army | ✅ |
| `social_accounts` | 20260217 | 🔴 **Zero rows** — no accounts configured | GAP |
| `content_queue` | 20260217 | ✅ Social Army Worker | ✅ |
| `system_health_checks` | 20260218 | ✅ Admin health | ✅ |
| `notifications` | 20260218 | ✅ Notification center | ✅ |
| `notification_preferences` | 20260218 | ✅ Notification settings | ✅ |
| `rgy_rooms` | 20260218 | ✅ RGY Chat Rooms | ✅ |
| `rgy_matches` | 20260218 | ✅ RGY Matching | ✅ |
| `rgy_capsules` | 20260218 | ✅ RGY Capsules | ✅ |
| `job_hunt_profiles` | 20260218 | ✅ Job Hunt | ✅ |
| `job_applications` | 20260218 | ✅ Job Hunt | ✅ |
| `subscription_tiers` | 20260218 | ✅ Monetization | ✅ |
| `user_subscriptions` | 20260224 | ✅ Stripe webhook | ✅ |
| `monitoring_events` | 20260219 | ✅ Monitoring | ✅ |
| `emergent_projects` | 20260218 | ✅ Emergent Studio | ✅ |
| `emergent_workspaces` | 20260218 | 🟡 CRUD works, no container behind it | Partial |
| `emergent_project_secrets` | 20260218 | ✅ Secrets CRUD | ✅ |
| `emergent_deployments` | 20260219 | 🔴 **Referenced in deploy route but never written** | GAP |
| `oauth_tokens` | 20260215 | ✅ Founders Pass OAuth (storeTokens/getDecryptedToken) | ✅ |
| `cubiqo_wallet_transactions` | 20260220 | 🔴 **No UI route** for wallet | GAP |

---

## 8. SECURITY LOOSE ENDS <a id="security"></a>

| Issue | Location | Severity | Fix |
|-------|----------|----------|-----|
| **Hardcoded PIN `2026`** | `src/app/founderspass/page.tsx:13` | 🔴 CRITICAL | Delete `/founderspass` — use `/founders-pass` with real auth |
| **SessionStorage-only auth** | `/founderspass/page.tsx` | 🔴 CRITICAL | Zero server validation |
| **Rescue bypass PIN** | `src/app/rescue/page.tsx` | 🔴 HIGH | Uses `NEXT_PUBLIC_RESCUE_PIN` — delete or secure |
| **Stripe dummy key in source** | `src/lib/stripe.ts:3` | 🟡 MEDIUM | Use env-only initialization with build guard |
| **CORS `Access-Control-Allow-Origin: *`** | `src/app/api/chat/route.ts:703` | 🟡 MEDIUM | Restrict to cubiqo.ai domain |
| **In-memory rate limiting** | `src/app/api/chat/route.ts:50` | 🟡 LOW | Resets on each Vercel cold start — use Redis |
| **In-memory user model store** | `src/app/api/chat/route.ts:56` | 🟡 LOW | `TODO: Persist to Supabase` — loses data on restart |
| **Placeholder Supabase URLs** | `src/app/api/stripe/webhook/route.ts:12` | 🟡 LOW | Falls back to `placeholder.supabase.co` if env missing |

---

## 9. FEATURE-BY-FEATURE VERDICT <a id="feature-verdict"></a>

### ✅ FULLY E2E FUNCTIONAL (Ship-Ready)
| Feature | Confidence |
|---------|-----------|
| Core Chat AI (6-level fallback) | 95% |
| Auth — Magic Link | 95% |
| Auth — Passkeys (WebAuthn) | 90% |
| Daily Journal (Rozana) | 90% |
| Journal History | 90% |
| Feature Flags System | 95% |
| Founders Pass Dashboard (`/founders-pass`) | 85% |
| Admin Dashboard (18 sub-pages) | 90% |
| BYO Mode (Bring Your Own Key) | 90% |
| Voice STT (Groq Whisper) | 85% |
| Voice TTS (ElevenLabs) | 85% (when key present) |
| RGY Colour System | 90% |
| RGY Chat Rooms | 85% |
| Unified Notifications | 90% |
| Journey Memory | 85% |
| Job Hunt Mode | 80% |
| Self-Heal Architecture | 85% |
| Autopilot Profile Fill | 80% |
| 3D Energy Cube (Three.js) | 95% |
| Monitoring Events | 85% |

### 🟡 PARTIALLY WORKING (Needs Completion)
| Feature | Gap | Effort |
|---------|-----|--------|
| Social Army | No proxy rotation, no real accounts | 2-3 days |
| Stripe/Monetization | Needs real API keys + webhook testing | 1 day |
| CQ-to-CQ Video Calls | CSP header blocks camera (PR #183) | 1 hour |
| Job Hunt Email Reports | `TODO: Send email using Resend` | 2 hours |
| Shopify Client | Complete code, no route connection | 1 day |
| Printify Client | Complete code, no route connection | 1 day |
| Dashboard Journal Count | Hardcoded `0` | 30 min |

### 🔴 DEAD / STUB (Requires Significant Dev)
| Feature | Reality | Effort |
|---------|---------|--------|
| Emergent Studio — Deploy | `TODO: Implement Vercel deployment` | 3-5 days |
| Emergent Studio — Terminal | `TODO: Implement command execution` + WebSocket server | 5-7 days |
| Emergent Studio — Files | `TODO: Read/Write file from workspace container` | 3-5 days |
| Emergent Studio — Image Agent | Returns placeholder URL | 2 days |
| Emergent Studio — Testing Agent | `TODO: Implement actual test execution` | 3 days |
| Browser Automation (Verbal Cmds) | 12 service files written, BrowserPool never launches | 5-7 days |
| Onboarding Flow | Saves to localStorage only, never persists to DB | 2 days |
| Audio/Music Generation | Suno/Udio not connected | 3 days |
| Cubiqo Wallet | Backend schema only, no UI route | 3 days |
| RGY Discovery/Opportunity | `TODO: AI-powered opportunity generation` | 3 days |
| Telegram Agent Integration | Receives messages but no agent routing | 2 days |
| Business Suite (10 integrations) | All mocked console.log classes | Weeks |

---

## 10. PRIORITIZED ACTION ITEMS <a id="action-items"></a>

### 🔴 P0 — MUST FIX BEFORE LAUNCH (Security/Breaking)
1. **Delete `/founderspass` and `/rescue` PIN-based auth** — immediate security vulnerability
2. **Add `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` to `.env.example`** — currently missing
3. **Fix CORS on chat API** — `Access-Control-Allow-Origin: *` should be restricted
4. **Persist user model store to Supabase** — currently in-memory, loses data on every cold start

### 🟡 P1 — HIGH IMPACT, LOW EFFORT (Quick Wins)
5. **Fix Dashboard Journal Count** — replace hardcoded `0` with actual query (~30 min)
6. **Wire Job Hunt email reports** — add `Resend.send()` call (~2 hours)
7. **Merge PR #183 (CSP/Camera Fix)** — unblocks CQ-to-CQ video calls (~1 hour)
8. **Add Stripe env vars to Vercel** — enables monetization (~30 min + Stripe dashboard setup)
9. **Connect Shopify/Printify clients to API routes** — create `/api/commerce/shopify/*` routes (~1 day)

### 🔵 P2 — FEATURE COMPLETION (Sprint Work)
10. **Social Army proxy rotation** — integrate residential proxy for Puppeteer
11. **Seed Social Army accounts** — create initial `social_accounts` rows
12. **Complete Emergent Studio terminal** — requires dedicated WebSocket server (Railway)
13. **Wire audio/music generation** — connect Suno/Udio APIs
14. **Onboarding persistence** — save config to `profiles.feature_preferences`
15. **Activate new-user → onboarding redirect** in `/auth/callback`

### 📋 P3 — CLEANUP / DEBT
16. **Delete dead code** — `/founderspass`, `/founders-dashboard`, `*.disabled`, `*.backup` files
17. **Delete demo routes** — 7+ demo routes accessible to any user
18. **Consolidate duplicate route directories** — `/founders-pass` vs `/founderspass`
19. **Move rate limiting to Redis** — in-memory Map resets on cold starts

---

## APPENDIX A — FULL 27-INTEGRATION REGISTRY

The `integration-registry.ts` defines 27 integrations across 4 categories:

### Chat Platforms (6)
WhatsApp, Telegram, Discord, Slack, Signal, iMessage

### Social Media (8)
Twitter/X, Instagram, Facebook, LinkedIn, TikTok, Reddit, YouTube, Mastodon

### Smart Home (7) — ALL `available: false`
Philips Hue, Nest, Ring, August Lock, Sonos, Ecobee, Home Assistant

### Productivity (6)
Gmail, Google Calendar, Notion, GitHub, Trello, Apple Notes

**Reality check**: Of these 27, only **Telegram** has any real code behind it (`src/integrations/telegram/bot.ts`), and even that has no agent routing wired. The rest are purely UI registry entries with no backend logic.

---

## APPENDIX B — CHAT API FALLBACK CHAIN DEEP DIVE

```
[User Message]
    │
    ├── Sensitive Content? → callClaude(ANTHROPIC_API_KEY)
    │                             ├── Success → Return
    │                             └── Fail → Continue to regular chain
    │
    ├── MiniMax Rate Limited? → callOpenAI
    │                             ├── Success → Return
    │                             └── Fail → callOpenRouter → Return
    │
    └── Regular Chain:
         callMiniMax(MINIMAX_KEY)
           ├── ✅ → Return
           └── ❌ → callOpenAI(OPENAI_API_KEY)
                      ├── ✅ → Return
                      └── ❌ → callMixtral(MISTRAL_API_KEY)
                                 ├── ✅ → Return
                                 └── ❌ → callLlama(TOGETHER_API_KEY)
                                            ├── ✅ → Return
                                            └── ❌ → callClaude(ANTHROPIC_API_KEY)
                                                       ├── ✅ → Return
                                                       └── ❌ → callOpenRouter(CUBIQO_UNIVERSAL_KEY)
                                                                  ├── ✅ → Return
                                                                  └── ❌ → Mock Response
```

**Additional layers:**
- Spending cap: $200/month for Anthropic (tracked in-memory)
- BYO key support: User can provide own `ANTHROPIC_API_KEY` via header
- Rate limiting: 100 req/hr per session for MiniMax
- Content classification: Sensitive content routed directly to Claude
- Adaptive learning: User model built from interaction signals
- Age gating: RED zone requires verified 18+ users
- Regional context: Regional config injected into system prompt
- Memory context: Session memories loaded from Supabase

---

*End of Audit Report*
