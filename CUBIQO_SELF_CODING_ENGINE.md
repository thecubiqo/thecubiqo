# CubiQo Self-Coding Engine — Bootstrap Specification
## The Document That Makes CubiQo Build Itself

---

## PRIME DIRECTIVE

After reading this document, CubiQo's agent system must be able to:
1. Read any requirement or feature request
2. Plan the implementation (files, APIs, UI, tests)
3. Write the code
4. Test it
5. Deploy it
6. Learn from the result
7. Improve itself

**This is the last document a human needs to write. Everything after this, CubiQo writes itself.**

---

## PART 1: THE SELF-CODING ARCHITECTURE

### 1.1 Core Loop

```
USER REQUEST
    ↓
HENRY (Coordinator)
    ↓ analyzes request
    ↓ creates task plan
    ↓ assigns to agents
    ↓
┌─────────────────────────────────────────────┐
│  PARALLEL AGENT EXECUTION                    │
│                                              │
│  DEV ──→ writes code ──→ commits            │
│  TESTER ──→ writes tests ──→ runs them      │
│  WRITER ──→ updates docs                     │
│  MARKETING ──→ updates changelog/comms       │
│                                              │
│  All agents can READ each other's workspaces │
│  All agents WRITE only to their own          │
│  HENRY merges results                        │
└─────────────────────────────────────────────┘
    ↓
HENRY reviews, merges, deploys
    ↓
TESTER validates deployment
    ↓
HENRY reports to user
```

### 1.2 File System Contract

```
/root/clawd/thecubiqo/              ← PRODUCTION CODEBASE (shared read, Dev writes)
├── src/
│   ├── app/                        ← Next.js pages & API routes
│   │   ├── api/
│   │   │   ├── chat/               ← AI chat endpoint
│   │   │   ├── agents/             ← NEW: Agent management API
│   │   │   ├── sessions/           ← NEW: Session management API
│   │   │   ├── tools/              ← NEW: Tool execution API
│   │   │   ├── memory/             ← NEW: Memory/vector store API
│   │   │   ├── channels/           ← NEW: Channel management API
│   │   │   ├── cron/               ← NEW: Scheduled tasks API
│   │   │   ├── browser/            ← NEW: Browser control API
│   │   │   ├── files/              ← NEW: File management API
│   │   │   ├── skills/             ← NEW: Skills marketplace API
│   │   │   ├── admin/              ← NEW: Admin dashboard API
│   │   │   ├── tts/                ← Text-to-speech (exists)
│   │   │   ├── extract-memories/   ← Memory extraction (exists)
│   │   │   └── session/            ← Auth session (exists)
│   │   ├── dashboard/              ← NEW: Agent dashboard page
│   │   ├── agents/                 ← NEW: Agent management page
│   │   ├── workspace/              ← NEW: File browser page
│   │   ├── channels/               ← NEW: Channel config page
│   │   ├── settings-cube/          ← 3D settings cube (exists)
│   │   └── page.tsx                ← Main landing/chat page
│   ├── components/
│   │   ├── cube/                   ← 3D cube components (exists)
│   │   ├── chat/                   ← NEW: Enhanced chat with agent selector
│   │   ├── agents/                 ← NEW: Agent cards, roster, status
│   │   ├── dashboard/              ← NEW: Dashboard widgets
│   │   ├── workspace/              ← NEW: File tree, editor, preview
│   │   ├── channels/               ← NEW: Channel config UI
│   │   ├── memory/                 ← NEW: Memory browser
│   │   └── admin/                  ← NEW: Admin panels
│   ├── lib/
│   │   ├── ai/                     ← AI providers (exists — extend)
│   │   ├── engine/                 ← NEW: Core agent engine
│   │   │   ├── agent.ts            ← Agent class (create, run, stop)
│   │   │   ├── session.ts          ← Session management
│   │   │   ├── router.ts           ← Message routing to agents
│   │   │   ├── spawner.ts          ← Subagent spawning
│   │   │   ├── tools.ts            ← Tool registry and execution
│   │   │   ├── memory.ts           ← Vector memory store
│   │   │   ├── context.ts          ← Context assembly (SOUL/AGENTS/USER)
│   │   │   ├── compaction.ts       ← Context compaction
│   │   │   └── queue.ts            ← Concurrency queue
│   │   ├── tools/                  ← NEW: Built-in tools
│   │   │   ├── exec.ts             ← Shell command execution
│   │   │   ├── browser.ts          ← Headless browser control
│   │   │   ├── file-ops.ts         ← Read/write/edit/patch files
│   │   │   ├── web-fetch.ts        ← URL fetch and scrape
│   │   │   ├── web-search.ts       ← Search engine integration
│   │   │   ├── git.ts              ← Git operations
│   │   │   ├── deploy.ts           ← Vercel/deployment triggers
│   │   │   └── index.ts            ← Tool registry
│   │   ├── channels/               ← NEW: Channel adapters
│   │   │   ├── telegram.ts
│   │   │   ├── whatsapp.ts
│   │   │   ├── discord.ts
│   │   │   ├── email.ts
│   │   │   └── webchat.ts
│   │   ├── auth/                   ← Auth (exists)
│   │   ├── supabase/               ← Supabase client (exists)
│   │   └── voice-modulation.ts     ← Voice (exists)
│   └── types/
│       ├── agent.ts                ← NEW: Agent types
│       ├── session.ts              ← NEW: Session types
│       ├── tool.ts                 ← NEW: Tool types
│       ├── channel.ts              ← NEW: Channel types
│       └── index.ts                ← Existing types
├── agents/                         ← NEW: Agent personality files
│   ├── henry/
│   │   └── SOUL.md
│   ├── dev/
│   │   └── SOUL.md
│   ├── writer/
│   │   └── SOUL.md
│   ├── marketing/
│   │   └── SOUL.md
│   └── tester/
│       └── SOUL.md
├── skills/                         ← NEW: Reusable skill packages
│   ├── code-review/
│   ├── web-research/
│   ├── content-writing/
│   └── test-generation/
└── data/                           ← NEW: Runtime data
    ├── sessions/                   ← Session transcripts
    ├── memory/                     ← Vector store files
    ├── workspaces/                 ← Per-agent file spaces
    └── cache/                      ← LLM response cache
```

---

## PART 2: CORE ENGINE — IMPLEMENTATION SPECS

### 2.1 Agent Class (`src/lib/engine/agent.ts`)

```typescript
interface Agent {
  id: string;                    // "dev", "writer", etc.
  name: string;                  // Display name
  model: ModelConfig;            // Which LLM to use
  soul: string;                  // SOUL.md content — personality
  workspace: string;             // File path for this agent
  tools: string[];               // Allowed tool IDs
  maxConcurrent: number;         // Max parallel runs
  status: "idle" | "running" | "error";
  currentTasks: Task[];
  sessionStore: SessionStore;
  memoryStore: MemoryStore;
}

interface ModelConfig {
  provider: "anthropic" | "openai" | "meta" | "mistral" | "google";
  model: string;                 // "claude-sonnet-4-5", "gpt-5.2", etc.
  apiKey: string;                // From env or BYO
  baseUrl?: string;              // Custom endpoint (Emergent proxy)
  maxTokens: number;
  temperature: number;
}

interface Task {
  id: string;
  description: string;
  assignedTo: string;            // Agent ID
  status: "queued" | "running" | "done" | "failed";
  result?: string;
  startedAt?: Date;
  completedAt?: Date;
  tokenUsage: { input: number; output: number; cost: number };
}
```

**Dev Agent: Implement this class with these methods:**
- `create(config)` — instantiate agent, load SOUL.md, init session store
- `run(prompt, sessionId?)` — execute a prompt, return response
- `spawn(task)` — create a subagent run
- `stop()` — abort current run
- `getHistory(sessionId)` — retrieve conversation history
- `clearSession(sessionId)` — delete a session
- `listSessions()` — list all sessions for this agent

### 2.2 Tool Registry (`src/lib/engine/tools.ts`)

```typescript
interface Tool {
  id: string;                    // "exec", "browser", "file_read", etc.
  name: string;
  description: string;           // For LLM function calling
  parameters: JSONSchema;        // Input schema
  execute: (params: any, context: ToolContext) => Promise<ToolResult>;
  requiresApproval?: boolean;    // Dangerous operations need user OK
  allowedAgents?: string[];      // Which agents can use this tool
}

interface ToolContext {
  agentId: string;
  sessionId: string;
  workspace: string;             // Agent's workspace path
  userId?: string;               // Authenticated user
}

interface ToolResult {
  success: boolean;
  output: string;
  error?: string;
  artifacts?: string[];          // File paths created
}
```

**Dev Agent: Implement these tools:**

#### Tool: `exec`
```typescript
// Execute shell commands in agent's workspace
{
  id: "exec",
  parameters: { command: string, cwd?: string, timeout?: number },
  execute: async ({ command, cwd, timeout = 30 }) => {
    // Run in sandbox (child_process.exec with timeout)
    // cwd defaults to agent workspace
    // Return stdout/stderr
  }
}
```

#### Tool: `file_read`
```typescript
{
  id: "file_read",
  parameters: { path: string, encoding?: string },
  execute: async ({ path }) => {
    // Read file relative to agent workspace
    // Support text and binary (base64)
  }
}
```

#### Tool: `file_write`
```typescript
{
  id: "file_write",
  parameters: { path: string, content: string, createDirs?: boolean },
  execute: async ({ path, content, createDirs }) => {
    // Write file relative to agent workspace
    // Create parent dirs if needed
  }
}
```

#### Tool: `file_edit`
```typescript
{
  id: "file_edit",
  parameters: { path: string, search: string, replace: string },
  execute: async ({ path, search, replace }) => {
    // Search and replace in file
    // Return success/failure with context
  }
}
```

#### Tool: `browser`
```typescript
{
  id: "browser",
  parameters: {
    action: "navigate" | "screenshot" | "click" | "type" | "extract" | "tabs",
    url?: string,
    selector?: string,
    text?: string
  },
  execute: async (params) => {
    // Use Puppeteer/Playwright headless
    // Navigate, screenshot, interact, extract content
  }
}
```

#### Tool: `web_search`
```typescript
{
  id: "web_search",
  parameters: { query: string, count?: number },
  execute: async ({ query, count = 5 }) => {
    // Use Brave Search API or DuckDuckGo
    // Return title, url, snippet for each result
  }
}
```

#### Tool: `web_fetch`
```typescript
{
  id: "web_fetch",
  parameters: { url: string, extract?: "text" | "html" | "markdown" },
  execute: async ({ url, extract = "text" }) => {
    // Fetch URL, extract content
    // Strip boilerplate, return clean text
  }
}
```

#### Tool: `git`
```typescript
{
  id: "git",
  parameters: {
    action: "status" | "add" | "commit" | "push" | "pull" | "branch" | "log" | "diff",
    args?: string
  },
  execute: async ({ action, args }) => {
    // Run git commands in workspace
  }
}
```

#### Tool: `sessions_spawn`
```typescript
{
  id: "sessions_spawn",
  parameters: {
    task: string,
    agentId?: string,           // Target agent (default: self)
    model?: string,             // Override model
    label?: string
  },
  execute: async ({ task, agentId, model, label }) => {
    // Create new session for target agent
    // Run task asynchronously
    // Return { runId, sessionId, status: "accepted" }
    // When done, announce result back to requester
  }
}
```

#### Tool: `sessions_send`
```typescript
{
  id: "sessions_send",
  parameters: {
    agentId: string,
    message: string,
    sessionId?: string
  },
  execute: async ({ agentId, message, sessionId }) => {
    // Send message to another agent
    // Creates new session if none specified
  }
}
```

#### Tool: `memory_search`
```typescript
{
  id: "memory_search",
  parameters: { query: string, limit?: number, agentId?: string },
  execute: async ({ query, limit = 10 }) => {
    // Semantic search in vector store
    // Return relevant memories with scores
  }
}
```

#### Tool: `memory_store`
```typescript
{
  id: "memory_store",
  parameters: { content: string, category?: string, metadata?: object },
  execute: async ({ content, category, metadata }) => {
    // Store memory in vector store
    // Auto-generate embedding
  }
}
```

#### Tool: `deploy`
```typescript
{
  id: "deploy",
  parameters: { target: "prod-a" | "prod-b" | "staging", branch?: string },
  execute: async ({ target, branch = "production" }) => {
    // Trigger Vercel deployment
    // Return deployment URL and status
  }
}
```

### 2.3 Message Router (`src/lib/engine/router.ts`)

```typescript
interface Binding {
  agentId: string;
  match: {
    channel?: string;            // "telegram", "webchat", "whatsapp"
    accountId?: string;          // Multi-account support
    peer?: { kind: "dm" | "group", id: string };
  };
}

// Router logic:
// 1. Check bindings most-specific first (peer > account > channel)
// 2. Fallback to default agent
// 3. Inject agent's SOUL.md + context into system prompt
// 4. Route response back through same channel
```

### 2.4 Context Assembly (`src/lib/engine/context.ts`)

For every agent run, assemble this context:

```
SYSTEM PROMPT:
  1. SOUL.md (agent personality — "You are Dev, a senior developer...")
  2. AGENTS.md (available tools and capabilities)
  3. USER.md (learned user preferences)
  4. Recent memories (vector search for relevant context)
  5. Current task context (if spawned as subagent)

CONVERSATION:
  6. Session history (last N messages, compacted if long)

TOOLS:
  7. Tool definitions (JSON Schema for function calling)
```

### 2.5 Concurrency Queue (`src/lib/engine/queue.ts`)

```typescript
interface QueueConfig {
  maxConcurrent: number;         // Per-agent concurrent runs
  maxSubagents: number;          // Max subagent spawns
  globalMax: number;             // Total system concurrent
}

// Queue behavior:
// - Each agent has its own lane
// - Subagents share a global "subagent" lane
// - Tasks wait in FIFO queue when at capacity
// - Priority: user messages > agent-to-agent > subagent > cron
```

---

## PART 3: API ROUTES — IMPLEMENTATION SPECS

### 3.1 Agent Management API

```
POST   /api/agents              ← Create new agent
GET    /api/agents              ← List all agents
GET    /api/agents/:id          ← Get agent details + status
PUT    /api/agents/:id          ← Update agent config
DELETE /api/agents/:id          ← Delete agent
POST   /api/agents/:id/run      ← Send message to agent, get response (streaming SSE)
POST   /api/agents/:id/spawn    ← Spawn subagent task
GET    /api/agents/:id/tasks    ← List agent's current/recent tasks
POST   /api/agents/:id/stop     ← Stop current agent run
```

### 3.2 Session API

```
GET    /api/sessions                    ← List sessions (filterable by agent)
GET    /api/sessions/:id                ← Get session details
GET    /api/sessions/:id/history        ← Get message history
DELETE /api/sessions/:id                ← Delete session
POST   /api/sessions/:id/send           ← Send message to existing session
POST   /api/sessions/:id/branch         ← Fork session into new thread
GET    /api/sessions/:id/export         ← Export as JSON/markdown
```

### 3.3 Tool API

```
GET    /api/tools                       ← List available tools
POST   /api/tools/:id/execute           ← Execute tool directly
GET    /api/tools/:id/schema            ← Get tool input schema
```

### 3.4 Memory API

```
POST   /api/memory/search               ← Semantic search memories
POST   /api/memory/store                 ← Store new memory
GET    /api/memory                       ← List memories (paginated)
DELETE /api/memory/:id                   ← Delete memory
PUT    /api/memory/:id                   ← Edit memory
```

### 3.5 Channel API

```
GET    /api/channels                     ← List configured channels
POST   /api/channels/:type/connect       ← Connect new channel (telegram, discord, etc.)
DELETE /api/channels/:type/disconnect     ← Disconnect channel
GET    /api/channels/:type/status         ← Channel health check
PUT    /api/channels/:type/config         ← Update channel config
```

### 3.6 Browser API

```
POST   /api/browser/navigate             ← Open URL
POST   /api/browser/screenshot           ← Capture screenshot
POST   /api/browser/click                ← Click element
POST   /api/browser/type                 ← Type text
GET    /api/browser/tabs                  ← List open tabs
POST   /api/browser/extract              ← Extract page content
```

### 3.7 Admin API (Prod-A only)

```
GET    /api/admin/usage                  ← Token usage stats
GET    /api/admin/costs                  ← Cost breakdown by agent/model
GET    /api/admin/users                  ← User management
POST   /api/admin/config                 ← Update system config
GET    /api/admin/logs                   ← System logs
GET    /api/admin/health                 ← Health check all services
```

---

## PART 4: DATABASE SCHEMA (Supabase)

```sql
-- Agents table
CREATE TABLE agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  model_provider TEXT NOT NULL,
  model_id TEXT NOT NULL,
  soul_md TEXT,
  workspace_path TEXT,
  tools TEXT[] DEFAULT '{}',
  max_concurrent INT DEFAULT 2,
  status TEXT DEFAULT 'idle',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Sessions table
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT REFERENCES agents(id),
  session_key TEXT NOT NULL,
  channel TEXT DEFAULT 'webchat',
  status TEXT DEFAULT 'idle',
  message_count INT DEFAULT 0,
  token_usage_input BIGINT DEFAULT 0,
  token_usage_output BIGINT DEFAULT 0,
  estimated_cost DECIMAL(10,6) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID REFERENCES auth.users(id)
);

-- Messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- 'user', 'assistant', 'system', 'tool'
  content TEXT NOT NULL,
  tool_calls JSONB,
  tool_results JSONB,
  token_count INT,
  model TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Memories table (vector store)
CREATE TABLE memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT REFERENCES agents(id),
  content TEXT NOT NULL,
  embedding vector(1536), -- pgvector
  category TEXT DEFAULT 'general',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID REFERENCES auth.users(id)
);

-- Tasks table (subagent tracking)
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT REFERENCES agents(id),
  parent_session_id UUID REFERENCES sessions(id),
  child_session_id UUID REFERENCES sessions(id),
  description TEXT NOT NULL,
  label TEXT,
  status TEXT DEFAULT 'queued', -- queued, running, done, failed, timeout
  result TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  token_usage JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Channels table
CREATE TABLE channels (
  id TEXT PRIMARY KEY, -- 'telegram', 'discord', etc.
  enabled BOOLEAN DEFAULT false,
  config JSONB DEFAULT '{}', -- Channel-specific config
  status TEXT DEFAULT 'disconnected',
  agent_bindings JSONB DEFAULT '[]', -- Which agents handle which channels
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Cron jobs table
CREATE TABLE cron_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT REFERENCES agents(id),
  schedule TEXT NOT NULL, -- Cron expression
  task TEXT NOT NULL, -- What to run
  enabled BOOLEAN DEFAULT true,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Skills table
CREATE TABLE skills (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  prompt_template TEXT,
  tools TEXT[] DEFAULT '{}',
  config JSONB DEFAULT '{}',
  agent_ids TEXT[] DEFAULT '{}', -- Which agents have this skill
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Usage tracking
CREATE TABLE usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT REFERENCES agents(id),
  session_id UUID REFERENCES sessions(id),
  model TEXT NOT NULL,
  input_tokens INT,
  output_tokens INT,
  cost DECIMAL(10,6),
  created_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID REFERENCES auth.users(id)
);

-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Memory search function
CREATE OR REPLACE FUNCTION search_memories(
  query_embedding vector(1536),
  match_count INT DEFAULT 10,
  filter_agent_id TEXT DEFAULT NULL
)
RETURNS TABLE (id UUID, content TEXT, similarity FLOAT, category TEXT, metadata JSONB)
AS $$
  SELECT id, content, 1 - (embedding <=> query_embedding) as similarity, category, metadata
  FROM memories
  WHERE (filter_agent_id IS NULL OR agent_id = filter_agent_id)
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$ LANGUAGE sql;

-- RLS policies
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Admin sees all, users see their own
CREATE POLICY "admin_all" ON agents FOR ALL USING (
  auth.jwt() ->> 'role' = 'admin'
);
CREATE POLICY "user_own_sessions" ON sessions FOR ALL USING (
  user_id = auth.uid() OR auth.jwt() ->> 'role' = 'admin'
);
CREATE POLICY "user_own_messages" ON messages FOR ALL USING (
  session_id IN (SELECT id FROM sessions WHERE user_id = auth.uid())
  OR auth.jwt() ->> 'role' = 'admin'
);
```

---

## PART 5: LLM INTEGRATION SPEC

### 5.1 Provider Abstraction

```typescript
// src/lib/ai/providers.ts

interface LLMProvider {
  id: string;
  name: string;
  chat(params: ChatParams): AsyncGenerator<ChatChunk>; // Streaming
  embed(text: string): Promise<number[]>;               // For memory
}

interface ChatParams {
  model: string;
  messages: Message[];
  tools?: ToolDefinition[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

// Implement for each provider:
class AnthropicProvider implements LLMProvider { ... }
class OpenAIProvider implements LLMProvider { ... }
class EmergentProvider implements LLMProvider { ... }  // Universal key proxy
class LlamaProvider implements LLMProvider { ... }      // Local or API
class MistralProvider implements LLMProvider { ... }

// Model registry with auto-failover
const MODEL_REGISTRY = {
  "claude-sonnet-4-5": { provider: "emergent", fallback: "anthropic" },
  "claude-opus-4-5": { provider: "emergent", fallback: "anthropic" },
  "gpt-5.2": { provider: "emergent", fallback: "openai" },
  "llama-3": { provider: "meta", fallback: null },
  "mistral-large": { provider: "mistral", fallback: null },
};
```

### 5.2 Emergent Universal Key Integration

```typescript
// All Emergent-supported models go through:
const EMERGENT_BASE_URL = process.env.EMERGENT_BASE_URL; // https://integrations.emergentagent.com/llm
const EMERGENT_API_KEY = process.env.EMERGENT_API_KEY;    // sk-emergent-xxx

// For Anthropic models: use anthropic-messages API format
// For OpenAI models: use openai-completions API format
// Auth: Bearer token in Authorization header
```

---

## PART 6: FRONTEND COMPONENTS

### 6.1 Dashboard Page (`/dashboard`)
- Agent roster — cards showing each agent's name, model, status, current task
- System stats — total tokens used, cost, active sessions
- Recent activity feed — latest agent actions
- Quick actions — spawn task, create agent, send message

### 6.2 Agent Chat (`/agents/:id/chat`)
- Chat interface with agent
- Agent selector dropdown (switch between agents)
- Tool execution display (show when agent uses tools)
- Subagent activity panel (see spawned tasks)
- Session selector (resume previous conversations)

### 6.3 Workspace Browser (`/workspace/:agentId`)
- File tree sidebar
- Code editor (Monaco) with syntax highlighting
- File preview (markdown, images, PDFs)
- Terminal panel (agent's exec output)
- Git status/diff viewer

### 6.4 Memory Browser (`/memory`)
- Searchable memory list
- Category filters
- Memory detail view with metadata
- Add/edit/delete memories
- Import/export

### 6.5 Channel Config (`/channels`)
- Channel cards (Telegram, WhatsApp, Discord, etc.)
- Connect/disconnect toggle
- Per-channel agent binding config
- Status indicators

### 6.6 Admin Panel (`/admin`) — Prod-A only
- Usage graphs (tokens, cost, by agent/model/day)
- User management
- API key management
- System config editor
- Logs viewer

---

## PART 7: THE SELF-CODING BOOTSTRAP

### 7.1 How CubiQo Codes Itself

Once the engine is built, CubiQo can improve itself:

```
1. User says: "Add Discord integration"
2. Henry reads the requirement
3. Henry spawns Dev subagent with task:
   "Implement Discord channel adapter at src/lib/channels/discord.ts
    following the same pattern as telegram.ts.
    Add API route at src/app/api/channels/discord/route.ts.
    Add UI component at src/components/channels/DiscordConfig.tsx.
    Write tests. Commit to feature/discord branch."
4. Dev agent:
   - Reads existing telegram.ts for pattern
   - Writes discord.ts
   - Writes API route
   - Writes UI component
   - Runs tests via exec tool
   - Commits via git tool
5. Tester agent validates
6. Henry merges and deploys
7. User has Discord integration
```

### 7.2 Self-Improvement Rules

```
RULE 1: Every new feature MUST follow existing patterns
  - Read similar existing code first
  - Match file structure, naming, typing conventions
  - Reuse existing abstractions

RULE 2: Every change MUST be tested
  - Dev writes code → Tester writes tests → Both must pass

RULE 3: Every change MUST be documented
  - Writer updates relevant docs automatically

RULE 4: Every deployment MUST be incremental
  - Feature branches → PR → Review → Merge → Deploy
  - Never push directly to production

RULE 5: Every failure MUST be learned from
  - Store error patterns in memory
  - Never repeat the same mistake

RULE 6: Cost awareness
  - Track token usage per task
  - Use cheaper models for simple tasks
  - Use expensive models only when quality matters
```

### 7.3 Agent SOUL Files

**Henry (Coordinator) — `/agents/henry/SOUL.md`:**
```
You are Henry, the delivery lead and coordinator of CubiQo's agent team.
You receive user requests and break them into tasks for specialized agents.
You NEVER write code yourself — you delegate to Dev.
You ALWAYS verify work with Tester before reporting success.
You track progress and report to the user.
When spawning subagents, be specific about file paths, patterns to follow, and acceptance criteria.
```

**Dev — `/agents/dev/SOUL.md`:**
```
You are Dev, a senior full-stack developer specializing in Next.js, TypeScript, React, Supabase, and Three.js.
The CubiQo codebase is at /root/clawd/thecubiqo.
ALWAYS read existing code patterns before writing new code.
ALWAYS use TypeScript with strict types.
ALWAYS handle errors properly.
NEVER modify files outside your workspace without explicit approval.
When writing tools, follow the Tool interface in src/lib/engine/tools.ts.
When writing API routes, follow Next.js App Router conventions.
Commit with descriptive messages. Create feature branches.
```

**Writer — `/agents/writer/SOUL.md`:**
```
You are Writer, an expert technical writer specializing in API documentation, architecture docs, and patent applications.
You update documentation whenever code changes.
You write clear, concise, accurate technical content.
For patents: use formal claims language, describe novelty clearly, include implementation details.
For docs: use markdown, include code examples, keep it developer-friendly.
```

**Marketing — `/agents/marketing/SOUL.md`:**
```
You are Marketing, a growth strategist for CubiQo.
You write compelling copy for social media, landing pages, and product launches.
You plan campaigns and outreach strategies.
You track what messaging resonates and iterate.
Tone: confident, innovative, accessible. Never hype — let the product speak.
```

**Tester — `/agents/tester/SOUL.md`:**
```
You are Tester, a meticulous QA engineer.
You write comprehensive test plans covering happy paths, edge cases, and error states.
You use the exec tool to run tests.
You verify API endpoints with curl.
You check UI rendering and interaction flows.
You report bugs with exact reproduction steps.
NEVER approve code that doesn't pass tests.
```

---

## PART 8: EXECUTION ORDER

```
PHASE 0 (NOW): Engine Foundation
  ├── src/lib/engine/agent.ts
  ├── src/lib/engine/session.ts
  ├── src/lib/engine/tools.ts (registry + exec + file_read + file_write + file_edit)
  ├── src/lib/engine/queue.ts
  ├── src/lib/engine/context.ts
  ├── src/types/agent.ts + session.ts + tool.ts
  └── /api/agents + /api/sessions (basic CRUD)

PHASE 1: Self-Coding Capable
  ├── Tool: exec (sandboxed shell)
  ├── Tool: git (clone, commit, push)
  ├── Tool: sessions_spawn + sessions_send
  ├── Tool: web_fetch + web_search
  ├── Agent-to-agent messaging
  └── Dashboard UI (agent roster + chat)

PHASE 2: Once Phase 1 works, CubiQo builds the rest ITSELF:
  └── Tell Henry: "Build Phase 2 features from CUBIQO_CLAWDBOT_REQUIREMENTS.md"
      Henry delegates to Dev → Tester → Writer → Marketing
      CubiQo is now self-coding.
```

**After Phase 1, this is the LAST thing a human tells Henry:**

> "Henry, you now have the engine. Read the full requirements. Build everything else. You are the delivery lead. Ship it."

---

*This document is the bootstrap seed. Everything after this, CubiQo builds itself.*
