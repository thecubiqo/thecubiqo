# Tools API Routes

This document describes the Tools API routes created for the CubiQo project.

## Overview

The Tools API provides endpoints to:
- List available tools in the system
- Execute tools directly via HTTP
- Retrieve tool schemas and parameter definitions

## Architecture

All routes follow Next.js App Router conventions and use:
- `NextRequest` and `NextResponse` from `next/server`
- Consistent error handling with try-catch blocks
- Standard JSON response format with `{ error: string }` for errors
- Auto-initialization via `import '@/lib/engine/init'`

## Endpoints

### 1. List Tools

**GET** `/api/tools`

Lists all available tools or a filtered subset.

**Query Parameters:**
- `ids` (optional): Comma-separated list of tool IDs to filter
- `userId` (optional): User ID for permission-based filtering (e.g., Founders Pass)

**Response:**
```json
{
  "tools": [
    {
      "name": "file_read",
      "description": "Read a file from the workspace",
      "input_schema": {
        "type": "object",
        "properties": {
          "path": { "type": "string", "description": "File path" }
        },
        "required": ["path"]
      }
    }
  ]
}
```

**Error Response:**
```json
{
  "error": "Failed to fetch tools"
}
```

**Example Usage:**
```bash
# List all tools
curl http://localhost:3000/api/tools

# List specific tools
curl "http://localhost:3000/api/tools?ids=file_read,exec"

# List tools for specific user (with permissions)
curl "http://localhost:3000/api/tools?userId=user-123"
```

---

### 2. Execute Tool

**POST** `/api/tools/:id/execute`

Executes a specific tool with provided parameters.

**Path Parameters:**
- `id` (required): Tool ID to execute (e.g., `file_read`, `exec`, `git`)

**Request Body:**
```json
{
  "params": {
    "path": "README.md"
  },
  "context": {
    "agentId": "my-agent",
    "sessionId": "session-123",
    "workspace": "/path/to/workspace",
    "userId": "user-456"
  }
}
```

**Fields:**
- `params` (required): Tool-specific parameters matching the tool's schema
- `context` (optional): Execution context
  - `agentId` (optional): Agent executing the tool (default: `api-direct`)
  - `sessionId` (optional): Session ID (default: `api-session`)
  - `workspace` (optional): Working directory (default: `process.cwd()`)
  - `userId` (optional): User ID for permission checks

**Success Response:**
```json
{
  "result": {
    "success": true,
    "output": "File content here...",
    "artifacts": ["/path/to/file"]
  }
}
```

**Error Response:**
```json
{
  "error": "Tool execution failed"
}
```

**Status Codes:**
- `200`: Success
- `400`: Missing required parameters (tool ID or params)
- `500`: Execution error

**Example Usage:**
```bash
# Read a file
curl -X POST http://localhost:3000/api/tools/file_read/execute \
  -H "Content-Type: application/json" \
  -d '{
    "params": { "path": "README.md" }
  }'

# Execute shell command
curl -X POST http://localhost:3000/api/tools/exec/execute \
  -H "Content-Type: application/json" \
  -d '{
    "params": { "command": "ls -la" },
    "context": { "workspace": "/tmp" }
  }'

# Git status
curl -X POST http://localhost:3000/api/tools/git/execute \
  -H "Content-Type: application/json" \
  -d '{
    "params": { "action": "status" }
  }'
```

---

### 3. Get Tool Schema

**GET** `/api/tools/:id/schema`

Retrieves the schema definition for a specific tool.

**Path Parameters:**
- `id` (required): Tool ID (e.g., `file_read`, `exec`, `git`)

**Response:**
```json
{
  "name": "file_read",
  "description": "Read a file from the workspace. Path is relative to workspace root.",
  "input_schema": {
    "type": "object",
    "properties": {
      "path": {
        "type": "string",
        "description": "File path relative to workspace"
      },
      "encoding": {
        "type": "string",
        "description": "File encoding (default: utf-8)"
      }
    },
    "required": ["path"]
  }
}
```

**Error Response (404):**
```json
{
  "error": "Tool not found: invalid_tool_id"
}
```

**Status Codes:**
- `200`: Success
- `400`: Missing tool ID
- `404`: Tool not found
- `500`: Server error

**Example Usage:**
```bash
# Get file_read schema
curl http://localhost:3000/api/tools/file_read/schema

# Get exec schema
curl http://localhost:3000/api/tools/exec/schema

# Get git schema
curl http://localhost:3000/api/tools/git/schema
```

---

## Available Tools

The following tools are registered by default (via `ToolRegistry`):

### Core Tools
- `file_read` - Read files from workspace
- `file_write` - Write files to workspace
- `file_list` - List directory contents
- `exec` - Execute shell commands
- `git` - Git operations (status, commit, push, etc.)

### Communication Tools
- `sessions_spawn` - Spawn subagents
- `sessions_send` - Send messages to sessions
- `telegram_send` - Send Telegram messages
- `slack_send` - Send Slack messages
- `discord_send` - Send Discord messages
- `email_send` - Send emails

### Utility Tools
- `web_search` - Web search
- `web_fetch` - Fetch web pages
- `vision` - Vision/OCR processing
- `patch` - Apply code patches

### Permission-Based Access

Some tools are restricted based on user permissions:
- **Founders Pass** users (e.g., `aditya@cubiqo.ai`) have access to all tools
- **Regular users** have restricted tools excluded:
  - `exec`
  - `git`
  - `file_write`
  - `sessions_spawn`
  - `email_send`
  - `slack_send`
  - `discord_send`
  - `telegram_send`

---

## Error Handling

All routes use consistent error handling:

```typescript
try {
  // API logic
  return NextResponse.json({ success: true, data });
} catch (error) {
  console.error('[API] Error:', error);
  return NextResponse.json(
    { error: 'Descriptive error message' },
    { status: 500 }
  );
}
```

**Common Error Status Codes:**
- `400` - Bad Request (missing parameters)
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## Implementation Details

### File Structure
```
src/app/api/tools/
├── route.ts                    # GET /api/tools
└── [id]/
    ├── execute/
    │   └── route.ts            # POST /api/tools/:id/execute
    └── schema/
        └── route.ts            # GET /api/tools/:id/schema
```

### Dependencies
- `@/lib/engine/tools` - ToolRegistry class
- `@/types/tool` - Type definitions
- `@/lib/engine/init` - Auto-initialization
- `next/server` - Next.js server utilities

### Type Safety

All routes use TypeScript with strict typing:
- `Tool` - Tool definition interface
- `ToolContext` - Execution context
- `ToolResult` - Execution result
- `ToolDefinition` - API-friendly tool schema
- `JSONSchema` - Parameter schema definition

---

## Testing

### Manual Testing

```bash
# 1. List all tools
curl http://localhost:3000/api/tools

# 2. Get tool schema
curl http://localhost:3000/api/tools/file_read/schema

# 3. Execute a tool
curl -X POST http://localhost:3000/api/tools/file_read/execute \
  -H "Content-Type: application/json" \
  -d '{"params": {"path": "package.json"}}'
```

### Integration Testing

```typescript
// Example test using fetch
const response = await fetch('/api/tools/file_read/execute', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    params: { path: 'test.txt' },
    context: { workspace: '/tmp' }
  })
});

const result = await response.json();
expect(result.result.success).toBe(true);
```

---

## Security Considerations

1. **Input Validation**: All routes validate required parameters
2. **Permission Checks**: ToolRegistry enforces user-based permissions
3. **Workspace Isolation**: File operations are restricted to workspace
4. **Command Sanitization**: Shell commands are executed with safeguards
5. **Error Hiding**: Internal errors are logged but not exposed to clients

---

## Future Enhancements

- [ ] Rate limiting per tool/user
- [ ] Audit logging for tool executions
- [ ] Async tool execution with webhooks
- [ ] Tool execution history/replay
- [ ] Custom tool registration via API
- [ ] Tool execution metrics/monitoring
- [ ] WebSocket support for streaming output

---

## Related Files

- `src/lib/engine/tools.ts` - ToolRegistry implementation
- `src/types/tool.ts` - Type definitions
- `src/lib/engine/init.ts` - Engine initialization
- `src/lib/engine/tools/` - Individual tool implementations

---

## Contact

For questions or issues with the Tools API:
- Check existing API routes in `src/app/api/` for patterns
- Review ToolRegistry documentation
- Contact the backend team (Blossom 💖)
