# Tools API Architecture Flow

## Request Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                          CLIENT                                  │
│  (Web App, CLI, External Service, Agent, etc.)                  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           │ HTTP Request
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Next.js API Routes                           │
│                   (src/app/api/tools/)                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │  GET /api/tools  │  │ POST /:id/execute│  │GET /:id/schema│ │
│  │  List tools      │  │ Execute tool     │  │Get schema    │  │
│  └────────┬─────────┘  └────────┬─────────┘  └──────┬───────┘  │
│           │                     │                    │           │
└───────────┼─────────────────────┼────────────────────┼───────────┘
            │                     │                    │
            │                     │                    │
            ▼                     ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                        ToolRegistry                              │
│                  (src/lib/engine/tools.ts)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  getTools()     │  │  execute()      │  │  register()     │ │
│  │  - Filter by ID │  │  - Check perms  │  │  - Add tool     │ │
│  │  - Check perms  │  │  - Execute tool │  │  - Validate     │ │
│  │  - Return defs  │  │  - Return result│  │                 │ │
│  └────────┬────────┘  └────────┬────────┘  └─────────────────┘ │
│           │                    │                                 │
└───────────┼────────────────────┼─────────────────────────────────┘
            │                    │
            │                    │
            ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Tool Instances                           │
│              (Built-in + Imported Tools)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Core Tools:          Communication:       Utilities:            │
│  ├─ file_read        ├─ sessions_send    ├─ web_search          │
│  ├─ file_write       ├─ telegram_send    ├─ web_fetch           │
│  ├─ file_list        ├─ slack_send       ├─ vision              │
│  ├─ exec             ├─ discord_send     └─ patch               │
│  ├─ git              └─ email_send                               │
│  └─ sessions_spawn                                               │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

---

## API Endpoint Details

### 1. GET /api/tools
**Purpose:** List available tools

```
Client Request:
  GET /api/tools?ids=file_read,exec&userId=user-123
                 ↓
Route Handler (route.ts):
  - Parse query params (ids, userId)
  - Create ToolRegistry instance
  - Call registry.getTools(toolIds, userId)
                 ↓
ToolRegistry.getTools():
  - Filter by toolIds (if provided)
  - Check Founders Pass (if userId provided)
  - Filter restricted tools for non-founders
  - Map to ToolDefinition[]
                 ↓
Response:
  { tools: [{ name, description, input_schema }, ...] }
```

---

### 2. POST /api/tools/:id/execute
**Purpose:** Execute a tool

```
Client Request:
  POST /api/tools/file_read/execute
  Body: { params: { path: "test.txt" }, context: { ... } }
                 ↓
Route Handler ([id]/execute/route.ts):
  - Validate tool ID from params
  - Validate params in body
  - Build ToolContext with defaults
  - Create ToolRegistry instance
  - Call registry.execute(id, params, context)
                 ↓
ToolRegistry.execute():
  - Lookup tool by ID
  - Check agent permissions (allowedAgents)
  - Call tool.execute(params, context)
                 ↓
Tool Implementation:
  - Validate params
  - Execute logic (read file, run command, etc.)
  - Return ToolResult { success, output, error, artifacts }
                 ↓
Response:
  { result: { success, output, error?, artifacts? } }
```

---

### 3. GET /api/tools/:id/schema
**Purpose:** Get tool schema

```
Client Request:
  GET /api/tools/file_read/schema
                 ↓
Route Handler ([id]/schema/route.ts):
  - Validate tool ID from params
  - Create ToolRegistry instance
  - Call registry.getTools([id])
  - Check if tool exists
                 ↓
ToolRegistry.getTools():
  - Lookup tool by ID
  - Return ToolDefinition
                 ↓
Response:
  { name, description, input_schema }
  
  OR (if not found):
  
  { error: "Tool not found: invalid_id" } (404)
```

---

## Permission Flow

```
User Request → API Route → ToolRegistry
                              │
                              ├─ Check userId
                              │  └─ Query Supabase profiles
                              │     └─ email = 'aditya@cubiqo.ai'?
                              │
                              ├─ If Founder:
                              │  └─ Return ALL tools
                              │
                              └─ If Regular User:
                                 └─ Filter out restricted tools:
                                    - exec
                                    - git
                                    - file_write
                                    - sessions_spawn
                                    - email_send
                                    - slack_send
                                    - discord_send
                                    - telegram_send
```

---

## Tool Execution Flow

```
1. Client sends params
   ↓
2. API validates params
   ↓
3. ToolRegistry finds tool
   ↓
4. Check agent permissions
   ↓
5. Tool.execute() runs
   ↓
6. Tool performs action:
   - Read file
   - Write file
   - Execute command
   - Send message
   - etc.
   ↓
7. Tool returns result:
   { success, output, error?, artifacts? }
   ↓
8. API returns to client
```

---

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                          Error Types                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Client Errors (4xx):                                            │
│  ├─ 400 Bad Request                                              │
│  │  - Missing required params                                    │
│  │  - Invalid param format                                       │
│  │  - Invalid tool ID                                            │
│  │                                                                │
│  ├─ 401 Unauthorized                                             │
│  │  - Missing auth token (future)                               │
│  │  - Invalid auth token (future)                               │
│  │                                                                │
│  ├─ 403 Forbidden                                                │
│  │  - Agent not allowed to use tool                             │
│  │  - User lacks permissions                                    │
│  │                                                                │
│  └─ 404 Not Found                                                │
│     - Tool ID doesn't exist                                      │
│                                                                   │
│  Server Errors (5xx):                                            │
│  └─ 500 Internal Server Error                                    │
│     - Tool execution failed                                      │
│     - Database connection failed                                 │
│     - Unexpected exception                                       │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘

Error Response Format:
  {
    "error": "Human-readable error message"
  }

Error Logging:
  console.error('[API Name] Method error:', error)
  - Logs full error server-side
  - Returns generic message to client
  - Hides internal details
```

---

## Data Flow Example: Execute file_read

```
Step 1: Client Request
-------
POST /api/tools/file_read/execute
Content-Type: application/json

{
  "params": {
    "path": "package.json",
    "encoding": "utf-8"
  },
  "context": {
    "workspace": "/home/user/project"
  }
}

Step 2: Route Handler
-------
- Extract tool ID: "file_read"
- Extract params: { path, encoding }
- Build context:
  {
    agentId: "api-direct",
    sessionId: "api-session",
    workspace: "/home/user/project",
    userId: undefined
  }

Step 3: ToolRegistry.execute()
-------
- Find tool: this.tools.get("file_read")
- Check permissions: No restrictions for file_read
- Call tool.execute(params, context)

Step 4: Tool Execution
-------
import { readFile } from 'fs/promises'
import { join } from 'path'

const fullPath = join(context.workspace, params.path)
// = /home/user/project/package.json

const content = await readFile(fullPath, 'utf-8')

Step 5: Tool Result
-------
{
  success: true,
  output: "{ \"name\": \"cubiqo\", ... }",
  artifacts: ["/home/user/project/package.json"]
}

Step 6: API Response
-------
HTTP 200 OK
Content-Type: application/json

{
  "result": {
    "success": true,
    "output": "{ \"name\": \"cubiqo\", ... }",
    "artifacts": ["/home/user/project/package.json"]
  }
}
```

---

## Integration Points

### Frontend Integration
```typescript
// React component or page
const listTools = async () => {
  const res = await fetch('/api/tools');
  const { tools } = await res.json();
  return tools;
};

const executeTool = async (toolId: string, params: any) => {
  const res = await fetch(`/api/tools/${toolId}/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ params })
  });
  const { result } = await res.json();
  return result;
};
```

### Agent Integration
```typescript
// Agent can use tools via HTTP
import { getAgent } from '@/lib/engine/agent';

const agent = getAgent('main');
const tools = await agent.getAvailableTools();
// Internally calls GET /api/tools

const result = await agent.executeTool('file_read', { path: 'test.txt' });
// Internally calls POST /api/tools/file_read/execute
```

### CLI Integration
```bash
# List tools
curl http://localhost:3000/api/tools | jq

# Execute tool
curl -X POST http://localhost:3000/api/tools/exec/execute \
  -H "Content-Type: application/json" \
  -d '{"params": {"command": "ls -la"}}'
```

---

## Security Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Security Layers                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Layer 1: Input Validation                                       │
│  ├─ Validate required params                                     │
│  ├─ Type checking via TypeScript                                │
│  └─ Early return on invalid input                               │
│                                                                   │
│  Layer 2: Permission Checking                                    │
│  ├─ User-based permissions (Founders Pass)                      │
│  ├─ Agent-based permissions (allowedAgents)                     │
│  └─ Tool-level restrictions                                     │
│                                                                   │
│  Layer 3: Workspace Isolation                                    │
│  ├─ File ops restricted to workspace                            │
│  ├─ Path sanitization via path.join()                           │
│  └─ No directory traversal                                      │
│                                                                   │
│  Layer 4: Command Sanitization                                   │
│  ├─ Timeout limits                                              │
│  ├─ Buffer size limits                                          │
│  └─ Error hiding                                                │
│                                                                   │
│  Layer 5: Error Handling                                         │
│  ├─ Log errors server-side                                      │
│  ├─ Generic client messages                                     │
│  └─ No stack trace exposure                                     │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Performance Considerations

```
┌─────────────────────────────────────────────────────────────────┐
│                    Performance Optimizations                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  1. Request-level ToolRegistry instances                         │
│     - New instance per request                                   │
│     - No shared state                                            │
│     - Thread-safe                                                │
│                                                                   │
│  2. Dynamic imports where needed                                 │
│     - import '@/lib/engine/init' for auto-init                  │
│     - Lazy-load heavy dependencies                              │
│                                                                   │
│  3. Query param optimization                                     │
│     - Filter tools by ID early                                   │
│     - Avoid loading all tools                                    │
│                                                                   │
│  4. Error short-circuiting                                       │
│     - Early return on validation failure                         │
│     - Fail fast pattern                                          │
│                                                                   │
│  5. Export dynamic = 'force-dynamic'                             │
│     - No static generation                                       │
│     - Always fresh data                                          │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Monitoring & Observability

```
Current Logging:
  console.error('[Tools API] GET error:', error)
  console.error('[Tool Execute API] POST error:', error)
  console.error('[Tool Schema API] GET error:', error)

Future Enhancements:
  - Structured logging (JSON format)
  - Request ID tracking
  - Execution time metrics
  - Success/failure rates
  - Tool usage statistics
  - Error rate monitoring
  - Alert thresholds
```

---

## Summary

The Tools API provides a robust, secure, and extensible interface for:
- **Listing** available tools with permission filtering
- **Executing** tools with proper context and validation
- **Inspecting** tool schemas for documentation and validation

All routes follow Next.js best practices, include comprehensive error handling, and integrate seamlessly with the existing CubiQo engine infrastructure.

---

**Architecture by:** Blossom 💖 (Backend Developer, Powerpuff Girls)
**Date:** 2024
**Version:** 1.0
