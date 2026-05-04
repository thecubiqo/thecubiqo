# Legacy Agentic CubiQo Audit

Date: 2026-05-04

## Current Finding

The legacy codebase did contain substantial agentic work. Most of it lives on `origin/staging0217` and related backup branches, not in the current QA React/Vercel baseline.

The work was not only conversational chat. It included an agent engine, browser automation, self-heal/self-reporting, monitoring, admin/NOC pages, sandboxed terminal APIs, and security scanning workflows. Some parts were real code. Some parts were scaffolding or simulations that would need hardening before production.

## Major Legacy Systems Found

### 1. Agent Engine

Branch/source:
- `origin/staging0217`

Key files:
- `src/lib/engine/agent.ts`
- `src/lib/engine/bootstrap.ts`
- `src/lib/engine/tools.ts`
- `src/lib/engine/router.ts`
- `src/lib/engine/session.ts`
- `src/lib/engine/memory.ts`
- `src/app/api/agents/*`

What it provided:
- Agent registry and `AgentInstance`
- Agent sessions and history
- Tool calling loop
- Subagent spawning
- Agent-to-agent messaging
- Per-agent/task workspaces
- Route-to-agent keyword router
- Bootstrapped agents:
  - `a1` / Henry: coordinator
  - `a2` / Dev: engineering/coding
  - `a3` / Writer
  - `a4` / Tester
  - `a5` / Marketing
  - `a6` / Animator
  - `a7` / Business

Important limitation:
- This was a custom hand-rolled agent loop on top of legacy provider wrappers. For QA now, the better path is to preserve the product concepts but reimplement the loop with OpenAI Agents SDK or Vercel AI SDK tooling.

### 2. Coder / Self-Coding Design

Key file:
- `CUBIQO_SELF_CODING_ENGINE.md`

What it described:
- Henry coordinating Dev, Tester, Writer, Marketing
- Dev writing code
- Tester verifying
- Writer documenting
- Git and deploy tooling
- File workspace browser
- Sessions, tools, memory, channels, browser APIs

Important limitation:
- The spec was aspirational in places. Some core pieces existed, but it was not a finished Codex-grade coding agent.

### 3. Headless Browser

Key files:
- `src/lib/browser/browser-service.ts`
- `src/app/api/browser/route.ts`
- `src/lib/engine/browser-tool.ts`
- `chrome-extension/manifest.json`
- `chrome-extension/service-worker.js`
- `chrome-extension/content-script.js`
- `chrome-extension/sidepanel.html`
- `chrome-extension/sidepanel.js`
- `public/clawdbot-chrome-extension.tar.gz`
- `tests/chrome-extension.test.ts`
- `supabase/migrations/20260217000001_browser_sessions_and_actions.sql`
- `supabase/migrations/20260217000002_browser_consent_records.sql`

What it provided:
- Puppeteer-based headless browser service
- Start session
- Navigate
- Click
- Type
- Screenshot
- Scrape/extract content
- Fill form
- Consent hooks
- Browser session/action tables
- Chrome extension side panel
- Active-tab context tracking
- Browser-control bridge from CubiQo iframe to Chrome extension APIs
- Content-script actions:
  - get page content
  - click selector
  - type into selector
  - extract text/links/images
  - scroll
- Extension service-worker actions:
  - list tabs
  - navigate tabs
  - close tabs
  - capture visible screenshot

The extension flow was:

```
CubiQo side-panel iframe
  -> postMessage(BROWSER_CONTROL)
  -> chrome-extension sidepanel.js
  -> service-worker.js
  -> Chrome tabs API or content-script.js
  -> BROWSER_CONTROL_RESULT back to CubiQo iframe
```

Important limitation:
- The server-side browser assumed Puppeteer/Chrome in the server runtime. That is not a good fit for Vercel serverless QA.
- The extension was wired to `http://localhost:3000/side-panel?mode=extension` in `sidepanel.html`; production would need that iframe URL rebuilt for `https://www.qa.cubiqo.ai` or `https://www.cubiqo.ai`.
- The extension had broad `<all_urls>` host permissions. That is powerful and needs explicit consent, clear install copy, and likely narrower permission gating before public release.
- The browser relay tool expected `BROWSER_RELAY_URL` defaulting to `http://127.0.0.1:18791`, but I have not found the actual relay server implementation yet. The extension itself could control tabs internally, while the agent engine's `browser-tool.ts` expected a separate relay API.

### 4. Live Search / Web Fetch

Key file:
- `src/lib/engine/web-tools.ts`

What it provided:
- Brave Search API tool via `BRAVE_API_KEY`
- Web fetch through Jina reader for cleaned markdown

Migration value:
- This maps cleanly to current CubiQo. Keep the concept; wire it as a formal tool in the new agent framework.

### 5. Self-Heal / Self-Reporting

Key files:
- `src/lib/self-heal/core.ts`
- `src/lib/self-heal/diagnostics.ts`
- `src/lib/self-heal/repairs.ts`
- `src/lib/self-heal/report.ts`
- `src/lib/self-heal/rollback.ts`
- `src/lib/self-heal/email.ts`
- `src/app/api/admin/self-heal/*`
- `src/app/api/cron/self-heal/route.ts`
- `.github/workflows/self-heal-cron.yml`
- `supabase/migrations/20260215000001_self_heal_reports.sql`
- `supabase/migrations/20260217000002_add_self_healing_feature.sql`

What it provided:
- Daily self-heal cron concept
- Diagnostics for memory, environment, endpoint health, database, sessions, agents
- Safe repair attempts
- Rollback patch generation
- Signed reports
- Email reporting
- Admin UI for last reports
- Database audit trail

Important limitation:
- Some diagnostics/repairs were simulated or placeholder-like. The reporting architecture is reusable; the repair actions need to be made real and conservative.

### 6. Monitoring / NOC / Activity Reporting

Key files:
- `.github/workflows/activity-monitor.yml`
- `.github/workflows/deployment-monitor.yml`
- `.github/workflows/emergent-merge-monitor.yml`
- `src/app/api/monitoring/activity/route.ts`
- `src/app/api/monitoring/dashboard/route.ts`
- `src/app/admin/noc/page.tsx`
- `src/app/admin/monitoring/page.tsx`
- `supabase/migrations/20260219000001_monitoring_events.sql`

What it provided:
- GitHub/Vercel activity monitor workflows
- Deployment health checks
- Monitoring events table
- Admin dashboard data endpoint
- NOC page with agent/activity view

Migration value:
- Strong fit for QA. We can reintroduce a small `/api/ops/status` first, then expand into a NOC dashboard later.

### 7. Security / Antivirus-Like Layers

Key files:
- `.github/workflows/security.yml`
- `src/lib/security/link-scanner.ts`
- `src/lib/security/fraud-detection.ts`
- `src/lib/security/rate-limit.ts`
- `src/lib/security/headers.ts`
- `src/proxy.ts`

What it provided:
- `npm audit`
- CodeQL
- TruffleHog secret scanning
- License checker
- Link/phishing scanner
- Fraud/rate-limit/security header helpers

Important clarification:
- I did not find a true runtime antivirus engine such as ClamAV. The legacy “antivirus/security” layer was closer to dependency scanning, secret scanning, suspicious link detection, fraud detection, rate limiting, and security headers.

### 8. Sandboxed Terminal / Workspace Execution

Key files:
- `src/lib/code-execution/sandbox.ts`
- `src/app/api/code/terminal/route.ts`
- `src/app/api/emergent/terminal/route.ts`
- `src/app/api/emergent/workspaces/route.ts`
- `src/lib/emergent/runner/docker-manager.ts`
- `supabase/migrations/20260218064854_emergent_runner.sql`
- `supabase/migrations/20260219130000_add_workspace_deployment_tables.sql`

What it provided:
- Command allow/block lists
- Workspace isolation by user/session
- Terminal API with auth and rate limiting
- Background process tracking
- Docker/workspace data model

Important limitation:
- This should not be moved directly into public QA. For a Codex-like CubiQo, execution should happen in a dedicated sandbox service or Vercel Sandbox-style environment, not inside the main app runtime.

### 9. CQ-to-CQ Messaging, CQ Number, And Communication Identity

Key files:
- `supabase/migrations/20260215000002_cq_system.sql`
- `supabase/migrations/20260218000001_cubiqo_communication_fields.sql`
- `src/lib/cq-to-cq/*`
- `src/types/cq.ts`
- `src/hooks/useDirectMessages.ts`
- `src/components/cq/*`
- `src/app/api/messages/route.ts`
- `CUBIQO_COMMUNICATION_IMPLEMENTATION.md`
- `CQ_SYSTEM_IMPLEMENTATION.md`

What it provided:
- CQ handle format: `CQ` plus three alphanumeric characters, for example `CQ7A2`
- Friends/contact table
- Friend requests with `pending`, `accepted`, `blocked`
- Direct messages with read/unread status
- Voice-delivered flag for messages
- Realtime Supabase subscription for incoming messages
- CQ communication UI components:
  - `CQBadge`
  - `AddFriend`
  - `FriendsList`
  - `FriendRequest`
  - `ChatWindow`
  - `MessageBubble`
  - `MessageInput`
  - `CallControls`
  - `SidePanel`
- WebRTC call scaffolding for audio/video and screen sharing
- Generated communication fields:
  - `cubiqo_email`
  - `cubiqo_phone`

Important limitation:
- The generated phone value was a branded placeholder format like `+1-CUBIQO-12345`, not a real carrier-provisioned phone number by itself. Real calling/SMS would still need Twilio, Telnyx, Vonage, or another telephony provider.
- WebRTC signaling existed, but would need production signaling, TURN servers, consent, and mobile QA before it can be considered reliable.

### 10. Premium Side Panels

Key files:
- `chrome-extension/sidepanel.html`
- `chrome-extension/sidepanel.js`
- `src/app/side-panel/page.tsx`
- `src/components/cq/SidePanel.tsx`
- `src/components/cq/ChatWindow.tsx`

What it provided:
- Chrome extension side panel shell
- Embedded CubiQo app iframe for extension mode
- Current page context displayed in a compact top status bar
- Slide-in CQ communication panel
- Friends/requests/chat views
- Dark, compact, premium-style UI foundation

Important limitation:
- The extension `sidepanel.html` still pointed at localhost in the legacy branch. It needs an environment-specific build step for QA/prod URLs.
- The current QA baseline does not include the old Next.js side-panel route. Porting it requires rebuilding the side panel in the current React app or moving the current app back toward the legacy Next.js structure.

## Recommendation For Current QA

Do not wholesale merge `origin/staging0217`. The current QA baseline is a small React app plus Vercel functions; the legacy code is a much larger Next.js App Router product. Direct merging would create build and architecture breakage.

Use a hybrid approach:

- Use an agent framework for the agent loop: OpenAI Agents SDK or Vercel AI SDK.
- Keep in-house/product-specific engineering for CubiQo identity, CQ-to-CQ, RGY, side panels, voice, memory, browser permissions, self-reporting, and admin/NOC.

The framework should provide the generic agentic switch: tool calling, multi-step reasoning, traces, handoffs, guardrails, and sessions.

The in-house layer should provide the CubiQo-specific operating system: who the user is, their CQ number, what a CQ-to-CQ message means, how RGY gates behavior, which browser actions require approval, what gets stored in Supabase, and what appears in the premium side panels.

Salvage the concepts in this order:

1. Add an agent tool registry to current `/api/converse`.
2. Replace ad hoc chat with OpenAI Agents SDK or Vercel AI SDK multi-step tools.
3. Implement safe tools first:
   - `runtime_status`
   - `self_inspect`
   - `web_search`
   - `web_fetch`
   - `supabase_memory`
   - `rgy_classifier`
4. Add self-reporting:
   - `/api/ops/status`
   - `/api/ops/self-heal/run`
   - `self_heal_reports` table
5. Add browser automation through Browserbase/Playwright/Stagehand, not local Puppeteer.
6. Add coding mode only behind founder/admin approval and sandboxed workspace execution.
7. Rebuild NOC/admin views after the backend signals are real.
8. Restore CQ-to-CQ and side panels after auth/profile identity is stable in QA.

## Bottom Line

The legacy work confirms the original CubiQo direction: independent agents, browser control, self-healing, reporting, secure workspaces, and a coder mode. The usable product path now is not to resurrect it exactly, but to port the intent into the current QA app using a modern agent framework and safer hosted tooling.
