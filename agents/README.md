# CubiQo Agents

Multi-agent AI system for coordinated task execution.

## Quick Start

### 1. Setup Environment
```bash
# Ensure .env.local has your API keys
EMERGENT_API_KEY=your_key_here
EMERGENT_BASE_URL=https://api.emergentmethods.ai/v1
```

### 2. Run Tests
```bash
# Simple spawn test (creates a test file)
node test-spawn-simple.js

# Full coordination test (simulates user → Henry → Dev workflow)
node test-agent-coordination.js
```

## Agents

| Agent | Role | Tools |
|-------|------|-------|
| **Henry** | Coordinator | spawn, send, read, list, web |
| **Dev** | Developer | exec, read, write, git |
| **Writer** | Docs | read, write, git |
| **Tester** | QA | exec, read, write, web |
| **Marketing** | Content | read, write, search, git |

## Agent Files

Each agent has:
- `SOUL.md` - Identity, rules, examples
- Workspace at `/root/clawd/thecubiqo`

## Coordination

Agents coordinate using:
- `sessions_spawn` - Create subagent task
- `sessions_send` - Message another agent
- Sessions - Conversation history
- Tasks - Tracked work units

See [AGENT_COORDINATION.md](./AGENT_COORDINATION.md) for full details.

## Architecture

```
┌─────────────────────────────────────────┐
│              User Input                 │
└──────────────┬──────────────────────────┘
               │
               ▼
         ┌──────────┐
         │  Henry   │  (Coordinator)
         └─────┬────┘
               │
       ┌───────┼───────┬────────┐
       │       │       │        │
       ▼       ▼       ▼        ▼
    ┌────┐  ┌────┐  ┌────┐  ┌────┐
    │Dev │  │Writ│  │Test│  │Mktg│
    └────┘  └────┘  └────┘  └────┘
       │       │       │        │
       └───────┴───────┴────────┘
               │
               ▼
         [Workspace Files]
```

## API Endpoints

### Spawn Task
```http
POST /api/agents/{agentId}/spawn
{
  "task": "Create a landing page component",
  "label": "Landing Page"
}
```

### Run Prompt
```http
POST /api/agents/{agentId}/run
{
  "prompt": "What's the status?",
  "sessionId": "optional"
}
```

### List Sessions
```http
GET /api/agents/{agentId}/sessions
```

## Examples

### Simple Task
```javascript
// Spawn Dev to create a file
const result = await fetch('/api/agents/dev/spawn', {
  method: 'POST',
  body: JSON.stringify({
    task: 'Create /utils/helpers.ts with a formatDate function'
  })
});

// Returns: { runId, sessionId, status: "accepted" }
```

### Complex Task
```javascript
// User: "Build a landing page"
// Henry receives request
// Henry spawns Dev with detailed spec
// Dev builds the page
// Henry spawns Tester to verify
// Tester validates
// Henry reports back to user
```

## Development

### Adding a New Agent

1. Create agent directory:
```bash
mkdir -p agents/newagent
```

2. Create SOUL.md:
```markdown
# NewAgent - Role Description

You are NewAgent, specializing in X.

## Rules
- Rule 1
- Rule 2

## Tools
- tool1
- tool2
```

3. Register in bootstrap.ts:
```typescript
await createAgent({
  id: 'newagent',
  name: 'NewAgent',
  model: defaultModel,
  tools: ['file_read', 'file_write'],
  maxConcurrent: 2,
});
```

4. Update Henry's SOUL.md with new agent info

### Testing Agent Changes

```bash
# Test individual agent
node test-agent.js newagent "Test task"

# Test coordination
node test-agent-coordination.js
```

## Troubleshooting

### Agent Not Found
- Check bootstrap.ts includes the agent
- Verify SOUL.md exists in agents/{agentId}/
- Restart the server

### Tool Not Available
- Check agent's `tools` array in bootstrap.ts
- Verify tool exists in tools.ts registry
- Check tool's `allowedAgents` if restricted

### Task Stuck
- Check Dev's currentTasks array
- Look for errors in task.result
- Verify LLM API key is valid
- Check token limits

## Best Practices

1. **Be Specific** - Clear task descriptions get better results
2. **Verify Results** - Always test before reporting success
3. **Track Progress** - Poll task status for long-running work
4. **Handle Errors** - Check for failed status and retry if needed
5. **Document** - Keep agent SOUL.md files up to date

## Resources

- [Agent Coordination Guide](./AGENT_COORDINATION.md)
- [Tool Reference](../src/lib/engine/tools.ts)
- [Type Definitions](../src/types/agent.ts)

## Next Steps

- [ ] Real-time progress streaming
- [ ] Agent-to-agent direct messaging
- [ ] Task queue with priorities
- [ ] Persistent sessions (Supabase)
- [ ] Cost tracking dashboard
- [ ] Agent learning and memory
