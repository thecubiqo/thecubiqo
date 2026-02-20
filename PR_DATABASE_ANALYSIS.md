# PR Database Requirements Analysis

**Generated:** 2026-02-19  
**Branches Compared:** `main`, `staging0217` (identical migration files)  
**Total Open PRs:** 58

---

## Existing Database Migrations (on both `main` and `staging0217`)

Both branches have **identical** migration files:

| Migration | Key Tables / Objects |
|-----------|---------------------|
| `20240209_user_integrations.sql` | `user_integrations` |
| `20250209_add_connections.sql` | `connections`, `deployments` |
| `20250210_ab_testing.sql` | `experiments`, `experiment_assignments`, `experiment_events` |
| `20250210_add_metadata_to_experiments.sql` | (ALTER on experiments) |
| `20251124000001_initial_schema.sql` | `profiles`, `sessions`, `conversations`, `messages`, `memory`, `events` |
| `20251126000001_fix_color_constraint.sql` | (ALTER constraint) |
| `20251127000001_ensure_profile_function.sql` | Functions: `ensure_profile_and_session`, `convert_guest_session` |
| `20260215000001_add_admin_and_audit.sql` | `audit_logs`, `profiles.is_admin` column |
| `20260215000001_feature_flags.sql` | `feature_flags`, `feature_flag_audit`, `feature_flag_webhooks`, `feature_flag_webhook_logs` |
| `20260215000001_founders_pass_schema.sql` | `sites`, `feature_flags`, `flag_overrides`, `oauth_tokens`, `action_templates`, `audit_log`, `feature_events`, `integration_configs` |
| `20260215000001_journal_entries.sql` | `journal_entries`, `journal_analytics`, `email_queue` |
| `20260215000001_journey_memory_schema.sql` | `journey_consents`, `journey_memories`, `journey_rollback_logs`, `journey_metrics` |
| `20260215000001_self_heal_reports.sql` | `self_heal_reports`, `self_heal_audit_logs` |
| `20260215000002_cq_system.sql` | `friends`, `direct_messages` |
| `20260215000002_design_toggles.sql` | `design_toggles` |
| `20260215000002_journey_helper_functions.sql` | Function: `get_top_journey_users` |
| `20260216000001_features_catalog.sql` | `features_catalog`, `user_feature_toggles` |
| `20260217000001_add_agent_features.sql` | (INSERT feature flags) |
| `20260217000002_add_self_healing_feature.sql` | (INSERT feature flags) |
| `20260217000003_fix_cq_schema.sql` | `cq_numbers`, `cq_friend_requests`, `cq_contacts`, `cq_conversations`, `cq_messages`, `cq_calls`, `cq_screen_shares`, `cq_notifications`, `cq_privacy_settings`, `cq_voice_synthesis`, `cq_premium_status` |
| `20260217000004_social_army_schema.sql` | `social_accounts`, `social_campaigns`, `content_queue` |
| `20260218000001_monetization_schema.sql` | `subscription_tiers`, `user_subscriptions` |

---

## PRs WITH Database Requirements

### PR #90 — feat: Add feature flag for ParticleLanding as home page
- **New Migration:** `20260216000002_add_particle_landing_flag.sql`
- **DB Need:** INSERT into `feature_flags` table (`ui.useParticleLandingAsHome`)
- **Exists in main/staging?** ❌ Migration file does NOT exist on main or staging0217
- **Tables needed:** `feature_flags` ✅ (exists)

### PR #106 — Implement RGY capsule system with staged matching and chat rooms
- **New Migrations:**
  - `20260217000001_browser_sessions_and_actions.sql`
  - `20260217000002_browser_consent_records.sql`
  - `20260218000001_unified_notifications.sql`
  - `20260218000100_notifications_system.sql`
  - `20260218000200_rgy_capsules_and_matching.sql`
- **DB Need:** New tables for browser sessions, consent records, notifications, RGY capsules, and matching
- **Exists in main/staging?** ❌ None of these migrations exist on main or staging0217

### PR #107 — Add staging database infrastructure with automated setup and documentation
- **DB Need:** Documentation only (`STAGING_DATABASE_SETUP.md`)
- **No new migrations** — docs-only PR about staging DB setup
- **Exists in main/staging?** N/A (documentation)

### PR #110 — AI App Factory: Architecture, strategic planning, and Epic 1 foundations
- **New Migration:** `20260218_001_epic1_foundations.sql`
- **DB Need:** New tables for AI App Factory (epic 1 foundation tables)
- **Exists in main/staging?** ❌ Does NOT exist on main or staging0217

### PR #111 — Auto-generate cubiqo_email and cubiqo_phone on user signup
- **New Migration:** `20260218000001_cubiqo_communication_fields.sql`
- **Modified:** `src/types/database.types.ts`
- **DB Need:** Add `cubiqo_email` and `cubiqo_phone` columns to `profiles` table
- **Exists in main/staging?** ❌ Does NOT exist on main or staging0217

### PR #112 — Add real-time monitoring UI and multi-channel notifications for self-heal system
- **New Migration:** `20260219000001_notifications_system.sql`
- **DB Need:** Notifications system tables for self-heal monitoring
- **Exists in main/staging?** ❌ Does NOT exist on main or staging0217

### PR #113 — Implement Emergent AI App Builder: Full-stack platform for AI-driven development
- **New Migrations:**
  - `20260218064853_emergent_foundations.sql`
  - `20260218064854_emergent_runner.sql`
  - `20260218064855_emergent_integrations.sql`
  - `20260218064856_emergent_postlaunch.sql`
  - `20260219130000_add_workspace_deployment_tables.sql`
- **DB Need:** Extensive new schema for Emergent platform (workspaces, runners, integrations, deployments)
- **Exists in main/staging?** ❌ None exist on main or staging0217

### PR #115 — Add staging0217 validation and deployment readiness documentation
- **New Migration:** `20260218000001_admin_dashboard_comprehensive.sql`
- **DB Need:** Comprehensive admin dashboard tables
- **Exists in main/staging?** ❌ Does NOT exist on main or staging0217

### PR #117 — Implement RGY intelligent matching: hybrid chat rooms + AI discovery with emergent UI
- **New Migration:** `20260218000001_rgy_intelligent_matching.sql`
- **DB Need:** Tables for `user_intents`, `opportunities`, `matches`, `pro_match_subscriptions` (pgvector-based matching)
- **Exists in main/staging?** ❌ Does NOT exist on main or staging0217

### PR #118 — Add UI verification with screenshots for Job Hunt Mode merge to staging0217
- **New Migration:** `20260218000002_job_hunt_schema.sql`
- **DB Need:** Job hunt mode tables
- **Exists in main/staging?** ❌ Does NOT exist on main or staging0217

### PR #130 — Add monitoring system and optimize admin route architecture
- **New Migration:** `20260219000001_monitoring_events.sql`
- **DB Need:** `monitoring_events` table with RLS policies
- **Exists in main/staging?** ❌ Does NOT exist on main or staging0217

### PR #133 — docs: Extract and document Emergent system requirements
- **Documentation:** `docs/emergent-database-schema.md`, `docs/emergent/04-DATABASE_SCHEMA.md`
- **DB Need:** Documents 52 database tables required for Emergent system
- **No new migrations** — documentation-only

### PR #138 — Add front/back camera toggle and DB API efficiency fixes
- **New Migration:** `20260219000001_add_cq_performance_indexes.sql`
- **Modified:** `src/lib/cq-to-cq/supabase-client.ts`
- **DB Need:** Performance indexes on existing CQ tables
- **Exists in main/staging?** ❌ Migration does NOT exist on main or staging0217
- **Tables needed:** `cq_conversations`, `cq_messages`, etc. ✅ (exist)

### PR #157 — feat: CubiQo Autopilot — autonomous profile filling and background agent tasks
- **New Migration:** `20260219000001_autopilot_features.sql`
- **DB Need:** Autopilot feature tables for autonomous profile filling
- **Exists in main/staging?** ❌ Does NOT exist on main or staging0217

### PR #158 — Fix Social Army: broken config, missing methods, schema mismatch
- **Modified Migrations:**
  - `supabase/migrations/20260217000004_social_army_schema.sql` (expand platform CHECK constraint)
  - `supabase/MASTER_PRODUCTION_SETUP.sql` (expand platform CHECK constraint)
  - `supabase/MASTER_STAGING_SETUP.sql` (expand platform CHECK constraint)
- **DB Need:** Expand `social_accounts.platform` CHECK constraint to include `reddit`, `pinterest`, `threads`, `facebook`, `discord`
- **Exists in main/staging?** The table exists, but the constraint is narrower (only `twitter`, `tiktok`, `linkedin`, `instagram`, `youtube`)

### PR #159 — Add AI & database usage monitoring with lock controls to admin dashboard
- **No new migrations** — Uses in-memory state via `spending-caps.ts`
- **DB Need:** None (in-memory lock state, no DB changes)
- **New API:** `GET/POST /api/admin/usage` for lock controls

---

## PRs WITHOUT Database Requirements

The following PRs have **no database schema changes** (no SQL files, no migration additions/modifications):

| PR | Title | Notes |
|----|-------|-------|
| #84 | Add OpenClaw provider abstraction with feature flags | Code/test changes only |
| #86 | Add PR merge audit tooling and comprehensive test infrastructure | CI workflow changes only |
| #87 | Verify Vercel Analytics installation and add test coverage | Test file changes only |
| #104 | Document Vercel branch-to-project deployment mappings | Documentation only |
| #105 | Add release strategy, product roadmap, and staging validation documentation | Documentation only |
| #109 | Add 3 specialized developer agents: full-stack, DevOps, mobile | Agent config files only |
| #114 | Add secure authentication and access control measures | Auth/validation code only |
| #116 | Implement enterprise security infrastructure with modern UI | Security UI/middleware, no SQL changes |
| #119 | Add UI verification documentation for journal history feature | Documentation only |
| #120 | Add multimodal AI capabilities: vision and hearing | Frontend components only |
| #121 | Conduct testing for all open pull requests | No files changed |
| #125 | Fix CI test failures blocking deployment | Test/build fixes only |
| #126 | Add staging0217 branch to CI/CD pipelines | CI workflow changes only |
| #127 | Consolidate admin route auth into shared `withAdminAuth` guard | Middleware refactor only |
| #128 | Add testing infrastructure for staging0217 validation | Test scripts/docs only |
| #129 | Fix 8 failing tests across 5 test files on main | Test fix only |
| #131 | Add API database validation test suite (67 tests) | Test files only, validates existing schema |
| #132 | Add comprehensive feature monetization and UI-centric analysis | Documentation only |
| #134 | Add staging CI gate with API route and database schema validation | CI/test infrastructure only |
| #135 | Add test coverage for API routes, database, and core dependencies | Test files only |
| #136 | Add automated conflict resolution script for PR #116 and #113 | Script and documentation only |
| #137 | Add JO feature readiness validation for 10 open PRs | Documentation only |
| #139 | feat: contextual deals/offers integration (Groupon-style) | API/UI code only, no DB schema |
| #140 | Add emergent capabilities dashboard, security/antivirus UI | UI components only |
| #141 | Add admin UI pages for events, journal, and system health | UI pages only (queries existing tables) |
| #142 | fix: align RGY colors to canonical system and fix dot order | UI color changes only |
| #143 | Verify presence of Companion Mode, Browser Control, and Duo Mode | Documentation only |
| #144 | Add Agent Hub: user-friendly agent discovery and interaction UI | UI components only |
| #145 | Fix chrome extension for cross-screen user following | Chrome extension code only |
| #146 | Add PWA install prompt with iOS fallback and offline support | PWA/UI code only |
| #147 | Fix UI component conflicts: consolidate EnergyCube rendering | UI refactoring only |
| #148 | Add UI components for voice-modulation, spending-caps, verbal-commands | UI components only |
| #149 | feat: staging readiness report — detect agent quiescence | CI workflow only |
| #150 | Add workspace isolation and agent-to-agent messaging | Engine code only |
| #151 | feat: Add missing Tools API, Channels API, and Admin API endpoints | API route code only |
| #152 | Add missing engine modules: context-assembly, queue, router | Engine code only |
| #153 | feat: add image and video generation API + UI | API/UI code only |
| #154 | Harden terminal API security; add rate-limit utility | Security code only |
| #155 | Enhance self-heal system: parallel diagnostics, retry logic | Self-heal workflow only |
| #156 | Add adaptive learning engine and conversion strategy | API/lib code only |
| #160 | Prepare complete and tested PRs for merging into main | No files changed |
| #161 | Analyze database requirements for open PRs | This PR |

---

## Summary: Migration Conflicts & Timestamp Collisions

⚠️ **Timestamp collision risk:** Multiple PRs use the same migration timestamp prefix, which would cause conflicts if merged together:

| Timestamp | PRs Using It | Files |
|-----------|-------------|-------|
| `20260218000001` | #111, #115, #117 | `cubiqo_communication_fields`, `admin_dashboard_comprehensive`, `rgy_intelligent_matching` |
| `20260218000002` | #118 | `job_hunt_schema` |
| `20260219000001` | #112, #130, #138, #157 | `notifications_system`, `monitoring_events`, `cq_performance_indexes`, `autopilot_features` |

**Recommendation:** Before merging, rename migration timestamps to unique sequential values to prevent conflicts.

---

## Key Findings

1. **15 PRs introduce new database requirements** (new migrations or schema changes)
2. **43 PRs have NO database requirements** (UI, docs, tests, CI only)
3. **`main` and `staging0217` are in sync** — both have identical migration files
4. **None of the new PR migrations exist** on either main or staging0217
5. **5 timestamp collisions** exist across PRs that would need resolution before merging
6. **PR #158** modifies an existing migration (social army schema) rather than adding a new one — this is an ALTER of a CHECK constraint
7. **PR #113** has the largest DB footprint: 5 new migration files for the Emergent platform
8. **PR #106** adds 5 new migration files for RGY capsules, notifications, and browser sessions
