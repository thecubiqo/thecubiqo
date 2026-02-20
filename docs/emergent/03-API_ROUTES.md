# API Routes Implementation Requirements

## Status: ~60% Implemented

## Overview

The Emergent Engine exposes REST API routes through Next.js App Router for agent management, session control, tool execution, memory operations, channel configuration, browser control, and admin functionality.

## Route Implementation Status

### Agent Management API (`/api/agents/`)

| Method | Route | Description | Status |
|--------|-------|-------------|--------|
| POST | `/api/agents` | Create new agent | ✅ |
| GET | `/api/agents` | List all agents | ✅ |
| GET | `/api/agents/:id` | Get agent details + status | ✅ |
| PUT | `/api/agents/:id` | Update agent config | ✅ |
| DELETE | `/api/agents/:id` | Delete agent | ✅ |
| POST | `/api/agents/:id/run` | Send message, get response (SSE) | ✅ |
| POST | `/api/agents/:id/spawn` | Spawn subagent task | ✅ |
| GET | `/api/agents/:id/tasks` | List current/recent tasks | ✅ |
| POST | `/api/agents/:id/stop` | Stop current agent run | ❌ |

Additional implemented routes:
- `/api/agents/activity/` — Agent activity tracking ✅
- `/api/agents/reports/` — Agent activity reports ✅

### Session API (`/api/sessions/`)

| Method | Route | Description | Status |
|--------|-------|-------------|--------|
| GET | `/api/sessions` | List sessions (filterable by agent) | ⚠️ Partial |
| GET | `/api/sessions/:id` | Get session details | ✅ |
| GET | `/api/sessions/:id/history` | Get message history | ❌ |
| DELETE | `/api/sessions/:id` | Delete session | ❌ |
| POST | `/api/sessions/:id/send` | Send message to session | ❌ |
| POST | `/api/sessions/:id/branch` | Fork session into new thread | ❌ |
| GET | `/api/sessions/:id/export` | Export as JSON/markdown | ❌ |

### Tool API (`/api/tools/`)

| Method | Route | Description | Status |
|--------|-------|-------------|--------|
| GET | `/api/tools` | List available tools | ❌ |
| POST | `/api/tools/:id/execute` | Execute tool directly | ❌ |
| GET | `/api/tools/:id/schema` | Get tool input schema | ❌ |

**Note**: The `/api/tools/` directory does not exist. Tool execution happens internally via the engine.

### Memory API (`/api/memory/`)

| Method | Route | Description | Status |
|--------|-------|-------------|--------|
| POST | `/api/memory/search` | Semantic search memories | ✅ |
| POST | `/api/memory/store` | Store new memory | ✅ |
| GET | `/api/memory` | List memories (paginated) | ✅ |
| DELETE | `/api/memory/:id` | Delete memory | ❌ |
| PUT | `/api/memory/:id` | Edit memory | ❌ |

Additional implemented routes:
- `/api/memory/extract/` — Memory extraction ✅
- `/api/memory/search/` — Semantic search ✅
- `/api/memory/stats/` — Memory statistics ✅

### Channel API (`/api/channels/`)

| Method | Route | Description | Status |
|--------|-------|-------------|--------|
| GET | `/api/channels` | List configured channels | ❌ |
| POST | `/api/channels/:type/connect` | Connect new channel | ❌ |
| DELETE | `/api/channels/:type/disconnect` | Disconnect channel | ❌ |
| GET | `/api/channels/:type/status` | Channel health check | ❌ |
| PUT | `/api/channels/:type/config` | Update channel config | ❌ |

**Note**: The `/api/channels/` directory does not exist. Channel adapters are not yet implemented.

### Browser API (`/api/browser/`)

| Method | Route | Description | Status |
|--------|-------|-------------|--------|
| POST | `/api/browser/navigate` | Open URL | ✅ |
| POST | `/api/browser/screenshot` | Capture screenshot | ✅ |
| POST | `/api/browser/click` | Click element | ✅ |
| POST | `/api/browser/type` | Type text | ✅ |
| GET | `/api/browser/tabs` | List open tabs | ❌ |
| POST | `/api/browser/extract` | Extract page content | ❌ |

### Admin API (`/api/admin/`)

| Method | Route | Description | Status |
|--------|-------|-------------|--------|
| GET | `/api/admin/usage` | Token usage stats | ❌ |
| GET | `/api/admin/costs` | Cost breakdown by agent/model | ❌ |
| GET | `/api/admin/users` | User management | ❌ |
| POST | `/api/admin/config` | Update system config | ❌ |
| GET | `/api/admin/logs` | System logs | ❌ |
| GET | `/api/admin/health` | Health check all services | ❌ |

## Existing API Routes (Not in Emergent Spec)

These routes exist in the codebase but are outside the emergent engine spec:
- `/api/ai-stats/` — AI usage statistics
- `/api/auth/` — Authentication
- `/api/chat/` — AI chat endpoint
- `/api/code/` — Code execution
- `/api/cron/` — Scheduled tasks
- `/api/experiments/` — A/B testing
- `/api/feature-flags/` — Feature toggles
- `/api/files/` — File management
- `/api/health/` — Health check
- `/api/journal/` — Journal entries
- `/api/journey/` — User journey
- `/api/messages/` — Messaging
- `/api/services/` — Service status
- `/api/session/` — Auth session
- `/api/tts/` — Text-to-speech
- `/api/voice/` — Voice synthesis
- `/api/webhooks/` — Webhook handlers

## Implementation Priority

1. **High**: Complete Session API (critical for agent-to-agent communication)
2. **High**: Implement Tool API (enables external tool execution)
3. **Medium**: Implement Channel API (multi-channel messaging)
4. **Medium**: Complete Admin API (monitoring and management)
5. **Low**: Complete Browser API (tabs, extract)

## References
- Source: `CUBIQO_SELF_CODING_ENGINE.md` Part 3
- Source: `src/app/api/` directory structure
