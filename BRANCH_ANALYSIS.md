# Branch Analysis Report

> **Generated:** 2026-02-18  
> **Repository:** thecubiqo/thecubiqo

---

## A. Branches & Features

### 1. `main` (Connected to Production)

**Tip SHA:** `82e073b6` | **Latest Activity:** 2026-02-18  
**Root Items:** 158 (20 directories, 138 files)

**App Routes (Features):**
- `/admin` — Admin control room dashboard v2
- `/agent-portal` — Agent portal
- `/agents` — Agents management
- `/api` — API routes (health, auth, chat, features, etc.)
- `/auth` + `/auth-demo` — Authentication (magic link, passkeys)
- `/chat` — AI chat interface
- `/dashboard` — User dashboard
- `/demo` — Demo pages
- `/dev-console` — Developer console
- `/email-preview` — Email template preview
- `/files` — File management
- `/founderpass` + `/founders-pass` + `/founderspass` — Founders Pass (3 variants)
- `/journal` — Daily journal
- `/journey` — User journey
- `/landing-demo` + `/landing-preview` — Landing page demos
- `/onboarding` — User onboarding
- `/pricing` — Pricing page
- `/settings-cube` — Settings cube
- `/sites` — Sites management
- `/[region]` — Regional routing

**Key Subsystems:** `social-army/`, `backend/`, `agents/`, `frontend/`, `chrome-extension/`, `.storybook/`, `supabase/`, `cubiqo-plasma-export/`, `generator/`, `scripts/`, `tests/`

**Recent Features (last 20 commits):**
- Social Army campaign management with Supabase
- RLS policies for campaigns and content queue
- Error boundary for client-side exceptions
- Supabase client singleton pattern fix
- Feature flags with try/catch
- Admin dashboard link in settings menu
- Next.js 14 downgrade for build stability
- CQ messaging schema
- Merged visual testing, user search, UI polish, auth fixes

---

### 2. `staging0217`

**Tip SHA:** `82e073b6` (⚠️ **IDENTICAL to `main`**)  
**Latest Activity:** 2026-02-18

**Features:** Identical to `main` — they point to the exact same commit (SHA `82e073b6`).

staging0217 was used as a staging/integration branch that was eventually merged into main. They are now fully synchronized.

---

### 3. `production`

**Tip SHA:** `c0428704` | **Latest Activity:** 2026-02-17  
**Root Items:** 145 (19 directories, 126 files)

**App Routes (Features):**
- Same core routes as main: `/admin`, `/agent-portal`, `/agents`, `/api`, `/auth`, `/auth-demo`, `/chat`, `/dashboard`, `/demo`, `/dev-console`, `/email-preview`, `/files`, `/founderpass`, `/founders-pass`, `/founderspass`, `/journal`, `/journey`, `/landing-demo`, `/landing-preview`, `/onboarding`, `/settings-cube`, `/sites`, `/[region]`
- ⚠️ Missing: `/pricing` (not present in production)

**Recent Features (last 20 commits):**
- Next.js 14 downgrade for turbopack build issues
- Merge from staging-environment (multiple feature branches)
- Biometric RP ID fix for passkeys (dynamic for localhost/production)
- Storybook + Chromatic visual regression testing
- Sign-in button fix (stuck loading/blinking)
- UI polish (dismissible questions panel, premium styling)
- Chat audio/voice fixes (callbacks, race conditions)
- Audio speaker button fix
- Repository identity documentation

**Unique to production:** `src/proxy.ts` (API proxy)

---

### 4. `merge-all-features`

**Tip SHA:** `762f9401` | **Latest Activity:** 2026-02-12  
**Root Items:** 86 (9 directories, 77 files)

**App Routes (Features):**
- `/admin` — Admin dashboard
- `/agents` — Agents
- `/api` — API routes
- `/auth` — Authentication
- `/chat` — Chat
- `/cubikey` — CubiKey smart routing (**UNIQUE**)
- `/files` — Files
- `/founders-dashboard` — Founders Dashboard (**UNIQUE**)
- `/founders-pass` — Founders Pass
- `/founders` — Founders experiments (**UNIQUE**)
- `/founderspass` — Founders Pass (variant)
- `/integrations` — Integrations page (**UNIQUE**)
- `/landing-preview` — Landing preview
- `/memory` — Memory system (**UNIQUE**)
- `/rescue` — Rescue page (**UNIQUE**)
- `/settings-cube` — Settings cube
- `/settings` — Settings page (**UNIQUE**)
- `/side-panel` — Side panel (**UNIQUE**)
- `/[region]` — Regional routing

**Unique Features NOT in main/production:**
- CubiKey smart routing
- Founders Dashboard with A/B testing
- Founders experiments page
- Integrations page
- Memory system
- Rescue page
- Side panel
- Settings page (separate from settings-cube)

**Recent Features (last 20 commits):**
- Cube design toggle experiments
- MiniMax integration
- Dev Panel and Founder features
- Isometric glassmorphic cube with code and particles
- Extension manifest fixes and AI router hardening
- Founder pass navigation with case-insensitive check
- Premium A/B testing framework and dashboard
- Public features API and global sync
- Sidekick/Cope modes
- CubiKey messaging

---

### 5. Copilot Branches (51 total)

All copilot branches are feature/fix branches created by GitHub Copilot. Key ones:

| Branch | Purpose |
|--------|---------|
| `copilot/add-agents-onboarding` | Agent onboarding flow |
| `copilot/add-job-hunt-mode` | Job application tracking |
| `copilot/add-magic-link-buttons` | Magic link auth buttons |
| `copilot/add-openclaw-provider-abstraction` | OpenClaw AI provider |
| `copilot/add-particle-landing-feature-flag` | Particle landing page flag |
| `copilot/add-user-communication-methods` | cubiqo_email/phone auto-gen |
| `copilot/add-user-search-functionality` | User search |
| `copilot/build-admin-level-dashboard` | Admin dashboard |
| `copilot/build-ai-app-environment` | Emergent AI platform |
| `copilot/check-chatbot-functionality` | RGY intelligent matching |
| `copilot/complete-daily-journal-page` | Daily journal page |
| `copilot/fix-auth-ui-implementation` | Auth UI fixes |
| `copilot/fix-plasma-wave-visibility` | Plasma wave visual fixes |
| `copilot/implement-cubiqo-features` | RGY capsule system |
| `copilot/implement-security-features` | Enterprise security |
| `copilot/integrate-shopify-printify` | Shopify/Printify integration |
| `copilot/merge-changes-into-staging0217` | Specialized dev agents |
| `copilot/setup-chromatic-visual-testing` | Chromatic visual testing |
| `copilot/setup-release-process` | Release strategy |
| `copilot/setup-supabase-staging-database` | Staging DB setup |
| `copilot/setup-vision-hearing-capabilities` | Multimodal AI |
| `copilot/update-ui-elements-for-premium-feel` | Premium UI polish |
| ...and 29 more |

---

## B. Branch Comparison

### Which branch has the most code?

| Branch | Root Items | Directories | Files | Status |
|--------|-----------|-------------|-------|--------|
| **main** | **158** | **20** | **138** | ✅ Most code |
| staging0217 | 158 | 20 | 138 | = Same as main |
| production | 145 | 19 | 126 | Behind main |
| merge-all-features | 86 | 9 | 77 | Oldest, fewest files |

### Which is ideal for production?

**`main` (= `staging0217`) is the ideal branch for production.** Reasons:
1. **Most complete:** Contains all the latest features, fixes, and infrastructure
2. **Most recent commits:** Last updated 2026-02-18 with build fixes and social army features
3. **Already has production fixes:** Includes Next.js 14 downgrade, Supabase fixes, error boundaries
4. **Contains merged features from production:** Has already absorbed production branch changes
5. **Active development:** All 22 open PRs target `main`

> ⚠️ The `production` branch is **behind `main`** by ~20 commits. It is missing social army features, additional build fixes, and recent admin dashboard work.

### Shared vs. Unique Code

| Comparison | Shared Commits (last 50) |
|-----------|------------------------|
| main ↔ staging0217 | **50/50** (100% identical) |
| main ↔ production | 3 shared |
| main ↔ merge-all-features | 0 shared |
| production ↔ merge-all-features | 0 shared |

**Summary:**
- **`main` and `staging0217`** = **IDENTICAL** (same SHA, same code)
- **`production`** = Diverged from main, has 47 unique commits (mostly older feature merges, audio/chat fixes, Storybook setup)
- **`merge-all-features`** = Completely different lineage, 50 unique commits (oldest branch, Feb 10-12). Has unique features like CubiKey, Founders Dashboard, Memory system, Side Panel that are NOT in main/production

### Unique Features by Branch

| Feature | main | staging0217 | production | merge-all-features |
|---------|------|-------------|------------|-------------------|
| Social Army | ✅ | ✅ | ❌ | ❌ |
| Admin Dashboard v2 | ✅ | ✅ | ✅ (older) | ✅ (different) |
| Pricing page | ✅ | ✅ | ❌ | ❌ |
| CubiKey | ❌ | ❌ | ❌ | ✅ |
| Founders Dashboard | ❌ | ❌ | ❌ | ✅ |
| Memory System | ❌ | ❌ | ❌ | ✅ |
| Side Panel | ❌ | ❌ | ❌ | ✅ |
| Integrations Page | ❌ | ❌ | ❌ | ✅ |
| Rescue Page | ❌ | ❌ | ❌ | ✅ |
| A/B Testing | ❌ | ❌ | ❌ | ✅ |
| Storybook/Chromatic | ✅ | ✅ | ✅ | ❌ |
| Error Boundary | ✅ | ✅ | ❌ | ❌ |
| Journal | ✅ | ✅ | ✅ | ❌ |
| Onboarding | ✅ | ✅ | ✅ | ❌ |
| Agent Portal | ✅ | ✅ | ✅ | ❌ |

---

## C. Open PR Health Check

### Overview

- **Total Open PRs:** 22
- **All target:** `main` branch
- **All are:** Draft PRs (none ready for review)
- **All created by:** GitHub Copilot agent
- **Date range:** 2026-02-16 to 2026-02-18

### PR List

| # | Title | Branch | Created |
|---|-------|--------|---------|
| 122 | [WIP] Verify features and stability of branches | `copilot/verify-branch-features` | 02-18 |
| 121 | [WIP] Conduct testing for all open pull requests | `copilot/test-open-pull-requests` | 02-18 |
| 120 | [WIP] Add core vision and hearing capabilities for multimodal AI | `copilot/setup-vision-hearing-capabilities` | 02-18 |
| 119 | [WIP] Complete static daily journal page | `copilot/complete-daily-journal-page` | 02-18 |
| 118 | Add Job Hunt Mode - Automated Job Application Tracking | `copilot/add-job-hunt-mode` | 02-18 |
| 117 | Implement RGY intelligent matching with AI-powered opportunity discovery | `copilot/check-chatbot-functionality` | 02-18 |
| 116 | Implement enterprise security framework and comprehensive testing infra | `copilot/implement-security-features` | 02-18 |
| 115 | [WIP] Add admin level dashboard with key metrics and user management | `copilot/build-admin-level-dashboard` | 02-18 |
| 114 | [WIP] Add secure authentication and access control measures | `copilot/secure-authentication-access-control` | 02-18 |
| 113 | Add Emergent platform foundation: Control Plane, Orchestrator, Runner | `copilot/build-ai-app-environment` | 02-18 |
| 112 | Add production caching, performance monitoring, and security scanning | `copilot/integrate-shopify-printify` | 02-18 |
| 111 | Auto-generate cubiqo_email and cubiqo_phone on user signup | `copilot/add-user-communication-methods` | 02-18 |
| 110 | AI App Factory: Architecture, strategic planning, and Epic 1 foundations | `copilot/analyze-feature-branches` | 02-18 |
| 109 | Add 3 specialized developer agents: full-stack, DevOps, mobile | `copilot/merge-changes-into-staging0217` | 02-18 |
| 107 | Add staging database infrastructure with automated setup | `copilot/setup-supabase-staging-database` | 02-17 |
| 106 | Implement RGY capsule system with staged matching and chat rooms | `copilot/implement-cubiqo-features` | 02-17 |
| 105 | Add release strategy, product roadmap, and staging validation docs | `copilot/setup-release-process` | 02-17 |
| 104 | Document Vercel branch-to-project deployment mappings | `copilot/compare-backup-with-main` | 02-16 |
| 90 | feat: Add feature flag for ParticleLanding as home page | `copilot/add-particle-landing-feature-flag` | 02-16 |
| 87 | Verify Vercel Analytics installation and add test coverage | `copilot/verify-vercel-analytics-installation` | 02-16 |
| 86 | Add PR merge audit tooling and comprehensive test infrastructure | `copilot/audit-pr-merges-and-testing` | 02-16 |
| 84 | feat: Add OpenClaw provider abstraction with feature flags | `copilot/add-openclaw-provider-abstraction-again` | 02-16 |

### Can We Combine PRs?

**Yes — several PRs can be grouped and potentially consolidated:**

#### Group 1: Infrastructure & DevOps (can combine into 1 PR)
- PR #107 — Staging database setup
- PR #105 — Release strategy & roadmap
- PR #104 — Vercel deployment mappings
- PR #87 — Vercel Analytics verification

#### Group 2: Security & Auth (can combine into 1 PR)
- PR #116 — Enterprise security framework
- PR #114 — Secure authentication & access control

#### Group 3: AI & Agent Features (can combine into 1 PR)
- PR #113 — Emergent AI platform
- PR #120 — Vision & hearing capabilities
- PR #117 — RGY intelligent matching
- PR #109 — Specialized developer agents

#### Group 4: Core Features (can combine into 1 PR)
- PR #118 — Job Hunt Mode
- PR #119 — Daily journal page
- PR #106 — RGY capsule system
- PR #111 — User communication methods

#### Group 5: Tooling & Testing (can combine into 1 PR)
- PR #86 — PR merge audit tooling
- PR #121 — Testing for open PRs
- PR #122 — Branch verification (this PR)

#### Group 6: UI & Provider (can combine into 1 PR)
- PR #84 — OpenClaw provider abstraction
- PR #90 — ParticleLanding feature flag

#### Standalone PRs:
- PR #110 — AI App Factory (large scope)
- PR #112 — Production caching & monitoring
- PR #115 — Admin level dashboard

### Consolidation Recommendation

Instead of 22 separate PRs, these could be reduced to **~8 focused PRs** using the groupings above. This would:
- Reduce merge conflict risk
- Simplify code review
- Provide clearer feature boundaries
- All target `main` branch

---

## Recommendations

1. **Sync `production` to `main`:** Production is behind. Since main has all the latest fixes and features, merge main → production.

2. **Review `merge-all-features` unique code:** Features like CubiKey, Founders Dashboard, Memory System, A/B Testing, Side Panel exist only in merge-all-features. Decide if they should be ported to main via PRs.

3. **Delete `staging0217`:** It's identical to main. It serves no purpose and creates confusion.

4. **Consolidate open PRs:** Reduce 22 draft PRs to ~8 by grouping related features.

5. **Clean up stale copilot branches:** 51 copilot branches exist; many are already merged or abandoned. Clean up those without open PRs.

6. **Use `main` for production deployments:** It has the most code, most recent fixes, and all infrastructure needed.
