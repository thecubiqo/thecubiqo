# Branch Merge Statistics

> **Generated:** 2026-02-20
> **Repository:** thecubiqo/thecubiqo
> **Data source:** GitHub Pull Requests (all states)

---

## Quick Answer

| Question | Answer |
|----------|--------|
| Branches merged **to staging** (`staging0217`) | **2** |
| Of those, how many reached **production** | **0** (staging0217 → main via PR #123; main → production has 0 formal PRs) |
| Branches merged **to main** (development/staging) | **67 PRs** from **66 distinct branches** |
| Of those, how many reached **production** | **0 via PR** (production was updated via direct cherry-picks; see [Production section](#production-branch)) |

---

## 1. Merges Into `staging0217`

`staging0217` is the dedicated staging branch. **2 branches** were merged into it via pull requests.

| PR | Source Branch | Title | Merged |
|----|---------------|-------|--------|
| #122 | `copilot/verify-branch-features` | fix: route guest sessions through server API, add DB health check for staging | 2026-02-18 |
| #124 | `copilot/monitor-merge-for-issues` | Merge merge-all-features → staging0217: resolve conflicts, fix build, preserve all features | 2026-02-19 |

### staging0217 → Production

`staging0217` was **not** directly merged to `production` via a pull request.

Its contents were forwarded to `main` via PR #123 (`copilot/analyze-features-staging0217` → `main`, merged 2026-02-19). From `main`, no formal PR to `production` has been created yet.

---

## 2. Merges Into `main` (Development / Staging)

`main` functions as the primary development and staging branch (see [BRANCHES.md](BRANCHES.md)). **67 pull requests** from **66 distinct branches** have been merged into `main`.

### Summary by period

| Period | PRs Merged to `main` |
|--------|----------------------|
| Oct 2025 | 1 |
| Nov 2025 | 2 |
| Feb 2026 | 64 |
| **Total** | **67** |

### All merged branches (66 distinct sources)

| PR | Source Branch | Merged |
|----|---------------|--------|
| #1 | `staging` | 2025-10-17 |
| #2 | `develop` | 2025-11-08 |
| #3 | `develop` | 2025-11-08 |
| #5 | `openclaw-simple` | 2026-02-01 |
| #8 | `copilot/debug-code-issues` | 2026-02-14 |
| #9 | `copilot/fix-vercel-deployment-issues` | 2026-02-14 |
| #11 | `copilot/fix-nextjs-build-error-again` | 2026-02-14 |
| #13 | `copilot/fix-authentication-ui-session-state` | 2026-02-15 |
| #14 | `copilot/fix-email-rate-limiting-issues` | 2026-02-16 |
| #15 | `copilot/create-founders-pass-admin` | 2026-02-16 |
| #16 | `copilot/enhance-dev-panel-console` | 2026-02-15 |
| #17 | `copilot/fix-auth-ui-implementation` | 2026-02-16 |
| #18 | `copilot/implement-founders-pass-portal` | 2026-02-15 |
| #19 | `copilot/implement-founders-pass-flags` | 2026-02-15 |
| #20 | `copilot/add-daily-self-heal-job` | 2026-02-16 |
| #21 | `copilot/add-agents-onboarding` | 2026-02-16 |
| #22 | `copilot/design-journey-memory-system` | 2026-02-16 |
| #23 | `copilot/featdaily-journal` | 2026-02-15 |
| #24 | `copilot/update-email-templates-to-cubiqo` | 2026-02-15 |
| #25 | `copilot/add-magic-link-buttons` | 2026-02-16 |
| #26 | `copilot/add-durable-admin-flag` | 2026-02-15 |
| #27 | `copilot/add-daily-self-heal-job-again` | 2026-02-16 |
| #30 | `copilot/create-pr-triage-agent` | 2026-02-16 |
| #31 | `copilot/resolve-open-pr-conflicts` | 2026-02-16 |
| #32 | `copilot/merge-main-and-clear-deployment` | 2026-02-15 |
| #33 | `copilot/investigate-voice-convo-issue` | 2026-02-15 |
| #34 | `copilot/remove-openai-emergent-references` | 2026-02-15 |
| #38 | `copilot/build-cq-communication-system` | 2026-02-15 |
| #39 | `copilot/fix-broken-auth-routes` | 2026-02-15 |
| #40 | `copilot/merge-features-into-main` | 2026-02-16 |
| #42 | `copilot/merge-feature-branches-to-main` | 2026-02-16 |
| #43 | `copilot/update-env-variable-mappings` | 2026-02-15 |
| #46 | `feat/biometric-auth` | 2026-02-15 |
| #47 | `copilot/consolidate-middleware-for-vercel` | 2026-02-15 |
| #49 | `copilot/apply-landing-page-ui-changes` | 2026-02-16 |
| #50 | `copilot/improve-slow-code-performance` | 2026-02-15 |
| #52 | `copilot/fix-voice-and-chat-issue` | 2026-02-15 |
| #76 | `copilot/create-copilot-agents-files` | 2026-02-15 |
| #77 | `copilot/fix-llm-router-dependencies` | 2026-02-16 |
| #78 | `copilot/port-wave-to-cube-morph` | 2026-02-16 |
| #80 | `copilot/fix-founderspass-dashboard-ux` | 2026-02-16 |
| #81 | `copilot/recreate-pr-28-auth-context` | 2026-02-16 |
| #82 | `copilot/validate-and-reintroduce-missing-pr-changes` | 2026-02-16 |
| #83 | `copilot/add-openclaw-provider-abstraction` | 2026-02-16 |
| #85 | `copilot/restore-energy-cube-components` | 2026-02-16 |
| #88 | `copilot/restore-energy-cube-components-again` | 2026-02-16 |
| #89 | `copilot/centralize-auth-state` | 2026-02-16 |
| #91 | `copilot/fix-plasma-wave-visibility` | 2026-02-16 |
| #92 | `copilot/fix-plasma-wave-visibility-again` | 2026-02-16 |
| #93 | `copilot/fix-working-issue` | 2026-02-16 |
| #94 | `copilot/fix-typo-and-update-year` | 2026-02-16 |
| #95 | `copilot/setup-chromatic-visual-testing` | 2026-02-18 |
| #96 | `copilot/add-user-search-functionality` | 2026-02-16 |
| #97 | `copilot/check-chromatic-connection` | 2026-02-16 |
| #98 | `copilot/fix-120k-particle-view` | 2026-02-16 |
| #99 | `copilot/check-chromatic-connection-again` | 2026-02-16 |
| #100 | `copilot/test-broken-chat-audio-landing-page` | 2026-02-16 |
| #101 | `copilot/update-ui-elements-for-premium-feel` | 2026-02-16 |
| #102 | `copilot/fix-sign-in-button-issue` | 2026-02-16 |
| #103 | `copilot/fix-audio-chat-issue` | 2026-02-16 |
| #119 | `copilot/complete-daily-journal-page` | 2026-02-19 |
| #123 | `copilot/analyze-features-staging0217` | 2026-02-19 |
| #128 | `copilot/test-staging0217-bug-reports` | 2026-02-19 |
| #130 | `copilot/monitor-activity-across-environments` | 2026-02-19 |
| #132 | `copilot/analyze-monetisation-ui-features` | 2026-02-19 |
| #133 | `copilot/extract-implementation-requirements` | 2026-02-19 |
| #135 | `copilot/test-api-database-dependency` | 2026-02-19 |

> **Note:** `develop` contributed PR #2 and PR #3 (same source branch, counted as 1 distinct branch).
> Total unique source branches: **66**.

---

## 3. Production Branch

The `production` branch is the live production deployment (cubiqo.ai). It has received **0 merges via GitHub pull requests**.

Production was updated via **direct cherry-picks** (not PRs), documented in [PRODUCTION_MERGE_LOG.md](PRODUCTION_MERGE_LOG.md):

| Phase | Source | Commits | Description |
|-------|--------|---------|-------------|
| Build Stability | `main` cherry-picks | 3 | Supabase fallbacks, static regions, build fixes |
| Core Features | `staging` branch | 6 | TechLandingCube, FlowingEnergyCube, energy components |
| Core Features | `ui/energy-cube-staging` | 1 | EnergyCube wireframe redesign |
| Documentation | Existing production files | 2 | Architecture + API docs |
| **Total** | | **12** | |

### main → production pipeline status

| Step | Count | Notes |
|------|-------|-------|
| Branches merged to `staging0217` | **2** | PRs #122, #124 |
| Branches merged to `main` | **67** (66 distinct) | Includes staging0217 content via PR #123 |
| `main` → `production` (via PR) | **0** | No formal PR created yet |
| `main` → `production` (via direct cherry-picks) | **12 commits** | See PRODUCTION_MERGE_LOG.md |

---

## 4. Branch Flow Diagram

```
Feature Branches (66 unique)
        │
        ├── 2 branches ──► staging0217 ──► main (via PR #123)
        │
        └── 65 branches ─────────────────► main (67 total PRs)
                                               │
                                               ▼
                                          production
                                     (12 cherry-picked commits;
                                      0 formal PRs to date)
```

---

## 5. Closed PRs That Were NOT Merged

For completeness, **36 pull requests** targeting `main` were closed without merging (declined or superseded).

| Base Branch | Total Closed PRs | Merged | Not Merged |
|-------------|-----------------|--------|------------|
| `main` | 103 | 67 | 36 |
| `staging0217` | 2 | 2 | 0 |
| `staging` | 1 | 0 | 1 |
| `fix/vercel-deploy` | 1 | 1 | 0 |
| `conflict_150226_1305` | 1 | 0 | 1 |
| **Total** | **108** | **70** | **38** |
