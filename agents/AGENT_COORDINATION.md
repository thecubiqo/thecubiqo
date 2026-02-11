# Agent Coordination Guide

CubiQo uses a multi-agent architecture where specialized agents work together to complete complex tasks.

## Architecture

```
User Request
    ↓
  Henry (Coordinator)
    ↓
    ├─→ Dev (Code)
    ├─→ Writer (Documentation)
    ├─→ Tester (QA)
    └─→ Marketing (Content)
```

## Agents

### Henry - Delivery Lead & Coordinator
- **Role**: Receives user requests, delegates to specialists, tracks progress
- **Tools**: `file_read`, `file_list`, `sessions_spawn`, `sessions_send`, `web_search`, `web_fetch`
- **Rules**:
  - NEVER writes code himself
  - ALWAYS verifies with Tester before reporting success
  - Tracks token usage and cost
  - Breaks down complex requests into specific tasks

### Dev - Senior Full-Stack Developer
- **Role**: Builds features, writes code, fixes bugs
- **Tools**: `exec`, `file_read`, `file_write`, `file_list`, `git`, `web_fetch`
- **Specialties**: Next.js, TypeScript, React, Supabase, Three.js
- **Rules**:
  - Always reads existing patterns first
  - TypeScript strict mode
  - Proper error handling
  - Tests for new features

### Writer - Technical Documentation Specialist
- **Role**: Creates and maintains documentation
- **Tools**: `file_read`, `file_write`, `file_list`, `web_fetch`, `git`
- **Rules**:
  - Matches existing tone and style
  - Includes code examples
  - Technical accuracy is priority
  - Updates table of contents

### Tester - QA Specialist
- **Role**: Tests features, verifies quality, reports bugs
- **Tools**: `exec`, `file_read`, `file_write`, `file_list`, `web_fetch`
- **Rules**:
  - Tests edge cases
  - Provides clear reproduction steps
  - Tests happy path AND error cases
  - Documents expected vs actual behavior

### Marketing - Content Specialist
- **Role**: Creates marketing content, social media, campaigns
- **Tools**: `file_read`, `file_write`, `file_list`, `web_search`, `web_fetch`, `git`

## Coordination Tools

### sessions_spawn
Spawns a subagent to work on a task in parallel.

```javascript
{
  "name": "sessions_spawn",
  "arguments": {
    "agentId": "dev",
    "task": "Create a landing page component with hero section and CTA",
    "label": "Landing Page Feature"
  }
}
```

**Returns:**
```json
{
  "runId": "uuid",
  "sessionId": "uuid",
  "status": "accepted"
}
```

### sessions_send
Send a message to another agent session.

```javascript
{
  "name": "sessions_send",
  "arguments": {
    "agentId": "tester",
    "sessionId": "optional-session-id",
    "message": "Test the new landing page component at /app/landing/page.tsx"
  }
}
```

## Workflow Example: "Build a Landing Page"

### 1. User → Henry
```
User: "Build a landing page for CubiQo with a hero section and CTA button"
```

### 2. Henry Analyzes & Delegates
Henry breaks this down into tasks:
- Dev: Build the component
- Writer: Document the component
- Tester: Verify it works

```javascript
// Henry spawns Dev
sessions_spawn({
  agentId: "dev",
  task: "Create /app/landing/page.tsx with:
    - Hero section with gradient background
    - Headline: 'Welcome to CubiQo'
    - Subheading: 'Your AI agent team'
    - CTA button: 'Get Started'
    - Responsive design
    - TypeScript strict mode
    - Tailwind CSS styling"
})
```

### 3. Dev Works
Dev:
1. Reads existing components for patterns
2. Creates `/app/landing/page.tsx`
3. Tests locally
4. Commits to feature branch
5. Returns result with file paths

### 4. Henry Verifies
```javascript
// Henry asks Tester to verify
sessions_spawn({
  agentId: "tester",
  task: "Test /app/landing/page.tsx:
    - Verify renders correctly
    - Test responsive design
    - Check accessibility
    - Validate TypeScript types"
})
```

### 5. Final Report
Henry compiles results and reports back to user:
```
✅ Landing page created at /app/landing/page.tsx
✅ Tested and verified by Tester
✅ Committed to branch: feature/landing-page

Next steps:
- Review the code
- Merge to production
- Deploy
```

## Best Practices

### For Henry (Coordinators)
1. **Be specific** - Give clear acceptance criteria
2. **Track progress** - Poll task status periodically
3. **Verify results** - Always test before reporting success
4. **Report clearly** - Summarize what was done and where

### For Specialists
1. **Acknowledge tasks** - Start with what you're doing
2. **Work methodically** - Read → Plan → Execute → Verify
3. **Return artifacts** - List files created/modified
4. **Report issues** - If blocked, explain what you need

### Task Descriptions
Good task description:
```
Create a React component at /components/Button.tsx with:
- Props: label, onClick, variant (primary/secondary)
- TypeScript interfaces
- Tailwind CSS styling
- Hover and focus states
- Accessibility attributes (aria-label, role)
```

Bad task description:
```
Make a button
```

## Testing

### Run Coordination Test
```bash
cd /root/clawd/thecubiqo
node test-agent-coordination.js
```

### Run Simple Spawn Test
```bash
node test-spawn-simple.js
```

## API Endpoints

### Spawn Agent
```http
POST /api/agents/henry/spawn
Content-Type: application/json

{
  "task": "Create a landing page",
  "label": "Landing Page Feature"
}
```

### Run Agent
```http
POST /api/agents/henry/run
Content-Type: application/json

{
  "prompt": "What's the status of the landing page task?",
  "sessionId": "optional-session-id"
}
```

### Get Agent Sessions
```http
GET /api/agents/henry/sessions
```

## Token Management

Each agent tracks:
- Input tokens
- Output tokens
- Estimated cost
- Token usage per session

Henry reports aggregate costs for the entire workflow.

## Error Handling

If a subagent fails:
1. Henry receives error status
2. Henry decides: retry, abort, or delegate differently
3. User is informed of the issue and resolution attempt

## Future Enhancements

- [ ] Agent-to-agent direct communication (without Henry)
- [ ] Parallel task execution with dependencies
- [ ] Task prioritization and queuing
- [ ] Real-time progress streaming
- [ ] Cross-agent context sharing
- [ ] Agent learning from past tasks
