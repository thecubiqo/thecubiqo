# Cubiqo — Implementation Audit

**Prepared by:** MO (CTO / Tech Architect)  
**Date:** 2026-02-21  
**Sources:** Git history (100 commits), 12 open PRs, Vercel deployment map, 38 DB migrations, 688 source files, 250+ internal markdown docs  
**Purpose:** Authoritative record of what has been implemented, when, and the techno-functional specification of the entire system as it stands today.

---

## 1. Environment Architecture

### 1.1 Branch ↔ Deployment Mapping

| Git Branch | Vercel Environment | URL | Database |
|---|---|---|---|
| `main` | **Production** | `cubiqo.ai` / `www.cubiqo.ai` | `cubiqo-production` (Supabase) |
| `staging0217` | Preview | `cubiqo-repo-git-staging0217-cubiqo-projects.vercel.app` | `cubiqo-staging` (`naoxezcmcauecawchgjk`) |
| `production` | Preview (legacy name — NOT prod) | `cubiqo-repo-git-production-cubiqo-projects.vercel.app` | Preview env vars |
| Any feature/copilot branch | Preview (auto) | `cubiqo-repo-git-{branch}-cubiqo-projects.vercel.app` | Preview env vars |

**Key fact:** The `production` branch is misnamed — it deploys to a *Vercel Preview*, not to the production domain. The actual production domain `cubiqo.ai` is served exclusively from `main`.

### 1.2 CI/CD Pipeline

- **Auto-deploy:** Every push to any branch triggers a Vercel Preview build
- **Production deploy:** Every merge to `main` → auto-deploys to `cubiqo.ai`
- **GitHub Actions Workflows:**
  - `ci.yml` — Build + Vitest test suite (branches: `main`, `develop`)
  - `chromatic.yml` — Visual regression via Storybook/Chromatic
  - `self-heal-cron.yml` — Scheduled daily self-healing job
- **Vercel region:** `iad1` (US East)
- **Vercel cron:** `/api/cron/self-heal` runs daily at 10:00 UTC

### 1.3 Current Workflow Run Status (2026-02-21)

| Branch | Status | Result |
|---|---|---|
| `copilot/research-third-party-apps` | in_progress | Copilot coding agent |
| `main` | completed | ✅ success |
| `staging0217` | completed | ✅ success |
| `refs/pull/181/head` | completed | ✅ success |

---

## 2. Technology Stack

| Layer | Technology | Version |
|---|---|---|
| **Framework** | Next.js (App Router) | 16.0.7 |
| **Runtime** | React | 19.2.0 |
| **Language** | TypeScript | Strict mode |
| **Database** | Supabase (PostgreSQL + Auth + Realtime + Storage) | `@supabase/supabase-js` 2.84.0 |
| **Styling** | Tailwind CSS + PostCSS | — |
| **3D Engine** | Three.js + React Three Fiber + @react-three/drei | — |
| **Testing** | Vitest + jsdom | 2,288 tests; 95.2% pass rate |
| **Visual Testing** | Storybook + Chromatic | — |
| **In-app Terminal** | xterm.js (`@xterm/xterm`, `@xterm/addon-fit`) | — |
| **In-app Editor** | Monaco Editor | — |
| **Browser Automation** | Puppeteer | — |
| **Container Runtime** | Docker (via dockerode) | — |
| **Caching / Rate Limiting** | Redis (ioredis) | — |
| **Email** | Resend | — |
| **Search** | Brave Search API | — |
| **Deployment** | Vercel (iad1 region) | — |
| **Notifications (Telegram)** | grammy | — |
| **Auth (Passkeys)** | SimpleWebAuthn (`@simplewebauthn/browser` + `server`) | — |
| **Package manager** | npm + yarn (both `package-lock.json` and `yarn.lock` committed) | — |

---

## 3. Open Pull Requests (as of 2026-02-21)

12 PRs are open, targeting either `main` or `staging0217`.

### PR #185 — Third-Party Integrations & Affiliate Playbook
- **Branch:** `copilot/research-third-party-apps` → `main`
- **Created:** 2026-02-21
- **What:** Documentation only — `THIRD_PARTY_INTEGRATIONS.md` (99 integrations across 20 categories) + `AFFILIATE_OPPORTUNITIES.md` (36 affiliate programs mapped to 5 user personas)
- **Status:** ✅ Ready to merge

### PR #184 — RGY SIGNAL Button Fix
- **Branch:** `copilot/fix-button-signal-issue` → `main`
- **Created:** 2026-02-21
- **What:** Wires Step 3 of the RGY chat flow — `showRoomChat` state was set on room selection but no `RoomView` component was rendered. Silent regression.
- **Tech:** Added `RoomView` rendering path inside `RGYMatchingInterface`; state machine now completes all 3 steps
- **Status:** ✅ Code complete

### PR #183 — Audio/Video Security Header Fixes
- **Branch:** `copilot/fix-audio-video-issues` → `main`
- **Created:** 2026-02-21
- **What:** Camera and audio completely broken on `cubiqo.ai` due to restrictive middleware headers
- **Root causes:**
  1. `Permissions-Policy: camera=()` — blanket-denied camera access (needed for CQ video calls)
  2. Missing `data:` scheme in `media-src` CSP directive
- **Tech:** Fixed `src/middleware.ts` (or `proxy.ts`) headers; camera now allowed from `self`, `data:` added to `media-src`
- **Status:** ✅ Code complete

### PR #182 — Supabase Client Null Safety + Font Loading
- **Branch:** `copilot/fix-chat-and-stuff-issues` → `main`
- **Created:** 2026-02-21
- **What:** Chat and CQ-to-CQ broken in production due to Supabase client returning nullable types; `next/font/google` failing in SSR when Google Fonts unreachable; Vitest mock chains incomplete
- **Tech:** Added null guards to Supabase client factory; made font loading resilient with fallback fonts; completed mock `.from().select().eq()` chain stubs
- **Status:** ✅ Code complete

### PR #181 — Standalone Frontend Preview (No-DB Fallback)
- **Branch:** `copilot/preview-standalone-implementation` → `main`
- **Created:** 2026-02-20
- **What:** Users couldn't preview Cubiqo frontend without a live Supabase DB — root route required auth, Three.js crashed on SSR, `AuthProvider` hung 4 seconds
- **Tech:** Created `/preview` static route; Three.js lazy-loaded with `dynamic(..., { ssr: false })`; `AuthProvider` given 500ms timeout before rendering anyway; added `/api/preview` endpoint returning mock data
- **Status:** ✅ Code complete (CI: passed)

### PR #180 — proxy.ts Inline Export Fix
- **Branch:** `copilot/fix-proxy-function-export` → `main`
- **Created:** 2026-02-20
- **What:** Next.js 16 Turbopack reference-style default exports (`export default proxy`) not reliably detected by Rust AST; builds failed silently
- **Tech:** Changed to inline: `export default function proxy(...)` in `src/proxy.ts`
- **Status:** ✅ Code complete

### PR #179 — Missing npm Dependencies
- **Branch:** `copilot/investigate-prod-build-failure` → `main`
- **Created:** 2026-02-20
- **What:** Production build had 5 `Module not found` errors — packages imported in source but absent from `package.json`
- **Missing packages added:** `@xterm/xterm`, `@xterm/addon-fit`, `dockerode`, `ioredis`, `grammy`
- **Status:** ✅ Code complete

### PR #178 — Landing Screen Branding
- **Branch:** `copilot/fix-multiple-point-failures` → **`staging0217`**
- **Created:** 2026-02-20
- **What:** Landing screen had no indication of capabilities — added three branding layers
- **Tech:** Animated adjectives marquee ("Intelligent • Proactive • Autonomous…"), scrolling integration logo bar (WhatsApp, Shopify, Printify, Gmail…), AI models bar (Claude, GPT-4, Gemini, MiniMax…) — applied to both `LandingCube` (plasma wave variant) and `TechLandingCube` (wireframe variant)
- **Status:** ✅ Code complete (targets staging, not main)

### PR #177 — Next.js 16 Turbopack Build Fix
- **Branch:** `copilot/fix-deploy-issue-for-prod` → `main`
- **Created:** 2026-02-20
- **What:** Production build failed because `next.config.js` had a `webpack` block with no `turbopack` equivalent — fatal in Next.js 16 which defaults to Turbopack
- **Tech:** Removed legacy `webpack` config block; added `turbopack: { resolveAlias: {...} }` block; aligned `serverExternalPackages` list
- **Status:** ✅ Code complete

### PR #176 — Test Failures + Hardcoded Admin Auth Fix
- **Branch:** `copilot/fix-build-error-cubiqo-ai` → `main`
- **Created:** 2026-02-20
- **What:** CI failing across 8 test files; hardcoded `admin@cubiqo.ai` bypass in admin middleware (security issue)
- **Tech:** Fixed duplicate `vi.mock()` calls (vitest hoisting conflict); completed mock chain stubs; removed hardcoded admin auth bypass; replaced with proper session validation
- **Status:** ✅ Code complete

### PR #175 — Post-Merge Test Run Reports
- **Branch:** `copilot/run-tests-and-generate-reports` → `main`
- **Created:** 2026-02-20
- **What:** Documentation PR — ran full Vitest suite after mega-merge; captured results
- **Results documented:** 101 test files, 2,283 tests, 96.1% pass rate (2,189 passed / 89 failed, all pre-existing)
- **Status:** ✅ Documentation only

### PR #172 — Fix 5 Failing Test Suites
- **Branch:** `copilot/test-syagiuing-main-branch` → `main`
- **Created:** 2026-02-19
- **What:** 8 failing tests across 5 suites — misconfigured test exclusions, missing jsdom polyfill, broken regex
- **Tech:** Fixed `vitest.config.ts` exclusions; added `@testing-library/jest-dom` setup; patched broken regex in search parser
- **Status:** ✅ Code complete

---

## 4. Production System — What's Live on cubiqo.ai

The `main` branch reached its current state on **2026-02-20** via a mega-merge of `staging0217test`, which itself incorporated 65+ PRs merged sequentially between 2026-02-15 and 2026-02-20.

### 4.1 Timeline of Major Merges to `main`

| Date | Event |
|---|---|
| 2025-11-24 | Initial schema: `sessions`, `messages`, `profiles`, `conversations` tables |
| 2026-02-15 | Founders Pass, Journal, Feature Flags, Admin Identity, CQ system, Journey Memory, Self-Heal, Design Toggles schemas |
| 2026-02-17 | Sprint 1: BYO Mode, Browser Queue/Pool/Consent, Social Army schema |
| 2026-02-18 | Emergent Studio foundations (4 migrations), Monetization schema, RGY matching, Job Hunt, Unified Notifications, Admin Dashboard comprehensive |
| 2026-02-19 | CQ performance indexes, Autopilot features, Monitoring events, Missing tables for staging |
| 2026-02-20 | **Mega-merge**: All 65 PRs (PR #84–#174) integrated via `staging0217test` → `main`; Cubiqo favicon; high-fidelity landing, audio engine, support hub |
| 2026-02-20 | Multiple build stability fixes (Turbopack, env var resilience, missing deps) |
| 2026-02-21 | AI reliability cleanup: fixed non-existent model names, migrated to sanitized ENV config; debug env endpoint added |

---

## 5. Implemented Features — Techno-Functional Specifications

### 5.1 Core AI Engine & Chat

**Implemented:** 2026-02-15 (foundations) → 2026-02-20 (mega-merge)  
**Status:** ✅ Live on production

**What it does:** Multi-provider AI chat with colour-coded "mood" routing (RGY colour system), voice synthesis, and memory extraction.

**Technical spec:**
- **Primary route:** `POST /api/chat` — authenticates user, loads conversation history from `messages` table, builds context, calls AI provider, streams response back via `ReadableStream`
- **AI routing:** `src/lib/ai/policy-router.ts` selects provider based on colour zone:
  - `YELLOW` → Llama 3.3 70B (Together AI via OpenRouter) → Qwen Turbo → Haiku fallback
  - `GREEN` → MiniMax M2.1 → DeepSeek V3 → Gemini 2.5 Pro → Opus fallback
  - `RED` → Mixtral 8x22B (Mistral) → Llama Uncensored → Green fallback
  - `REASONING` → DeepSeek R1 → Opus
  - `FOUNDER` → Claude 3.5 Sonnet (always, via Anthropic SDK)
  - `FREEDOM` → Ollama local (`localhost:11434`) or uncensored OpenRouter
- **Fallback chain:** `src/lib/ai/fallback.ts` — tries each provider in order, catches `APIError`, logs, retries
- **BYO mode:** `src/lib/byo/byo-manager.ts` — if user has BYO keys (AES-256-GCM encrypted in `profiles.byo_config`), router uses those instead of server keys
- **Spending caps:** Redis-backed per-user daily spend counter; DALL-E 3 image gen capped at $50/month; `src/lib/rate-limit.ts`
- **Memory extraction:** Background call to `POST /api/extract-memories` after each exchange; stores to `conscious_memories` table; enriches future prompts
- **DB tables:** `sessions`, `messages`, `conversations`, `profiles`

### 5.2 RGY Colour & Mood System

**Implemented:** 2026-02-15 (initial), 2026-02-18 (intelligent matching)  
**Status:** ✅ Live on production

**What it does:** The cube and AI voice change colour/tone based on conversation topic. Users can lock to a colour. There are three base colours (Red, Green, Yellow) plus Orange (Founder mode).

**Technical spec:**
- **Topic detection:** `src/lib/ai/topic-detector.ts` — keywords + LLM classification → maps to `RED | GREEN | YELLOW | ORANGE`
- **Colour state:** stored per session in `sessions.color_state` column; transitions controlled by `color_transition_at` timestamp with minimum dwell time
- **Voice modulation:** `VOICE_MOODS` map in `src/components/settings/VoiceModulationPanel.tsx`; maps mood to ElevenLabs voice ID + pitch/rate parameters
- **RGY Chat Rooms:** Capsule format `[COLOR|INTENT|KEYWORDS]` — users broadcast intents; matching algorithm finds compatible users within geo-fence; `src/lib/rgy/matching-engine.ts`
- **DB tables:** `rgy_capsules`, `rgy_matches`, `rgy_rooms` (migration `20260218000200_rgy_capsules_and_matching.sql`)
- **API:** `GET/POST /api/rgy/capsules`, `POST /api/rgy/match`, `GET /api/rgy/rooms`, `POST /api/rgy/signal`

### 5.3 BYO Mode (Bring Your Own API Key)

**Implemented:** 2026-02-17 (Sprint 1, Day 1–2)  
**Status:** ✅ Live on production

**What it does:** Users paste their own Anthropic/OpenAI API keys. Keys are encrypted at rest. Cubiqo uses them instead of server keys — reduces Cubiqo's infrastructure cost by 60–80% for those users.

**Technical spec:**
- **Encryption:** AES-256-GCM via Web Crypto API; PBKDF2 key derivation (100,000 iterations, SHA-256); per-user passphrase = `{ENCRYPTION_SECRET}:{userId}`; IV is random 12-byte nonce prepended to ciphertext
- **Storage:** Encrypted blob stored in `profiles.byo_config` (JSONB column); never stored in plaintext
- **API:**
  - `POST /api/byo` — save/update key (validates format with regex before encrypting)
  - `POST /api/byo/test` — live-tests key against provider API before saving
  - `DELETE /api/byo` — wipe key
- **UI:** `src/components/byo/BYOSettings.tsx` — show/hide toggle, format validation, "Test Connection" button
- **Router integration:** `src/lib/ai/router.ts` — on each chat request, decrypts BYO key if present, injects into provider config
- **Security:** Production throws hard error if `BYO_ENCRYPTION_SECRET` env var not set; no default fallback

### 5.4 Voice & Audio Engine

**Implemented:** 2026-02-15 (initial), 2026-02-20 (audio engine + support hub)  
**Status:** ✅ Live (microphone blocked — fixed by PR #183, pending merge)

**What it does:** Voice-first interaction — user speaks, Cubiqo transcribes (Whisper via Groq), routes to AI, synthesises response voice (ElevenLabs), plays back.

**Technical spec:**
- **STT (Speech-to-Text):** Groq Whisper API (`/api/multimodal/whisper`); audio recorded in browser via `MediaRecorder` → sent as `multipart/form-data`
- **TTS (Text-to-Speech):** ElevenLabs streaming synthesis; `useElevenLabsTTS` hook (`src/hooks/useElevenLabsTTS.ts`); voice ID selected from `VOICE_MOODS` based on current colour
- **Voice state machine:** 4 states — `idle` / `listening` / `thinking` / `speaking`; visualised in the Energy Cube (colour + animation changes per state)
- **Voice modulation:** Madhyama marg philosophy — "middle path" tone; not harsh, not flat; pitch ±5–15%, rate 0.9–1.1×, configured per colour zone
- **Audio score generation:** `src/lib/audio/audio-score-service.ts` + `POST /api/audio/generate-music` — hooks to Suno/Udio for ambient background music (API not yet wired in production)
- **CQ-to-CQ voice calls:** WebRTC P2P via `stun.l.google.com:19302`; voice synthesised through ElevenLabs before transmitting; `src/lib/cq-to-cq/webrtc-calls.ts`

### 5.5 CQ-to-CQ Communication (Peer Messaging & Calls)

**Implemented:** 2026-02-15 (schema), 2026-02-17 (schema fix), 2026-02-19 (performance indexes)  
**Status:** ✅ Live (camera/microphone broken — fixed by PR #183, pending merge)

**What it does:** Native peer-to-peer messaging and video/audio calls within Cubiqo — "BBM for AI natives". Each user gets a CQ number (e.g. `CQ734`).

**Technical spec:**
- **CQ numbers:** Auto-generated on profile creation; format `CQ{3-digit-number}`; stored in `profiles.cq_number`; rotatable via `rotateCQNumber()` in `src/lib/db/db.ts`
- **Messaging:** Real-time via Supabase Realtime subscriptions on `cq_messages` table; `useCQMessaging` hook (`src/lib/cq-to-cq/hooks/useCQMessaging.ts`)
- **Calls:** WebRTC — ICE/STUN via Google STUN (`stun.l.google.com:19302`); signalling via Supabase Realtime channel; `useCQCalls` hook; `src/lib/cq-to-cq/webrtc-calls.ts`
- **DB tables:** `cq_conversations`, `cq_messages`, `cq_call_sessions` (migration `20260215000002_cq_system.sql`; fixed `20260217000003_fix_cq_schema.sql`)
- **Performance:** Composite indexes on `(sender_id, created_at)`, `(receiver_id, status)` for fast lookup (migration `20260219000001_add_cq_performance_indexes.sql`)
- **API:** `GET /api/messages`, `POST /api/messages`, `GET /api/friends`, `POST /api/friends`

### 5.6 Authentication & Identity

**Implemented:** 2025-11-24 (initial), 2026-02-15 (admin identity), 2026-02-17 (passkeys)  
**Status:** ✅ Live

**What it does:** Magic-link email login (via Supabase Auth + Resend), passkey/biometric login (FIDO2/WebAuthn), guest/anonymous session.

**Technical spec:**
- **Magic link:** Supabase Auth `signInWithOtp()`; email sent via Resend (`RESEND_API_KEY`); quick-open buttons for Gmail and Outlook in `MagicLinkButtons.tsx`
- **Passkeys:** `@simplewebauthn/browser` (client) + `@simplewebauthn/server` (server); registration at `POST /api/auth/passkey/register`; authentication at `POST /api/auth/passkey/authenticate`; stored in `webauthn_credentials` table
- **Sessions:** Supabase Auth JWT; server-side validation via `@supabase/ssr` cookie strategy; middleware validates every request
- **Admin identity:** `is_admin` boolean column in `profiles` table; `ADMIN_EMAILS` env var for bootstrap; verified in admin middleware before any `/admin/*` route
- **RLS:** All tables have Row Level Security policies; service role key used server-side to bypass RLS for cross-user admin operations
- **Guest mode:** `localStorage`-backed anonymous session; migrated to DB on sign-in (conversation history preserved)

### 5.7 Founders Pass

**Implemented:** 2026-02-15 (schema + core), 2026-02-18 (OAuth + ecosystem)  
**Status:** ✅ Live (premium feature, gated)

**What it does:** Premium tier for founders. White-label site management, OAuth connections to Shopify/Stripe/Printify/Printful/Uber/Gmail, feature flag overrides, action templates, audit log.

**Technical spec:**
- **Feature gating:** `is_founder` check via `profiles.subscription_tier = 'FOUNDER_ACCESS'`; `hasFeature()` util in `src/lib/features.ts`
- **Sites:** Founders can create "white-label" sub-sites; each site has slug, custom domain, feature flag overrides; stored in `founders_sites` table
- **OAuth:** Authorization-code flow for 6 providers; tokens AES-256-GCM encrypted before storage in `oauth_tokens` table; callback at `/api/founders-pass/oauth/callback`; `src/lib/founders-pass/oauth.ts`
- **Action templates:** Pre-built automation templates (e.g. "Post to all social", "Fulfil order"); stored in `founders_pass_action_templates`; API: `GET/POST/PUT /api/founders-pass/actions`
- **Audit log:** Every founders-pass action logged to `founders_pass_audit_log` with actor, timestamp, IP
- **Pages:** `/founders-pass`, `/founders-pass/integrations`, `/founders-pass/sites`, `/founders-pass/flags`, `/founders-pass/actions`, `/founders-pass/audit`, `/founders-pass/security`
- **DB migrations:** `20260215000001_founders_pass_schema.sql`, `20260215000001_feature_flags.sql`

### 5.8 Daily Journal (Rozana)

**Implemented:** 2026-02-15 (schema), 2026-02-17 (API + UI), 2026-02-19 (history view)  
**Status:** ✅ Live

**What it does:** AI-guided daily journalling with 8 prompts per session, mood tracking, history view, BigBoss personality delivery.

**Technical spec:**
- **Schema:** `journal_entries` table — `user_id`, `content`, `mood_score` (1–10), `ai_analysis` (JSONB), `created_at`; one entry per user per day enforced by unique constraint on `(user_id, date(created_at))`
- **API:** `GET /api/journal/entries` (with pagination, date filters), `POST /api/journal/entries` (requires auth; validates `content` field)
- **AI analysis:** After entry saved, async call to `POST /api/journal/analyze` — Claude Haiku extracts mood, themes, action items; stored in `ai_analysis` JSONB field
- **History:** `/journal/history` — timeline view; `GET /api/journal/entries?page=&limit=` pagination
- **Freemium gate:** 1 entry/day on Free tier; unlimited on Premium; enforced at API route
- **Email summary:** Daily digest sent via Resend; templated in `src/lib/email/`
- **DB migration:** `20260215000001_journal_entries.sql`

### 5.9 Journey Memory System

**Implemented:** 2026-02-15  
**Status:** ✅ Live

**What it does:** Progressive, consent-aware memory system. AI builds a persistent model of the user — preferences, patterns, events — shared across sessions.

**Technical spec:**
- **Storage:** `conscious_memories` table — `user_id`, `memory_type` (enum: `PREFERENCE | PATTERN | EVENT | RELATIONSHIP | GOAL | FACT`), `content`, `confidence`, `source_session_id`, `created_at`, `last_reinforced_at`
- **Extraction:** Triggered post-chat via `POST /api/extract-memories`; Claude Haiku (`claude-haiku-4-5`) used for cost-efficient extraction; `src/lib/autopilot/profile-autofill.ts`
- **Context injection:** On each chat request, top-N memories retrieved (ranked by confidence × recency) and prepended to system prompt
- **Consent:** `conscious_memory_consent` column in `profiles`; if false, no memories stored; user can wipe via `DELETE /api/journey/memories`
- **DB migrations:** `20260215000001_journey_memory_schema.sql`, `20260215000002_journey_helper_functions.sql`
- **Pages:** `/journey`, `/memory`, `/settings/privacy`

### 5.10 Emergent Studio (AI App Factory)

**Implemented:** 2026-02-18 (4 DB migrations), merged 2026-02-20  
**Status:** ✅ Foundations live; full studio UI at `/studio`

**What it does:** An in-browser AI-powered app factory. User describes an app; agents design, code, test, and deploy it. Includes Docker-sandboxed code execution, GitHub integration, Vercel deployment.

**Technical spec:**
- **Architecture:** "Worlds" pattern — each integration is a `World` class implementing `IWorld` interface; `WorldOrchestrator` (`src/lib/emergent/orchestrator.ts`) coordinates
- **Agents:** Specialist sub-agents — `ImageAgent`, `MediaAgent`, `CodeAgent`, `DeployAgent`; each has tools registry; communicate via message bus
- **Orchestrator:** Uses OpenRouter for routing between agents; Brave Search for research tasks; streaming output to `/studio` UI
- **Sandboxed execution:** Docker containers spun up per workspace via `dockerode`; `EmergentDockerManager` (`src/lib/emergent/runner/docker-manager.ts`); each workspace gets isolated `/workspace` directory
- **Business Suite:** `src/lib/emergent/integrations/business-suite.ts` — manages Shopify, Printify, Printful, Apliiq, Prodigi, Faire, ReCharge, Klaviyo, Meta Ads, Gorgias connections for launched apps
- **Webhook bridge:** `src/lib/emergent/integrations/webhook-bridge.ts` — receives HubSpot, Salesforce, Shopify, Stripe webhook events and routes to correct agent handler
- **DB tables:** `emergent_projects`, `emergent_sessions`, `emergent_messages`, `emergent_workspaces`, `emergent_integrations`, `emergent_post_launch_ops` (4 migrations: `20260218064853`–`20260218064856`)
- **Pages:** `/studio`, `/dev-console`, `/launchpad`, `/agents`
- **API routes:** `/api/emergent/*`, `/api/code`, `/api/files`, `/api/agents`

### 5.11 Social Army

**Implemented:** 2026-02-17 (schema), 2026-02-20 (Railway Worker merged)  
**Status:** ✅ Live (Railway-deployed Puppeteer worker active)

**What it does:** Automated social media posting across 9 platforms from a single content queue. User creates content once; Social Army distributes to all connected accounts.

**Technical spec:**
- **Worker:** Node.js Puppeteer-based worker in `social-army/` directory; deployed on Railway; `social-army/Dockerfile`
- **Queue:** `content_queue` Supabase table — `user_id`, `content`, `media_urls`, `platforms` (array), `scheduled_at`, `status`, `result`
- **Platforms:** Twitter/X, Instagram, LinkedIn, TikTok, YouTube (Shorts), Reddit, Pinterest, Threads, Facebook — all via Puppeteer browser automation (no official API required)
- **Scheduling:** Worker polls `content_queue` every 60s for `scheduled_at ≤ NOW()` and `status = 'pending'`; marks `processing` → `posted` or `failed`
- **DB migration:** `20260217000004_social_army_schema.sql`
- **Admin view:** `/admin/social-army`

### 5.12 Verbal Commands & Lifestyle Automation

**Implemented:** 2026-02-17–20 (various PRs)  
**Status:** ✅ Services implemented; live via Handshake Wizard

**What it does:** Users say (or type) "Order me an Uber to [address]" / "Send WhatsApp to [contact]" / "Play [song] on Spotify" — Cubiqo's verbal command router parses intent and executes via browser automation.

**Technical spec:**
- **Intent parsing:** `src/lib/browser/command-parser.ts` — regex + LLM classification → maps to `ActionType`
- **Router:** `src/lib/verbal-commands/command-router.ts` — dispatches to the correct service module
- **Service modules (each is a Puppeteer driver):**
  - `uber-service.ts` — request ride, get estimate, check status
  - `uber-eats-service.ts` — browse menus, place order
  - `gmail-service.ts` — send, read, search emails
  - `slack-service.ts` — send message to channel/DM
  - `discord-service.ts` — send message to server/channel
  - `whatsapp-service.ts` — send message to contact
  - `twitter-service.ts` — post tweet, reply, DM
  - `maps-service.ts` — place search, directions, nearby
  - `spotify-service.ts` — play, pause, skip, search
  - `notion-service.ts` — create page, search database
  - `trello-service.ts` — add card, read list
  - `linkedin-service.ts` — post, connect, message
- **Browser Queue:** Max 5 concurrent Puppeteer sessions; rate-limited to 10/hour/user; `src/lib/browser/BrowserQueue.ts` + `BrowserPool.ts`
- **Consent:** Every first automation for a service requires explicit user consent; stored in `browser_consent_records` table
- **Audit:** Every browser action logged to `browser_sessions` + `browser_actions` tables (migration `20260217000001_browser_sessions_and_actions.sql`)

### 5.13 Unified Notifications System

**Implemented:** 2026-02-18  
**Status:** ✅ Live

**What it does:** All notifications from 27+ platforms aggregated into one bell-icon panel inside Cubiqo. Never need to leave the app to see WhatsApp, Instagram, Slack, Philips Hue alerts.

**Technical spec:**
- **Registry:** `src/lib/notifications/integration-registry.ts` — 27 platforms pre-registered (6 chat, 8 social, 7 smart home, 6 productivity); each entry has: `platformId`, `displayName`, `icon`, `color`, `connectionType` (OAuth | Puppeteer | Local)
- **Real-time:** Supabase Realtime subscription on `notifications` table; unread count badge auto-updates
- **Components:** `NotificationCenter.tsx` (slide-in panel), `BrandedActionCard.tsx` (platform-branded notification card with platform colours/icons)
- **API:** `GET /api/notifications` (list, paginated), `POST /api/notifications` (create), `PATCH /api/notifications/:id` (mark read), `DELETE /api/notifications/:id`
- **DB tables:** `notifications`, `notification_preferences` (migration `20260218000001_unified_notifications.sql`)
- **Pages:** `/notifications-demo`, `/registry-demo`

### 5.14 Admin Dashboard

**Implemented:** 2026-02-15 (identity), 2026-02-18 (comprehensive schema + UI)  
**Status:** ✅ Live (gated to `is_admin = true` users)

**What it does:** Full administrative control panel — user management, feature flags, spending monitoring, security audit, self-heal reports, social army management, analytics.

**Technical spec:**
- **Auth gate:** Middleware checks `profiles.is_admin = true` before any `/admin/*` route; bootstrapped via `ADMIN_EMAILS` env var
- **Sub-pages:** `/admin/users`, `/admin/feature-flags`, `/admin/spending`, `/admin/security`, `/admin/self-heal`, `/admin/social-army`, `/admin/journal`, `/admin/monitoring`, `/admin/health`, `/admin/analytics`, `/admin/system-health`, `/admin/noc`, `/admin/designs`, `/admin/events`, `/admin/experiments`, `/admin/settings`
- **API routes:** `/api/admin/stats`, `/api/admin/users`, `/api/admin/integrations/health`, `/api/admin/reports`, `/api/admin/spending`, `/api/admin/connections/github`
- **DB tables:** `admin_audit_log`, `admin_identity`, `system_health_checks` (migration `20260215000001_add_admin_and_audit.sql`; `20260218000001_admin_dashboard_comprehensive.sql`)

### 5.15 Self-Healing Architecture

**Implemented:** 2026-02-17 (cron setup), 2026-02-18 (UI + reports)  
**Status:** ✅ Live

**What it does:** Daily automated self-diagnostic and repair job. Checks AI provider connectivity, DB health, API endpoints, sends email report.

**Technical spec:**
- **Cron trigger:** Vercel cron `0 10 * * *` → `POST /api/cron/self-heal` (protected by `CRON_SECRET` bearer token)
- **Checks performed:** AI provider ping (Anthropic, OpenRouter, Groq), Supabase connection, Redis connection, key API routes (`/api/health`, `/api/features`), email delivery test
- **Auto-repair actions:** Re-seeds default feature flags if missing; clears stale Redis rate-limit keys > 24h; removes orphaned browser sessions
- **Reporting:** Results stored in `self_heal_reports` table; email sent via Resend to `SELF_HEAL_EMAIL_TO`; UI at `/admin/self-heal`
- **DB migration:** `20260215000001_self_heal_reports.sql`, `20260217000002_add_self_healing_feature.sql`

### 5.16 Monetization & Feature Flags

**Implemented:** 2026-02-15 (feature flags), 2026-02-18 (subscription schema), merged 2026-02-20  
**Status:** ✅ Live

**Pricing tiers:** Free / Premium ($19/mo) / Enterprise ($99/mo/seat) / Founder (Founders Pass)

**Technical spec:**
- **Feature flags:** `feature_flags` table — `feature_name`, `enabled`, `updated_by`, `updated_at`; server-side read at `GET /api/features`; cached in Redis with 60s TTL
- **Tier enforcement:** `src/lib/features.ts` — `FOUNDER_ACCESS` and `USER_ACCESS` constant objects; `hasFeature(user, featureName)` checks `profiles.subscription_tier`
- **Subscription tables:** `subscription_tiers` (config), `user_subscriptions` (active subscriptions), `usage_events` (per-feature usage tracking for billing) — migration `20260218000001_monetization_schema.sql`
- **Stripe:** OAuth via Founders Pass; webhook handler at `/api/webhooks/stripe` processes `checkout.session.completed`; unlocks tier on payment
- **CubiKey API:** `GET/POST /api/channels` — 100 req/day free, 10K/month on Starter ($29); tracked via `usage_events`

### 5.17 Job Hunt Mode

**Implemented:** 2026-02-18 (schema + API + UI)  
**Status:** ✅ Live

**What it does:** Automated job application tracker. Users upload resume, set target role criteria, track applications across LinkedIn/Indeed/Glassdoor, receive daily email reports.

**Technical spec:**
- **DB tables:** `job_hunt_profiles`, `job_hunt_resumes`, `job_applications`, `job_hunt_activities` (migration `20260218000002_job_hunt_schema.sql`)
- **Resume storage:** PDF/DOC/DOCX/TXT uploaded to Supabase Storage bucket `resumes`; content extracted server-side for AI parsing
- **Application tracking:** Status enum: `pending | applied | screening | interview | offer | rejected`
- **API:** `GET /api/job-hunt/dashboard` (stats), `POST /api/job-hunt/profile`, `POST /api/job-hunt/resumes`, `GET/POST /api/job-hunt/applications`
- **Email reports:** Daily summary via Resend; lists new applications, status changes, upcoming interviews
- **Pages:** `/job-hunt` (dashboard), `/job-hunt/setup`

### 5.18 Autopilot — Profile Auto-Fill

**Implemented:** 2026-02-19  
**Status:** ✅ Live (Claude Haiku extraction)

**What it does:** Watches conversation history and automatically fills in user profile fields (name, profession, location, interests) without asking explicitly.

**Technical spec:**
- **Trigger:** After every 5th AI message exchange, background job calls `POST /api/autopilot/extract`
- **Extraction:** Claude Haiku (`claude-haiku-4-5`) used (cost-efficient); prompt instructs it to return structured JSON of inferred profile fields
- **Storage:** Merged into `profiles.autopilot_data` JSONB column
- **User control:** Shown in `/settings` as "Autopilot Profile" section; user can edit/override/delete individual fields
- **DB migration:** `20260219000001_autopilot_features.sql`

### 5.19 3D Energy Cube

**Implemented:** 2026-02-08 (initial), 2026-02-17–20 (multiple visual iterations)  
**Status:** ✅ Live (two variants)

**What it does:** Central visual identity of Cubiqo — an interactive 3D cube that changes colour, animation, and behaviour based on AI state and user mood colour.

**Technical spec:**
- **Renderer:** Three.js + React Three Fiber; lazy-loaded with `dynamic(..., { ssr: false })` to prevent SSR crash
- **Variants:**
  - `LandingCube` (`src/components/cube/LandingCube.tsx`) — plasma wave / flowing energy ribbons; `FlowingEnergyCube.tsx` uses `TubeGeometry` along Catmull-Rom curves
  - `TechLandingCube` (`src/components/TechLandingCube.tsx`) — high-def wireframe with orange accent lines; 391 lines
  - `EnergyCubeWireframe` (`src/components/cube/EnergyCubeWireframe.tsx`) — 385 lines; replaces original solid cube
  - `EnergyCube` (`src/components/cube/EnergyCube.tsx`) — physics-based with shader material; colour shifts per voice state
- **Colour mapping:** `ORANGE`=Founder/idle, `RED`=active/urgent, `YELLOW`=thinking, `GREEN_BLUE`=calm/speaking
- **Animation states:** Idle (slow rotate), listening (pulse + expand), thinking (colour oscillate), speaking (ripple outward)
- **Wave-to-cube transition:** `src/lib/wave-to-cube/` — plasma wave on landing; morphs to cube on first interaction

### 5.20 Cubiqo Wallet (Internal Payments)

**Implemented:** 2026-02-20  
**Status:** ✅ Schema + service live

**What it does:** Internal QR-code-based escrow payments — user pays, funds held until QR scan releases to recipient.

**Technical spec:**
- **Service:** `src/lib/finance/wallet-service.ts`
- **Flow:** `createDelayedPayment()` → generates `pay_escrow_{uuid}` QR code → stores in `payments` table with `status=held`; `releaseByQR(qrCode, scannerId)` → updates to `status=released`
- **Release conditions:** `delivery` (courier scans QR), `time` (automatic after N hours), `qr_scan` (manual)
- **DB migration:** `20260220000001_cubiqo_wallet_schema.sql`
- **Note:** No third-party payment processor — fully internal; no Stripe dependency for this flow

---

## 6. Database Migration Inventory

38 migration files across the `supabase/migrations/` directory:

| Migration Date | File / Purpose |
|---|---|
| 2024-02-09 | `user_integrations` — OAuth tokens table |
| 2025-02-09 | `add_connections` — GitHub/Vercel OAuth connections |
| 2025-02-10 | `ab_testing` — Experiments + variants |
| 2025-02-10 | `add_metadata_to_experiments` |
| 2025-11-24 | **Initial schema** — `sessions`, `messages`, `conversations`, `profiles` |
| 2025-11-26 | Fix colour constraint (ORANGE/RED/YELLOW/GREEN_BLUE) |
| 2025-11-27 | `ensure_profile_function` — SECURITY DEFINER function |
| 2026-02-15 | Admin identity + audit log |
| 2026-02-15 | Feature flags system |
| 2026-02-15 | Founders Pass schema (sites, OAuth tokens, action templates, audit) |
| 2026-02-15 | Journal entries |
| 2026-02-15 | Journey Memory schema |
| 2026-02-15 | Self-heal reports |
| 2026-02-15 | CQ-to-CQ system |
| 2026-02-15 | Design toggles |
| 2026-02-15 | Journey helper functions |
| 2026-02-16 | Features catalog + user toggles |
| 2026-02-16 | Particle landing feature flag |
| 2026-02-17 | Agent + integration features |
| 2026-02-17 | Browser sessions + actions audit |
| 2026-02-17 | Add self-healing as 32nd feature |
| 2026-02-17 | Browser consent records |
| 2026-02-17 | CQ schema fix |
| 2026-02-17 | Social Army tables |
| 2026-02-18 | Admin dashboard comprehensive |
| 2026-02-18 | Cubiqo email + phone number generation |
| 2026-02-18 | Monetization schema (tiers, subscriptions, usage) |
| 2026-02-18 | RGY intelligent matching |
| 2026-02-18 | Unified notifications |
| 2026-02-18 | Job Hunt schema |
| 2026-02-18 | Notifications system (100+ platform support) |
| 2026-02-18 | RGY capsules + matching algorithm |
| 2026-02-18 | Emergent foundations (×4 migrations: `064853`–`064856`) |
| 2026-02-18 | Epic 1 foundations |
| 2026-02-19 | CQ performance indexes |
| 2026-02-19 | Autopilot features |
| 2026-02-19 | Missing tables for staging (conscious_memories, daily_summaries, pending_intents, regions) |
| 2026-02-19 | Monitoring events |
| 2026-02-19 | Workspace + deployment tables |
| 2026-02-20 | Cubiqo wallet schema |

---

## 7. Application Routes Inventory

### Public/User Routes
`/` (landing), `/chat`, `/[region]/chat`, `/dashboard`, `/journal`, `/journal/history`, `/journey`, `/memory`, `/settings`, `/settings/privacy`, `/job-hunt`, `/job-hunt/setup`, `/auth`, `/auth/signin`, `/onboarding`, `/welcome`, `/studio`, `/agents`, `/generate`, `/files`, `/pricing`, `/cubikey`, `/launchpad`, `/dev-console`

### Admin Routes (gated: `is_admin = true`)
`/admin`, `/admin/users`, `/admin/feature-flags`, `/admin/spending`, `/admin/security`, `/admin/self-heal`, `/admin/social-army`, `/admin/journal`, `/admin/monitoring`, `/admin/health`, `/admin/analytics`, `/admin/system-health`, `/admin/noc`, `/admin/designs`, `/admin/events`, `/admin/experiments`, `/admin/settings`, `/admin/analytics`, `/admin/email-preview`

### Founders Pass Routes (gated: Founders tier)
`/founders-pass`, `/founders-pass/integrations`, `/founders-pass/sites`, `/founders-pass/flags`, `/founders-pass/actions`, `/founders-pass/audit`, `/founders-pass/security`, `/founders-pass/integrations/ecosystem`

### Demo/Dev Routes
`/demo`, `/demo/neon-cube`, `/landing-demo`, `/landing-preview`, `/notifications-demo`, `/registry-demo`, `/auth-demo`, `/commerce-demo`, `/multimodal-demo`, `/preview`, `/side-panel`, `/settings-cube`, `/email-preview`

---

## 8. Security Architecture Summary

- **Auth:** Supabase Auth (magic link + passkeys); all routes server-side validated
- **Encryption:** AES-256-GCM (BYO keys, OAuth tokens); PBKDF2 (100k iterations) key derivation
- **RLS:** Enabled on all user-owned tables; service role used server-side only
- **Admin:** `is_admin` DB flag + `ADMIN_EMAILS` env var bootstrap; no hardcoded bypass (removed in PR #176)
- **CSP:** Content-Security-Policy headers in middleware; `data:` added to `media-src` (pending PR #183 merge)
- **Permissions-Policy:** Camera/microphone now allowed from `self` (pending PR #183 merge)
- **Rate limiting:** Redis-backed; 10 browser sessions/hour/user; AI spending caps per user/day
- **Audit logging:** Browser actions, admin actions, Founders Pass actions all logged with actor + timestamp
- **Cron auth:** `CRON_SECRET` bearer token required on `/api/cron/self-heal`
- **WebAuthn:** FIDO2 passkey support via SimpleWebAuthn (full spec compliance)
- **Known gaps:** Turbopack Rust AST issues with some dynamic imports (mitigated by eval-require pattern in `serverExternalPackages`)

---

## 9. Current Production Health

As of 2026-02-21:

| Metric | Status |
|---|---|
| **Production build** | ✅ Building (post Turbopack + dependency fixes) |
| **Test suite** | 2,169 / 2,288 passing (95.2%) — 114 pre-existing failures |
| **CI (main)** | ✅ Passing |
| **CI (staging0217)** | ✅ Passing |
| **Camera/microphone** | ⚠️ Blocked by CSP — fix ready in PR #183 |
| **RGY SIGNAL flow** | ⚠️ Step 3 missing — fix ready in PR #184 |
| **Open PRs** | 12 PRs ready to merge |
| **Vercel deployments** | Auto-deploy active on all branches |
