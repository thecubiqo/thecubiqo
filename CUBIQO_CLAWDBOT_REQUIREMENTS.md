# CubiQo + ClawdBot Capabilities — Full Requirements Spec
## For: Henry (Delivery Lead) → Dev, Writer, Marketing, Tester

---

## VISION
Transform CubiQo from an AI chat companion into a **full autonomous agent platform** with all ClawdBot-level capabilities. CubiQo becomes the user-facing product; ClawdBot's engine powers it underneath.

---

## CAPABILITY MAP: ClawdBot → CubiQo

### TIER 1: CORE AGENT ENGINE (P0 — Ship First)

#### 1.1 Multi-Agent System
- **What ClawdBot has:** Multiple isolated agents with separate workspaces, memory, personalities (SOUL.md), and session stores
- **CubiQo needs:**
  - [x] Agent creation UI — users create named agents with custom roles/personalities
  - [x] Agent workspace isolation — each agent gets its own file space, memory, context
  - [x] Agent-to-agent messaging — agents can delegate tasks to each other
  - [x] Agent coordinator (like Henry) — main agent routes tasks to specialists
  - [x] Agent roster dashboard — see all agents, their status, current tasks
  - [x] Per-agent model selection (Claude, GPT, Llama, Mistral, etc.)

#### 1.2 Subagent Spawning
- **What ClawdBot has:** `sessions_spawn` — background parallel agents that report back
- **CubiQo needs:**
  - [ ] Spawn subagents from any agent for parallel work
  - [ ] Subagent progress tracking — see what each subagent is doing
  - [ ] Subagent announce — results posted back to the requesting chat
  - [ ] Concurrency controls — max concurrent agents, queue management
  - [ ] Auto-archive completed subagent sessions
  - [ ] Cost tracking per subagent run (tokens, model, duration)

#### 1.3 Session Management
- **What ClawdBot has:** Persistent sessions, session history, session pruning, compaction
- **CubiQo needs:**
  - [x] Persistent conversation sessions per agent
  - [x] Session history retrieval and search
  - [ ] Session pruning (auto-delete old sessions)
  - [x] Context compaction (summarize long conversations to save tokens)
  - [ ] Session branching — fork a conversation into a new thread
  - [ ] Session export (JSON, markdown)

---

### TIER 2: TOOL SYSTEM (P0)

#### 2.1 Browser Control
- **What ClawdBot has:** Headless Chrome, Chrome extension relay, tab control, screenshots, CDP
- **CubiQo needs:**
  - [ ] Headless browser on server — agents can browse, scrape, fill forms
  - [ ] Screenshot capture and visual analysis
  - [ ] Tab management (open, close, navigate, list)
  - [ ] Click, type, drag, select actions
  - [ ] Page content extraction (text, images, links)
  - [ ] Browser profile management (isolated sessions)
  - [ ] Optional: Chrome extension relay for controlling user's browser

#### 2.2 Code Execution
- **What ClawdBot has:** `exec` tool — run shell commands, scripts, code
- **CubiQo needs:**
  - [ ] Sandboxed code execution (Python, Node.js, shell)
  - [ ] File read/write/edit within agent workspace
  - [ ] Git integration (clone, commit, push, PR)
  - [ ] Process management (start, stop, monitor background tasks)
  - [ ] Approval workflows for dangerous operations

#### 2.3 Web Search & Fetch
- **What ClawdBot has:** `web_fetch`, Brave Search, Firecrawl integration
- **CubiQo needs:**
  - [ ] Web search (Brave, Google, DuckDuckGo)
  - [ ] URL fetch and content extraction
  - [ ] Web scraping with structured data output
  - [ ] RSS/feed monitoring

#### 2.4 File & Canvas
- **What ClawdBot has:** Canvas file server, read/write/edit/apply_patch tools
- **CubiQo needs:**
  - [ ] Agent workspace file management
  - [ ] Canvas — shared visual workspace for agent outputs
  - [ ] File preview (code, markdown, images, PDFs)
  - [ ] Collaborative editing between agents

---

### TIER 3: CHANNEL SYSTEM (P1)

#### 3.1 Multi-Channel Messaging
- **What ClawdBot has:** Telegram, WhatsApp, Discord, Slack, Signal, iMessage, Nostr, Teams, Matrix
- **CubiQo needs:**
  - [x] Telegram bot integration
  - [ ] WhatsApp (via Baileys)
  - [x] Discord bot
  - [x] Slack app
  - [x] Email (send/receive/reply)
  - [ ] SMS (Twilio)
  - [x] Web chat (already exists — enhance)
  - [x] Channel routing — different agents on different channels
  - [ ] Multi-account support per channel

#### 3.2 Channel Features
- [ ] Inline buttons / interactive messages
- [ ] Media handling (images, audio, video, documents)
- [ ] Reaction notifications
- [ ] Reply threading
- [ ] Group chat support with mention gating
- [ ] DM access control (pairing, allowlist, open)

---

### TIER 4: MEMORY & INTELLIGENCE (P1)

#### 4.1 Long-Term Memory
- **What ClawdBot has:** Memory extraction, session-based recall, LanceDB vector store
- **CubiQo needs:**
  - [ ] Conversation memory extraction (key facts, preferences, decisions)
  - [ ] Vector store for semantic memory search (LanceDB or Supabase pgvector)
  - [ ] Memory categories (personal, project, reference)
  - [ ] Memory management UI — view, edit, delete memories
  - [ ] Cross-agent memory sharing (optional, controlled)
  - [ ] User profile building from conversations (USER.md equivalent)

#### 4.2 Context System
- **What ClawdBot has:** SOUL.md, AGENTS.md, USER.md, IDENTITY.md, HEARTBEAT.md, BOOTSTRAP.md
- **CubiQo needs:**
  - [ ] SOUL.md — agent personality and behavior rules
  - [ ] AGENTS.md — agent capabilities and tool descriptions
  - [ ] USER.md — learned user preferences and context
  - [ ] System prompt management UI
  - [ ] Context injection per conversation
  - [ ] Dynamic context based on active project/task

---

### TIER 5: VOICE & MULTIMODAL (P1)

#### 5.1 Voice System (CubiQo already has basics)
- **Enhance with:**
  - [ ] Voice-to-text (Whisper/Deepgram)
  - [ ] Text-to-speech (ElevenLabs — already integrated)
  - [ ] Voice modulation (madhyama marg — already built)
  - [ ] Real-time voice conversation mode
  - [ ] Voice commands for agent control
  - [ ] Audio message support in channels

#### 5.2 Vision & Image
- [x] Image understanding (GPT-4V, Claude Vision)
- [ ] Screenshot analysis
- [ ] Image generation (DALL-E, Stable Diffusion)
- [ ] Document/PDF analysis
- [ ] Camera input (mobile)

---

### TIER 6: AUTOMATION & SCHEDULING (P2)

#### 6.1 Cron Jobs
- **What ClawdBot has:** Scheduled tasks, recurring agent runs
- **CubiQo needs:**
  - [x] Cron job scheduler — run agent tasks on schedule
  - [ ] Recurring tasks (daily reports, monitoring, backups)
  - [ ] Event-triggered tasks (new email → agent processes it)
  - [ ] Task queue with priority

#### 6.2 Skills System
- **What ClawdBot has:** Reusable skill packages per agent or shared
- **CubiQo needs:**
  - [ ] Skill marketplace — install pre-built capabilities
  - [ ] Custom skill creation (prompt + tools + config)
  - [ ] Per-agent skill assignment
  - [ ] Skill sharing between agents
  - [ ] Community skills repo

---

### TIER 7: SECURITY & ADMIN (P1)

#### 7.1 Authentication & Access
- [ ] User auth (Supabase — already exists)
- [ ] Role-based access (Admin, User, Guest)
- [ ] API key management (BYO mode — already exists)
- [ ] Agent permission controls (which tools each agent can use)
- [ ] Approval workflows for sensitive operations
- [ ] Audit log of all agent actions

#### 7.2 Cost & Usage
- [ ] Token usage tracking per agent, per model
- [ ] Spending caps and alerts
- [ ] Cost dashboard with breakdowns
- [ ] Rate limiting per user/agent
- [ ] Model cost comparison

#### 7.3 Deployment
- [ ] Prod-A (Admin) / Prod-B (Public) split — already designed
- [ ] Docker containerization
- [ ] One-click deploy (Vercel, Railway, self-host)
- [ ] Environment management UI

---

## LLM PROVIDER MATRIX

| Provider | Models | Use Case | Priority |
|----------|--------|----------|----------|
| Anthropic | Claude Sonnet 4.5, Opus 4.5 | Deep reasoning, coding | P0 |
| OpenAI | GPT-5.2, GPT-4o | Creative, general | P0 |
| Meta | Llama 3.x | Open source, self-host | P1 |
| Mistral | Mixtral, Mistral Large | European, fast | P1 |
| Google | Gemini Pro/Flash | Multimodal | P2 |
| ElevenLabs | Voice models | TTS | P0 (exists) |
| Deepgram/Whisper | STT | Voice input | P1 |

---

## IMPLEMENTATION PHASES

### Phase 1: Agent Engine (Week 1-2)
- Multi-agent creation and management
- Subagent spawning
- Session management
- Agent-to-agent communication
- **Owner: Dev Agent**

### Phase 2: Tool System (Week 2-3)
- Headless browser integration
- Code execution sandbox
- File management
- Web search/fetch
- **Owner: Dev Agent**

### Phase 3: Channels (Week 3-4)
- Telegram integration
- WhatsApp integration
- Channel routing
- **Owner: Dev Agent**

### Phase 4: Memory & Context (Week 4-5)
- Vector memory store
- Context system (SOUL/AGENTS/USER)
- Memory management UI
- **Owner: Dev Agent + Writer Agent**

### Phase 5: Automation (Week 5-6)
- Cron jobs
- Skills system
- Event triggers
- **Owner: Dev Agent**

### Phase 6: Polish & Launch (Week 6-8)
- Security audit — **Tester Agent**
- Documentation — **Writer Agent**
- Marketing launch — **Marketing Agent**
- Patent filing — **Writer Agent**

---

## ARCHITECTURE DECISION

### Option A: Embed ClawdBot as Engine
- Use ClawdBot's npm package as the backend agent engine
- CubiQo frontend → ClawdBot gateway → agents
- Pros: Battle-tested, all features ready
- Cons: Dependency on ClawdBot updates

### Option B: Build Native
- Rebuild agent capabilities natively in CubiQo's Next.js stack
- Pros: Full control, no dependencies
- Cons: Massive effort, reinventing the wheel

### RECOMMENDATION: Option A (Hybrid)
- Use ClawdBot as the agent engine (gateway + tools + channels)
- CubiQo frontend as the UI layer
- CubiQo API routes proxy to ClawdBot gateway
- Gradually replace ClawdBot components with native ones as needed

---

## HENRY'S ORDERS

Henry — you are the delivery lead. Execute this as follows:

1. **Read this entire doc** and internalize the vision
2. **Create a project plan** with milestones in your workspace
3. **Assign Phase 1 tasks to Dev** — start with multi-agent engine
4. **Assign documentation to Writer** — start with architecture updates
5. **Assign launch prep to Marketing** — start with positioning and copy
6. **Assign test planning to Tester** — start with test matrix for Phase 1
7. **Report daily progress** to Ed via Telegram
8. **Escalate blockers** immediately — don't wait
9. **Track costs** — monitor Universal Key spending
10. **Ship incrementally** — deploy each phase as it's ready

**The goal: CubiQo becomes a product anyone can deploy that gives them their own Henry + team.**

---

*Generated by E1 on Emergent — Full capability transfer spec from ClawdBot to CubiQo*
