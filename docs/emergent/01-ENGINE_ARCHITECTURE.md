# Emergent Engine Architecture Requirements

## Status: ~70% Implemented

## Overview

The CubiQo Emergent Engine is a self-coding AI agent system that coordinates 7 specialized agents (A1–A7) through the Emergent universal API provider. The engine enables autonomous task planning, parallel execution, and iterative self-improvement.

## Core Loop

```
USER REQUEST → HENRY (Coordinator) → PARALLEL AGENT EXECUTION → MERGE & DEPLOY → REPORT
```

## Implemented Components

### ✅ Agent Class (`src/lib/engine/agent.ts`)
- `AgentInstance` class with full lifecycle: `run()`, `spawn()`, `stop()`, `getHistory()`, `clearSession()`, `listSessions()`
- Session and tool management built-in
- LLM integration via `callLLM()` from `src/lib/ai/llm-router.ts`
- Auto-compaction for session context

### ✅ Bootstrap System (`src/lib/engine/bootstrap.ts`)
- 7 agents configured with Emergent provider (claude-sonnet-4-5)
- Agent roles: Henry (A1), Dev (A2), Writer (A3), Tester (A4), Marketing (A5), Animator (A6), Business (A7)
- Default model config: `provider: 'emergent'`, `maxTokens: 4096`, `temperature: 0.7`

### ✅ Type System (`src/types/agent.ts`)
- `Agent`, `ModelConfig`, `Task`, `AgentConfig` interfaces
- Provider union: `'anthropic' | 'openai' | 'meta' | 'mistral' | 'google' | 'emergent' | 'groq'`

### ✅ Additional Engine Files
- `src/lib/engine/session.ts` — Session management
- `src/lib/engine/tools.ts` — Tool registry and execution
- `src/lib/engine/memory.ts` — Vector memory store
- `src/lib/engine/browser-tool.ts` — Browser control
- `src/lib/engine/web-tools.ts` — Web fetch/search
- `src/lib/engine/init.ts` — Engine initialization
- `src/lib/engine/cron.ts` — Scheduled tasks

## Remaining Implementation

### ❌ Context Assembly (`src/lib/engine/context.ts`)
Per the spec, each agent run must assemble:
1. SOUL.md (agent personality)
2. AGENTS.md (available tools and capabilities)
3. USER.md (learned user preferences)
4. Recent memories (vector search for relevant context)
5. Current task context (if spawned as subagent)
6. Session history (last N messages, compacted if long)
7. Tool definitions (JSON Schema for function calling)

### ❌ Concurrency Queue (`src/lib/engine/queue.ts`)
Required implementation:
- Per-agent lanes with configurable `maxConcurrent`
- Global subagent lane with `maxSubagents` limit
- FIFO queue with priority: user messages > agent-to-agent > subagent > cron
- Total system concurrent limit (`globalMax`)

### ❌ Message Router (`src/lib/engine/router.ts`)
Required implementation:
- Channel bindings (telegram, webchat, whatsapp, discord, email)
- Most-specific-first routing (peer > account > channel)
- Fallback to default agent
- SOUL.md + context injection into system prompt

## Environment Variables
```
EMERGENT_API_KEY=sk-emergent-xxx
EMERGENT_BASE_URL=https://api.emergentmethods.ai/v1
```

## File System Contract
```
src/lib/engine/
├── agent.ts        ✅ Agent class
├── session.ts      ✅ Session management
├── tools.ts        ✅ Tool registry
├── memory.ts       ✅ Vector memory
├── browser-tool.ts ✅ Browser control
├── web-tools.ts    ✅ Web fetch/search
├── bootstrap.ts    ✅ Agent bootstrap
├── init.ts         ✅ Initialization
├── cron.ts         ✅ Scheduled tasks
├── context.ts      ❌ Context assembly
├── queue.ts        ❌ Concurrency queue
├── router.ts       ❌ Message router
├── compaction.ts   ❌ Context compaction
└── spawner.ts      ❌ Subagent spawning
```

## References
- Source: `CUBIQO_SELF_CODING_ENGINE.md` Part 1, Part 2
- Source: `src/lib/engine/bootstrap.ts`
- Source: `src/types/agent.ts`
