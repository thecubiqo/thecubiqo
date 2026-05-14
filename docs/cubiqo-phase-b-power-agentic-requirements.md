# CubiQo Phase B — Power Agentic Requirements

Phase B starts **after Phase A is stable**: CubiQo already understands the user, has memory, can classify intent, can create an RGY capsule, and the user can approve or "shoot" the capsule.

Phase B is where CubiQo becomes **one durable agentic operator**.

It should not be a hardcoded jobs app, Shopify app, social scheduler, startup checklist, or multi-agent swarm. It should be a single durable operating system that can take a user-approved capsule, create a Duo project, build a task graph, determine the best route, assemble the right tools, execute safely with the user in the loop, and learn from the outcome.

## Phase B Definition

**Input:** an approved RGY capsule or explicit user goal.

**Output:** a living Duo Mode project that can plan, research, execute steps, ask for access, ask clarifying questions, request approvals, report progress, recover from failures, and close the goal.

**Hard guardrails that remain forever:**

1. CubiQo does not touch payments or checkout.
2. CubiQo does not final-send, final-submit, final-publish, final-push, or final-deploy without the user pressing the final approval button.
3. CubiQo is a single durable operator first. Specialist handoffs can come later, but the Phase B control plane is not a swarm.
4. Vercel Workflow is the preferred durable runtime for long-running, pause/resume, retryable operator work.
5. Supabase remains the audit, state, and dashboard source of truth.
6. Every project, task, tool call, approval, timeline event, outcome, and self-heal proposal carries a shared `trace_id`.

## Phase B Step Breakdown

Phase B should be divided like Phase A: clear operating steps, each with its own state, logs, test cases, and acceptance criteria.

| Step | Name | What It Does | Source Of Truth | Runtime |
|---:|---|---|---|---|
| B0 | Entry Gate | Starts only from an approved capsule or explicit user goal. Creates `trace_id`. | Supabase | App route |
| B1 | Durable Operator Runtime | Starts/resumes the single operator run, handles pause/resume/retry/timeouts. | Supabase state + workflow run id | Vercel Workflow preferred |
| B2 | Duo Project Creation | Creates the project shell, domain, success criteria, owner, status, and initial timeline. | Supabase `duo_projects` | Operator |
| B3 | Goal Interpretation | Clarifies outcome, missing facts, risks, constraints, required access, and done definition. | Supabase project fields | Operator + LLM |
| B4 | Task Graph Builder | Builds tasks, dependencies, blockers, approvals, questions, artifacts, and measurable outcomes. | Supabase `duo_tasks` | Operator |
| B5 | Risk-Aware Decision Router | Chooses API/MCP/extension/Stagehand-browser/computer-use/manual route per task. | Supabase `duo_tool_calls` + decision record | Operator |
| B6 | Connector Readiness | Checks existing connectors, credentials, OAuth/session state, scopes, limits, and setup needs. | Supabase connector registry | Operator |
| B7 | Tool Execution | Executes safe read/draft/sync/write steps with evidence capture and idempotency. | Supabase tool calls + timeline | Vercel Workflow steps |
| B8 | Approval Gate | Pauses for user approval before final external actions or sensitive writes. | Existing `action_approvals` if working | Workflow pause + app UI |
| B9 | Evidence And Timeline | Stores screenshots, logs, external IDs, API responses, artifacts, and what changed. | Supabase + object storage | Operator |
| B10 | Outcome Writeback | Marks tasks/projects as done/blocked/failed, writes user outcomes, updates memory. | Supabase outcomes + memory | Operator |
| B11 | Self-Report | Produces daily status about cron health, failures, costs, active projects, and blocked tasks. | Supabase audit/admin views | Cron/workflow |
| B12 | Self-Heal Proposal | Diagnoses repeated failures in sandbox/branch, proposes patch, test result, and approval request. | Supabase + Git branch/PR | Sandbox + workflow |
| B13 | Specialist Handoffs Later | Adds specialized workers only after the single operator contract is stable. | Operator remains owner | Later |

### Step Grouping For Delivery

| Delivery Slice | Includes | Why It Matters |
|---|---|---|
| B-Core | B0-B5 | CubiQo can create projects, task graphs, and choose the safest route. |
| B-Execution | B6-B10 | CubiQo can work through tools, pause for approvals, log evidence, and close tasks. |
| B-Ops | B11-B12 | CubiQo can report on itself and propose safe repairs. |
| B-Scale Later | B13 plus public beta monetisation | Specialist handoffs, Stripe, broader networks, and high-scale commercial packaging. |

### Trace Contract

`trace_id` is the spine of Phase B. It lets the dashboard, logs, approvals, retries, and self-heal reports tell one coherent story.

Every one of these records must include `trace_id`:

- `duo_projects`
- `duo_tasks`
- `duo_task_edges`
- `duo_tool_calls`
- `duo_timeline_events`
- `action_approvals` or the equivalent approval table
- `action_audit_logs` or the equivalent audit table
- `duo_outcomes`
- `self_heal_proposals`
- `api_usage_events`

Before creating new approval or audit tables, inspect the existing `action_approvals` and `action_audit_logs` patterns. If they are already working, reuse them and add the missing Phase B fields instead of inventing parallel systems.

## Is This Like Claude/Copilot Coworker?

Similar category, different product shape.

Claude/Copilot-style coworker products usually help inside a work surface: code, documents, browser, office apps, IDEs, or workflows.

CubiQo Phase B is broader: it is a **goal coworker with one durable operator**. It starts from the user's life/business goal, creates a capsule, opens Duo Mode, chooses routes, coordinates tools, and keeps a dashboard of progress, blockers, access needs, approvals, traces, and outcomes.

So the closest mental model is:

> AI coworker + durable operator + operating dashboard + connector router + memory + user-approved action system.

## Are These Covered In Phase B?

| Requirement | Covered by Phase B? | Required capability |
|---|---:|---|
| CubiQo can answer real-time questions about its own codebase | Yes | Codebase workspace, git access, repo index, file search, shell/test runner, architecture memory |
| CubiQo can report about itself daily, including cron jobs | Yes | Observability layer, job_runs, cron health, admin metrics, daily self-report generator |
| CubiQo can convert people to use it | Yes | Conversion engine, anonymous-to-signed-up migration, shareable results, referral loops, onboarding nudges |
| CubiQo can self-heal | Yes | Error detection, route health, retry queues, regression tests, safe patch proposal, human approval before deploy |
| CubiQo can choose browser vs API vs extension vs headless | Yes | Decisioning/routing layer with risk, auth, reliability, compliance, and evidence scoring |
| CubiQo can run Shopify/POD, social, domains, AI comparison, local events, startup work | Yes | Domain-agnostic task graph + connector registry + Duo Mode templates |
| CubiQo can integrate a totally new tool when a user needs it | Yes, with limits | Tool onboarding protocol, connector request flow, user-provided credentials/OAuth, MCP/plugin wrapper |
| CubiQo can do "anything under the sun" | Directionally, but not literally | It can attempt any permitted digital workflow with available access, but must respect platform rules, safety, credentials, and user approval |

## Phase B Canonical Pipeline

```text
APPROVED RGY CAPSULE / EXPLICIT GOAL
  ↓
DURABLE OPERATOR RUNTIME
  One operator run, preferably Vercel Workflow, with trace_id, pause/resume, retries, and state checkpoints.
  ↓
DUO PROJECT CREATION
  Creates the project shell, success criteria, owner, dashboard state, and first timeline event.
  ↓
GOAL INTERPRETER
  What outcome does the user actually want?
  What does "done" mean?
  What constraints, risks, and approvals exist?
  ↓
TASK GRAPH BUILDER
  Breaks goal into steps, dependencies, blockers, questions, tools, and checkpoints.
  ↓
DECISIONING / ROUTE PLANNER
  Chooses API, MCP/plugin, extension, Stagehand/Browserbase, computer-use browser, code env, or manual ask.
  ↓
CONNECTOR + PLAYGROUND REGISTRY
  Knows what CubiQo can access right now and what needs user setup.
  ↓
DUO MODE DASHBOARD
  Dynamic project UI generated from Supabase project/task state, not hardcoded screens.
  ↓
EXECUTION ENGINE
  Performs safe steps, asks questions, requests approvals, logs every action with trace_id and evidence.
  ↓
FEEDBACK + OUTCOME LOOP
  Learns what worked, updates memory, updates playbooks, improves future routing.
  ↓
OBSERVABILITY + SELF-HEALING
  Detects failures, retries, reports daily, proposes fixes, opens PRs or asks for approval.
```

## The Decisioning Layer

The decisioning layer is the heart of Phase B.

It answers:

> "Given this goal, what is the safest, most reliable, least detectable, highest-quality way to complete it?"

It must not blindly choose Puppeteer/headless browser just because it can. For example, job applications, social posting, dating/social platforms, and commerce dashboards can create detection or account-risk issues. The router must consider that before selecting a method.

### Route Preference Order

Default preference:

1. Official API with user OAuth/token
2. First-party connector/plugin already installed
3. MCP server or internal adapter with structured methods
4. Browser extension using the user's authenticated browser session
5. Stagehand/Browserbase for unknown UI where DOM-aware browser work is safer than raw headless scripts
6. Regular visible browser automation with user present
7. Headless browser only for low-risk public pages or owned/admin pages
8. Computer-use vision/browser control for unknown visual UI
9. Ask user to do the final/manual step

### Route Scoring

Each possible route gets scored:

| Factor | Meaning |
|---|---|
| Reliability | Does this method usually work without breaking? |
| Auth availability | Does CubiQo already have user-approved access? |
| Platform policy risk | Could this violate platform rules or trigger abuse detection? |
| Account blocking risk | Could this lock, flag, or ban the user's account? |
| Data sensitivity | Does it touch private, financial, health, identity, or social data? |
| Reversibility | Can the action be undone? |
| User approval need | Is this a final external action? |
| Cost | Does it use paid APIs, browser sessions, vision frames, or LLM calls? |
| Speed | Can it finish within the user expectation? |
| Evidence quality | Can CubiQo observe whether it succeeded? |
| Loop risk | Is the route failing repeatedly and should it escalate? |

### Decision Examples

| Scenario | Best route | Why |
|---|---|---|
| Create Shopify product draft | Shopify Admin API | Official, reliable, auditable |
| Configure unknown POD app UI | Stagehand/Browserbase, then visible browser if needed | Unknown UI needs browser intelligence and evidence |
| Social media draft creation | API/connector if available, otherwise dashboard draft | Publishing needs user approval |
| Job application form | Browser extension or visible browser with user present | Avoid headless detection and allow final review |
| Bulk static websites | Code env + Git + Vercel API | Fast, repeatable, auditable |
| Compare GPT/Claude/Gemini/Grok/Llama | Official provider APIs | Consistent prompt, cost/latency tracking |
| Local events/social activities | Web search + event APIs + user preference filter | No heavy automation needed |
| Red/chatroom app | Product design + safety architecture first | Consent, moderation, age-gating, privacy risk |

## "Eyes" For The AI Model

CubiQo needs multiple kinds of eyes:

1. **Vision input:** image/camera/screenshot understanding through OpenAI vision-capable models.
2. **Browser state eyes:** screenshots, DOM/accessibility tree, URL, cookies/session context, and page text from a controlled browser.
3. **Computer-use eyes:** model observes screenshots and returns actions like click/type/scroll; CubiQo executes them in a sandbox/browser.
4. **Codebase eyes:** repo index, file search, AST/symbol search, git history, test results, build logs.
5. **Runtime eyes:** cron logs, API usage, errors, Vercel deployment state, Supabase health, queue state.
6. **Business eyes:** analytics, conversion events, recommendation quality, user activation, retention, outcomes.

Recommended APIs/layers:

| Need | Recommended layer |
|---|---|
| Understand screenshots/images | OpenAI Responses API with image input |
| Use live/current web | OpenAI web_search for inline answers; Tavily for multi-query research |
| Control arbitrary UI | OpenAI computer-use tool or browser automation wrapper |
| Navigate unknown web apps | Stagehand/Browserbase as preferred unknown-UI browser layer |
| Structured tool use | OpenAI Agents SDK tools / MCP / internal tool registry |
| Authenticated browser work | Browser extension or visible browser session |
| Codebase reasoning | GitHub API, local repo tools, embeddings/file search, test runner |

## Connector Readiness Model

Phase B needs a connector registry, not a hardcoded set of workflows.

Each connector should be described like this:

```ts
type ConnectorCapability = {
  id: string;
  label: string;
  category: 'commerce' | 'social' | 'code' | 'deploy' | 'design' | 'email' | 'ai' | 'events' | 'analytics' | 'database';
  authType: 'oauth' | 'api_key' | 'session' | 'manual' | 'none';
  status: 'available' | 'needs_auth' | 'needs_install' | 'blocked' | 'unknown';
  supportedActions: string[];
  finalActionRequiresUser: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  preferredRoutes: Array<'api' | 'plugin' | 'mcp' | 'extension' | 'stagehand_browserbase' | 'visible_browser' | 'headless' | 'computer_use' | 'manual'>;
  setupRequirements: string[];
  dataSourceOfTruth: 'cubiqo' | 'external' | 'mixed';
};
```

### Preinstalled Connector Categories

Phase B should have these categories ready:

| Category | Examples | Why needed |
|---|---|---|
| Database | Supabase | Duo Mode state, tasks, memory, approvals, logs |
| Code/Git | GitHub, local repo, Codex workspace | Codebase answers, self-healing, PRs |
| Deploy | Vercel | Websites, previews, deploy health |
| Browser | Stagehand/Browserbase, visible browser, headless low-risk, computer use | Unknown sites, visual workflows |
| Extension | authenticated browser session bridge | Safer than headless for logged-in user workflows |
| Commerce | Shopify, Printify/Printful/Gelato | POD/startup/ecommerce goals |
| Social | LinkedIn, X, Instagram, TikTok, YouTube, Reddit, Bluesky | Content workflows, drafts, analytics |
| Design | Canva/GFX tools/image generation/video tools | Marketing assets |
| AI providers | OpenAI, Anthropic, Google, xAI, Llama providers | AI comparison dashboard |
| Email/forms | Resend, SendGrid, Postmark | Contact forms, notifications |
| Analytics | Vercel Analytics, GA4/Plausible/PostHog | Domain launches and conversion |
| Events/local | Google Calendar, Meetup/Eventbrite/web search | Social/community suggestions |
| Docs/files | Google Drive, local files, Supabase Storage | Artifacts, docs, images, reports |

## New Tool Integration In Real Time

If the user asks for a tool CubiQo has never seen before, Phase B should not fail. It should enter a **Tool Onboarding Protocol**.

### Tool Onboarding Protocol

1. Identify the tool and desired outcome.
2. Search for official API/OAuth docs if current access is needed.
3. Check if an MCP server/plugin already exists.
4. Ask user for required access only when needed.
5. Create a connector candidate record.
6. Choose safest first route:
   - official API if available
   - plugin/MCP if available
   - Stagehand/Browserbase for unknown UI
   - browser extension/authenticated browser if user is logged in
   - visible browser/computer use if UI-only
   - manual instruction if unsafe
7. Run a small read-only test first.
8. If successful, enable limited write actions.
9. Always require final user approval for final external actions.
10. Store connector metadata and evidence logs.

### New Tool Record

```ts
type ToolCandidate = {
  trace_id: string;
  name: string;
  website: string;
  userGoal: string;
  apiDocsUrl?: string;
  oauthSupported?: boolean;
  mcpAvailable?: boolean;
  browserOnly?: boolean;
  setupNeeded: string[];
  firstSafeTest: string;
  risks: string[];
  approvedByUser: boolean;
};
```

## Playgrounds CubiQo Needs

Playgrounds are controlled environments where CubiQo can work.

| Playground | Purpose | Boundary |
|---|---|---|
| Supabase playground | Read/write Duo Mode projects, tasks, memory, approvals | RLS, service role server-only |
| Vercel Workflow playground | Durable task execution, pause/resume, retries, delayed steps | Preferred runtime; Supabase still stores state |
| Code playground | Inspect repo, edit files, run tests, propose PRs | No production push without approval |
| Stagehand/Browserbase playground | Navigate unknown UI with DOM/browser intelligence | Preferred browser layer for unknown apps |
| Browser playground | Navigate sites visibly with user context | No final submit without user |
| Headless playground | Public low-risk scraping/checking | Avoid logged-in high-risk platforms |
| Extension playground | Use user's active browser session | Explicit consent and limited actions |
| Vercel playground | Preview deployments, logs, domains | No production promote without approval |
| API playground | Test connectors with dry-run/read-only calls | Escalate writes only after user approval |
| Design/media playground | Generate/edit creative assets | Store artifacts and ask review |
| AI comparison playground | Query multiple model providers | Track cost, latency, prompt, response |
| Analytics playground | Read product/site performance | Read-only by default |

## Duo Mode Dynamic Dashboard

Duo Mode should not be one fixed dashboard. It should be generated from a task schema.

### Core Duo Mode Data Model

```ts
type DuoProject = {
  id: string;
  trace_id: string;
  workflowRunId?: string;
  capsuleId: string;
  domain: string;
  goal: string;
  status: 'planning' | 'blocked' | 'working' | 'awaiting_user' | 'ready_for_approval' | 'done' | 'failed';
  successCriteria: string[];
  tasks: DuoTask[];
  blockers: Blocker[];
  questions: Question[];
  approvals: ApprovalRequest[];
  connectors: ConnectorRequirement[];
  artifacts: Artifact[];
  timeline: TimelineEvent[];
  metrics: ProjectMetric[];
};

type DuoTask = {
  id: string;
  trace_id: string;
  projectId: string;
  title: string;
  status: 'todo' | 'blocked' | 'working' | 'awaiting_user' | 'ready_for_approval' | 'done' | 'failed';
  route?: 'api' | 'mcp' | 'plugin' | 'extension' | 'stagehand_browserbase' | 'visible_browser' | 'headless' | 'computer_use' | 'manual';
  evidenceIds: string[];
};
```

### Dynamic Dashboard Slots

Every Duo Mode project can render these slots:

| Slot | Purpose |
|---|---|
| Goal summary | What CubiQo is trying to achieve |
| Success criteria | What done means |
| Task graph | Steps, dependencies, statuses |
| Access requests | Missing API/OAuth/session credentials |
| Questions | What CubiQo needs from the user |
| Approval requests | Final action gates |
| Blockers | What prevents progress |
| Artifacts | Drafts, files, mockups, code, links |
| External records | Shopify IDs, post IDs, Vercel deployments, provider responses |
| Timeline | What CubiQo did and when |
| Metrics | Results, costs, status, performance |

### Dynamic Examples

| Goal | Duo Mode surface |
|---|---|
| Shopify POD | Products, mockups, pricing, apps, listings, launch checklist |
| Marketing posts | Drafts, assets, review queue, schedule, captions, platform status |
| Bulk domains | Domain list, DNS, Vercel deploys, forms, leads, analytics |
| AI comparison | Provider widgets, prompt history, cost, latency, saved answers |
| Social/community | Local events, comfort filters, calendar, RSVP notes |
| Chatroom app | Consent, moderation, safety flags, matching settings, admin review |
| Investment/startup | Investor CRM, pitch assets, outreach drafts, due diligence, follow-ups |

## Playbooks Must Not Become Hardcoded

Playbooks should be reusable patterns, not fixed scripts.

Store playbooks as versioned templates:

```ts
type Playbook = {
  id: string;
  domain: string;
  goalPattern: string;
  defaultSteps: string[];
  requiredConnectors: string[];
  riskNotes: string[];
  approvalGates: string[];
  researchRequired: boolean;
  lastReviewedAt: string;
};
```

At runtime, CubiQo should:

1. Start with a playbook if one matches.
2. Do live research when the goal depends on current UI, current policies, current prices, or recent platform changes.
3. Adapt the task graph based on available connectors, user answers, and observed external state.
4. Save what worked as a better playbook suggestion.

The playbook is a starting hypothesis, not the truth.

## Self-Knowledge: CubiQo Answers Questions About Itself

Phase B needs a self-observation layer.

### Codebase Awareness

CubiQo should answer:

- Where is this feature implemented?
- What changed recently?
- Why did this build fail?
- Which routes touch memory?
- What hardcoded values remain?
- Which tests cover this workflow?
- What would need to change to support X?

Requirements:

- Repository index
- File search
- Symbol search
- Git diff/history
- Build/test runner
- Architecture docs index
- Runtime config registry
- Link from feature → files → routes → DB tables → tests

### Daily Self-Report

CubiQo should produce a daily self-report:

- Cron jobs that ran
- Cron jobs stale or failed
- Background tasks failed/retried
- New capsules created
- Recommendations shown/clicked/saved
- API cost by provider
- Slow routes
- Error spikes
- Deploy/build status
- Open self-heal suggestions

Required tables/routes:

- `job_runs`
- `api_usage_events`
- `background_trigger_failures`
- `cron_health`
- `self_reports`
- `/api/admin/cron-health`
- `/api/admin/costs`
- `/api/admin/self-report`

## Self-Healing

CubiQo self-healing does not mean silent production changes.

It means:

1. Detect issue.
2. Diagnose cause.
3. Propose fix.
4. Patch in a branch or sandbox.
5. Run tests.
6. Present diff and evidence.
7. Ask user to approve merge/deploy.

Examples:

| Failure | Self-heal action |
|---|---|
| Cron failed | Retry job, log reason, report if repeated |
| API key missing | Mark connector needs_auth and ask user/admin |
| Build fails | Inspect logs, patch likely cause, run tests |
| Route timeout | Identify slow provider, add timeout/fallback |
| Connector auth expired | Refresh token or ask user to reconnect |
| Dashboard stale | Re-sync external source and update task status |
| Test regression | Bisect diff, propose revert/fix PR |

## Conversion Engine

Phase B should help CubiQo grow without dark patterns.

Requirements:

- Anonymous value before signup
- One conversion nudge only after value is created
- "Keep this memory" signup CTA
- Shareable briefing/results
- Referral tracking
- Saved recommendations
- Progress cards
- Milestone cards
- Clear "what CubiQo did for you" summary

Conversion should come from:

> "CubiQo actually helped me move something forward."

Not from popups.

## Startup Success Mode

CubiQo should be useful for founders/newbies trying to launch a startup.

Core startup capabilities:

- Clarify idea and target user
- Market research
- Competitor scan
- Landing page creation
- Domain launch
- Lead capture
- Analytics setup
- Outreach drafts
- Investor CRM
- Pitch deck outline
- Grant/investor/event discovery
- Warm intro tracking
- MVP task graph
- Weekly progress review

Investment help should not be generic LLM advice. It should be workflow-driven:

- Build investor list
- Match investor thesis to startup
- Track outreach status
- Prepare pitch materials
- Compare accelerators/grants
- Flag deadlines
- Draft but not send outreach
- Store notes and follow-ups

## Phase B Requirement Checklist

### Core Agentic Engine

- [ ] Approved capsule launches a Duo Mode project.
- [ ] One durable operator owns the run; no multi-agent swarm in Phase B core.
- [ ] Vercel Workflow is available as preferred durable runtime for pause/resume/retry.
- [ ] Supabase stores dashboard state, audit state, traces, tool call state, and outcomes.
- [ ] `trace_id` exists across project, task, tool call, approval, audit log, timeline, and outcome.
- [ ] Goal interpreter extracts outcome, constraints, success criteria, risk, and missing info.
- [ ] Task graph builder creates steps, dependencies, blockers, questions, approvals.
- [ ] Decisioning layer chooses route using reliability/risk/auth/cost/evidence scoring.
- [ ] Execution engine supports read, draft, write, sync, and final-approval-gated actions.
- [ ] Every action is logged with source, route, result, timestamp, and evidence.
- [ ] Existing `action_approvals` and `action_audit_logs` are reused if they are already working.

### Connector Readiness

- [ ] Connector registry supports category, auth type, status, actions, risk, preferred routes.
- [ ] Missing connector creates access request in Duo Mode.
- [ ] New tool onboarding protocol exists.
- [ ] Read-only test happens before any write action.
- [ ] Final external actions always require approval.
- [ ] Tool capabilities can be added without editing every workflow.
- [ ] Unknown-UI browser work prefers Stagehand/Browserbase before raw headless automation.

### Playgrounds

- [ ] Supabase playground available.
- [ ] Vercel Workflow playground available for durable steps.
- [ ] Code/Git playground available.
- [ ] Stagehand/Browserbase playground available.
- [ ] Browser playground available.
- [ ] Headless browser allowed only for low-risk routes.
- [ ] Browser extension/session bridge available for authenticated workflows.
- [ ] Vercel/deploy playground available.
- [ ] API dry-run playground available.
- [ ] Design/media playground available.
- [ ] AI provider comparison playground available.
- [ ] Analytics playground available.

### Duo Mode

- [ ] Duo Mode dashboard is schema-driven, not hardcoded.
- [ ] Dashboard changes by domain/task/capsule/provider/status.
- [ ] Access requests, questions, blockers, approvals, notes, reminders, artifacts all render from data.
- [ ] Task graph status updates in real time.
- [ ] External IDs and sync logs are stored.
- [ ] User can approve, edit, reject, or ask CubiQo to re-plan.

### Self-Knowledge

- [ ] CubiQo can answer codebase questions from repo/docs/git/tests.
- [ ] CubiQo can explain where a feature lives and what depends on it.
- [ ] CubiQo can inspect build/test failures.
- [ ] CubiQo can report daily cron/API/usage/health status.
- [ ] CubiQo can detect stale jobs and failed background work.

### Self-Healing

- [ ] Failed jobs enter retry queues.
- [ ] Repeated failures create self-heal proposals.
- [ ] Code fixes happen only in branch/sandbox.
- [ ] Tests run before a fix is proposed.
- [ ] User approves merge/deploy.
- [ ] Production-changing actions remain user-gated.

### Conversion

- [ ] Anonymous users get value before signup prompts.
- [ ] Conversion nudge is memory/value based, not spammy.
- [ ] Shareable outputs exist.
- [ ] Referral/milestone loops exist.
- [ ] CubiQo can summarize "what I did for you."
- [ ] Stripe/subscriptions are not an engineering entry gate for Phase B.
- [ ] Public beta can add Stripe after the operator proves value.
- [ ] Paid tiers use fair-use / agentic credits, not vague "unlimited."

### Startup/Product Goals

- [ ] Startup success playbook exists as a flexible template.
- [ ] Investor/outreach/grant workflow supported.
- [ ] Landing/domain launch workflow supported.
- [ ] Commerce/POD workflow supported.
- [ ] Marketing/social workflow supported.
- [ ] AI comparison workflow supported.
- [ ] Local/community workflow supported.
- [ ] High-risk social/chatroom workflow requires strict safety and consent.

### Safety

- [ ] Payments blocked.
- [ ] Final send/submit/publish/push/deploy requires explicit approval.
- [ ] Platform policy risk checked before automation route.
- [ ] Headless automation blocked for high-detection-risk scenarios unless explicitly safe.
- [ ] Sensitive data access is consented and logged.
- [ ] Red/high-risk projects require extra moderation/age/consent controls.
- [ ] Specialist handoffs are later and cannot bypass the single operator, trace, or approval contract.

## Final Phase B Summary

Phase B is not "build more fixed workflows."

Phase B is:

> Give CubiQo one durable operator, Vercel Workflow-backed execution, Supabase-backed state, controlled playgrounds, a connector registry, a route decisioning brain, a dynamic Duo Mode project surface, traceable evidence, and approval-gated execution.

Then CubiQo can approach almost any goal by asking:

1. What is the desired outcome?
2. What information is missing?
3. Which tools are available?
4. Which route is safest and most reliable?
5. What can I do now?
6. What requires user approval?
7. How do I prove it worked?
8. What should I learn for next time?

That is the power agentic version.
