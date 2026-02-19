# CubiQo Emergent — Complete Requirements Extraction

> **Version**: 1.0  
> **Date**: 2026-02-19  
> **Status**: Requirements 100% Specified | Implementation 40% Complete  
> **Audience**: @mo @jo @guy @blossom @bubbles @buttercup @pushpa

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Overview](#2-system-overview)
3. [What's Complete (40%)](#3-whats-complete-40)
4. [Frontend Studio UI Requirements](#4-frontend-studio-ui-requirements)
5. [Runner System Requirements](#5-runner-system-requirements)
6. [Deployment Flow Requirements](#6-deployment-flow-requirements)
7. [Post-Launch OS Requirements](#7-post-launch-os-requirements)
8. [Technical Specifications](#8-technical-specifications)
9. [Database Extensions Required](#9-database-extensions-required)
10. [API Endpoints Required](#10-api-endpoints-required)
11. [Component Library Required](#11-component-library-required)
12. [Performance Benchmarks](#12-performance-benchmarks)
13. [Security Requirements](#13-security-requirements)
14. [Monetization Integration](#14-monetization-integration)
15. [Integration Points](#15-integration-points)
16. [Success Criteria](#16-success-criteria)
17. [Implementation Roadmap](#17-implementation-roadmap)
18. [Team Assignments](#18-team-assignments)
19. [Risk Assessment](#19-risk-assessment)
20. [Appendix: Existing Asset Inventory](#20-appendix-existing-asset-inventory)

---

## 1. Executive Summary

CubiQo is an **Emotional AI Companion** platform built as a Next.js monorepo with a multi-agent orchestration engine called "Emergent." The system enables users to interact with AI agents, create custom workflows, execute code, and manage deployments — all through an integrated web experience.

### Current State

| Area | Status | Detail |
|------|--------|--------|
| **Architecture** | ✅ Complete | Monorepo, Buckets strategy, 3-tier deployment |
| **Database** | ✅ Complete | 52+ tables, 22 migrations, RLS on all tables |
| **Backend APIs** | ✅ Complete | 76 API routes across 32 domains |
| **Security** | ✅ Complete | AES-256-GCM, WebAuthn, RLS, RBAC, audit logging |
| **CI/CD** | ✅ Complete | Vitest (32 tests), GitHub Actions, Chromatic |
| **Agent Engine** | ✅ Complete | 7 agents, 14+ tools, LLM router, session management |
| **Frontend Components** | ⚠️ Partial | 109 components, 48 pages — Studio UI pending |
| **Runner System** | ❌ Pending | Task queue, execution runtime, communication bus |
| **Deployment Flow** | ❌ Pending | One-click deploy, versioning, environment management |
| **Post-Launch OS** | ❌ Pending | Monitoring, auto-scaling, analytics dashboard |

### Completion Breakdown

```
██████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 40% Complete
```

- **Complete (40%)**: Architecture, Database (52+ tables), Backend APIs (76 routes), Security, CI/CD, Agent Engine, Integration Playbooks
- **Requirements Ready (100%)**: All pending areas fully specified
- **Pending Implementation (60%)**: Frontend Studio UI, Runner System, Deployment Flow, Post-Launch OS

---

## 2. System Overview

### 2.1 Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend** | Next.js | 14.2.25 |
| **UI Library** | React | 18.3.1 |
| **Language** | TypeScript | 5.x |
| **Styling** | Tailwind CSS | 3.x |
| **3D Graphics** | Three.js / React Three Fiber | 8.16.8 |
| **Animation** | Framer Motion | 12.34.0 |
| **Code Editor** | Monaco Editor | 0.55.1 |
| **Charts** | Recharts | 2.12.7 |
| **Database** | Supabase (PostgreSQL) | Latest |
| **Auth** | Supabase Auth + WebAuthn | FIDO2 |
| **Deployment** | Vercel | Edge Network |
| **Testing** | Vitest | 4.0.18 |
| **Visual Testing** | Chromatic / Storybook | Latest |

### 2.2 Architecture: Buckets Strategy

The system is organized into 5 independent "Buckets" for scalability:

| Bucket | Location | Responsibility |
|--------|----------|----------------|
| **Core Brain** | `src/app` | Main UI, Chat, Router, Auth |
| **Control Room** | `src/app/admin` | Admin Dashboard, monitoring, feature toggles |
| **Social Army** | `social-army/` | Social media automation, content posting |
| **Agents** | `agents/` | Standalone AI agents for offline tasks |
| **Extension** | `chrome-extension/` | Browser extension, Ghost Mode |

### 2.3 AI Provider Support

The LLM Router (`src/lib/ai/llm-router.ts`) supports 7 providers:

| Provider | Models | Use Case |
|----------|--------|----------|
| **Anthropic** | Claude 3.5 Sonnet, Claude 3 Haiku | Primary reasoning |
| **Emergent** | Claude via custom endpoint | Default agent provider |
| **OpenAI** | GPT-4, GPT-3.5 | Fallback, embeddings |
| **Google** | Gemini Pro, Gemini Flash | Multimodal tasks |
| **Groq** | Llama, Mixtral | Fast inference |
| **Mistral** | Mistral Large, Medium | European compliance |
| **OpenRouter** | Various | Cost optimization |

### 2.4 Deployment Pipeline

```
┌─────────────┐     ┌──────────────┐     ┌────────────────────┐
│   Staging    │ ──► │  Production  │ ──► │ Production Fallback│
│ (staging0217)│     │    (main)    │     │  (safety valve)    │
└─────────────┘     └──────────────┘     └────────────────────┘
     Push              PR Merge            Manual Revert Only
```

- **Staging**: Integration testing, dummy data, internal only
- **Production**: Live traffic, real users, auto-deploy on merge
- **Fallback**: Last known good config, manual activation only

---

## 3. What's Complete (40%)

### 3.1 Database Schema — 52+ Tables Across 12 Domains

| Domain | Tables | Status |
|--------|--------|--------|
| **Core Auth** | profiles, sessions | ✅ |
| **Conversations** | conversations, messages, memory, events | ✅ |
| **Integrations** | user_integrations, connections, deployments | ✅ |
| **Experiments** | experiments, experiment_assignments, experiment_events | ✅ |
| **Admin** | audit_logs | ✅ |
| **Feature Flags** | feature_flags, feature_flag_audit, feature_flag_webhooks, feature_flag_webhook_logs, design_toggles, features_catalog, user_feature_toggles | ✅ |
| **Journal** | journal_entries, journal_analytics, email_queue | ✅ |
| **Journey Memory** | journey_consents, journey_memories, journey_rollback_logs, journey_metrics | ✅ |
| **Self-Healing** | self_heal_reports, self_heal_audit_logs | ✅ |
| **CQ Messaging** | cq_numbers, cq_friend_requests, cq_contacts, cq_conversations, cq_messages, cq_calls, cq_screen_shares, cq_notifications, cq_privacy_settings, cq_voice_synthesis, cq_premium_status | ✅ |
| **Social Army** | social_accounts, social_campaigns, content_queue | ✅ |
| **Monetization** | subscription_tiers, user_subscriptions | ✅ |

**Key Features**:
- pgvector extension for semantic similarity search (journey_memories)
- Color-state routing for AI conversations (ORANGE/RED/YELLOW/GREEN_BLUE)
- CQ number rotation (30-day anonymous identity)
- 150+ Row Level Security policies
- 100+ performance indexes

### 3.2 Backend APIs — 76 Routes Across 32 Domains

#### Agent Management
| Route | Methods | Description |
|-------|---------|-------------|
| `/api/agents` | GET, POST | List/create agents |
| `/api/agents/[id]/run` | POST | Execute prompt on agent |
| `/api/agents/[id]/spawn` | POST | Spawn async background task |
| `/api/agents/[id]/sessions` | GET | List agent sessions |
| `/api/agents/[id]/message` | GET, POST | Agent-to-agent messaging |
| `/api/agents/[id]/tasks` | GET | Agent task status |
| `/api/agents/activity` | GET | Activity feed (last 50) |
| `/api/agents/reports` | GET | Agent reports |

#### Code Execution
| Route | Methods | Description |
|-------|---------|-------------|
| `/api/code/execute` | POST | Run code (Python/JS/TS/Bash) |
| `/api/code/terminal` | GET, POST, DELETE | Shell terminal emulation |
| `/api/code/file-ops` | POST | File CRUD operations |

#### AI & Communication
| Route | Methods | Description |
|-------|---------|-------------|
| `/api/chat` | POST | Main chat endpoint |
| `/api/coder` | POST | AI code generation (MiniMax + OpenClaw) |
| `/api/browser` | POST | Browser automation |
| `/api/voice` | POST | Voice processing |
| `/api/stt` | POST | Speech to text |
| `/api/tts` | POST | Text to speech |
| `/api/verbal-command` | POST | Natural language commands |

#### Admin & Features
| Route | Methods | Description |
|-------|---------|-------------|
| `/api/admin/audit` | GET, POST | Audit log management |
| `/api/admin/self-heal/*` | GET, POST | Self-healing system |
| `/api/admin/features` | GET, POST | Feature management |
| `/api/admin/designs` | GET, POST | Design toggles |
| `/api/admin/experiments/*` | GET, POST | A/B testing |
| `/api/admin/connections/*` | GET, POST | OAuth connections |
| `/api/admin/journey/*` | GET, POST | Journey management |
| `/api/feature-flags/*` | GET, POST | Feature flag CRUD |
| `/api/founders-pass/*` | GET, POST | Founders pass system |

#### Data & Memory
| Route | Methods | Description |
|-------|---------|-------------|
| `/api/journal/*` | GET, POST | Journal entries & stats |
| `/api/journey/*` | GET, POST | Journey consent, memories, similarity |
| `/api/memory/*` | GET, POST, DELETE | Memory CRUD, search, extract |
| `/api/messages` | POST | Message handling |
| `/api/sessions/[id]/compact` | GET, POST | Session compaction |
| `/api/files/*` | GET | File tree & read |

#### System
| Route | Methods | Description |
|-------|---------|-------------|
| `/api/health` | GET | Health check |
| `/api/ai-stats` | GET | AI usage statistics |
| `/api/cron/self-heal` | POST | Scheduled self-heal |
| `/api/webhooks/telegram` | POST | Telegram webhook |
| `/api/integrations/telegram` | POST | Telegram integration |

### 3.3 Agent Engine

**7 Default Agents** (initialized in `src/lib/engine/bootstrap.ts`):

| ID | Name | Role | Tools | Max Concurrent |
|----|------|------|-------|----------------|
| a1 | Henry | Project Lead, Architect | 11 tools | 5 |
| a2 | Dev | Technical Architect | 9 tools | 3 |
| a3 | Writer | Content & Documentation | 7 tools | 3 |
| a4 | Tester | QA & Bug Verification | 6 tools | 2 |
| a5 | Marketing | Social Media & Growth | 11 tools | 3 |
| a6 | Animator | Visual Interactions | 6 tools | 2 |
| a7 | Business | Outreach & Customer Service | 9 tools | 3 |

**14+ Tools** (registered in `src/lib/engine/tools.ts`):

| Tool | Category | Access |
|------|----------|--------|
| `file_read` | File Operations | All agents |
| `file_write` | File Operations | Restricted (founders) |
| `file_list` | File Operations | All agents |
| `file_patch` | File Operations | Dev agents |
| `exec` | Execution | Restricted (founders + dev) |
| `git` | Version Control | Restricted |
| `web_search` | Web (Brave API) | All agents |
| `web_fetch` | Web | All agents |
| `telegram_send` | Communication | Restricted |
| `slack_send` | Communication | Restricted |
| `discord_send` | Communication | Restricted |
| `email_send` | Communication | Restricted |
| `vision_analyze` | AI | Lead agents |
| `sessions_spawn` | Session Mgmt | Restricted |
| `sessions_send` | Session Mgmt | All agents |

### 3.4 Security Layer

- **Authentication**: Supabase Auth (magic links) + WebAuthn/FIDO2 (passwordless)
- **Encryption**: AES-256-GCM tokens, AES-GCM client-side API keys (PBKDF2, 100K iterations)
- **Authorization**: RBAC (founder → admin → user → guest), tool access control
- **Data Protection**: RLS on all 52+ tables (150+ policies), memory privacy zones (green/yellow/red)
- **Audit**: Admin action logging, feature flag audit, self-heal audit, webhook delivery logs
- **Privacy**: CQ number rotation (30-day), configurable data retention, right to deletion

### 3.5 Frontend — 109 Components, 48 Pages

**Component Categories**:
- 3D Scenes (8): EnergyCubeScene, PlasmaWaveField, WaveToCubeMorph, FlowingEnergyCube, LandingCube, TechLandingCube, GlassyAgentCube, AgentActivityCube
- Dev Console (4): PromptPane, LiveCoderPane, DevConsoleHeader, ConfirmationModal
- Agent UI (4): AgentDashboard, AgentCreationModal, CodePanel, FileTree
- Auth (3): AuthButton, OnboardingFlow, HandshakeWizard
- Chat (2): RGYChatGateway, RGYChatsModal
- Admin subsystem, Journal, Journey, Landing, Founders components
- 16 custom hooks, 2 contexts (Auth, Region)

### 3.6 Testing — 32 Test Files

| Category | Count | Examples |
|----------|-------|---------|
| Unit | 14 | Components, analytics, feature flags, auth context |
| Integration | 10 | Auth flows, messaging, onboarding, sandbox |
| Regression | 2 | Critical selectors, visual smoke tests |
| Snapshot | 1 | TopRightCTA |
| E2E | 1 | Landing page |
| Visual | N/A | Chromatic/Storybook |

### 3.7 Integration Playbooks

- ✅ Telegram bot (implemented, bidirectional messaging)
- ✅ GitHub OAuth connection
- ✅ Vercel OAuth connection
- ✅ Supabase connection management
- ✅ Shopify integration (designed)
- ✅ Printify integration (designed)

---

## 4. Frontend Studio UI Requirements

### 4.1 Visual Agent Builder

**User Story**: As a user, I want to visually create AI agents by selecting models, tools, and behaviors, so that I can build custom automation without coding.

**Description**: A drag-and-drop visual interface for creating and configuring AI agents. Users select from available LLM providers, assign tools, define personality (soul), and test their agents — all without writing code.

#### Components Required

| Component | Description | Dependencies |
|-----------|-------------|-------------|
| `AgentStudioCanvas` | Main drag-and-drop canvas for agent building | @dnd-kit/core or react-dnd |
| `ToolPalette` | Sidebar listing all 14+ available tools | Existing tools.ts registry |
| `ModelSelector` | LLM provider/model picker with cost indicators | Existing llm-router.ts |
| `SoulEditor` | Agent personality/prompt editor | Monaco Editor (installed) |
| `WorkspaceManager` | Agent workspace file browser | Existing FileTree component |
| `AgentTestPanel` | Live testing panel — send prompts, see responses | Existing /api/agents/[id]/run |
| `AgentConfigForm` | Form for name, max concurrent, tools selection | New |
| `ToolConfigDrawer` | Per-tool configuration drawer | New |

#### Technical Specifications

```typescript
// AgentStudioCanvas props
interface AgentStudioCanvasProps {
  agentId?: string;           // Edit existing or create new
  onSave: (config: AgentConfig) => void;
  onTest: (prompt: string) => Promise<string>;
  availableTools: ToolDefinition[];
  availableModels: ModelConfig[];
}

// AgentConfig (extends existing type in src/types/agent.ts)
interface StudioAgentConfig extends AgentConfig {
  soul: string;              // System prompt / personality
  workspace: string;         // Workspace path
  icon?: string;             // Agent icon
  color?: string;            // Agent color theme
  description?: string;      // Human-readable description
  triggers?: TriggerConfig[]; // Auto-execution triggers
}
```

#### Acceptance Criteria
- [ ] User can drag tools from palette onto agent canvas
- [ ] User can select LLM provider and model from dropdown
- [ ] User can write/edit agent soul (system prompt) in Monaco Editor
- [ ] User can test agent with sample prompts and see responses
- [ ] Agent configuration persists to Supabase
- [ ] Tool access respects existing RBAC (restricted tools grayed out for non-founders)
- [ ] Canvas renders in < 100ms
- [ ] Tool palette loads in < 200ms

#### UI/UX Requirements
- Desktop-first design with tablet support (min 768px)
- Dark theme consistent with existing CubiQo design system
- Drag handles with visual feedback (ghost preview)
- Tool cards show name, icon, description, access level
- Model selector shows provider, model name, cost per 1K tokens
- Save button with validation (required: name, model, at least 1 tool)

**Monetization Angle**: Free tier = view-only. Pro+ = full Studio access.

---

### 4.2 Workflow Designer

**User Story**: As a user, I want to chain multiple agent actions into a visual workflow, so that complex multi-step tasks run automatically.

**Description**: A node-based graph editor for creating automated pipelines. Users connect action nodes (tool executions), conditional nodes (branching), and trigger nodes (schedule/event/manual) into workflows that execute sequentially or in parallel.

#### Components Required

| Component | Description | Dependencies |
|-----------|-------------|-------------|
| `WorkflowCanvas` | Node-based graph editor | reactflow or elkjs |
| `ActionNode` | Individual action step (tool execution) | Tool registry |
| `ConditionalNode` | Branching logic (if/else/switch) | New |
| `TriggerNode` | Workflow start trigger | Existing cron.ts |
| `ParallelNode` | Fork/join for parallel execution | New |
| `WorkflowToolbar` | Save, run, debug, undo/redo controls | New |
| `WorkflowSidebar` | Node palette and properties panel | New |
| `ExecutionViewer` | Real-time execution visualization | New |

#### Technical Specifications

```typescript
// Workflow definition format (JSON)
interface WorkflowDefinition {
  id: string;
  name: string;
  description?: string;
  version: number;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  triggers: TriggerConfig[];
  variables: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

interface WorkflowNode {
  id: string;
  type: 'action' | 'conditional' | 'trigger' | 'parallel' | 'end';
  position: { x: number; y: number };
  data: {
    label: string;
    toolName?: string;       // For action nodes
    toolParams?: Record<string, any>;
    condition?: string;      // For conditional nodes
    branches?: string[];     // For conditional nodes
    agentId?: string;        // Which agent executes this
  };
}

interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;            // e.g., "true", "false" for conditionals
  type?: 'default' | 'success' | 'failure';
}

interface TriggerConfig {
  type: 'manual' | 'schedule' | 'event' | 'webhook';
  schedule?: string;         // Cron expression
  event?: string;            // Event name to listen for
  webhookPath?: string;      // Webhook URL path
}
```

#### Acceptance Criteria
- [ ] User can drag nodes from sidebar onto canvas
- [ ] User can connect nodes with edges (drag from output to input)
- [ ] User can configure each node's parameters
- [ ] Conditional nodes support if/else branching
- [ ] Parallel nodes support fork/join patterns
- [ ] Workflows can be saved, loaded, and versioned
- [ ] User can run workflow manually and see real-time execution
- [ ] Execution shows node-by-node progress with green (success) / red (failure) highlights
- [ ] Workflow execution start < 3s
- [ ] Node render < 50ms

#### UI/UX Requirements
- Infinite canvas with zoom/pan (mouse wheel, drag)
- Minimap for navigation on complex workflows
- Snap-to-grid alignment
- Auto-layout option (dagre/elkjs)
- Keyboard shortcuts: Delete (remove node), Ctrl+Z (undo), Ctrl+S (save), Ctrl+Enter (run)
- Execution mode: nodes highlight in sequence as they execute

**Monetization Angle**: Free = 0 workflows. Pro = 3 workflows. Commander = unlimited.

---

### 4.3 Live Code Editor Enhancements

**User Story**: As a developer, I want a full-featured code editor with integrated terminal, AI assistance, and multi-file support, so that I can build and test code within CubiQo.

**Description**: Enhance the existing dev-console (Ctrl+` toggle) and CodePanel components into a full IDE experience.

#### Already Exists
- Monaco Editor integration (`@monaco-editor/react` installed)
- `/api/code/execute` — Multi-language execution (Python, JS, TS, Bash)
- `/api/code/terminal` — Shell terminal emulation
- `/api/code/file-ops` — File CRUD operations
- `/api/coder` — AI code generation (MiniMax + OpenClaw)
- Dev Console components: PromptPane, LiveCoderPane, DevConsoleHeader
- FileTree component, CodePanel component

#### Enhancements Required

| Enhancement | Description | Effort |
|-------------|-------------|--------|
| Multi-file tabs | Tab bar for multiple open files | Small |
| Integrated terminal | Terminal panel below editor | Small |
| Git panel | Branch, diff, commit UI | Medium |
| AI assist sidebar | Connect to /api/coder, inline suggestions | Medium |
| File tree DnD | Drag-and-drop file management | Small |
| Split panes | Horizontal/vertical editor splits | Small |
| Syntax highlighting | Auto-detect language from file extension | Small (Monaco built-in) |
| Search & replace | Global search across workspace | Small (Monaco built-in) |

#### Technical Specifications

```typescript
// Enhanced editor props
interface LiveEditorProps {
  workspaceId: string;
  initialFiles?: FileEntry[];
  onExecute: (code: string, language: string) => Promise<ExecutionResult>;
  onSave: (path: string, content: string) => Promise<void>;
  aiAssistEnabled?: boolean;   // Show AI sidebar
  terminalEnabled?: boolean;   // Show terminal panel
  gitEnabled?: boolean;        // Show git panel
}

interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTime: number;
}
```

#### Acceptance Criteria
- [ ] Multi-file tabs with unsaved indicator (dot)
- [ ] Integrated terminal with /api/code/terminal
- [ ] AI code suggestions via /api/coder
- [ ] File tree shows workspace files from /api/files/list
- [ ] Code execution feedback < 3s
- [ ] Editor loads in < 1s
- [ ] Supports Python, JavaScript, TypeScript, Bash

#### Performance Requirements
- Editor load: < 1s
- Code execution feedback: < 3s
- File tree render: < 200ms
- AI suggestion latency: < 2s
- Terminal response: < 100ms

---

### 4.4 Agent Dashboard Enhancements

**User Story**: As an admin, I want to monitor all agents in real-time with performance metrics and cost tracking, so that I can optimize resource usage.

#### Already Exists
- AgentDashboard component
- AgentActivityCube (3D visualization)
- `/api/agents/activity` endpoint
- `/api/ai-stats` endpoint
- Recharts charting library (installed)

#### Enhancements Required

| Enhancement | Description | Effort |
|-------------|-------------|--------|
| Real-time status | WebSocket/SSE agent status updates | Medium |
| Token usage charts | Per-agent token consumption (Recharts) | Small |
| Cost tracking | Dollar cost per agent per day/week/month | Medium |
| Session browser | Browse and replay agent sessions | Medium |
| Task queue viz | Visual task queue with priorities | Small |
| Alert system | Threshold-based alerts (high cost, errors) | Medium |

#### Acceptance Criteria
- [ ] Dashboard shows real-time status for all 7+ agents
- [ ] Token usage chart with daily/weekly/monthly views
- [ ] Cost displayed in USD per agent
- [ ] Session history browsable with message replay
- [ ] Task queue shows queued/running/done/failed counts
- [ ] Dashboard loads in < 2s
- [ ] Charts render in < 500ms

---

## 5. Runner System Requirements

### 5.1 Task Queue Manager

**User Story**: As the system, I want to queue and execute agent tasks in priority order with retry logic, so that resources are used efficiently and tasks don't get lost.

**Description**: A persistent task queue that manages agent task execution with priority, concurrency limits, retry logic, and dead letter handling.

#### Technical Specifications

```typescript
// Task Queue interface
interface TaskQueue {
  enqueue(task: TaskDefinition): Promise<string>;  // Returns taskId
  dequeue(agentId: string): Promise<TaskDefinition | null>;
  complete(taskId: string, result: TaskResult): Promise<void>;
  fail(taskId: string, error: Error): Promise<void>;
  retry(taskId: string): Promise<void>;
  getStatus(taskId: string): Promise<TaskStatus>;
  getQueueLength(agentId?: string): Promise<number>;
}

interface TaskDefinition {
  id: string;
  agentId: string;
  prompt: string;
  priority: 'critical' | 'high' | 'normal' | 'low';
  maxRetries: number;        // Default: 3
  retryDelay: number;        // Default: exponential backoff
  timeout: number;           // Default: 300s (5 min)
  metadata?: Record<string, any>;
  createdAt: Date;
  scheduledFor?: Date;       // Delayed execution
}

interface TaskResult {
  output: string;
  tokenUsage: { input: number; output: number; cost: number };
  executionTime: number;
  toolsUsed: string[];
}

interface TaskStatus {
  state: 'queued' | 'running' | 'done' | 'failed' | 'dead_letter';
  attempts: number;
  lastError?: string;
  result?: TaskResult;
  queuedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}
```

#### Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Enqueue    │ ──► │  Task Queue  │ ──► │   Worker     │
│  (API/Cron)  │     │  (Supabase)  │     │  (Agent)     │
└──────────────┘     └──────────────┘     └──────────────┘
                            │                     │
                            ▼                     ▼
                     ┌──────────────┐     ┌──────────────┐
                     │ Dead Letter  │     │   Results    │
                     │    Queue     │     │  (Supabase)  │
                     └──────────────┘     └──────────────┘
```

#### Acceptance Criteria
- [ ] Tasks queue with priority ordering (critical > high > normal > low)
- [ ] FIFO within same priority level
- [ ] Concurrency respects agent.maxConcurrent setting
- [ ] Failed tasks retry 3 times with exponential backoff (1s, 4s, 16s)
- [ ] After max retries, task moves to dead letter queue
- [ ] Task pickup latency < 100ms
- [ ] Queue operations (enqueue/dequeue) < 10ms
- [ ] Queue persists across server restarts (Supabase-backed)
- [ ] Task timeout enforcement (kill after timeout)

#### Database Table Required

```sql
CREATE TABLE task_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL,
  prompt TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal',
  state TEXT NOT NULL DEFAULT 'queued',
  attempts INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  timeout_seconds INTEGER DEFAULT 300,
  result JSONB,
  error TEXT,
  metadata JSONB,
  scheduled_for TIMESTAMPTZ,
  queued_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  CONSTRAINT valid_state CHECK (state IN ('queued', 'running', 'done', 'failed', 'dead_letter')),
  CONSTRAINT valid_priority CHECK (priority IN ('critical', 'high', 'normal', 'low'))
);

CREATE INDEX idx_task_queue_agent_state ON task_queue(agent_id, state);
CREATE INDEX idx_task_queue_priority ON task_queue(priority, queued_at);
CREATE INDEX idx_task_queue_scheduled ON task_queue(scheduled_for) WHERE state = 'queued';
```

---

### 5.2 Execution Runtime Enhancements

**User Story**: As the system, I want sandboxed execution environments with persistent state, resource monitoring, and streaming output, so that agent tasks run safely and users get real-time feedback.

#### Already Exists
- `/api/code/execute` — Multi-language execution with sandbox
- `/api/code/terminal` — Shell terminal with background process support
- Per-session workspace isolation (`/tmp/workspace-{sessionId}`)
- 30-second timeout, 10KB output limit

#### Enhancements Required

| Enhancement | Description | Effort |
|-------------|-------------|--------|
| Persistent workspace | Workspace state survives across executions | Medium |
| Resource monitoring | Track CPU, memory, disk per workspace | Medium |
| Streaming output | Server-Sent Events for real-time output | Medium |
| Execution telemetry | Log execution time, resource usage, errors | Small |
| Runtime management | Install/manage language runtimes | Large |
| Warm pools | Keep warm execution environments | Medium |

#### Technical Specifications

```typescript
// Execution Runtime interface
interface ExecutionRuntime {
  execute(request: ExecutionRequest): AsyncGenerator<ExecutionEvent>;
  getWorkspaceState(sessionId: string): Promise<WorkspaceState>;
  getResourceUsage(sessionId: string): Promise<ResourceUsage>;
  cleanup(sessionId: string): Promise<void>;
}

interface ExecutionRequest {
  code: string;
  language: 'python' | 'javascript' | 'typescript' | 'bash';
  sessionId: string;
  timeout?: number;          // Default: 30s
  env?: Record<string, string>;
  workingDir?: string;
  streaming?: boolean;       // Enable SSE output
}

interface ExecutionEvent {
  type: 'stdout' | 'stderr' | 'exit' | 'error' | 'resource';
  data: string;
  timestamp: number;
}

interface ResourceUsage {
  cpuPercent: number;
  memoryMB: number;
  diskMB: number;
  processCount: number;
}
```

#### Acceptance Criteria
- [ ] Workspace state persists between executions within same session
- [ ] Resource usage tracked per workspace (CPU, memory, disk)
- [ ] Streaming output via SSE for long-running tasks
- [ ] Execution telemetry logged to Supabase
- [ ] Cold start < 2s
- [ ] Warm execution < 500ms
- [ ] Output limit configurable per tier (10KB free, 100KB pro, 1MB commander)

---

### 5.3 Agent Communication Bus

**User Story**: As the system, I want agents to communicate with each other via pub/sub messaging, so that multi-agent collaboration happens efficiently.

#### Already Exists
- `/api/agents/[id]/message` — Agent-to-agent direct messaging
- `sessions_send` tool — Send message to existing session

#### Enhancements Required

| Enhancement | Description | Effort |
|-------------|-------------|--------|
| Pub/Sub channels | Topic-based message broadcasting | Medium |
| Message routing | Rules-based message routing | Medium |
| Priority messaging | Priority queue for urgent messages | Small |
| Dead letter handling | Handle undeliverable messages | Small |
| Message history | Searchable message log | Small |

#### Technical Specifications

```typescript
// Communication Bus interface
interface AgentBus {
  publish(channel: string, message: BusMessage): Promise<void>;
  subscribe(channel: string, agentId: string): Promise<void>;
  unsubscribe(channel: string, agentId: string): Promise<void>;
  send(fromAgentId: string, toAgentId: string, message: BusMessage): Promise<void>;
  getHistory(channel: string, limit?: number): Promise<BusMessage[]>;
}

interface BusMessage {
  id: string;
  from: string;              // Agent ID
  channel?: string;          // Pub/sub channel
  to?: string;               // Direct message target
  type: 'request' | 'response' | 'broadcast' | 'alert';
  priority: 'critical' | 'high' | 'normal' | 'low';
  payload: any;
  timestamp: Date;
  ttl?: number;              // Time-to-live in seconds
}
```

#### Acceptance Criteria
- [ ] Agents can publish to named channels
- [ ] Multiple agents can subscribe to same channel
- [ ] Direct agent-to-agent messaging works
- [ ] Priority messages processed before normal messages
- [ ] Undelivered messages go to dead letter after TTL
- [ ] Message delivery < 50ms (direct)
- [ ] Broadcast delivery < 200ms (to all subscribers)
- [ ] Message history searchable

---

## 6. Deployment Flow Requirements

### 6.1 One-Click Deploy

**User Story**: As a user, I want to deploy my agent configuration with one click, so that my agents go live instantly after testing in Studio.

#### Already Exists
- `deployments` table in Supabase
- `connections` table for Vercel OAuth
- Connection management APIs

#### Components Required

| Component | Description | Effort |
|-----------|-------------|--------|
| `DeploymentWizard` | Step-by-step deploy flow | Medium |
| `EnvironmentSelector` | Target environment picker | Small |
| `ConfigValidator` | Pre-deploy validation | Medium |
| `DeploymentMonitor` | Real-time deploy status | Medium |
| `DeploymentHistory` | Past deployments list | Small |

#### Technical Specifications

```typescript
// Deployment flow
interface DeploymentFlow {
  validate(config: AgentConfig): Promise<ValidationResult>;
  deploy(config: AgentConfig, environment: Environment): Promise<Deployment>;
  monitor(deploymentId: string): AsyncGenerator<DeploymentEvent>;
  rollback(deploymentId: string): Promise<Deployment>;
}

interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

interface Deployment {
  id: string;
  agentId: string;
  environment: 'staging' | 'production';
  status: 'validating' | 'building' | 'deploying' | 'live' | 'failed' | 'rolled_back';
  version: string;
  url?: string;
  buildDuration?: number;
  createdAt: Date;
  completedAt?: Date;
}

type Environment = 'staging' | 'production';
```

#### Acceptance Criteria
- [ ] Pre-deploy validation catches config errors before deploy
- [ ] Deploy creates record in Supabase deployments table
- [ ] Real-time status updates during deploy (validating → building → deploying → live)
- [ ] Deploy initiation < 3s
- [ ] Status updates < 5s interval
- [ ] One-click rollback to previous version
- [ ] Deploy requires admin or agent owner role

---

### 6.2 Version Management

**User Story**: As a user, I want to version my agent configurations, compare versions, and rollback to previous versions, so that I can safely iterate on my agents.

#### Components Required

| Component | Description | Effort |
|-----------|-------------|--------|
| `VersionHistory` | List of config versions with timestamps | Small |
| `DiffViewer` | Side-by-side version comparison | Small (Monaco diff) |
| `RollbackButton` | Revert to selected version | Small |
| `VersionTag` | Tag versions with names/labels | Small |

#### Technical Specifications

```sql
CREATE TABLE agent_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  config JSONB NOT NULL,
  diff_from_previous JSONB,
  tag TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(agent_id, version)
);

CREATE INDEX idx_agent_versions_agent ON agent_versions(agent_id, version DESC);
```

#### Acceptance Criteria
- [ ] Each save creates a new version automatically
- [ ] Semantic versioning (auto-increment)
- [ ] Diff view shows changes between any two versions (Monaco diff editor)
- [ ] One-click rollback to any previous version
- [ ] Version tags for labeling (e.g., "v1.0-stable", "pre-refactor")
- [ ] Version history immutable (audit trail)

---

### 6.3 Environment Management

**User Story**: As an admin, I want to manage staging and production environments, promote configurations between them, and configure per-environment settings.

#### Already Exists
- 3-tier deployment pipeline (staging → production → fallback)
- Environment isolation (separate Supabase instances)

#### Components Required

| Component | Description | Effort |
|-----------|-------------|--------|
| `EnvironmentDashboard` | View all environments with status | Medium |
| `PromoteButton` | Promote staging config to production | Small |
| `EnvironmentConfig` | Per-environment variable management | Medium |
| `EnvironmentHealth` | Health status per environment | Small |

#### Acceptance Criteria
- [ ] Dashboard shows staging and production status side-by-side
- [ ] Promote staging to production with confirmation dialog
- [ ] Per-environment variables (API keys, feature flags)
- [ ] Health check per environment (green/yellow/red)
- [ ] Environment promotion is atomic (all-or-nothing)

---

## 7. Post-Launch OS Requirements

### 7.1 Monitoring Dashboard

**User Story**: As an admin, I want a real-time monitoring dashboard showing system health, agent performance, API metrics, and costs, so that I can detect and respond to issues quickly.

#### Already Exists
- `/api/health` — System health endpoint
- `/api/ai-stats` — AI usage statistics
- Self-heal system (reports, audit, cron)
- Recharts charting library (installed)

#### Components Required

| Component | Description | Effort |
|-----------|-------------|--------|
| `SystemHealthPanel` | Overall system status (green/yellow/red) | Medium |
| `AgentMetricsPanel` | Per-agent performance charts | Medium |
| `APIMetricsPanel` | API response times, error rates | Medium |
| `CostDashboard` | LLM spend tracking per agent/provider | Large |
| `AlertsPanel` | Active alerts with severity | Medium |
| `MetricsTimeline` | Historical view (24h, 7d, 30d) | Medium |

#### Technical Specifications

```typescript
// Monitoring data model
interface SystemHealth {
  status: 'healthy' | 'degraded' | 'critical';
  uptime: number;            // Seconds
  components: ComponentHealth[];
  lastCheck: Date;
}

interface ComponentHealth {
  name: string;              // e.g., "database", "llm-router", "task-queue"
  status: 'up' | 'degraded' | 'down';
  latency: number;           // ms
  errorRate: number;         // Percentage
  details?: string;
}

interface AgentMetrics {
  agentId: string;
  period: '1h' | '24h' | '7d' | '30d';
  tasksCompleted: number;
  tasksFailed: number;
  avgExecutionTime: number;  // ms
  totalTokens: number;
  totalCost: number;         // USD
  errorRate: number;
}

interface CostBreakdown {
  period: '24h' | '7d' | '30d';
  totalCost: number;
  byAgent: Record<string, number>;
  byProvider: Record<string, number>;
  byModel: Record<string, number>;
  trend: 'increasing' | 'stable' | 'decreasing';
  projectedMonthly: number;
}
```

#### Acceptance Criteria
- [ ] Dashboard shows real-time system status
- [ ] Agent metrics with charts (tasks, tokens, cost, errors)
- [ ] API metrics (p50, p95, p99 latencies, error rates)
- [ ] Cost breakdown by agent, provider, and model
- [ ] Historical views: 24h, 7d, 30d
- [ ] Configurable alert thresholds
- [ ] Dashboard loads in < 2s
- [ ] Charts render in < 500ms
- [ ] 30-second auto-refresh

---

### 7.2 Auto-Scaling

**User Story**: As the system, I want to automatically adjust agent concurrency and resource allocation based on demand, so that the platform stays responsive under varying load.

#### Technical Specifications

```typescript
interface ScalingRule {
  id: string;
  metric: 'queue_depth' | 'response_time' | 'error_rate' | 'cpu_usage';
  threshold: number;
  direction: 'scale_up' | 'scale_down';
  action: ScalingAction;
  cooldown: number;          // Seconds before next scaling event
}

interface ScalingAction {
  type: 'adjust_concurrency' | 'adjust_timeout' | 'enable_fallback';
  value: number;
  agentId?: string;          // Specific agent or all
}
```

#### Implementation Notes
- Vercel provides serverless auto-scaling (built-in for API routes)
- Agent concurrency adjustment via `agent.maxConcurrent` setting
- Database connection pooling via Supabase (PgBouncer)
- Rate limiting per subscription tier
- Queue depth monitoring triggers scaling events

#### Acceptance Criteria
- [ ] Auto-adjust agent concurrency based on queue depth
- [ ] Rate limiting enforced per subscription tier
- [ ] Scaling events logged to scaling_events table
- [ ] Cooldown period prevents scaling thrashing
- [ ] Manual override available for admins

---

### 7.3 Self-Healing Enhancements

**User Story**: As the system, I want automated recovery from known failure modes with root cause analysis, so that the platform maintains 99.9% uptime.

#### Already Exists
- `self_heal_reports` table — Diagnostic results
- `self_heal_audit_logs` table — Repair action audit
- `/api/admin/self-heal/*` — Management APIs
- `/api/cron/self-heal` — Scheduled execution

#### Enhancements Required

| Enhancement | Description | Effort |
|-------------|-------------|--------|
| Automated recovery | Auto-fix known issues without human intervention | Large |
| Root cause analysis | ML-based pattern detection | Large |
| Predictive alerts | Alert before failures occur | Medium |
| Recovery playbooks | Documented recovery procedures | Small |
| Dashboard integration | Self-heal status in monitoring dashboard | Small |

#### Acceptance Criteria
- [ ] Auto-recover from: database connection loss, LLM provider timeout, queue overflow
- [ ] Root cause analysis identifies failure patterns
- [ ] Predictive alerts fire 5+ minutes before predicted failure
- [ ] Recovery playbooks documented for each failure mode
- [ ] Self-heal resolves 80% of known issues automatically
- [ ] All recovery actions logged with rollback commands

---

### 7.4 Analytics & Insights

**User Story**: As a product owner, I want business analytics tracking user funnels, feature adoption, churn signals, and revenue metrics, so that I can make data-driven product decisions.

#### Already Exists
- `events` table — Analytics event tracking
- `experiments` system — A/B testing
- `journey_metrics` table — User journey metrics
- Analytics test coverage

#### Components Required

| Component | Description | Effort |
|-----------|-------------|--------|
| `UserFunnel` | Acquisition → activation → retention → revenue | Medium |
| `FeatureAdoption` | Usage tracking per feature from features_catalog | Medium |
| `ChurnPrediction` | Signals: inactivity, reduced usage, support tickets | Large |
| `RevenueMetrics` | MRR, ARR, LTV, CAC, ARPU tracking | Medium |
| `CohortAnalysis` | User cohort behavior over time | Medium |

#### Technical Specifications

```typescript
interface FunnelMetrics {
  period: '7d' | '30d' | '90d';
  stages: {
    visitors: number;
    signups: number;
    activated: number;        // Completed onboarding
    retained: number;         // Active after 7 days
    paying: number;           // Converted to paid
    referrers: number;        // Invited others
  };
  conversionRates: {
    visitorToSignup: number;
    signupToActivated: number;
    activatedToRetained: number;
    retainedToPaying: number;
    payingToReferrer: number;
  };
}

interface RevenueMetrics {
  mrr: number;               // Monthly Recurring Revenue
  arr: number;               // Annual Recurring Revenue
  arpu: number;              // Average Revenue Per User
  ltv: number;               // Lifetime Value
  cac: number;               // Customer Acquisition Cost
  churnRate: number;          // Monthly churn percentage
  netRevenueRetention: number; // NRR percentage
}
```

#### Acceptance Criteria
- [ ] Funnel visualization with conversion rates at each stage
- [ ] Feature adoption heatmap (most/least used features)
- [ ] Churn risk scoring per user (low/medium/high)
- [ ] Revenue dashboard with MRR, ARR, LTV, CAC
- [ ] Cohort analysis with retention curves
- [ ] Data exportable (CSV, JSON)

**Monetization Angle**: Basic analytics for Pro tier. Advanced analytics (churn prediction, cohort analysis) for Commander/General tiers.

---

## 8. Technical Specifications

### 8.1 State Management

Currently using React context (AuthContext, RegionContext) + Supabase real-time for state. For Studio UI, consider:

- **Local state**: React useState/useReducer for UI state
- **Server state**: Supabase queries via existing hooks
- **Real-time**: Supabase Realtime for live updates
- **Optimistic updates**: Update UI immediately, sync with server

### 8.2 Real-Time Communication

For Runner and Monitoring features:

| Protocol | Use Case | Implementation |
|----------|----------|----------------|
| **SSE** | Streaming execution output | Next.js API route with ReadableStream |
| **Supabase Realtime** | Database change notifications | Existing subscription infrastructure |
| **Polling** | Dashboard metrics refresh | 30-second interval with SWR/fetch |

### 8.3 Error Handling Strategy

```typescript
// Standard error response format
interface APIError {
  error: {
    code: string;            // e.g., 'AGENT_NOT_FOUND', 'QUEUE_FULL'
    message: string;         // Human-readable description
    details?: any;           // Additional context
    retryable: boolean;      // Whether client should retry
    retryAfter?: number;     // Seconds to wait before retry
  };
  status: number;            // HTTP status code
}
```

### 8.4 Caching Strategy

| Data | Cache Location | TTL | Invalidation |
|------|---------------|-----|-------------|
| Agent configs | Memory | 5 min | On save |
| Feature flags | Memory | 1 min | On toggle |
| LLM model list | Memory | 1 hour | Manual |
| Dashboard metrics | Client | 30 sec | Auto-refresh |
| File tree | Memory | 30 sec | On file change |
| Workflow defs | Memory | 5 min | On save |

---

## 9. Database Extensions Required

### New Tables for Pending Features

| Table | Domain | Purpose |
|-------|--------|---------|
| `workflows` | Studio | Workflow definitions (JSON graph) |
| `workflow_runs` | Studio | Workflow execution history |
| `workflow_nodes` | Studio | Individual workflow steps |
| `agent_versions` | Deployment | Agent config version history |
| `task_queue` | Runner | Persistent task queue |
| `task_executions` | Runner | Task execution history with telemetry |
| `deploy_records` | Deployment | Deployment history with status |
| `monitoring_snapshots` | Post-Launch | Periodic health metric snapshots |
| `scaling_events` | Post-Launch | Auto-scaling event log |
| `cost_tracking` | Post-Launch | LLM cost per agent/session/provider |
| `alert_rules` | Post-Launch | Configurable alert thresholds |
| `alert_events` | Post-Launch | Triggered alert history |

### Schema Definitions

```sql
-- Workflows
CREATE TABLE workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  definition JSONB NOT NULL,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workflow Runs
CREATE TABLE workflow_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES workflows(id) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  result JSONB,
  error TEXT,
  node_statuses JSONB DEFAULT '{}'
);

-- Cost Tracking
CREATE TABLE cost_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL,
  session_id TEXT,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  input_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  cost_usd DECIMAL(10,6) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cost_tracking_agent ON cost_tracking(agent_id, created_at);
CREATE INDEX idx_cost_tracking_provider ON cost_tracking(provider, created_at);

-- Monitoring Snapshots
CREATE TABLE monitoring_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  component TEXT NOT NULL,
  status TEXT NOT NULL,
  latency_ms INTEGER,
  error_rate DECIMAL(5,2),
  metadata JSONB,
  captured_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_monitoring_snapshots_component ON monitoring_snapshots(component, captured_at);

-- Alert Rules
CREATE TABLE alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  metric TEXT NOT NULL,
  threshold DECIMAL NOT NULL,
  comparison TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'warning',
  enabled BOOLEAN DEFAULT true,
  cooldown_seconds INTEGER DEFAULT 300,
  notify_channels JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alert Events
CREATE TABLE alert_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID REFERENCES alert_rules(id),
  severity TEXT NOT NULL,
  metric_value DECIMAL NOT NULL,
  message TEXT NOT NULL,
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 10. API Endpoints Required

### New Endpoints for Pending Features

| Endpoint | Method | Description | Domain |
|----------|--------|-------------|--------|
| `/api/workflows` | GET, POST | List/create workflows | Studio |
| `/api/workflows/[id]` | GET, PUT, DELETE | CRUD single workflow | Studio |
| `/api/workflows/[id]/run` | POST | Execute workflow | Studio |
| `/api/workflows/[id]/runs` | GET | Workflow run history | Studio |
| `/api/queue/tasks` | GET | Task queue status | Runner |
| `/api/queue/enqueue` | POST | Add task to queue | Runner |
| `/api/queue/[taskId]` | GET | Task status | Runner |
| `/api/deploy` | POST | Initiate deployment | Deploy |
| `/api/deploy/[id]/status` | GET | Deployment status | Deploy |
| `/api/deploy/[id]/rollback` | POST | Rollback deployment | Deploy |
| `/api/versions/[agentId]` | GET, POST | Agent version history | Deploy |
| `/api/versions/[agentId]/[version]` | GET | Specific version | Deploy |
| `/api/monitoring/health` | GET | System health metrics | OS |
| `/api/monitoring/agents` | GET | Agent performance | OS |
| `/api/monitoring/costs` | GET | Cost breakdown | OS |
| `/api/monitoring/alerts` | GET, POST | Alert management | OS |
| `/api/analytics/funnel` | GET | User funnel metrics | OS |
| `/api/analytics/revenue` | GET | Revenue metrics | OS |
| `/api/analytics/features` | GET | Feature adoption | OS |

---

## 11. Component Library Required

### New Components for Pending Features

| Component | Category | Dependencies | Effort |
|-----------|----------|-------------|--------|
| `AgentStudioCanvas` | Studio | @dnd-kit/core | Large |
| `ToolPalette` | Studio | tools.ts | Small |
| `ModelSelector` | Studio | llm-router.ts | Small |
| `SoulEditor` | Studio | Monaco Editor | Medium |
| `WorkflowCanvas` | Studio | reactflow | Large |
| `ActionNode` | Studio | Tool registry | Small |
| `ConditionalNode` | Studio | New | Small |
| `TriggerNode` | Studio | cron.ts | Small |
| `WorkflowToolbar` | Studio | New | Small |
| `ExecutionViewer` | Studio | SSE | Medium |
| `DeploymentWizard` | Deploy | connections | Medium |
| `EnvironmentSelector` | Deploy | New | Small |
| `ConfigValidator` | Deploy | New | Medium |
| `DeploymentMonitor` | Deploy | SSE | Medium |
| `VersionHistory` | Deploy | New | Small |
| `DiffViewer` | Deploy | Monaco diff | Small |
| `SystemHealthPanel` | OS | Recharts | Medium |
| `AgentMetricsPanel` | OS | Recharts | Medium |
| `CostDashboard` | OS | Recharts | Medium |
| `AlertsPanel` | OS | New | Medium |
| `UserFunnel` | OS | Recharts | Medium |
| `RevenueMetrics` | OS | Recharts | Medium |

**New Dependencies Required**: @dnd-kit/core (or react-dnd), reactflow

---

## 12. Performance Benchmarks

### Target Metrics

| Metric | Target | Priority |
|--------|--------|----------|
| Studio canvas render | < 100ms | P0 |
| Tool palette load | < 200ms | P0 |
| Workflow execution start | < 3s | P0 |
| Node render | < 50ms | P1 |
| Task queue pickup | < 100ms | P0 |
| Queue operations | < 10ms | P0 |
| Agent cold start | < 2s | P1 |
| Agent warm execution | < 500ms | P0 |
| Message delivery (direct) | < 50ms | P0 |
| Message broadcast | < 200ms | P1 |
| Deploy initiation | < 3s | P0 |
| Deploy status update | < 5s | P1 |
| Dashboard load | < 2s | P0 |
| Chart render | < 500ms | P0 |
| Code execution feedback | < 3s | P0 |
| Editor load | < 1s | P0 |
| API response (p95) | < 500ms | P0 |
| API response (p99) | < 1s | P1 |

### Load Targets

| Metric | Target |
|--------|--------|
| Concurrent users | 1,000 |
| API requests/sec | 500 |
| WebSocket connections | 5,000 |
| Task queue depth | 10,000 |
| Database connections | 100 (pooled) |
| Agent concurrency (total) | 50 |

---

## 13. Security Requirements

### For New Features

| Feature | Security Requirement |
|---------|---------------------|
| Studio | Agent configs encrypted at rest, RBAC on agent access |
| Workflows | Workflow execution sandboxed per user, no cross-user access |
| Task Queue | Tasks validated before execution, timeout enforcement |
| Deployment | Deploy requires admin or owner role, audit logged |
| Monitoring | Cost data encrypted, admin-only access |
| Analytics | PII anonymized in analytics, GDPR-compliant export |
| Versions | Version history immutable (append-only) |
| Alerts | Alert rules admin-only, notification channels validated |

### Authentication Requirements
- All new API endpoints require Supabase session authentication
- Admin endpoints require `is_admin: true` profile flag
- Agent owner endpoints require `user_id` match
- Rate limiting per subscription tier:
  - Free: 100 req/min
  - Pro: 500 req/min
  - Commander: 2000 req/min
  - General: 10000 req/min

### Data Retention
- Workflow runs: 90 days
- Task executions: 30 days
- Monitoring snapshots: 30 days
- Cost tracking: 365 days
- Alert events: 90 days
- Agent versions: Indefinite (immutable)

---

## 14. Monetization Integration

### Subscription Tiers (Existing)

| Tier | Price | Key Limits |
|------|-------|-----------|
| **Free** | $0/mo | 50 msgs/day, 1 agent, 1 memory slot, view-only Studio |
| **Pro** | $29/mo | Unlimited msgs, 5 agents, 3 workflows, 100 memory slots, basic deploy & monitoring |
| **Commander** | $499/mo | API access, 25 agents, unlimited workflows, 1000 memory slots, full deploy & monitoring, cost tracking, advanced analytics |
| **General** | $1999/mo | White-label, unlimited agents, SLA, custom integrations, enterprise analytics, dedicated support |

### Feature Gating by Tier

| Feature | Free | Pro | Commander | General |
|---------|------|-----|-----------|---------|
| Studio (view) | ✅ | ✅ | ✅ | ✅ |
| Studio (create) | ❌ | ✅ | ✅ | ✅ |
| Workflows | 0 | 3 | ∞ | ∞ |
| Agent count | 1 | 5 | 25 | ∞ |
| Task queue | 10/day | 100/day | 1000/day | ∞ |
| Code execution | 10/day | 100/day | 1000/day | ∞ |
| Deploy | ❌ | Basic | Full | Full + SLA |
| Monitoring | ❌ | Basic | Advanced | Enterprise |
| Analytics | ❌ | Basic | Advanced | Enterprise |
| Cost tracking | ❌ | ❌ | ✅ | ✅ |
| API access | ❌ | ❌ | ✅ | ✅ |
| Support | Community | Email | Priority | Dedicated |

### Revenue Projections

**Conversion Funnel Targets**:
- Free → Pro: 5% conversion rate
- Pro → Commander: 2% conversion rate
- Commander → General: 0.5% conversion rate

**Revenue Model (Month 6 target)**:
- 10,000 free users × 5% = 500 Pro users × $29 = $14,500/mo
- 500 Pro × 2% = 10 Commander users × $499 = $4,990/mo
- 10 Commander × 0.5% = ~1 General user × $1,999 = $1,999/mo
- **Projected MRR**: ~$21,489/mo
- **Projected ARR**: ~$257,868/yr

---

## 15. Integration Points

### Existing Integrations
| Integration | Status | Implementation |
|-------------|--------|----------------|
| Telegram | ✅ Implemented | Bot webhook, bidirectional messaging |
| GitHub OAuth | ✅ Implemented | Connection management, agent tool |
| Vercel OAuth | ✅ Implemented | Deployment tracking |
| Supabase | ✅ Implemented | Core data layer |
| Stripe | ✅ Schema ready | subscription_tiers, user_subscriptions |
| Shopify | 📋 Designed | Integration playbook |
| Printify | 📋 Designed | Integration playbook |

### Planned Integrations (Post-Launch)
| Integration | Priority | Purpose |
|-------------|----------|---------|
| Slack App | P1 | Team notifications, agent control |
| Discord Bot | P1 | Community engagement |
| Zapier | P2 | 3rd-party workflow automation |
| Notion | P2 | Documentation sync |
| Linear | P2 | Issue tracking sync |
| Google Workspace | P3 | Calendar, Docs, Sheets integration |
| Microsoft 365 | P3 | Enterprise compatibility |

---

## 16. Success Criteria

### Studio UI Success Criteria
- [ ] User can create a working agent in < 5 minutes
- [ ] User can build a workflow with 5+ nodes
- [ ] Code editor supports all 4 languages (Python, JS, TS, Bash)
- [ ] Dashboard shows real-time status for all agents
- [ ] Studio renders correctly on desktop (1280px+) and tablet (768px+)

### Runner System Success Criteria
- [ ] Tasks execute within 100ms of queue pickup
- [ ] Failed tasks retry 3 times with exponential backoff
- [ ] Agent-to-agent communication < 50ms latency
- [ ] 99.9% task completion rate
- [ ] Queue handles 10,000+ pending tasks without degradation

### Deployment Flow Success Criteria
- [ ] One-click deploy completes in < 30 seconds
- [ ] Rollback completes in < 10 seconds
- [ ] Version diff visualization renders correctly
- [ ] Environment promotion is atomic (all-or-nothing)
- [ ] Zero-downtime deployments

### Post-Launch OS Success Criteria
- [ ] Monitoring dashboard loads in < 2 seconds
- [ ] Alerts fire within 30 seconds of threshold breach
- [ ] Self-heal resolves 80% of known issues automatically
- [ ] Cost tracking accurate to $0.01
- [ ] System maintains 99.9% uptime

---

## 17. Implementation Roadmap

### Phase 1: Studio UI (Weeks 1-4) — Effort: Large

| Week | Deliverables | Team |
|------|-------------|------|
| 1 | Agent Builder canvas + tool palette | Bubbles + Pushpa |
| 2 | Model selector + soul editor + agent test panel | Bubbles + Blossom |
| 3 | Workflow designer (node-based canvas) | Bubbles + Pushpa |
| 4 | Code editor enhancements + dashboard improvements | Bubbles + Blossom |

### Phase 2: Runner System (Weeks 5-7) — Effort: Medium

| Week | Deliverables | Team |
|------|-------------|------|
| 5 | Task queue manager + scheduler | Blossom + Guy |
| 6 | Execution runtime enhancements + SSE streaming | Blossom |
| 7 | Agent communication bus + pub/sub | Blossom |

### Phase 3: Deployment Flow (Weeks 8-9) — Effort: Medium

| Week | Deliverables | Team |
|------|-------------|------|
| 8 | One-click deploy + config validation | Blossom + Bubbles |
| 9 | Version management + environment management | Blossom + Guy |

### Phase 4: Post-Launch OS (Weeks 10-12) — Effort: Large

| Week | Deliverables | Team |
|------|-------------|------|
| 10 | Monitoring dashboard + health panels | Bubbles + Blossom |
| 11 | Auto-scaling + self-healing enhancements | Blossom |
| 12 | Analytics & insights + revenue metrics | Bubbles + Jo |

### Testing Throughout (Buttercup)
- Unit tests for all new components
- Integration tests for API endpoints
- E2E tests for critical flows (agent creation, workflow execution, deploy)
- Performance tests against benchmarks

---

## 18. Team Assignments

| Team Member | Primary Role | Key Deliverables |
|-------------|-------------|------------------|
| **MO** | Architecture & Review | System design, code review, merge approvals |
| **JO** | Product Owner | Requirements, prioritization, monetization strategy |
| **Bubbles** | Frontend | Studio UI, Dashboard, Agent Builder, Monitoring UI |
| **Blossom** | Backend | Runner APIs, Task Queue, Deploy Flow, Communication Bus |
| **Guy** | Database | Schema extensions, migrations, query optimization |
| **Buttercup** | QA | Test coverage, E2E tests, performance validation |
| **Pushpa** | UI/UX & 3D | Studio canvas design, 3D visualizations, animations |

---

## 19. Risk Assessment

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| LLM cost overruns | High | Medium | Implement cost caps per agent, spending alerts |
| Task queue overflow | High | Low | Dead letter queue, auto-scaling, rate limiting |
| Security breach | Critical | Low | Sandbox isolation, input validation, audit logging |
| Performance degradation | High | Medium | Caching, connection pooling, lazy loading |
| Scope creep | Medium | High | MVP-first approach, strict phase boundaries |
| Third-party API outages | Medium | Medium | Provider fallback (LLM router), circuit breaker |
| Database scaling | Medium | Low | Supabase managed scaling, read replicas |

---

## 20. Appendix: Existing Asset Inventory

### Codebase Statistics

| Metric | Count |
|--------|-------|
| API Routes | 76 |
| React Components | 109 |
| Pages | 48 |
| Test Files | 32 |
| Database Tables | 52+ |
| Migrations | 22 |
| Custom Hooks | 16 |
| Library Modules | 99 |
| Agent Tools | 14+ |
| Default Agents | 7 |
| Subscription Tiers | 4 |
| Feature Flags | 32+ |
| RLS Policies | 150+ |
| Database Indexes | 100+ |

### Key File Paths

| File | Purpose |
|------|---------|
| `src/types/agent.ts` | Agent, ModelConfig, Task type definitions |
| `src/types/tool.ts` | Tool, ToolContext type definitions |
| `src/lib/engine/agent.ts` | AgentInstance class |
| `src/lib/engine/bootstrap.ts` | Agent initialization (7 agents) |
| `src/lib/engine/tools.ts` | Tool registry (14+ tools) |
| `src/lib/engine/session.ts` | Session management with compaction |
| `src/lib/engine/cron.ts` | Scheduled job execution |
| `src/lib/ai/llm-router.ts` | Multi-provider LLM routing |
| `src/middleware.ts` | Auth session refresh middleware |
| `src/config/feature-flags.ts` | Feature flag configuration |
| `vitest.config.ts` | Test configuration |

### Supporting Documentation

| Document | Location | Size |
|----------|----------|------|
| System Architecture | `/docs/emergent-architecture.md` | ~77KB |
| Database Schema | `/docs/emergent-database-schema.md` | ~78KB |
| Tool API Specification | `/docs/emergent-tool-api.md` | ~63KB |
| Security Documentation | `/docs/emergent-security.md` | ~91KB |
| Testing Strategy | `/docs/emergent-testing.md` | ~15KB |
| This Document | `/docs/EMERGENT_REQUIREMENTS_EXTRACTED.md` | ~70KB |

---

*Document generated: 2026-02-19*  
*Next review: After Phase 1 completion*  
*Owner: JO (Product Owner) + MO (CTO)*
