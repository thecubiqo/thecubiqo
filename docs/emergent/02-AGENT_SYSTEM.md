# Agent System Requirements

## Status: ~65% Implemented

## Overview

The CubiQo agent system consists of 7 specialized AI agents that operate through the Emergent provider. Each agent has a defined role, tool set, and personality (SOUL.md).

## Agent Roster

| ID | Name | Role | Tools | Max Concurrent | Status |
|----|------|------|-------|---------------|--------|
| a1 | Henry | Project Lead, Coordinator | file_read, file_list, sessions_spawn, sessions_send, web_search, web_fetch, telegram_send, vision_analyze, slack_send, discord_send, email_send | 5 | ✅ Configured |
| a2 | Dev | Technical Architect | exec, file_read, file_write, file_patch, file_list, sessions_spawn, sessions_send, git, web_fetch | 3 | ✅ Configured |
| a3 | Writer | Documentation Specialist | file_read, file_write, file_list, sessions_send, web_fetch, git, web_search | 3 | ✅ Configured |
| a4 | Tester | QA Engineer | exec, file_read, file_write, file_list, sessions_send, web_fetch | 2 | ✅ Configured |
| a5 | Marketing | Growth/Social | file_read, file_write, file_list, sessions_send, web_search, web_fetch, vision_analyze, slack_send, discord_send, telegram_send, email_send | 3 | ✅ Configured |
| a6 | Animator | Visual Effects | file_read, file_write, file_list, sessions_send, vision_analyze | 2 | ✅ Configured |
| a7 | Business | Outreach/Customer Service | file_read, file_write, file_list, sessions_send, web_search, web_fetch, telegram_send, slack_send, discord_send, email_send | 3 | ✅ Configured |

## Agent Lifecycle

### Implemented ✅
1. **create(config)** — Instantiate agent, load SOUL.md, init session store
2. **run(prompt, sessionId?)** — Execute a prompt, return response
3. **spawn(task)** — Create a subagent run
4. **stop()** — Abort current run
5. **getHistory(sessionId)** — Retrieve conversation history
6. **clearSession(sessionId)** — Delete a session
7. **listSessions()** — List all sessions for this agent

### Not Implemented ❌
- Auto-failover between providers
- Agent-to-agent messaging via sessions_send tool
- Subagent result announcement back to requester
- Agent workspace isolation (file system sandboxing)

## Tool Registry

### Implemented Tools ✅
| Tool ID | Description | Source |
|---------|-------------|--------|
| exec | Shell command execution | `src/lib/engine/tools.ts` |
| file_read | Read files | `src/lib/engine/tools.ts` |
| file_write | Write files | `src/lib/engine/tools.ts` |
| file_patch | Patch/edit files | `src/lib/engine/tools.ts` |
| file_list | List directory contents | `src/lib/engine/tools.ts` |
| browser | Headless browser control | `src/lib/engine/browser-tool.ts` |
| web_fetch | URL fetch and scrape | `src/lib/engine/web-tools.ts` |
| web_search | Search engine integration | `src/lib/engine/web-tools.ts` |
| memory_search | Semantic memory search | `src/lib/engine/memory.ts` |
| memory_store | Store new memory | `src/lib/engine/memory.ts` |

### Not Implemented Tools ❌
| Tool ID | Description | Spec Reference |
|---------|-------------|----------------|
| git | Git operations (status, add, commit, push, etc.) | CUBIQO_SELF_CODING_ENGINE.md §2.2 |
| sessions_spawn | Create new session for target agent | CUBIQO_SELF_CODING_ENGINE.md §2.2 |
| sessions_send | Send message to another agent | CUBIQO_SELF_CODING_ENGINE.md §2.2 |
| deploy | Trigger Vercel deployment | CUBIQO_SELF_CODING_ENGINE.md §2.2 |
| telegram_send | Send Telegram message | CUBIQO_SELF_CODING_ENGINE.md §2.2 |
| slack_send | Send Slack message | CUBIQO_SELF_CODING_ENGINE.md §2.2 |
| discord_send | Send Discord message | CUBIQO_SELF_CODING_ENGINE.md §2.2 |
| email_send | Send email | CUBIQO_SELF_CODING_ENGINE.md §2.2 |
| vision_analyze | Analyze images | CUBIQO_SELF_CODING_ENGINE.md §2.2 |

## SOUL Files

### Required Agent Personalities
Each agent needs a `SOUL.md` file defining its personality and operating rules:

| Agent | Path | Status |
|-------|------|--------|
| Henry | `/agents/henry/SOUL.md` | ✅ Exists |
| Dev | `/agents/dev/SOUL.md` | ✅ Exists |
| Writer | `/agents/writer/SOUL.md` | ✅ Exists |
| Tester | `/agents/tester/SOUL.md` | ✅ Exists |
| Marketing | `/agents/marketing/SOUL.md` | ✅ Exists |
| Animator | `/agents/animator/SOUL.md` | ❌ Missing |
| Business | `/agents/business/SOUL.md` | ❌ Missing |

## Self-Improvement Rules
1. Every new feature MUST follow existing patterns
2. Every change MUST be tested (Dev writes code → Tester writes tests)
3. Every change MUST be documented (Writer updates docs)
4. Every deployment MUST be incremental (feature branches → PR → review → merge)
5. Every failure MUST be learned from (store error patterns in memory)
6. Cost awareness (track token usage, use cheaper models for simple tasks)

## References
- Source: `src/lib/engine/bootstrap.ts`
- Source: `src/lib/engine/agent.ts`
- Source: `src/types/agent.ts`
- Source: `CUBIQO_SELF_CODING_ENGINE.md` Part 2, Part 7
- Source: `agents/README.md`
