# CUBIQO — Master Techno-Functional Analysis
**Prepared:** 2026-02-21  
**Sources:** 688 source files, 38 DB migrations, 100 git commits, 12 open PRs, complete src/ inspection  
**Scope:** Answers to Questions A, B, C, D  

---

## PART 0 — ENVIRONMENT BASELINE

| Branch | Vercel Target | URL | Database |
|---|---|---|---|
| `main` | **Production** | `cubiqo.ai` / `www.cubiqo.ai` | `cubiqo-production` Supabase |
| `staging0217` | Staging Preview | `cubiqo-repo-git-staging0217-cubiqo-projects.vercel.app` | `cubiqo-staging` (`naoxezcmcauecawchgjk`) |
| `production` | **Misnomer — Preview only** | `cubiqo-repo-git-production-cubiqo-projects.vercel.app` | Preview env vars |

> ⚠️ **Critical Naming Confusion:** The branch called `production` is **NOT** prod. Real prod = `main` → `cubiqo.ai`.

---

## PART 1 — WHEN WAS EACH FEATURE IMPLEMENTED?

### Timeline of All Feature Implementations

| Feature | Staging Date | Main (Prod) Date | Techno-Functional Reason |
|---|---|---|---|
| **Core DB schema** (sessions, messages, profiles, conversations) | 2025-11-24 | 2025-11-24 | Initial bootstrap commit |
| **RGY Colour + Mood system** | 2026-02-15 | 2026-02-20 (mega-merge) | Colour-keyed AI routing + session state |
| **Auth (magic link + passkeys)** | 2026-02-15 | 2026-02-20 | Supabase Auth + SimpleWebAuthn FIDO2 |
| **Admin Identity + Audit Log** | 2026-02-15 | 2026-02-20 | `is_admin` flag, ADMIN_EMAILS env bootstrap |
| **Feature Flags system** | 2026-02-15 | 2026-02-20 | Redis-cached DB flags, `GET /api/features` |
| **Founders Pass (core)** | 2026-02-15 | 2026-02-20 | AES-256-GCM OAuth token store, white-label |
| **Daily Journal (Rozana)** | 2026-02-15 | 2026-02-20 | 1x/day entry, AI mood analysis, Resend email |
| **Journey Memory System** | 2026-02-15 | 2026-02-20 | Persistent `conscious_memories` table, PBKDF2 |
| **Self-Heal Architecture** | 2026-02-15 + 02-17 | 2026-02-20 | Vercel cron daily, Resend report email |
| **CQ-to-CQ Messaging + Calls** | 2026-02-15 (schema), 02-17 (fix) | 2026-02-20 | WebRTC P2P, Supabase Realtime, STUN |
| **Design Toggles** | 2026-02-15 | 2026-02-20 | Feature-flag-controlled UI variants |
| **BYO Mode (Bring Your Own Key)** | 2026-02-17 | 2026-02-20 | AES-256-GCM encrypted key storage |
| **Browser Automation (Verbal Commands)** | 2026-02-17 | 2026-02-20 | Puppeteer service modules per platform |
| **Social Army Worker** | 2026-02-17 (schema), 02-20 (worker) | 2026-02-20 | Railway Puppeteer worker, content queue |
| **Admin Dashboard (comprehensive)** | 2026-02-18 | 2026-02-20 | 18 admin sub-pages, API routes, `system_health_checks` |
| **Founders Pass OAuth Ecosystem** | 2026-02-18 | 2026-02-20 | Shopify/Stripe/Printify/Gmail OAuth tokens |
| **Unified Notifications** | 2026-02-18 | 2026-02-20 | 27-platform registry, Supabase Realtime bell |
| **Job Hunt Mode** | 2026-02-18 | 2026-02-20 | Resume storage, application tracker, email reports |
| **Emergent Studio (AI App Factory)** | 2026-02-18 (4 migrations) | 2026-02-20 | Docker sandbox, WorldOrchestrator, 4 sub-agents |
| **Monetization + Subscription tiers** | 2026-02-18 | 2026-02-20 | `subscription_tiers`, `user_subscriptions`, Stripe webhook |
| **RGY Chat Rooms + Matching** | 2026-02-18 | 2026-02-20 | Capsule format, geofence matching engine |
| **Cubiqo Communication Fields** (email/phone gen) | 2026-02-18 | 2026-02-20 | CQ number auto-gen on `profiles` |
| **Autopilot — Profile Auto-Fill** | 2026-02-19 | 2026-02-20 | Claude Haiku extraction, every 5th exchange |
| **Monitoring Events** | 2026-02-19 | 2026-02-20 | `monitoring_events` table, `/api/monitoring` |
| **CQ Performance Indexes** | 2026-02-19 | 2026-02-20 | Composite indexes for sub-100ms lookups |
| **Cubiqo Wallet (QR Escrow)** | 2026-02-20 | 2026-02-20 | Internal QR escrow, no Stripe |
| **Landing Page Branding Bars** | 2026-02-20 | `staging0217` only (PR #178 pending) | Animated marquee + integration logo bar |
| **3D Energy Cube variants** | 2026-02-08 → 02-20 | 2026-02-20 | Three.js/R3F, SSR-safe dynamic import |
| **Audio Engine + Music Gen** | 2026-02-20 | 2026-02-20 | `audio-score-service.ts`, Suno/Udio (not yet wired) |
| **PR #183 — CSP/Camera Fix** | 2026-02-21 | **PENDING MERGE** | `Permissions-Policy` header fix |
| **PR #184 — RGY Step 3 Fix** | 2026-02-21 | **PENDING MERGE** | `RoomView` render path was missing |

**Techno-Functional reasons for the staged implementation:**
- **Why staging first:** 65+ PRs were merged into `staging0217` between Feb 15–20, validated via Vitest (95%+ pass rate), then merged to `main` in a single mega-merge on 2026-02-20
- **Why sprint batches:** Each "day" of Sprint 1 (Feb 15, 17, 18, 19) had a specific vertical — Auth/Identity first, then Browser/Social, then Monetization/Studio, then Performance
- **Why not to main directly:** The team used `staging0217` as the stabilization branch to avoid deploying broken builds to `cubiqo.ai`

---

## PART 2 — A: UI COMPONENT MAP (Feature → Component → Status)

### LEGEND
- ✅ **Full E2E** = UI + API + DB all wired, working in prod  
- 🟡 **UI Only** = Page/component exists but API stub or TODO inside  
- 🔴 **Dead/Broken** = Route exists, code present, but non-functional  
- 🔵 **Demo/Dev only** = Preview/demo route, not linked in user nav  

---

### FULLY E2E FUNCTIONAL (UI + API + DB + Prod)

| Feature | UI Component/Page | API Endpoint | DB Table | Status |
|---|---|---|---|---|
| **Chat (Core AI)** | `FullscreenApp.tsx` → chat panel | `POST /api/chat` | `sessions`, `messages` | ✅ Full E2E |
| **Auth — Magic Link** | `/auth` → `LoginForm.tsx` → `BiometricLogin.tsx` | `/auth/callback/route.ts` | `profiles` | ✅ Full E2E |
| **Auth — Passkeys (WebAuthn)** | `BiometricLogin.tsx`, `BiometricRegistration.tsx` | `/api/auth/webauthn/*` | `webauthn_credentials` | ✅ Full E2E |
| **Daily Journal** | `/journal` → `JournalEntryForm` (within FullscreenApp) | `GET/POST /api/journal/entries` | `journal_entries` | ✅ Full E2E |
| **Journal History** | `/journal/history` | `GET /api/journal/entries?page=&limit=` | `journal_entries` | ✅ Full E2E |
| **Feature Flags** | `/founders-pass/flags` (FeatureToggleList.tsx) | `GET /api/features`, `GET/POST /api/feature-flags` | `feature_flags` | ✅ Full E2E |
| **Founders Pass Dashboard** | `/founders-pass` (full dashboard page) | `/api/founders-pass/flags`, `/sites`, `/audit` | `founders_sites`, `feature_flags`, `founders_pass_audit_log` | ✅ Full E2E |
| **Admin Dashboard** | `/admin` and 18 sub-pages | `/api/admin/stats`, `/users`, `/spending`, etc. | `admin_audit_log`, `system_health_checks` | ✅ Full E2E (gated: is_admin) |
| **BYO Mode** | `BYOSettings.tsx` in settings panel | `POST/DELETE /api/byo`, `POST /api/byo/test` | `profiles.byo_config` (AES-256) | ✅ Full E2E |
| **Voice (STT via Groq Whisper)** | `VoiceStateIndicator.tsx`, audio button in chat | `/api/multimodal/whisper` | — (stateless) | ✅ Full E2E |
| **Voice (TTS via ElevenLabs)** | `useElevenLabsTTS` hook + cube animator | `/api/tts` | — (stateless) | ✅ Full E2E (camera/mic blocked until PR #183) |
| **RGY Colour System** | `RGYColorSelector.tsx`, cube colour change | `/api/rgy/capsules`, `/signal` | `rgy_capsules`, `sessions.color_state` | ✅ Full E2E |
| **RGY Chat Rooms** | `RGYChatsModal.tsx`, `RGYRoomView.tsx` | `/api/rgy/rooms`, `/match` | `rgy_rooms`, `rgy_matches` | ✅ Full E2E (PR #184 fixes Step 3) |
| **Unified Notifications** | `NotificationCenter.tsx`, `BrandedActionCard.tsx` | `GET/PATCH/DELETE /api/notifications` | `notifications`, `notification_preferences` | ✅ Full E2E |
| **Journey Memory** | `/journey`, `/memory` pages | `/api/extract-memories`, `/api/journey/*` | `conscious_memories` | ✅ Full E2E |
| **Job Hunt Mode** | `/job-hunt`, `/job-hunt/setup` | `/api/job-hunt/dashboard`, `/applications`, `/resumes` | `job_hunt_profiles`, `job_applications` | ✅ Full E2E |
| **Social Army Queue** | `/admin/social-army` | Content queue poller (Railway worker) | `content_queue` | ✅ Full E2E (Railway-deployed) |
| **Self-Heal** | `/admin/self-heal` | `POST /api/cron/self-heal` | `self_heal_reports` | ✅ Full E2E (Vercel cron daily) |
| **Autopilot Profile Fill** | `/settings` → Autopilot section | `POST /api/autopilot/extract` | `profiles.autopilot_data` | ✅ Full E2E |
| **3D Energy Cube** | `LandingCube.tsx`, `TechLandingCube.tsx`, `EnergyCube.tsx` | — (client-only, Three.js) | — | ✅ UI Only (but intentional) |
| **Monitoring** | `/admin/monitoring` | `POST /api/monitoring/events` | `monitoring_events` | ✅ Full E2E |

---

### UI EXISTS BUT PARTIALLY WIRED / STUB INSIDE

| Feature | UI Component/Page | What's Missing | Status |
|---|---|---|---|
| **Onboarding Flow** | `/onboarding` → `OnboardingFlow.tsx` | OAuth "Connect" buttons show `alert()` — stub only. Config saved to `localStorage` only, never persisted to DB or Supabase | 🟡 UI Only |
| **Emergent Studio — Deploy** | `/studio`, `/launchpad` | `/api/emergent/deploy` → `TODO: Implement Vercel deployment` | 🟡 UI + Schema, no deploy logic |
| **Emergent Studio — Terminal** | `/dev-console` | `/api/emergent/terminal` → `TODO: Implement command execution` | 🟡 UI + Schema, no execution |
| **Emergent Studio — Files** | `/files` | `/api/emergent/files` → `TODO: Read/Write file from workspace container` | 🟡 UI exists, container I/O not wired |
| **Emergent Studio — Image Agent** | Part of studio flow | `image-agent.ts` → `TODO: Implement actual image generation` | 🟡 Agent scaffolding only |
| **Emergent Studio — Testing Agent** | Part of studio flow | `testing-agent.ts` → `TODO: Implement actual test execution` | 🟡 Agent scaffolding only |
| **Browser Pool / Queue (Verbal Cmds)** | `HandshakeWizard.tsx` | `BrowserPool.ts` → TODO: Launch actual browser instance; `BrowserQueue.ts` → TODO Execute actions | 🟡 Schema + queue exists, Puppeteer launch logic is stubs |
| **Verbal Commands (all services)** | `HandshakeWizard.tsx` | Puppeteer drivers written but `BrowserPool` never actually launches browsers in Vercel | 🟡 Service files complete, runtime environment not wired |
| **Audio Score / Music Gen** | `/studio` ambient music | `audio-score-service.ts` + `/api/audio/generate-music` — Suno/Udio API not connected | 🟡 Service + UI present, API NOT wired |
| **Cubiqo Wallet** | Not yet linked in nav | `wallet-service.ts` complete, no UI page in `src/app/` | 🟡 Backend only, no UI route |
| **RGY Discovery / Opportunity** | `OpportunityFeed.tsx` | `discovery-service.ts` → TODO: Implement notification & AI-powered opportunity generation | 🟡 Component exists, AI logic unimplemented |
| **CQ-to-CQ Video Calls** | Within CQ chat | WebRTC wired, but camera blocked by CSP until PR #183 merges | 🟡 Code complete, header bug blocking it |
| **Telegram Agent Integration** | `/api/monitoring` | `telegram.ts` → TODO: Connect to Agent Engine | 🟡 Telegram receive logic written, agent routing missing |
| **Dashboard Journal Count** | `/dashboard` | `journalEntriesCount: 0 // TODO: Fetch from journal_entries table` | 🟡 Hard-coded zero |
| **Job Hunt Email Reports** | Scheduled email | `job-hunt/reports/route.ts` → TODO: Send email using Resend | 🟡 Logic present, email call missing |

---

### DEAD CODE / DUPLICATE / SHOULD BE DELETED

*(See Part D below for full analysis)*

---

## PART 2 — B: FULL AUTH FLOW vs BROWSER AUTOMATION

### Real Auth (Supabase — Full User Flow ✅)

The **real authentication** uses Supabase Auth and is **fully end-to-end**:

```
User visits /auth
  → LoginForm.tsx (email input)
  → useAuth() hook → supabase.auth.signInWithOtp(email)
  → Supabase calls Resend to send magic link email
  → User clicks link → /auth/callback/route.ts
  → exchangeCodeForSession(code)
  → Profile created in `profiles` table if new user
  → Redirect to /chat
```

**What is wired in prod:**
- ✅ `LoginForm.tsx` — real Supabase `signInWithOtp` call
- ✅ `/auth/callback/route.ts` — real token exchange
- ✅ `MagicLinkButtons.tsx` — Gmail/Outlook deep links shown post-send
- ✅ `BiometricLogin.tsx` / `BiometricRegistration.tsx` — real FIDO2/WebAuthn via SimpleWebAuthn
- ✅ `AuthNudgeModal.tsx` — nudges guest users to sign in (triggered by chat AI)
- ✅ Session middleware validates every `/api/admin/*` route via Supabase JWT
- ✅ RLS on all DB tables — authenticated users can only see their own data

**What is NOT real auth (automation disguised as auth):**

| Pattern | Where | Risk |
|---|---|---|
| **Hardcoded PIN `'2026'`** | `/founderspass/page.tsx` line 13 | 🔴 CRITICAL SECURITY — Anyone who finds `/founderspass` URL gets admin access |
| **SessionStorage-only auth** | `/founderspass/page.tsx` — stores `founders_pass_auth: 'true'` in `sessionStorage` | 🔴 Zero server-side validation — bypassed in any new tab |
| **`/rescue` emergency bypass** | `/rescue/page.tsx` — same PIN, same sessionStorage trick | 🔴 Emergency bypass publicly accessible |
| **Dev bypass button in LoginForm** | `LoginForm.tsx` line 149–161 — hidden in dev env only | ✅ Safe (NODE_ENV guard), but watch prod builds |
| **Onboarding OAuth "Connect"** | `OnboardingFlow.tsx` line 57–67 — fires `alert()` | 🟡 Stub — no OAuth flow, no token exchange |

### Browser Automation (Puppeteer — Verbal Commands)

The verbal commands system (Uber, WhatsApp, Spotify, Gmail, etc.) uses **Puppeteer browser automation** — NOT OAuth:

```
User says "Order me an Uber to [address]"
  → command-parser.ts classifies intent
  → command-router.ts dispatches to uber-service.ts
  → uber-service.ts creates Puppeteer session via BrowserPool
  → Puppeteer logs in to Uber website with user credentials
  → Performs action on user's behalf
```

**Current state of Browser Automation:**
- ✅ **Schema complete** — `browser_sessions`, `browser_actions`, `browser_consent_records` tables exist
- ✅ **Service modules all written** — 12 platform drivers (`uber-service.ts`, `gmail-service.ts`, etc.)
- ✅ **Consent manager** — per-platform explicit consent required before first use
- 🔴 **`BrowserPool.ts` and `BrowserQueue.ts` are STUBS** — the actual Puppeteer launch code has `TODO` comments and no implementation
- 🔴 **Vercel serverless constraint** — Puppeteer cannot run persistent browser sessions on Vercel; this requires a Railway/dedicated worker (same as Social Army uses)
- 🟡 **Social Army** IS working via Railway Puppeteer worker — this proves the model works, but verbal commands haven't been ported to that architecture

---

## PART 2 — C: ONBOARDING FLOW — CURRENT STATE

### What Exists

| Component | File | Route |
|---|---|---|
| Onboarding page | `src/app/onboarding/page.tsx` | `/onboarding` |
| Onboarding component | `src/components/OnboardingFlow.tsx` | (rendered by above) |

### What the Onboarding Flow Actually Does Today (3 steps)

**Step 1 — Feature Toggles:**
- Shows toggle UI for: AI Agents, Voice Mode, Code Execution, File Management, Memory & Context, CubiQo Autopilot
- Toggle state stored in React `useState` only — NOT saved to DB or `profiles` table

**Step 2 — Connect Accounts:**
- Shows GitHub, Google, Slack "Connect" buttons
- `handleOAuthConnect` fires `alert()` with a message about what OAuth would do
- **No real OAuth flow initiated** — this is a UI stub

**Step 3 — Confirmation:**
- Shows a summary of what was enabled
- "Get Started" calls `onComplete(config)` which saves to `localStorage` only

### What `/onboarding/page.tsx` Does on Completion:
```javascript
localStorage.setItem('cubiqo-onboarding', JSON.stringify({
  completed: true,
  timestamp: ...,
  config,   // ← the feature toggles the user chose
}))
router.push('/')
```

### Critical Gaps in Onboarding:
1. **No database persistence** — onboarding preferences lost if user clears localStorage or switches devices
2. **No server-side effect** — feature toggles chosen in onboarding don't update `profiles.feature_preferences` or any DB column
3. **No trigger from `/auth/callback`** — new users land at `/chat`, NOT `/onboarding`. The callback route redirects to `next ?? '/chat'` — there's no "new user → onboarding" redirect logic
4. **OAuth stubs** — GitHub/Google/Slack connections in Step 2 are purely decorative
5. **Not linked from navigation** — the `/onboarding` route exists but no nav item, CTA, or post-signup redirect points to it
6. **Duplicate "welcome" flow** — `/welcome` renders the `LandingPage` component with an `onComplete` → redirect `/`, which overlaps function with onboarding

### Recommendation:
The onboarding flow is UI-complete for Step 1 (toggles look correct) but is functionally broken — it has no real effect on the user's experience because nothing is persisted anywhere the server can read.

---

## PART 2 — D: DEAD CODE — WHAT TO DELETE OR CONSOLIDATE

### 🔴 CATEGORY 1 — Duplicate Route Directories (Same feature, multiple paths)

| Routes | Files | Issue | Action |
|---|---|---|---|
| `/founders-pass/*` AND `/founderspass/*` AND `/founderpass` AND `/founders` | `src/app/founders-pass/`, `src/app/founderspass/`, `src/app/founderpass/`, `src/app/founders/` | Four different paths for the same feature. `/founderpass` and `/founders` are redirects to `/founderspass`. `/founders-pass` is the full real dashboard. `/founderspass` is the legacy PIN-auth version. | **Delete:** `/founderpass`, `/founders`, `/founderspass/* (PIN version)`. Keep `/founders-pass/*` only. Fix the PIN auth issue first. |
| `/founders-dashboard` | `src/app/founders-dashboard/page.tsx` | Generic "Founders Dashboard" that shows DashboardStats and hardcoded experiment names — separate from both founders-pass implementations | **Delete** — functionality absorbed by `/founders-pass` |
| `/api/founders-pass/*` AND `/api/founderspass/*` | Both present in `src/app/api/` | Duplicate API subdirectories for same feature | Consolidate to `/api/founders-pass/*` only |
| `src/components/founders-pass/` AND `src/components/founderspass/` | Both component directories exist | Same duplication | Consolidate |

### 🔴 CATEGORY 2 — Security Risk (Delete or Secure)

| File | Line | Issue | Action |
|---|---|---|---|
| `src/app/founderspass/page.tsx` | 13 | `const FOUNDER_PIN = '2026'` — hardcoded PIN in client-side code. Anyone who reads the source can auth. | **DELETE this file** — replace entire `/founderspass` with a redirect to `/founders-pass` which uses real Supabase auth |
| `src/app/rescue/page.tsx` | 10 | `const rescuePin = process.env.NEXT_PUBLIC_RESCUE_PIN || '2026'` — publicly accessible emergency bypass with fallback to same hardcoded PIN | **DELETE** — emergency access should be server-side only, not a public URL |
| `src/middleware.ts` | 11 | Two `import { NextResponse }` statements — duplicate import causes compile error | Already caught by build tools, but clean up |

### 🟡 CATEGORY 3 — Disabled / .disabled Files

| File | Issue | Action |
|---|---|---|
| `src/app/agent-portal/page.tsx.disabled` | Feature disabled but not deleted — pollutes directory | **Delete** — functionality exists at `/agents` now |
| `src/components/AgentActivityCube.tsx.backup` | .backup file committed to git | **Delete** — use git history instead |

### 🟡 CATEGORY 4 — Demo/Preview Routes (Not in User Journey)

These routes exist for internal demos but are accessible to any user with the URL. They add noise to the route tree:

| Route | File | What it is | Action |
|---|---|---|---|
| `/auth-demo` | `src/app/auth-demo/` | Auth flow UI demo | **Delete or gate to admin** |
| `/commerce-demo` | `src/app/commerce-demo/` | Commerce UI demo | **Delete or gate to admin** |
| `/multimodal-demo` | `src/app/multimodal-demo/` | Multimodal demo | **Delete or gate to admin** |
| `/notifications-demo` | `src/app/notifications-demo/` | Notifications demo | **Delete or gate to admin** |
| `/registry-demo` | `src/app/registry-demo/` | Integration registry demo | **Delete or gate to admin** |
| `/landing-demo` | `src/app/landing-demo/` | Landing page demo variant | **Delete or gate to admin** |
| `/landing-preview` | `src/app/landing-preview/` | Landing preview | **Delete or gate to admin** |
| `/hero-webgl-preview` | `src/app/hero-webgl-preview/` | 3D hero test | **Delete or gate to admin** |
| `/neon-cube-preview` | `src/app/neon-cube-preview/` | Neon cube test | **Delete or gate to admin** |
| `/previews` | `src/app/previews/` | Generic previews | **Delete or gate to admin** |
| `/side-panel` | `src/app/side-panel/` | Side panel demo | **Delete or gate to admin** |
| `/settings-cube` | `src/app/settings-cube/` | Settings cube demo | **Delete or gate to admin** |
| `/email-preview` | `src/app/email-preview/` | Email template preview | **Gate to admin** (useful for email QA) |

### 🟡 CATEGORY 5 — Features with TODO Stubs (Working UI but Dead Backend)

These have UIs that look functional but do nothing when clicked:

| Feature | File | TODO | Priority to Fix |
|---|---|---|---|
| **Emergent Studio Deploy** | `/api/emergent/deploy/route.ts` L28,76 | "TODO: Implement Vercel deployment" | 🔴 HIGH — it's the core Studio output |
| **Emergent Studio Terminal** | `/api/emergent/terminal/route.ts` L47 | "TODO: Implement command execution" | 🔴 HIGH |
| **Emergent Studio Files R/W** | `/api/emergent/files/route.ts` L29,64,99 | "TODO: Read/Write file from workspace container" | 🔴 HIGH |
| **Browser Automation Execution** | `BrowserPool.ts` L120,145,204; `BrowserQueue.ts` L188-191 | "TODO: Launch actual browser instance" | 🟡 MEDIUM — needs Railway worker |
| **Onboarding OAuth** | `OnboardingFlow.tsx` L57-67 | `alert()` fake flow | 🟡 MEDIUM |
| **BYO Key Test** | `byo-manager.ts` L201 | "TODO: Add actual API calls to test keys" | 🟡 MEDIUM |
| **Dashboard Journal Count** | `dashboard/page.tsx` L54 | `journalEntriesCount: 0 // TODO` | 🟢 LOW |
| **Job Hunt Email Reports** | `job-hunt/reports/route.ts` L182 | "TODO: Send email using Resend" | 🟡 MEDIUM |
| **Emergent Image Agent** | `image-agent.ts` L44 | "TODO: Implement actual image generation" | 🟡 MEDIUM |
| **RGY Opportunity Feed AI** | `discovery-service.ts` L333,347 | "TODO: Implement AI-powered opportunity generation" | 🟢 LOW |
| **Adaptive User Model Persistence** | `chat/route.ts` L55 | "TODO: Persist to Supabase for cross-instance durability" | 🟡 MEDIUM — currently in-memory, lost on restart |

### 🟡 CATEGORY 6 — Root-Level Document Overload

The repo root has **250+ markdown files** (`ARCHITECTURE.md`, `STAGING0217_*.md`, `IMPLEMENTATION_AUDIT.md`, etc.). This is documentation debt from the AI-assisted development process. While informative, it should be:
- Moved to `/docs/` directory
- Or archived in a separate `docs-archive/` branch

---

## SUMMARY SCORECARD

| Question | Answer |
|---|---|
| **How many features are fully E2E (UI + API + DB)?** | **21 features** fully end-to-end in production |
| **How many are UI-only (page exists, backend is stub)?** | **12 features** have UI but backends are TODOs |
| **How many dead/duplicate routes exist?** | **~20 demo routes** + **4 duplicate Founders-Pass paths** |
| **Is onboarding functional?** | **No** — UI only, no DB persist, no new-user redirect trigger |
| **Is real Supabase auth in place?** | **Yes** — magic link + passkeys, fully wired |
| **Is browser automation (verbal commands) working?** | **No** — schemas+services written, actual Puppeteer launch is a TODO stub |
| **What's the biggest security risk?** | Hardcoded PIN `'2026'` at `/founderspass` and `/rescue` accessible by any user |
| **What should be deleted first?** | `/founderspass/page.tsx`, `/rescue/page.tsx`, all 10+ demo routes, `.disabled` and `.backup` files |
