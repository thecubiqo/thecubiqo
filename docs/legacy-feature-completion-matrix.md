# QA Legacy Feature Completion Matrix

Date: 2026-05-06
Branch: `QA/lagacy_feature_branch`

## Complete In QA Legacy

| Feature | Current completion | Done means |
|---|---|---|
| Landing/cube/particle visual ideas | Complete enough for QA | Landing loads, launches to app, uses current visual direction, and preserves QA/prod routing. |
| Left tray controls | Complete enough for QA | Theme toggle, auth entry, daily journal CTA, CubiQo size controls, and dashboard entry work from the tray. |
| Auth / sign-in | Functionally present | Email/password auth works with Supabase, profile sync works, auth state renders in the tray. Magic-link/passkey are not yet included. |
| RGY keyword panel UI/local behavior | Complete enough for QA | RGY bands, selected glow/dim behavior, keyword capture, local/session keyword behavior, and side panel UI are present. |
| Dashboard basics / feature console | Complete shell | `/dashboard` loads, shows account status, stats where available, journal local fallback, and all legacy workstreams with gates. |

## Code Ready But Not End-To-End Complete

| Feature | Missing | Complete means | Closure path |
|---|---|---|---|
| Daily Journal cloud backend/history | Supabase `journal_entries` migration is not applied. | Signed-in save, fetch history, stats count, RLS, and regression all pass against QA Supabase. | Apply `supabase/migrations/20260506000000_daily_journal.sql`, rerun `npm run verify:cqai`. |
| Dashboard account stats | Journal count waits on journal table. | Dashboard stats pull conversations, keywords, journals, and recent activity for signed-in users. | Complete journal migration, then expand `/api/dashboard`. |
| RGY router backend | Current QA is mostly UI/session RGY behavior. | Intent classification, model routing, failover, direct override, and telemetry all have API tests. | Add current-stack `/api/rgy/route`, provider selection, and tests. |

## Moved As Visible/Gated Workstreams, Not Complete

| Feature | Current QA status | Complete means |
|---|---|---|
| Job Hunter | Card in dashboard; scope pending. | Profile/resume store, job pipeline, approved search/import, cover letter generation, user-reviewed application packets, audit trail, and compliant browser handoff. |
| Website launcher / sites | Card in dashboard. | Site/project records, template picker, generated content, deployment workflow, preview links, and owner approval before publish. |
| Ecomm business pack | Card in dashboard. | Product/catalog setup, provider integrations, store launcher, payment/provider secrets, fulfillment status, and QA test order flow. |
| Social Army 10/10/10 | Card in dashboard. | Admin planner, queue, content generation, approvals, platform account config, provider/API integration, worker execution, and posting logs. |
| Agent engine | Card in dashboard. | Tool registry, task planner, durable runs, permissions, memory/audit trail, and safe execution boundary. |
| Coder / Studio | Card in dashboard. | Read-only repo inspector first, then sandboxed edits, tests, PR creation, and explicit user approval. |
| Browser automation | Card in dashboard. | Consent model, isolated browser runtime, visible steps, site policy gates, credentials boundary, logs, and manual takeover. |
| Chrome extension / side panel | Not ported into app bundle. | Separate extension package, QA/prod config, permissions review, browser-store path, and app pairing. |
| CQ-to-CQ messaging / CQ number | Right panel placeholder only. | CQ identity tables, realtime messaging, contacts, blocking/reporting, and optional call signaling/TURN. |
| Self-heal / self-report | Card in dashboard. | Read-only diagnostics first, report storage, alerting, and owner-approved repair playbooks. |
| BYO API keys | Not implemented. | Encrypted vault, per-user key storage, validation, revocation, and provider-level audit. |
| Wallet / crypto / QR release | Not implemented. | Threat model, provider selection, wallet/connect flow, escrow/release rules, and compliance review. |
| Food/taxi/smart-home | Not implemented. | Provider selection, OAuth/connectors, user confirmation, no-surprise purchase/action gates, and test flows. |
| Biometrics / camera awareness | Card in dashboard. | Explicit opt-in, local permissions, purpose labels, no retention by default, and multimodal reactions behind consent. |
| Security / antivirus | Not implemented as antivirus. | Use real malware scanning service or OS integration; current legacy traces are scanning/reporting helpers only. |

## Not Moved Yet

- Real legacy source folders for `social-army/`, old agents, Puppeteer browser, extension package, and old admin dashboards are not bulk-copied into the current branch because they do not match the current Next/Supabase/Vercel architecture cleanly.
- The correct path is still feature-by-feature: schema, API, UI, test, UAT, then mark complete.
