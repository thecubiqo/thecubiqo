# Deployment & Infrastructure Requirements

## Status: ~60% Implemented

## Overview

CubiQo deploys through Vercel with a multi-environment pipeline (staging → production → fallback). The Emergent Engine requires additional infrastructure for agent execution, scheduled tasks, and multi-channel messaging.

## Deployment Pipeline

### Current Architecture ("The Fortress")

```
Staging (staging0217)
    ↓ Verified
Production (prod-a / cubiqo.ai)
    ↓ Fallback
Production Fallback (prod-b)
```

### Vercel Configuration (`vercel.json`)
- Next.js 14.2.25 deployment
- Environment-specific builds
- API routes served as serverless functions

### Environment Configuration
```
# Production URLs
NEXT_PUBLIC_BASE_URL=https://cubiqo.ai
VERCEL_URL=cubiqo.ai

# Supabase
NEXT_PUBLIC_SUPABASE_URL=xxx
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# LLM Providers
EMERGENT_API_KEY=sk-emergent-xxx
EMERGENT_BASE_URL=https://api.emergentmethods.ai/v1
ANTHROPIC_API_KEY=sk-ant-xxx
OPENAI_API_KEY=sk-xxx

# Additional services
BRAVE_SEARCH_KEY=xxx            # Web search tool
MINIMAX_API_KEY=xxx             # Voice synthesis
```

## Monitoring

### Implemented ✅
- `/api/health` — Basic health check endpoint
- `/api/services` — Service status
- Admin dashboard (`/admin`) — Real-time stats (agents, sessions, messages)
- System health display — Memory, heap, uptime on admin page
- AI cost analytics (`DashboardStats` component) — Ollama vs cloud usage
- Dashboard system health — Uptime (99.9%), memory (42%), API latency (45ms)

### Not Implemented ❌
- `/api/admin/usage` — Token usage stats per agent/model
- `/api/admin/costs` — Cost breakdown with historical data
- `/api/admin/logs` — Centralized system logging
- `/api/admin/health` — Comprehensive health check (all services)
- Agent activity monitoring — Per-agent task tracking
- Error alerting — Notifications for agent failures
- Performance metrics — Request latency, throughput tracking

## CI/CD Workflows

### Existing Workflows (`.github/workflows/`)

| Workflow | File | Purpose |
|----------|------|---------|
| CI Pipeline | `ci.yml` | Build, lint, test on PRs |
| Chromatic | `chromatic.yml` | Visual regression testing |
| Self-Heal Cron | `self-heal-cron.yml` | Scheduled self-healing |

### Required Workflow Updates

1. **Engine Tests**: Add emergent engine test suite to CI pipeline
2. **Migration Validation**: Validate Supabase migration files
3. **Provider Tests**: Test LLM provider integration (mocked)
4. **Deployment Validation**: Post-deploy health checks

## Infrastructure Requirements

### For Agent Execution
- **Compute**: Agent runs require sustained compute for tool execution (exec, browser, etc.)
- **Concurrency**: Global max concurrent runs per the queue specification
- **Timeouts**: 30s default for tool execution, configurable per tool
- **File Storage**: Per-agent workspace directories

### For Multi-Channel Messaging
- **Webhook Endpoints**: Telegram, Discord, Slack webhook receivers
- **Persistent Connections**: WebSocket for real-time chat
- **Channel Adapters**: Stateless adapters per channel type

### For Vector Memory
- **pgvector Extension**: Required on Supabase PostgreSQL
- **Embedding Generation**: API calls for text → vector(1536)
- **Similarity Search**: Efficient cosine similarity queries

## Execution Phases

From `CUBIQO_SELF_CODING_ENGINE.md` Part 8:

### Phase 0: Engine Foundation ✅ (Mostly Complete)
- [x] `src/lib/engine/agent.ts`
- [x] `src/lib/engine/session.ts`
- [x] `src/lib/engine/tools.ts` (registry + exec + file ops)
- [ ] `src/lib/engine/queue.ts`
- [ ] `src/lib/engine/context.ts`
- [x] `src/types/agent.ts` + related types
- [x] `/api/agents` (basic CRUD)
- [x] `/api/sessions` (partial)

### Phase 1: Self-Coding Capable (In Progress)
- [x] Tool: exec (shell execution)
- [ ] Tool: git (clone, commit, push)
- [ ] Tool: sessions_spawn + sessions_send
- [x] Tool: web_fetch + web_search
- [ ] Agent-to-agent messaging
- [x] Dashboard UI (agent roster + emergent status)

### Phase 2: Self-Building
Once Phase 1 is complete, CubiQo builds remaining features itself:
- Channel integrations (Telegram, Discord, WhatsApp, etc.)
- Admin panel enhancements
- Skills marketplace
- Additional tool implementations

## Feature Flags

Current feature flags (`src/config/feature-flags.ts`):
- Admin elevated controls
- Audit logging
- Landing page variants (model footer, particle landing)
- Controlled via environment variables

## References
- Source: `docs/ARCHITECTURE_V1.md`
- Source: `vercel.json`
- Source: `.env.example`
- Source: `.github/workflows/`
- Source: `CUBIQO_SELF_CODING_ENGINE.md` Part 8
- Source: `src/config/feature-flags.ts`
