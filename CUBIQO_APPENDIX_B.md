# Cubiqo — Appendix B: Deep Dives on 15 Topics

**Author:** MO (CTO / Co-Founder)  
**Date:** 2026-02-22  
**Companion to:** `CUBIQO_MASTER_REPORT.md`  
**Basis:** Direct code inspection — every finding references an actual file path

---

> **Document Links (GitHub PR branch)**
>
> - **Master Report (Markdown):** `CUBIQO_MASTER_REPORT.md`
> - **Master Report (PDF):** `CUBIQO_MASTER_REPORT.pdf`
> - **Architecture — Current:** `CUBIQO_ARCHITECTURE_CURRENT.md`
> - **Architecture — Roadmap:** `CUBIQO_ARCHITECTURE_ROADMAP.md`
> - **Patent Opportunities:** `PATENT_OPPORTUNITIES.md`
> - **Patent Flow Diagrams:** `PATENT_FLOW_DIAGRAMS.md`
> - **This document:** `CUBIQO_APPENDIX_B.md`
>
> All files are in the `copilot/investigate-features-and-ui-components` branch.

---

## Topic 1 — Dashboard, Admin & Control Room Status

### All Admin / Dashboard Routes Found in Codebase

| Route | Page | Functional? | Notes |
|-------|------|-------------|-------|
| `/admin` | Admin dashboard | 🟡 Partial | Fetches live agent stats + usage data; spending caps display in-memory values |
| `/admin/analytics` | Analytics | 🟡 Partial | API exists; no funnel charts, only agent activity metrics |
| `/admin/users` | User management | 🟢 Working | Lists users, view sessions per user |
| `/admin/feature-flags` | Feature flags | 🟢 Working | DB-backed, % rollout, enable/disable |
| `/admin/social-army` | Social Army Console | 🟢 Working | Campaign progress, queue view, persona groups |
| `/admin/spending` | Spending limits | 🟡 Partial | Reads in-memory caps — shows wrong values after redeploy |
| `/admin/journal` | Journal admin | 🟢 Working | Admin view of journal entries |
| `/admin/journey` | Journey memory | 🟢 Working | Feature flag + metrics view |
| `/admin/monitoring` | Activity monitor | 🟢 Working | Real-time activity feed |
| `/admin/noc` | Network Ops Centre | 🟡 Partial | System health display |
| `/admin/security` | Security alerts | 🟢 Working | Failed logins, security alerts |
| `/admin/self-heal` | Self-heal logs | 🟢 Working | Automated health checks |
| `/admin/system-health` | System health | 🟢 Working | Database + services status |
| `/admin/experiments` | A/B experiments | 🟢 Working | Create/manage experiments |
| `/admin/gate` | Access gate | 🟡 Partial | UI exists, wiring unclear |
| `/admin/designs` | Design assets | 🟡 Partial | Preview system |
| `/admin/events` | Events log | 🟢 Working | Track analytics events |
| `/admin/settings` | Admin settings | 🟢 Working | Configuration |
| `/dashboard` | User dashboard | 🟡 Partial | Stats load from DB; TODO in code: `LAST_THREAT_SCAN = '2 hours ago'` is hard-coded |
| `/dashboard/analytics` | User analytics | ⚫ Stub | All metrics show `0` — no data wired |
| `/founders-dashboard` | Founders view | 🟡 Partial | Different from founderspass |
| `/founders-pass` | Founder portal | 🟢 Working | Actions, audit, flags, security, sites |
| `/founders-pass/integrations` | Ecosystem integrations | 🟢 Working | Integration health, list |
| `/founderspass/dashboard` | FoundersPass dashboard | 🟢 Working | Feature flag toggles, duo mode visible |
| `/founderspass/experiments` | A/B testing | 🟢 Working |
| `/agent-portal` | Agent portal | 🟡 Partial | Agent management UI |

### What Needs to Be Built for the "Control Room" to Be Complete

```
Priority 1 — Fix broken values (1 week):
  □ Spending caps page: move to Supabase so values survive redeploys
  □ Dashboard: replace hard-coded "2 hours ago" with real timestamp
  □ /dashboard/analytics: wire to actual analytics events (sign-up funnel)

Priority 2 — Heavy Analytics Work (3-4 weeks):
  □ User funnel chart: signup → first voice → journal → upgrade
  □ Retention cohort table: Day 1/7/30 by signup week
  □ Revenue dashboard: MRR, churn, LTV, new vs renewing
  □ Voice usage heatmap: which hours users are most active
  □ Journal streak tracking: consecutive days + void detection
  □ RGY matching analytics: matches made, rooms joined, connections formed
  □ Agent usage by type: which A1-A7 agents are used most
  □ Social Army campaign ROI: posts → clicks → signups

Priority 3 — CEO View (2 weeks):
  □ Single-page CEO summary: MRR, DAU, CAC, LTV, churn, NPS
  □ Real-time alerts: spending cap approaching, error spike, churn event
  □ Competitor traffic comparison panel (SimilarWeb API)
```

---

## Topic 2 — SEO & AI SEO Status

### What Exists in Code

| SEO Asset | File | Status | Quality |
|-----------|------|--------|---------|
| Canonical URL | `layout.tsx` | ✅ Set | `https://www.cubiqo.ai` |
| OG tags | `layout.tsx` | ✅ Set | Title, description, image |
| Twitter card | `layout.tsx` | ✅ Set | `summary_large_image` |
| JSON-LD: FAQPage | `layout.tsx` | ✅ Set | 6 Q&A pairs |
| JSON-LD: SoftwareApplication | `layout.tsx` | ✅ Set | Category, OS, description |
| JSON-LD: Organization | `layout.tsx` | ✅ Set | Name, URL, logo |
| sitemap.xml | `public/sitemap.xml` | ⚠️ Outdated | Only 3 URLs; dated 2025-02-04 |
| robots.txt | `public/robots.txt` | ✅ Good | Allows all crawlers + AI crawlers |
| AI crawler allowlist | `robots.txt` | ✅ Excellent | GPTBot, Claude-Web, PerplexityBot, Anthropic |
| llms.txt | Referenced in robots.txt | ❌ Missing | File doesn't exist yet |
| Page-level metadata | Most pages | ⚠️ Mixed | Some pages have it, many don't |
| Core Web Vitals | Unknown | ❓ Untested | Not measured |
| Sitemap coverage | 3 pages | ❌ Missing | Needs 20+ pages |

### What Needs to Be Done (SEO Roadmap)

```
Week 1 — Foundation (Technical SEO):
  □ Update sitemap.xml with all public pages:
    /  /pricing  /journal  /chat  /job-hunt
    /founders  /cubikey  /privacy  /terms
    /blog (once live)
  □ Create /public/llms.txt
    What LLMs should know about Cubiqo:
    - Product name and purpose
    - Key differentiators
    - API documentation summary
    - Pricing information
  □ Add page-level metadata to every page in src/app
  □ Add og:image to all product pages (use the 3D cube as visual)
  □ Measure Core Web Vitals via PageSpeed Insights

Week 2 — Content SEO:
  □ Create /blog with 3 seed articles:
    1. "Why BYO API keys are the future of private AI" (targets: private AI, BYO AI)
    2. "Voice-first productivity for solopreneurs" (targets: AI productivity, voice assistant)
    3. "RGY: How color signals change social matching" (targets: AI social, intent-based)
  □ Each article embeds the 3D cube demo as a hook
  □ Internal linking: blog → /chat → /pricing → /cubikey

Week 3 — AI SEO:
  □ Answer engine optimisation (AEO): structure FAQ answers as direct answers
    to queries like "best private AI assistant" and "AI productivity tool for freelancers"
  □ Submit to Perplexity, You.com, and SearchGPT via their partner programs
  □ Ensure llms.txt is comprehensive (product, pricing, features, API docs)
  □ Monitor Perplexity/ChatGPT citation tracking with a manual search query log

Ongoing:
  □ Publish 2 blog posts per week — target long-tail queries
  □ Monitor rankings: "BYO AI assistant", "voice AI for solopreneurs",
    "AI journal app", "private AI with own API key"
  □ Submit each new page to Google Search Console on publish
  □ Track AI citation rate: how often does Perplexity cite cubiqo.ai?
```

---

## Topic 3 — The WeChat Vision & Affiliate Strategy

### What "WeChat for AI" Means for Cubiqo

WeChat became a super-app by owning the user's daily life across: messaging, payments, mini-programs, social feed, and commerce — all within one UI. For Cubiqo, the equivalent is:

```
CUBIQO SUPER-APP VISION:
────────────────────────────────────────────────────────────────────
Layer 1: Voice + Chat (done ✅)
  → The "messaging" layer. The daily touch point.

Layer 2: Journal + Memory (done ✅)
  → The "diary" layer. Creates emotional lock-in.

Layer 3: RGY Matching (done ✅)
  → The "social" layer. Connects users to opportunities and people.

Layer 4: Social Army (done, needs gate ⚠️)
  → The "broadcast" layer. Users grow their audience from inside Cubiqo.

Layer 5: Job Hunt (done but no browser automation live 🟡)
  → The "commerce" layer. Real economic value delivered.

Layer 6: CubiKey (6-8 weeks to build ⚫)
  → The "mini-programs" layer. Third parties build on Cubiqo.

Layer 7: Emergent Platform (partially built 🟡)
  → The "app builder" layer. Users create new tools inside Cubiqo.

Layer 8: Integrations / Commerce (Shopify, Printify, Telegram ✅ wired)
  → The "payments & commerce" layer. Revenue flows through Cubiqo.
```

### Affiliate Strategy

```
TIER 1 — Referral Affiliates (launch day):
  □ Standard user referral: give $10 / get $10 off next month
  □ Tracked via referral_code column (needs to be added to user_profiles)
  □ Attribution: utm_source=referral&ref={code} in all shared links

TIER 2 — Content Creator Affiliates ($1K MRR milestone):
  □ 20% recurring commission on referred Pro subscriptions
  □ Custom landing page: cubiqo.ai/{affiliate-slug}
  □ Dashboard: real-time earnings + conversion tracking
  □ Ideal affiliates: productivity YouTubers, AI newsletter writers, LinkedIn coaches

TIER 3 — Integration Partners (post $5K MRR):
  □ Shopify app store listing: users connect their Shopify store to Cubiqo agents
  □ Printify partnership: Social Army designs → Printify products automatically
  □ LinkedIn Premium affiliate link: job hunt users who upgrade via Cubiqo link
  □ Revenue share: 10-15% of transaction value for commerce integrations

TIER 4 — CubiKey Ecosystem Affiliates (post $10K MRR):
  □ Developer affiliates: build a plugin that uses CubiKey API, earn 10% of that
    plugin's revenue
  □ Agency affiliates: agencies manage Commander accounts, earn 15% recurring
  □ This is the WeChat mini-program model applied to Cubiqo
```

---

## Topic 4 — Social Army: POC Status & 10×10×10 Assessment

### What Exists in Code (Confirmed by Test Suite)

```
CONFIRMED WORKING (test suite passes):
  ✅ 10 platforms configured: twitter, linkedin, instagram, tiktok, youtube,
     reddit, pinterest, threads, facebook, discord
  ✅ 10 accounts per platform (persona groups in admin console):
     The Builders (20), Productivity Gurus (30), Philosophers (15),
     Visual Artists (20), Memelords (15) → total 100 configured
  ✅ GFXToolz: processVideo(), createProject(), login() all tested
  ✅ Content queue: Supabase table "content_queue"
  ✅ Campaign progress: real percentage from DB (posted / target)
  ✅ Admin console: /admin/social-army — live campaign tracking
  ✅ Social campaigns table: "social_campaigns" in DB

WHAT 10-10-10 MEANS vs REALITY:
  10 platforms:  ✅ Configured in platforms.json
  10 accounts:   ✅ Persona groups defined (100 total across 5 types)
  10 min posts:  ⚠️ Queue exists; cron job at /api/cron/rgy-discovery exists
                    but no confirmed 10-minute scheduler configured on Vercel

WHAT IS BROKEN / MISSING:
  ❌ poster.ts posts directly (no human review gate in code)
  ❌ Browser session management for 10 simultaneous platform sessions unclear
  ❌ GFXToolz processVideo() mocked — real API key needed for production
  ❌ No video/photo from actual Cubiqo app being captured and posted
  ❌ LinkedIn: rate limit = 1 post/day per account; can't do 10-min intervals
  ❌ Instagram: no direct API for posting without Meta Business approval
  ❌ TikTok: no direct API posting; requires TikTok for Developers approval
```

### What Needs to Be Done to Reach 10×10×10

```
Phase 1 — Legal Safety (must do first):
  □ Add human review gate to poster.ts
    Before publish: route to admin queue, require approval click
  □ Add Social Army Terms consent screen for Commander-tier users
  □ Add per-platform rate limits that respect each platform's ToS:
    - Twitter: 50 posts/day per account (10-min interval = fine)
    - LinkedIn: 1 post/day per personal account; use company pages
    - Instagram: Use Meta Graph API (requires approval)
    - TikTok: Official API only (requires developer approval)
    - YouTube: Title/description posts via YouTube Data API v3
    - Reddit: 0.9 posts/min across subreddits

Phase 2 — Real Content (media pipeline):
  □ App screenshot automation: Puppeteer takes screenshots of actual Cubiqo UI
    → Watermarked → Added to content queue automatically
  □ GFXToolz: plug in real API key and test processVideo() end-to-end
  □ Video: short-form clip of plasma cube voice interaction
    → Auto-rendered → posted to TikTok/Reels/Shorts
  □ Content variety: 60% educational, 30% product demo, 10% meme/entertainment

Phase 3 — Scheduling (10-minute cycle):
  □ Vercel Cron: configure /api/cron content-post at */10 * * * *
    (Vercel Pro required for < 1 hour cron intervals; hobby plan = hourly minimum)
  □ Queue priority: round-robin across platforms to avoid burst
  □ Session persistence: store browser session cookies in Supabase,
    restore on next cycle (Playwright persistent contexts)

Phase 4 — Analytics:
  □ Track: impressions, clicks, profile visits, conversions per post
  □ A/B test content types weekly
  □ Automated report to admin console every Monday
```

---

## Topic 5 — Emergent Coding Platform Status

### What Actually Exists in Code

| Component | File | Status |
|-----------|------|--------|
| Projects API (create/list) | `/api/emergent/projects/` | ✅ Full CRUD with auth + validation |
| Workspaces API | `/api/emergent/workspaces/` | ✅ Working |
| Files API | `/api/emergent/files/` | ✅ Working |
| Terminal API | `/api/emergent/terminal/` | ✅ Working |
| Secrets management | `/api/emergent/secrets/` | ✅ Full CRUD + rotate |
| Deploy API | `/api/emergent/deploy/` | ✅ Vercel deploy wired |
| Analytics API | `/api/emergent/analytics/` | ✅ Working |
| Audit log API | `/api/emergent/audit/` | ✅ Working |
| Org management | `/api/emergent/orgs/` | ✅ With RBAC |
| Monaco Editor | `LiveCoderPane.tsx` | ✅ Working — TypeScript/JS/HTML/CSS |
| Sandbox preview | `LiveCoderPane.tsx` | ✅ CSP-sandboxed iframe |
| Security RBAC | `emergent/security/rbac.ts` | ✅ Role-based access control |
| Audit logger | `emergent/security/audit-logger.ts` | ✅ Working |
| Stacks supported | Schema | TypeScript, JavaScript, Python, Next.js, React, Vue, Svelte, Vanilla |

### Honest Assessment vs Replit / Vercel v0

```
WHAT EMERGENT DOES WELL:
  ✅ RBAC with organisations and permission levels
  ✅ Secrets management with rotation
  ✅ Audit logging on all operations
  ✅ Live Monaco editor with syntax highlighting
  ✅ Sandboxed preview (CSP-strict)
  ✅ Vercel deployment integration
  ✅ Project + workspace management

WHAT IS MISSING FOR PROFESSIONAL GRADE:
  ❌ No collaborative editing (multiple cursors / real-time sync)
  ❌ No git integration in the UI (commits, branches, PRs shown in editor)
  ❌ No package manager UI (npm install within the platform)
  ❌ No terminal output streaming (real-time build logs)
  ❌ No debugging tools (breakpoints, step-through)
  ❌ No template library (start from Next.js starter, not blank)
  ❌ No AI inline code completion (Copilot-style)
  ❌ No multi-file navigation sidebar visible
  ❌ Preview only handles vanilla JS — not full Next.js / React rendering
  ❌ No mobile preview mode
```

### What to Build to Make It Professional Grade

```
Sprint 1 (2-3 weeks) — Core editor UX:
  □ File sidebar: tree view, create/rename/delete files
  □ Terminal streaming: SSE-based real-time output (build logs, npm output)
  □ Template library: 5 starters (Next.js blank, React app, Landing page, API, Blog)
  □ AI code completion: tab-triggered inline Haiku/Deepseek completions

Sprint 2 (3-4 weeks) — Git integration:
  □ Connect to GitHub OAuth (already partially implemented in admin/connections)
  □ Show commits timeline in sidebar
  □ One-click "open PR" from Emergent to GitHub
  □ Auto-commit every save (like Replit)

Sprint 3 (2-3 weeks) — Full preview + deploy:
  □ Next.js preview: spin up a lightweight Next.js process per workspace
  □ Custom domain assignment for each deployed project (via Vercel API)
  □ Environment variable UI mapped to Vercel project env vars
  □ One-click deploy button → shows deploy status in real time
```

---

## Topic 6 — In-App Agents: Capabilities, Access & Gaps

### All 7 Agents (Confirmed in `src/lib/engine/router.ts`)

| ID | Name | Trigger Keywords | Capabilities | Access Path |
|----|------|-----------------|--------------|-------------|
| **A1** | Henry (Orchestrator) | Fallback / coordination | Multi-agent task orchestration, session memory, tool delegation | Default agent — active at all times |
| **A2** | Developer | code, dev, build, fix, bug, deploy, implement, refactor, debug | Code generation, file operations, terminal commands, code review | Say "write code" / "build" in chat |
| **A3** | Writer | write, document, content, blog, copy, article, draft | Long-form writing, SEO copywriting, email drafts, README | Say "write" / "draft" in chat |
| **A4** | Tester | test, qa, quality, verify, validation, regression, coverage | Test writing, bug reports, validation scripts | Say "test" / "QA" in chat |
| **A5** | Marketing | market, social, campaign, growth, promote, SEO, audience | Content calendars, social copy, campaign briefs, SEO articles | Say "marketing" / "campaign" in chat |
| **A6** | Animator | animate, visual, 3D, design, motion, graphic, render | Animation scripts, 3D prompts, visual concepts, design briefs | Say "animate" / "design" in chat |
| **A7** | Business | outreach, customer, sales, email, lead, CRM, contact | Sales emails, outreach templates, CRM data, business intelligence | Say "outreach" / "sales" in chat |

### Agent Capabilities in Detail

```
ALL AGENTS SHARE:
  ✅ Persistent session memory (conversation history stored)
  ✅ Tool registry access (filtered by user permissions)
  ✅ Auto-compaction when context window fills (saves tokens)
  ✅ SOUL.md personality file (agents/A1/SOUL.md etc.)
  ✅ Workspace isolation (each agent has its own file workspace)
  ✅ Multi-concurrent task support (A1: up to 2 parallel tasks)
  ✅ Spawn capability: A1 can spawn A2-A7 for subtasks
  ✅ Session compaction: auto-summarises old history

TOOLS AVAILABLE TO AGENTS (from tool registry):
  ✅ File read/write operations
  ✅ Code execution (sandboxed)
  ✅ Browser automation (Playwright via /api/browser/)
  ✅ Web search (via LLM router with search mode)
  ✅ Email send (via Resend integration)
  ✅ Calendar (if user connects Google Calendar)
  ✅ GitHub (if user connects GitHub)
  ✅ Slack, Discord, Telegram (if user connects)
```

### How Users Access Agents

```
Current access paths:
  1. /agents page — list all agents, start new session
  2. Chat: type a message containing trigger keywords → routes automatically
  3. /agent-portal — agent management UI
  4. Voice: speak trigger keywords → voice routes to correct agent

What needs to be built:
  □ Agent picker UI in chat: @henry, @dev, @writer inline mentions
  □ Agent card gallery: visual showcase of each agent's specialty
  □ Agent output preview: show A3's drafts in a document editor UI
  □ Agent workspace browser: see A2's files without leaving chat
  □ Agent collaboration: A2 writes code, A4 auto-tests it, A3 documents it
    (multi-agent pipeline initiated from single user request)
```

---

## Topic 7 — Duo Mode & Companion Mode

### What Exists in Code

```
DUO MODE (confirmed):
  File: src/components/chat/DuoModeToggle.tsx — UI component exists
  Feature flag: duo_mode in feature-gate-simple.ts
  Access: Founders only (FOUNDER_ACCESS.duo_mode = true, USER_ACCESS.duo_mode = false)
  Description: "Proactive AI interjections — AI interjects with health/safety/tone advice"
  UI: Toggle button in chat header with purple glow animation
  Backend: The autopilot profile extraction runs in background
    (/api/autopilot/tasks) while AI companion converses

COMPANION MODE (Sidekick):
  Feature flag: sidekick_mode — enabled for founders
  File: founderspass/dashboard page shows "Sidekick Companion" as feature
  Description: "AI companion mode"
  Backend: No dedicated sidekick route found — appears to be a variant of chat mode

COPE MODE:
  Feature flag: cope_mode — enabled for founders
  Description: Not documented in code, but exists as a feature gate
  Likely: Emotional support / mental health focused conversation mode

VOICE MODE:
  Feature flag: voice_mode — separate toggle
  Working: voice_mode is the ElevenLabs TTS + Whisper STT pipeline
```

### What Needs to Be Configured / Built

```
Duo Mode — what the proactive interjections should include:
  □ Health: "You've been talking for 45 minutes — take a breath"
  □ Safety: Crisis pattern detected (already in PolicyRouter) → proactive check-in
  □ Tone coaching: "That email sounds aggressive — want me to soften it?"
  □ Focus: "You've shifted topics 5 times — want to focus on one thing?"
  □ Finance: "You mentioned money stress 3 times this week — want to journal?"

Companion Mode — what makes it different from standard chat:
  □ Persistent persona: remembers user's name, preferred topics, past decisions
  □ Proactive memory: "Last week you said you wanted to learn Python — any progress?"
  □ Emotional check-in: opens sessions with "How's today going?"
  □ Voice-default: companion mode should default to voice, not text
  □ Daily greeting message: pushed at user's typical start time

What to build:
  □ Duo Mode: connect autopilot tasks to proactive interjection API route
    → Background task checks for health/focus/tone signals every N turns
    → Injects interjection into conversation as assistant message
  □ Companion Mode: separate system prompt that emphasises continuity + memory
  □ User settings panel: "Companion personality" slider (professional ↔ personal)
```

---

## Topic 8 — Job Hunt: Ideal User Flow vs Current Reality

### Ideal Complete User Flow

```
STEP 1 — INTAKE:
  User lands on /job-hunt → "Set up your profile"
  → Upload resume (PDF/DOCX) ✅ exists at /api/job-hunt/resume
  → Enter LinkedIn URL ✅ field exists in JobHuntProfile type
  → Select: target roles, locations, work type, salary range ✅ all in schema
  → Answer questionnaire (common application questions: "Are you authorized to work?")
    ✅ /api/job-hunt/questions exists

STEP 2 — AUTOMATED SEARCH:
  Cubiqo browser agent goes to:
  → LinkedIn Jobs ✅ (Playwright browser + credentials)
  → Indeed, Glassdoor, ZipRecruiter ✅ (platforms in JobPlatform type)
  → Company career pages (custom browser sessions) ✅ via browser-service.ts
  Filters jobs by profile preferences
  Scores each job for match (AI scoring against resume)
  Returns ranked list to user

STEP 3 — USER REVIEW:
  User sees feed of matched jobs with match score
  → "Apply automatically" checkbox per job
  → "Customise cover letter" option
  → "Add to watchlist" (manual review later)

STEP 4 — AUTOMATED APPLICATION:
  For each approved job:
  → Navigate to job URL via Playwright ✅
  → Fill application form fields from profile ✅ (credentials encrypted in DB)
  → Upload resume from profile ✅
  → Use stored questionnaire answers for common fields ✅
  → Submit → store application in job_applications table ✅

STEP 5 — TRACKING & ALERTS:
  User gets daily email report: applications submitted, responses received ✅
  Interview detected → alert sent ✅ (interview_alert report type exists)
  Status tracking: pending → applied → screening → interview → offer/rejected ✅

STEP 6 — INTERVIEW PREP:
  Not yet implemented — should be:
  → AI researches company from website + LinkedIn
  → Generates likely interview questions
  → Voice practice: Cubiqo asks questions, user answers, feedback given
```

### Current vs Ideal Reality

| Step | Ideal | Current Code | Gap |
|------|-------|-------------|-----|
| Resume upload | PDF/DOCX/TXT | ✅ Implemented | — |
| LinkedIn URL | Field exists | ✅ In schema | Not validated |
| Target roles/skills | Full form | ✅ Types defined | Setup UI at `/job-hunt/setup` |
| Questionnaire | Common questions | ✅ API exists | Q&A content not seeded |
| Job search (browser) | 6+ platforms | 🟡 Browser wired | Auto-search not scheduled |
| Job scoring | AI match score | ❌ Not implemented | Needs LLM scoring step |
| User review UI | Ranked feed | 🟡 Dashboard exists | Feed not built |
| Auto-apply | Browser fill/submit | 🟡 Playwright ready | Submit flow not fully built |
| Email alerts | Daily + interview | ✅ Report types exist | Email send not wired |
| Interview prep | Voice Q&A | ❌ Not started | Future feature |
| Application tracking | Full status flow | ✅ Types + API | Dashboard shows stats |

### What to Build to Complete Job Hunt

```
Week 1:
  □ Job search automation: schedule browser agent to search LinkedIn/Indeed
    using user's target roles + locations at configurable intervals
  □ Job scoring: LLM call to rate each job against resume (0-100 match score)
  □ Jobs feed UI: ranked list with match score, apply/skip buttons

Week 2:
  □ Auto-apply flow: complete the form-fill + submit sequence
  □ Wire daily email report via Resend
  □ Interview alert: detect "interview" in email subject → send notification

Week 3:
  □ Company research agent: before application, A7 researches company
    → cultural fit analysis → personalised cover letter
  □ Interview prep: A1 asks role-specific questions → user answers via voice
    → A1 gives feedback on content + communication
```

---

## Topic 9 — Daily Journal: Full User Flow & What's Pending

### Current Working Flow (Confirmed in Code)

```
Step 1: User goes to /journal
  → App checks: has user journaled in the last 24 hours?
    ✅ API: GET /api/journal?sessionId={id}&userId={uid}
    ✅ Response: { canJournal: true/false, nextAvailable: ISO timestamp }
  → If already journaled: shows "Come back tomorrow" gate with countdown
  → If can journal: shows "Begin today's session"

Step 2: Journaling flow (/components/journal/JournalFlow.tsx)
  ✅ 8 guided prompts, BigBoss confessional style:
    1. "How are you feeling right now? Really feeling?"
    2. "What happened today that actually mattered?"
    3. "How did that make you feel?"
    4. "What color is today — Green/Yellow/Red/Orange?"
    5. "What did you learn?"
    6. "What's one thing you want to accomplish tomorrow?"
    7. "Big picture — where are you heading in the next month?"
    8. "Anything else you need to get off your chest?"
  ✅ User types response to each prompt
  ✅ "Next" advances through prompts
  ✅ Final prompt saves to database

Step 3: Save & Summary
  ✅ POST /api/journal/entries — creates entry with:
    - session_id, user_id
    - all prompt responses
    - color_category (Green/Yellow/Red from prompt 4)
    - duration_seconds
  ✅ Email summary queued for user after completion
  ✅ Analytics event tracking

Step 4: History
  ✅ GET /api/journal/history — paginated, searchable
  🟡 /journal/history page exists but is NOT connected to API
  ✅ GET /api/journal/stats — streak, total entries, color distribution
  ✅ GET /api/journal/summary — AI-generated weekly summary
```

### What Is Pending for Full Journal Experience

```
Week 1 — Connect the UI:
  □ /journal/history page: wire to /api/journal/history
  □ Show streak counter: "🔥 7-day streak" in journal header
  □ Calendar heatmap: GitHub-style activity grid showing journal days
  □ Color distribution chart: what % of days were Green/Yellow/Red

Week 2 — Voice Journal:
  □ Voice mode in journal: user speaks responses → Whisper transcribes
  □ Cubiqo reads each prompt aloud via TTS before user responds
  □ Creates a 15-minute "audio therapy session" feel

Week 3 — Insights & AI:
  □ Weekly summary email: "This week you felt Yellow 4 times, Red 2 times..."
  □ Pattern detection: "You feel Red every Monday — notice that?"
  □ Connection to RGY: journal color auto-updates capsule (patent opportunity #3)
  □ Memory extraction: key facts from journal → added to Journey Memory

Week 4 — Social / Connection:
  □ RGY connection: if 3+ consecutive Red days → proactively suggest RGY match
    with someone in Green (who might be in a position to help)
  □ Crisis detection: if journal responses contain crisis patterns →
    immediately surface crisis resources + duo-mode check-in
```

---

## Topic 10 — RGY Keywords & 3 Intent Types: DB Status

### What Exists in Database (Confirmed)

```sql
-- rgy_capsules table (CONFIRMED in migration 20260218000200):
  color   TEXT: 'green' | 'yellow' | 'red'  ← COLOR CONFIRMED
  intent  TEXT: 'collaborate' | 'trade' | 'company'  ← 3 INTENTS CONFIRMED
  keywords JSONB[]  ← max 50 keywords, GIN indexed  ← KEYWORDS CONFIRMED

-- DB Constraint (semantically meaningful):
  yellow → intent MUST be NULL (open/neutral state)
  green  → intent MUST be 'collaborate' | 'trade' | 'company'
  red    → intent MUST be 'collaborate' | 'trade' | 'company'

-- RGY Chat Rooms table (CONFIRMED):
  name, color, intent, keywords, geofence, expiry, max_participants

-- API routes (CONFIRMED working):
  POST /api/rgy/intents      ← register intent
  GET  /api/rgy/opportunities/discover  ← find matches
  POST /api/rgy/opportunities/express-interest  ← signal interest
  GET  /api/rgy/subscription  ← subscription status
```

### The 3 Intents Explained

| Intent | Meaning | Example Use Case | Matching Logic |
|--------|---------|-----------------|---------------|
| **collaborate** | Creative/technical partnership | "I want to build something with someone" | Match two GREEN/collaborate users who share keywords |
| **trade** | Exchange of services/goods | "I have X skill, need Y skill" | Match complementary keyword sets |
| **company** | Build a company together | "Looking for a co-founder" | Match users with complementary domains (tech + biz) |

### What Is Fully Functional vs Needs Work

```
FULLY FUNCTIONAL:
  ✅ capsule creation with color + intent + keywords
  ✅ 4-stage matching algorithm (color → intent → keyword → vector)
  ✅ RGYRooms component: browse rooms by color + intent
  ✅ Join room: user can enter a chat room
  ✅ Geofence filtering (Haversine SQL function)
  ✅ Vector cosine similarity (pgvector overlay)

NEEDS WORK:
  □ Keyword autocomplete UI: suggest keywords as user types
  □ Capsule editor UI: where does user create/edit their capsule?
    (RGYColorSelector.tsx and KeywordPanel.tsx exist — need to be wired into a flow)
  □ Proactive Cubiqo matching: Cubiqo goes and finds matches without user searching
    (see Topic 11)
  □ RealTime notifications: when a match is found → notify user
  □ Match quality feedback: "Was this a good match?" for ML improvement
  □ Journal → capsule color sync (the patent-critical closed loop)
```

---

## Topic 11 — RGY Chat, Capsule Logic & Proactive Matching

### Is the Full System Understood in the Codebase?

**YES — the full system is designed and partially implemented.**

```
CAPSULE = color × intent × keywords
  (e.g., "GREEN × collaborate × [react, typescript, fintech]")

WHAT THE UI CONFIRMS:
  ✅ RGYColorSelector.tsx — color selection UI exists
  ✅ KeywordPanel.tsx — keyword entry UI exists
  ✅ RGYIntentKeywordList.tsx — intent + keyword display component
  ✅ RGYRooms.tsx — browse + join chat rooms
  ✅ OpportunityFeed.tsx — opportunity discovery feed component

WHAT THE DB CONFIRMS:
  ✅ rgy_capsules table with all fields
  ✅ rgy_chat_rooms table
  ✅ Staged matching functions in SQL
  ✅ user_intents + opportunities tables (with vector similarity)
  ✅ RGY chat from Emergent platform was pushed (/api/rgy/* routes exist)
```

### Proactive Matching — What Cubiqo Should Do Without User Asking

```
PROACTIVE FLOW (to be built):

Step 1: Cubiqo reads the user's active capsule
  → color = GREEN, intent = collaborate, keywords = [AI, voice, nextjs]

Step 2: Cubiqo runs the matching algorithm against all active capsules
  → finds 3 potential matches (anonymised at this stage)

Step 3: Cubiqo presents options to user in chat:
  "I found 3 people who might align with what you're building.
   One is a designer (GREEN × collaborate × [figma, ui, saas]).
   Want me to find out if they're interested?"

Step 4: If user says yes → Cubiqo sends anonymous signal to matched user
  → POST /api/rgy/opportunities/express-interest (with anonymous=true)
  → Matched user gets notification: "Someone with aligned interests found you"

Step 5: Both users consent to reveal → Chat room created
  → Room expires in 7 days if no activity
  → If both parties join → connection formed → may or may not reveal identity

WHAT IS ALREADY BUILT FOR THIS:
  ✅ /api/rgy/opportunities/discover endpoint
  ✅ /api/rgy/opportunities/express-interest endpoint
  ✅ Anonymisation: can be done at API layer before revealing user IDs
  ✅ Chat rooms: auto-created with expiry

WHAT NEEDS TO BE BUILT:
  □ Cron: /api/cron/rgy-discovery already exists! Schedule on Vercel
  □ Notification: when a match is found → push notification to user
  □ Consent flow: before identity reveal, get explicit consent from both
  □ Chat UI: integrate RGY room chat into main Cubiqo chat interface
  □ UI connection: make the RGY section visible from /chat sidebar
```

### How to Kickstart RGY (Immediate Steps)

```
Week 1 — Make capsule creation easy:
  □ Add "Set your RGY Status" to onboarding flow (after first voice message)
  □ Simple 3-step capsule creation: pick color → pick intent → add keywords
  □ Show active capsule in chat header as a colored dot

Week 2 — Enable proactive matching:
  □ Activate /api/cron/rgy-discovery on Vercel Pro
  □ Add notification when match found: in-app banner + email
  □ Wire the consent flow before identity reveal

Week 3 — Show the feed:
  □ Add "RGY tab" in main navigation
  □ Show: your capsule | matches found today | rooms you're in
  □ Chat rooms: integrate into existing voice/chat interface
```

---

## Topic 12 — Where to Get Test Users + First 1,000 Users

### Getting Test Users (Before Launch)

```
PHASE 0 — Friends & Founders (0-50 users):
  □ Slack: personal network, founder communities
  □ WhatsApp: close circle + extended network
  □ Give them direct access URL + Founders Pass
  □ Conduct 10 structured user interviews (30 min each via Zoom)
    Ask: What did they try first? Where did they get stuck? What surprised them?

PHASE 1 — Community Seeding (50-200 users):
  □ Reddit:
    r/Entrepreneur, r/solopreneur, r/productivity, r/artificialintelligence
    Post: "I built a voice-first AI OS that runs on YOUR API keys — here's a demo"
    Not promotional — lead with a genuine experiment or finding
  □ Hacker News: Show HN post — leads with technical credibility
    "Show HN: CubiQo — a voice AI companion with BYO API key encryption"
  □ Product Hunt upcoming page: collect upvote pledges before launch
  □ IndieHackers: post as a build-in-public story
  □ Typefully/Tweethunter: schedule 30-day Twitter/X thread series
    Day 1: "I'm building a WeChat for AI..."
    Day 5: "Here's why client-side AES-256 encryption matters for AI privacy"
    Day 10: "Our voice AI detects your emotional tone and adjusts its voice parameters"
    (Build-in-public creates organic followers who convert to users)

PHASE 2 — Creator Partnerships (200-500 users):
  □ Target YouTube channels: Ali Abdaal, Thomas Frank, Tiago Forte, Mike Peralta
    → Offer 6 months free Pro in exchange for honest video review
    → Audience: productivity-obsessed professionals (exact ICP)
  □ Target AI newsletters: TLDR AI, The Rundown, Superhuman
    → Offer exclusive beta access to their reader list
  □ Target LinkedIn creators: Lara Acosta, Justin Welsh (solopreneur audience)
    → Use Social Army to prepare personalised outreach for each

PHASE 3 — Paid Acquisition (500-1000 users):
  □ Start ONLY after Day-30 retention > 20% (otherwise you're wasting money)
  □ Channels: X/Twitter Ads (tech/AI audience), LinkedIn Ads (professional persona)
  □ Ad creative: 15-second screen recording of 3D cube morphing as user speaks
    → "This is your new AI OS. It runs on your API keys."
  □ Landing page A/B test: cube demo vs. problem statement vs. social proof

BEST PLATFORMS TO RECRUIT TESTERS:
  □ Betalist.com — pre-launch testers who specifically sign up for betas
  □ BetaFamily.com — engaged testers who give structured feedback
  □ TestFlight (iOS) / Google Play beta — for mobile future
  □ Slack communities: Online Geniuses, Product Hunt Makers, Indie Founders
  □ Discord servers: Midjourney, Notion, Obsidian communities
```

---

## Topic 13 — Milestones Aligned to Social, Launch & Growth

### The Full Timeline

| Milestone | Target Date | Social Signal | Technical Gate |
|-----------|------------|---------------|----------------|
| **Patent provisionals filed** | Day 7 from now | — | File before any public post |
| **P0 sprint complete** | Day 14 | Soft tweet: "Billing is live" | Stripe + ToS + caps fixed |
| **Waitlist open** | Day 14 | Twitter/LinkedIn: "We're accepting 100 beta testers" | /waitlist page |
| **50 beta users** | Week 3 | Reddit + HN Show HN post | Feature flags set for beta |
| **10 user interviews done** | Week 4 | Build-in-public post: learnings thread | Record + publish findings |
| **Day-30 retention measured** | Week 6 | — | Analytics ≥10 events live |
| **$1K MRR** | Month 2 | Tweet: "First $1K MRR 🎉" | Stripe verified |
| **Product Hunt launch** | Month 3 | Full PH campaign | After provisionals + billing |
| **Hacker News Show HN** | Month 3 | Technical deep-dive article | After PH launch |
| **$5K MRR** | Month 4 | LinkedIn post: "from 0 to $5K MRR in 120 days" | CubiKey portal live |
| **Angel conversations** | Month 4-5 | — | $5K MRR + metrics deck |
| **Social Army activated** | Month 4 | First content wave live | Review gate confirmed |
| **First affiliate partner** | Month 4 | — | Referral programme live |
| **Accelerator applications** | Month 5 | — | Metrics + traction proof |
| **$20K MRR** | Month 6 | "Crossing $20K MRR 🚀" | Enterprise accounts |
| **Seed round close** | Month 9 | — | Post-accelerator |

---

## Topic 14 — Who Are Cubiqo's Users

### Primary User Persona: The Solopreneur Operator

```
PERSONA 1 — "The Solopreneur Operator" (highest value, highest fit)
──────────────────────────────────────────────────────────────────────
Age: 27-42
Works: Freelancer, consultant, indie maker, content creator
Income: $4,000-$20,000/month (unpredictable)
Tools today: Notion, ChatGPT, Gmail, Calendly, LinkedIn, Stripe
Pain: "I run 10 apps and none of them talk to each other.
       I forget context between sessions. I can't automate without a team."
What they'll pay for: $29/month (2 hours of saved work at $50/hr)
Aha moment: "It remembered what I told it 3 weeks ago"
Entry feature: Voice + Journal
Upsell path: Pro → Agents → Social Army
```

### Secondary Personas

```
PERSONA 2 — "The Frustrated Developer"
Age: 24-35 | Works: Startup developer, side-project builder
Pain: "ChatGPT is too locked down. Claude is expensive. I want one interface."
Entry: CubiKey BYO mode
Aha moment: "I'm running 7 models through one UI for $0.10"
Upsell: CubiKey API subscription for their projects

PERSONA 3 — "The Social Media Hustler"
Age: 20-32 | Works: Content creator, personal brand, online coach
Pain: "Posting across 10 platforms is exhausting. Hiring a VA is expensive."
Entry: Social Army (Commander tier)
Aha moment: "It posted 50 pieces of content this week without me touching it"
Upsell: Commander tier upgrade

PERSONA 4 — "The Job Seeker in Transition"
Age: 25-45 | Works: Career pivoter, tech professional, laid-off worker
Pain: "Job hunting is a full-time job. I'm applying to 50 places manually."
Entry: Job Hunt feature (free tier allows limited applications)
Aha moment: "It applied to 20 jobs last night while I slept"
Upsell: Pro tier for unlimited applications + priority alerts

PERSONA 5 — "The Emotionally Exhausted Professional"
Age: 28-50 | Works: High-pressure professional, remote worker
Pain: "I want to process my day but can't afford a therapist."
Entry: Journal (free, always accessible)
Aha moment: "It noticed I felt red 4 Mondays in a row and asked if I'm okay"
Upsell: Pro for voice journaling + companion mode
```

---

## Topic 15 — MO's Insider Tricks to Make This Mainstream

These are not in the codebase. These are strategic insights from pattern recognition across comparable AI products.

### The 7 Insider Moves

**Trick 1: Lead with the Cube, Not the Features**  
The 3D plasma cube morphing as the user speaks is the most emotionally compelling thing about Cubiqo. Every marketing piece should open with a 10-second screen recording of the cube reacting to voice. No competitor has anything like it. This is your hook. The features explain later.

**Trick 2: "It remembered what you told it 3 weeks ago"**  
The single most powerful thing that will make Cubiqo feel different from ChatGPT is persistent contextual memory. The Aha moment is when a user mentions something offhand, comes back 3 weeks later, and Cubiqo references it unprompted. Build the memory highlight explicitly — after each session, show the user "Here's what I learned about you today" in 1-3 bullets.

**Trick 3: Make BYO Mode the LEAD, Not the Footnote**  
Every AI product is leaking user data to their servers. BYO mode with client-side AES-256-GCM encryption is a genuine differentiator. The message: "Your API key never leaves your device." Position this as the privacy-first choice. Privacy-conscious users are the most loyal and highest LTV. They will evangelize for you because it aligns with their identity.

**Trick 4: The RGY Colour System as a Social Identity**  
People love colour-coded identity systems (Red/Blue politics, MBTI, Hogwarts houses). RGY gives users a new social identity: "I'm a GREEN collaborator in the AI space." Build shareable RGY capsule cards — a simple image that says "🟢 Collaborate × AI × Voice × NextJS" that users can post to LinkedIn. It creates curiosity about Cubiqo without explaining it.

**Trick 5: Ride the "Agentic AI" Wave Before It Peaks**  
The market narrative in 2026 is shifting from "chatbots" to "agentic AI" — AI that actually does things, not just talks. Cubiqo's browser automation, job hunt, and Social Army are all agentic. The framing: "Cubiqo doesn't just answer questions. It sends emails, applies to jobs, and posts content while you sleep." This narrative is 6 months ahead of mainstream adoption. Get there before the crowded market does.

**Trick 6: The $0 CAC Flywheel**  
Every user who uses Social Army to post on LinkedIn/Twitter is also indirectly marketing Cubiqo. Build the Social Army content templates to include: "Made with Cubiqo" watermark (optional but incentivized with extra free posts). Estimate: if 100 Commander users each post 5 times/week across 3 platforms, that's 1,500 brand impressions/week from users, not your marketing budget. This is the WeChat flywheel — the product markets itself through use.

**Trick 7: The "Voice Diary" Emotion Hack**  
Research shows that the most retained app categories are health trackers, note-taking apps, and social apps — because they become part of daily routine. The Journal feature, especially in voice mode, creates a daily ritual. The secret: after the first voice journal, send an email: "Your voice note from today is waiting. Want to hear what Cubiqo noticed?" Play back a 30-second AI summary of what the user said. This creates a loop: journal → playback → insights → journal again. This is more habit-forming than any gamification system.

---

## Summary: What to Build Next (Prioritised by Strategic Impact)

| Priority | What | Why | Who | Weeks |
|---------|------|-----|-----|-------|
| 🔴 P0 | Stripe billing + ToS | Existential — no revenue without this | Blossom | 1-2 |
| 🔴 P0 | File patent provisionals | Public launch destroys rights | Founder | 1 |
| 🔴 P0 | Spending caps → DB | Financial risk in prod | Blossom | 1 |
| 🟠 P1 | Analytics ≥ 10 events | Cannot steer without data | Blossom | 2 |
| 🟠 P1 | Journal history UI connected | Primary retention feature | Bubbles | 1 |
| 🟠 P1 | Duo Mode backend wired | Key differentiated feature | Blossom | 2 |
| 🟠 P1 | RGY capsule creation in onboarding | Starts network effect | Bubbles | 1 |
| 🟠 P1 | sitemap.xml updated + llms.txt | SEO / AI SEO | MO | 0.5 |
| 🟡 P2 | Social Army review gate | Legal/reputational safety | Blossom | 1 |
| 🟡 P2 | Job hunt search automation | Key upsell trigger | Blossom | 3 |
| 🟡 P2 | RGY proactive matching cron | Network effect engine | Blossom | 2 |
| 🟡 P2 | Emergent platform MVP | Launch tool for other products | Blossom | 4 |
| 🔵 Post | CubiKey portal | Revenue Engine 2 | Blossom + Bubbles | 8 |
| 🔵 Post | Referral programme | $0 CAC flywheel | Blossom | 3 |
| 🔵 Post | Voice journal mode | Retention + daily ritual | Blossom + Bubbles | 3 |
| 🔵 Post | Interview prep feature | Job Hunt completeness | Blossom | 3 |
| 🔵 Post | Blog (3 seed articles) | SEO + AI SEO | MO + A3 | 2 |
| 🔵 Post | Social Army 10×10×10 | Viral distribution | Blossom | 4 |
