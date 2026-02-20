# CubiQo Emergent Tool API Specification

**Version**: 1.0.0  
**Last Updated**: 2024  
**Status**: Production

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication & Authorization](#authentication--authorization)
3. [Rate Limiting & Quotas](#rate-limiting--quotas)
4. [Error Handling](#error-handling)
5. [Agent Tool Registry](#agent-tool-registry)
6. [HTTP API Endpoints](#http-api-endpoints)
7. [LLM Router API](#llm-router-api)
8. [WebSocket APIs](#websocket-apis)
9. [Security Model](#security-model)
10. [Code Examples](#code-examples)

---

## Overview

The CubiQo Emergent system provides a comprehensive API for AI agents to interact with files, execute code, control browsers, access web data, and communicate across platforms. This document specifies all available tools, HTTP endpoints, and their usage.

### Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Client Applications                 │
│         (Browser, CLI, Telegram, Slack, etc.)       │
└─────────────────────┬───────────────────────────────┘
                      │
                      │ HTTPS / WebSocket
                      │
┌─────────────────────▼───────────────────────────────┐
│              Next.js API Routes Layer                │
│  (/api/agents, /api/code, /api/chat, etc.)         │
└─────────────────────┬───────────────────────────────┘
                      │
                      │
┌─────────────────────▼───────────────────────────────┐
│              Agent Engine Core                       │
│  (Tool Registry, Session Manager, LLM Router)       │
└─────────────────────┬───────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
┌───────▼──────┐ ┌───▼────┐ ┌─────▼──────┐
│  File System │ │  LLMs  │ │  Services  │
│   (Local/VFS)│ │(Claude,│ │(Supabase,  │
│              │ │OpenAI) │ │ Telegram)  │
└──────────────┘ └────────┘ └────────────┘
```

### Base URLs

- **Production**: `https://thecubiqo.com/api`
- **Development**: `http://localhost:3000/api`
- **Staging**: `https://staging.thecubiqo.com/api`

### Content Types

All API endpoints accept and return `application/json` unless otherwise specified.

---

## Authentication & Authorization

### Authentication Methods

#### 1. Session Cookie (Primary)
```http
Cookie: next-auth.session-token=<session-token>
```

Used by browser clients. Automatically managed by NextAuth.js.

#### 2. Bearer Token (API Clients)
```http
Authorization: Bearer <api-key>
```

For programmatic access. Generate via admin dashboard.

#### 3. WebAuthn (Biometric)
```http
POST /api/auth/webauthn/login/verify
```

Passkey-based authentication for enhanced security.

#### 4. Founders Pass (Special Access)
```http
X-Founders-Pass: <32-char-hex>
```

Special header for founders with elevated permissions.

### Authorization Levels

| Level | Description | Capabilities |
|-------|-------------|--------------|
| **Public** | Unauthenticated | Health checks, public docs |
| **User** | Authenticated user | Chat, read files, basic tools |
| **Agent** | System agent | Tool execution, file operations |
| **Founder** | Founder account | All tools, admin APIs, code execution |
| **Admin** | System administrator | User management, audit logs, system config |

### Example Authentication Flow

```typescript
// 1. Login with credentials
const response = await fetch('/api/auth/webauthn/login/options', {
  method: 'GET',
  credentials: 'include'
});

const options = await response.json();

// 2. Use WebAuthn API
const credential = await navigator.credentials.get({
  publicKey: options
});

// 3. Verify credential
await fetch('/api/auth/webauthn/login/verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(credential),
  credentials: 'include'
});

// 4. Session cookie is set, subsequent requests are authenticated
```

---

## Rate Limiting & Quotas

### Global Rate Limits

| Endpoint Pattern | Rate Limit | Window | Per |
|------------------|------------|--------|-----|
| `/api/chat` | 60 requests | 1 minute | User |
| `/api/code/execute` | 30 requests | 1 minute | User |
| `/api/agents/*/run` | 100 requests | 1 minute | Agent |
| `/api/coder` | 20 requests | 1 minute | User |
| `/api/browser` | 30 requests | 1 minute | User |
| `/api/*` (default) | 300 requests | 1 minute | User |

### Resource Quotas

| Resource | Limit | Scope |
|----------|-------|-------|
| Code execution timeout | 30 seconds | Per request |
| Code output size | 10 KB | Per execution |
| File read size | 10 MB | Per request |
| Session memory | 50 MB | Per session |
| Concurrent sessions | 10 | Per user |
| Browser instances | 3 | Per user |
| VFS storage | 100 MB | Per user |

### Rate Limit Headers

```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1609459200
Retry-After: 30
```

### Rate Limit Error Response

```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 30,
  "limit": 60,
  "window": 60
}
```

---

## Error Handling

### Standard Error Response Format

```json
{
  "success": false,
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional context"
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "requestId": "req_abc123"
}
```

### HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful request |
| 201 | Created | Resource created |
| 400 | Bad Request | Invalid input |
| 401 | Unauthorized | Missing/invalid auth |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource already exists |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Service temporarily down |

### Error Codes

| Code | Description | Action |
|------|-------------|--------|
| `AUTH_REQUIRED` | Authentication required | Login |
| `AUTH_INVALID` | Invalid credentials | Re-authenticate |
| `PERMISSION_DENIED` | Insufficient permissions | Check access level |
| `RATE_LIMIT_EXCEEDED` | Too many requests | Wait and retry |
| `INVALID_INPUT` | Validation failed | Fix input |
| `RESOURCE_NOT_FOUND` | Resource doesn't exist | Check ID |
| `RESOURCE_EXISTS` | Resource already exists | Use different name |
| `EXECUTION_TIMEOUT` | Code execution timeout | Optimize code |
| `EXECUTION_ERROR` | Code execution failed | Check code |
| `FILE_TOO_LARGE` | File exceeds size limit | Reduce file size |
| `QUOTA_EXCEEDED` | Quota exceeded | Upgrade plan |
| `SERVICE_UNAVAILABLE` | External service down | Retry later |
| `INTERNAL_ERROR` | Unexpected error | Contact support |

---

## Agent Tool Registry

The Agent Tool Registry (`src/lib/engine/tools.ts`) provides 15+ tools that agents can use to interact with the system and external services.

### Tool Context

Every tool receives a `ToolContext` object:

```typescript
interface ToolContext {
  agentId: string;      // ID of the agent executing the tool
  sessionId: string;    // Current session ID
  workspace: string;    // Workspace directory path
  isFounder: boolean;   // Whether user is a founder
}
```

---

### 1. file_read

**Description**: Read file contents from the workspace.

**Access**: All agents

**Parameters**:
```typescript
{
  path: string;  // Relative or absolute file path
}
```

**Returns**:
```typescript
{
  success: boolean;
  content?: string;
  error?: string;
}
```

**Example**:
```json
// Request
{
  "path": "src/app/page.tsx"
}

// Response
{
  "success": true,
  "content": "import React from 'react';\n\nexport default function Home() {\n  return <div>Hello</div>;\n}"
}
```

**Errors**:
- `FILE_NOT_FOUND`: File doesn't exist
- `PERMISSION_DENIED`: No read access
- `FILE_TOO_LARGE`: File exceeds 10MB limit

---

### 2. file_write

**Description**: Write or create files in the workspace.

**Access**: Restricted (founders only for non-agents)

**Parameters**:
```typescript
{
  path: string;     // File path
  content: string;  // File content
}
```

**Returns**:
```typescript
{
  success: boolean;
  bytesWritten?: number;
  error?: string;
}
```

**Example**:
```json
// Request
{
  "path": "src/utils/helper.ts",
  "content": "export function greet(name: string) {\n  return `Hello, ${name}`;\n}"
}

// Response
{
  "success": true,
  "bytesWritten": 78
}
```

**Errors**:
- `PERMISSION_DENIED`: No write access
- `INVALID_PATH`: Invalid file path
- `DISK_FULL`: No space left

---

### 3. file_list

**Description**: List directory contents.

**Access**: All agents

**Parameters**:
```typescript
{
  path: string;         // Directory path
  recursive?: boolean;  // List recursively (default: false)
}
```

**Returns**:
```typescript
{
  success: boolean;
  files?: Array<{
    name: string;
    path: string;
    type: 'file' | 'directory';
    size: number;
    modified: string;
  }>;
  error?: string;
}
```

**Example**:
```json
// Request
{
  "path": "src/components",
  "recursive": false
}

// Response
{
  "success": true,
  "files": [
    {
      "name": "Button.tsx",
      "path": "src/components/Button.tsx",
      "type": "file",
      "size": 1234,
      "modified": "2024-01-15T10:30:00Z"
    },
    {
      "name": "ui",
      "path": "src/components/ui",
      "type": "directory",
      "size": 0,
      "modified": "2024-01-15T10:30:00Z"
    }
  ]
}
```

**Errors**:
- `DIRECTORY_NOT_FOUND`: Directory doesn't exist
- `PERMISSION_DENIED`: No read access

---

### 4. file_patch

**Description**: Apply unified diff patches to existing files.

**Access**: Dev agents

**Parameters**:
```typescript
{
  path: string;   // File to patch
  patch: string;  // Unified diff format
}
```

**Returns**:
```typescript
{
  success: boolean;
  linesChanged?: number;
  error?: string;
}
```

**Example**:
```json
// Request
{
  "path": "src/app/page.tsx",
  "patch": "--- a/src/app/page.tsx\n+++ b/src/app/page.tsx\n@@ -1,3 +1,4 @@\n import React from 'react';\n+import { Button } from '@/components/Button';\n \n export default function Home() {"
}

// Response
{
  "success": true,
  "linesChanged": 1
}
```

**Errors**:
- `PATCH_FAILED`: Patch couldn't be applied
- `FILE_NOT_FOUND`: File doesn't exist
- `INVALID_PATCH`: Malformed patch

---

### 5. exec

**Description**: Execute shell commands in a sandboxed environment.

**Access**: Restricted (founders + dev agents)

**Parameters**:
```typescript
{
  command: string;    // Shell command
  timeout?: number;   // Timeout in seconds (default: 30, max: 30)
  cwd?: string;       // Working directory
}
```

**Returns**:
```typescript
{
  success: boolean;
  stdout?: string;
  stderr?: string;
  exitCode?: number;
  error?: string;
}
```

**Example**:
```json
// Request
{
  "command": "npm run build",
  "timeout": 60,
  "cwd": "/workspace"
}

// Response
{
  "success": true,
  "stdout": "> next build\n\nCreating an optimized production build...\nCompleted in 45s",
  "stderr": "",
  "exitCode": 0
}
```

**Security**:
- 30-second timeout enforced
- 10KB output limit
- Sandboxed execution
- No network access (configurable)

**Errors**:
- `EXECUTION_TIMEOUT`: Command exceeded timeout
- `EXECUTION_ERROR`: Command failed
- `PERMISSION_DENIED`: No execute access
- `OUTPUT_TOO_LARGE`: Output exceeds 10KB

---

### 6. git

**Description**: Execute Git version control operations.

**Access**: Restricted (founders + dev agents)

**Parameters**:
```typescript
{
  args: string[];  // Git command arguments
}
```

**Returns**:
```typescript
{
  success: boolean;
  output?: string;
  error?: string;
}
```

**Example**:
```json
// Request
{
  "args": ["status", "--short"]
}

// Response
{
  "success": true,
  "output": " M src/app/page.tsx\n?? src/components/Button.tsx"
}
```

**Common Commands**:
```json
// Check status
{ "args": ["status"] }

// Commit changes
{ "args": ["commit", "-m", "Add feature"] }

// Create branch
{ "args": ["checkout", "-b", "feature/new-feature"] }

// View diff
{ "args": ["diff", "HEAD"] }
```

**Errors**:
- `GIT_ERROR`: Git operation failed
- `PERMISSION_DENIED`: No git access

---

### 7. web_search

**Description**: Search the web using Brave Search API.

**Access**: All agents

**Parameters**:
```typescript
{
  query: string;   // Search query
  count?: number;  // Number of results (default: 10, max: 50)
}
```

**Returns**:
```typescript
{
  success: boolean;
  results?: Array<{
    title: string;
    url: string;
    description: string;
    publishedDate?: string;
  }>;
  error?: string;
}
```

**Example**:
```json
// Request
{
  "query": "Next.js 14 features",
  "count": 5
}

// Response
{
  "success": true,
  "results": [
    {
      "title": "Next.js 14 – Vercel",
      "url": "https://nextjs.org/blog/next-14",
      "description": "Next.js 14 is our most focused release with...",
      "publishedDate": "2023-10-26"
    }
  ]
}
```

**Errors**:
- `API_ERROR`: Brave Search API error
- `INVALID_QUERY`: Empty or invalid query
- `QUOTA_EXCEEDED`: Search quota exceeded

---

### 8. web_fetch

**Description**: Fetch and parse web page content.

**Access**: All agents

**Parameters**:
```typescript
{
  url: string;  // Web page URL
}
```

**Returns**:
```typescript
{
  success: boolean;
  content?: string;      // Cleaned text content
  title?: string;        // Page title
  metadata?: object;     // Open Graph metadata
  error?: string;
}
```

**Example**:
```json
// Request
{
  "url": "https://nextjs.org/docs"
}

// Response
{
  "success": true,
  "title": "Getting Started | Next.js",
  "content": "Next.js is a React framework...",
  "metadata": {
    "og:title": "Getting Started",
    "og:description": "Learn Next.js fundamentals"
  }
}
```

**Features**:
- Automatic content extraction
- JavaScript rendering (Playwright)
- Metadata parsing
- Image/script filtering

**Errors**:
- `FETCH_FAILED`: Network error
- `INVALID_URL`: Malformed URL
- `TIMEOUT`: Page load timeout

---

### 9. telegram_send

**Description**: Send messages via Telegram Bot API.

**Access**: Restricted (founders + communication agents)

**Parameters**:
```typescript
{
  chatId: string;   // Telegram chat ID
  message: string;  // Message text
}
```

**Returns**:
```typescript
{
  success: boolean;
  messageId?: number;
  error?: string;
}
```

**Example**:
```json
// Request
{
  "chatId": "123456789",
  "message": "Deployment complete! ✅"
}

// Response
{
  "success": true,
  "messageId": 9876
}
```

**Errors**:
- `TELEGRAM_ERROR`: API error
- `INVALID_CHAT_ID`: Chat not found
- `BOT_BLOCKED`: Bot blocked by user

---

### 10. slack_send

**Description**: Send messages to Slack channels.

**Access**: Restricted (founders + communication agents)

**Parameters**:
```typescript
{
  channel: string;  // Channel ID or name
  message: string;  // Message text
  blocks?: Array<object>;  // Rich formatting
}
```

**Returns**:
```typescript
{
  success: boolean;
  timestamp?: string;
  error?: string;
}
```

**Example**:
```json
// Request
{
  "channel": "#deployments",
  "message": "Production deployment started",
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*Status*: In Progress"
      }
    }
  ]
}

// Response
{
  "success": true,
  "timestamp": "1609459200.000100"
}
```

**Errors**:
- `SLACK_ERROR`: API error
- `CHANNEL_NOT_FOUND`: Invalid channel
- `NOT_IN_CHANNEL`: Bot not in channel

---

### 11. discord_send

**Description**: Send messages to Discord channels.

**Access**: Restricted (founders + communication agents)

**Parameters**:
```typescript
{
  channelId: string;  // Discord channel ID
  message: string;    // Message text
  embed?: object;     // Rich embed
}
```

**Returns**:
```typescript
{
  success: boolean;
  messageId?: string;
  error?: string;
}
```

**Example**:
```json
// Request
{
  "channelId": "1234567890",
  "message": "Build failed",
  "embed": {
    "title": "Build #42",
    "color": 16711680,
    "fields": [
      { "name": "Status", "value": "Failed" }
    ]
  }
}

// Response
{
  "success": true,
  "messageId": "9876543210"
}
```

---

### 12. email_send

**Description**: Send emails via SMTP/SendGrid.

**Access**: Restricted (founders + communication agents)

**Parameters**:
```typescript
{
  to: string;          // Recipient email
  subject: string;     // Email subject
  body: string;        // Email body (HTML or plain text)
  from?: string;       // Sender (default: noreply@thecubiqo.com)
  cc?: string[];       // CC recipients
  attachments?: Array<{
    filename: string;
    content: string;   // Base64 encoded
  }>;
}
```

**Returns**:
```typescript
{
  success: boolean;
  messageId?: string;
  error?: string;
}
```

**Example**:
```json
// Request
{
  "to": "user@example.com",
  "subject": "Welcome to CubiQo",
  "body": "<h1>Welcome!</h1><p>Get started with your account.</p>"
}

// Response
{
  "success": true,
  "messageId": "msg_abc123"
}
```

---

### 13. vision_analyze

**Description**: Analyze images using AI vision models (GPT-4 Vision, Claude 3).

**Access**: Lead agents

**Parameters**:
```typescript
{
  imageUrl: string;  // Image URL or base64 data URI
  prompt: string;    // Analysis prompt
}
```

**Returns**:
```typescript
{
  success: boolean;
  analysis?: string;
  confidence?: number;
  error?: string;
}
```

**Example**:
```json
// Request
{
  "imageUrl": "https://example.com/screenshot.png",
  "prompt": "Describe the UI layout and identify any usability issues"
}

// Response
{
  "success": true,
  "analysis": "The interface shows a navigation bar at the top with logo on the left. The main content area has a form with 3 input fields. The submit button is not clearly visible, which may cause usability issues.",
  "confidence": 0.92
}
```

**Supported Formats**: PNG, JPEG, WebP, GIF

**Errors**:
- `INVALID_IMAGE`: Unsupported format
- `IMAGE_TOO_LARGE`: Exceeds size limit
- `VISION_ERROR`: AI analysis failed

---

### 14. sessions_spawn

**Description**: Create a sub-agent session for parallel task execution.

**Access**: Restricted (lead agents, founders)

**Parameters**:
```typescript
{
  agentId: string;  // Agent to spawn
  prompt: string;   // Initial prompt
}
```

**Returns**:
```typescript
{
  success: boolean;
  sessionId?: string;
  response?: string;
  error?: string;
}
```

**Example**:
```json
// Request
{
  "agentId": "coder-agent-001",
  "prompt": "Refactor the authentication module for better testability"
}

// Response
{
  "success": true,
  "sessionId": "sess_abc123",
  "response": "I'll refactor the auth module. Let me start by analyzing the current code..."
}
```

**Use Cases**:
- Parallel task execution
- Delegation to specialized agents
- Background processing

---

### 15. sessions_send

**Description**: Send a message to an existing agent session.

**Access**: All agents

**Parameters**:
```typescript
{
  sessionId: string;  // Target session ID
  message: string;    // Message to send
}
```

**Returns**:
```typescript
{
  success: boolean;
  response?: string;
  error?: string;
}
```

**Example**:
```json
// Request
{
  "sessionId": "sess_abc123",
  "message": "Focus on unit tests first, then integration tests"
}

// Response
{
  "success": true,
  "response": "Understood. I'll prioritize unit tests for the auth module..."
}
```

---

## HTTP API Endpoints

### Agent Management API

#### POST /api/agents

**Description**: Create a new agent.

**Auth**: Founder required

**Request Body**:
```typescript
{
  name: string;              // Agent name
  model: string;             // LLM model (e.g., "claude-3-sonnet")
  tools: string[];           // Available tools
  maxConcurrent?: number;    // Max concurrent sessions (default: 5)
  systemPrompt?: string;     // Custom system prompt
  metadata?: object;         // Additional metadata
}
```

**Response**:
```json
{
  "success": true,
  "agent": {
    "id": "agent_abc123",
    "name": "Code Review Agent",
    "model": "claude-3-sonnet",
    "tools": ["file_read", "file_write", "git"],
    "maxConcurrent": 5,
    "status": "active",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

**Example**:
```bash
curl -X POST https://thecubiqo.com/api/agents \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Documentation Agent",
    "model": "gpt-4",
    "tools": ["file_read", "file_write", "web_search"],
    "systemPrompt": "You are a technical writer specializing in API documentation."
  }'
```

**Errors**:
- `400`: Invalid input
- `401`: Unauthorized
- `403`: Not a founder
- `409`: Agent name already exists

---

#### GET /api/agents

**Description**: List all agents with their current status.

**Auth**: User required

**Query Parameters**:
```typescript
{
  status?: 'active' | 'idle' | 'busy' | 'error';
  limit?: number;    // Default: 50
  offset?: number;   // Default: 0
}
```

**Response**:
```json
{
  "success": true,
  "agents": [
    {
      "id": "agent_001",
      "name": "Coder Agent",
      "model": "claude-3-sonnet",
      "status": "busy",
      "activeSessions": 3,
      "totalSessions": 127,
      "lastActive": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 10,
  "limit": 50,
  "offset": 0
}
```

**Example**:
```bash
curl https://thecubiqo.com/api/agents?status=active \
  -H "Authorization: Bearer <token>"
```

---

#### POST /api/agents/[id]/run

**Description**: Execute a prompt on a specific agent.

**Auth**: User required

**Request Body**:
```typescript
{
  prompt: string;         // Prompt to execute
  sessionId?: string;     // Resume existing session (optional)
  stream?: boolean;       // Stream response (default: false)
}
```

**Response (Non-Streaming)**:
```json
{
  "success": true,
  "response": "I've analyzed the code and found 3 issues...",
  "sessionId": "sess_abc123",
  "tokensUsed": 1234,
  "toolCalls": [
    {
      "tool": "file_read",
      "path": "src/app/page.tsx",
      "success": true
    }
  ]
}
```

**Response (Streaming)**:
```
data: {"type":"token","content":"I've"}
data: {"type":"token","content":" analyzed"}
data: {"type":"tool_call","tool":"file_read","args":{"path":"src/app/page.tsx"}}
data: {"type":"tool_result","success":true}
data: {"type":"token","content":" the code"}
data: {"type":"done","tokensUsed":1234}
```

**Example**:
```bash
# Non-streaming
curl -X POST https://thecubiqo.com/api/agents/agent_001/run \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Review the authentication module"}'

# Streaming
curl -X POST https://thecubiqo.com/api/agents/agent_001/run \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{"prompt": "Review the authentication module", "stream": true}'
```

---

#### POST /api/agents/[id]/spawn

**Description**: Spawn an asynchronous task on an agent.

**Auth**: User required

**Request Body**:
```typescript
{
  prompt: string;  // Task prompt
}
```

**Response**:
```json
{
  "success": true,
  "taskId": "task_abc123",
  "sessionId": "sess_xyz789",
  "status": "queued"
}
```

**Example**:
```bash
curl -X POST https://thecubiqo.com/api/agents/agent_001/spawn \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Refactor all components to use TypeScript strict mode"}'
```

---

#### GET /api/agents/[id]/sessions

**Description**: List all sessions for an agent.

**Auth**: User required

**Query Parameters**:
```typescript
{
  status?: 'active' | 'completed' | 'error';
  limit?: number;
  offset?: number;
}
```

**Response**:
```json
{
  "success": true,
  "sessions": [
    {
      "id": "sess_001",
      "agentId": "agent_001",
      "status": "active",
      "messageCount": 15,
      "tokensUsed": 8765,
      "startedAt": "2024-01-15T10:00:00Z",
      "lastActivity": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

#### POST /api/agents/[id]/message

**Description**: Send an agent-to-agent message.

**Auth**: Agent required

**Request Body**:
```typescript
{
  from: string;      // Sender agent ID
  message: string;   // Message content
}
```

**Response**:
```json
{
  "success": true,
  "messageId": "msg_abc123",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

#### GET /api/agents/[id]/tasks

**Description**: Get task execution status for an agent.

**Auth**: User required

**Response**:
```json
{
  "success": true,
  "tasks": [
    {
      "id": "task_001",
      "status": "running",
      "progress": 0.65,
      "startedAt": "2024-01-15T10:00:00Z",
      "estimatedCompletion": "2024-01-15T10:35:00Z"
    }
  ]
}
```

---

#### GET /api/agents/activity

**Description**: Get real-time activity feed for all agents.

**Auth**: User required

**Query Parameters**:
```typescript
{
  agentId?: string;  // Filter by agent
  limit?: number;    // Default: 50
}
```

**Response**:
```json
{
  "success": true,
  "activities": [
    {
      "id": "activity_001",
      "agentId": "agent_001",
      "type": "tool_call",
      "tool": "file_write",
      "status": "success",
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

### Code Execution API

#### POST /api/code/execute

**Description**: Execute code in a sandboxed environment.

**Auth**: User required (founders) or agent

**Request Body**:
```typescript
{
  code: string;                          // Code to execute
  language: 'python' | 'javascript' | 'typescript' | 'bash';
  sessionId?: string;                    // Session for workspace isolation
  timeout?: number;                      // Timeout in seconds (max: 30)
  env?: Record<string, string>;          // Environment variables
}
```

**Response**:
```json
{
  "success": true,
  "output": "Hello, World!\n",
  "error": "",
  "exitCode": 0,
  "executionTime": 0.123,
  "sessionId": "sess_abc123"
}
```

**Example - Python**:
```bash
curl -X POST https://thecubiqo.com/api/code/execute \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "print(\"Hello, World!\")\nprint(2 + 2)",
    "language": "python",
    "timeout": 10
  }'
```

**Response**:
```json
{
  "success": true,
  "output": "Hello, World!\n4\n",
  "error": "",
  "exitCode": 0,
  "executionTime": 0.05
}
```

**Example - TypeScript**:
```bash
curl -X POST https://thecubiqo.com/api/code/execute \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "const greet = (name: string) => `Hello, ${name}`;\nconsole.log(greet(\"World\"));",
    "language": "typescript"
  }'
```

**Security**:
- Isolated per-session workspace in `/tmp/cubiqo-session-{sessionId}`
- 30-second timeout enforced
- 10KB output limit
- No network access (by default)
- Read-only system directories

**Errors**:
- `EXECUTION_TIMEOUT`: Code exceeded timeout
- `EXECUTION_ERROR`: Runtime error
- `OUTPUT_TOO_LARGE`: Output exceeds 10KB
- `UNSUPPORTED_LANGUAGE`: Invalid language

---

#### POST /api/code/terminal

**Description**: Interactive shell terminal with session persistence.

**Auth**: Founder required

**Request Body**:
```typescript
{
  command: string;                     // Shell command
  sessionId: string;                   // Terminal session ID
  action: 'execute' | 'status' | 'kill';
  env?: Record<string, string>;
  timeout?: number;
}
```

**Response (execute)**:
```json
{
  "success": true,
  "output": "drwxr-xr-x  5 user  group  160 Jan 15 10:30 src\n",
  "exitCode": 0,
  "pid": 12345,
  "isRunning": false
}
```

**Response (status)**:
```json
{
  "success": true,
  "isRunning": true,
  "pid": 12345,
  "startTime": "2024-01-15T10:30:00Z",
  "output": "Processing... 45%\n"
}
```

**Example - Long Running Command**:
```bash
# Start command
curl -X POST https://thecubiqo.com/api/code/terminal \
  -H "Authorization: Bearer <token>" \
  -d '{
    "command": "npm run build",
    "sessionId": "term_001",
    "action": "execute"
  }'

# Check status
curl -X POST https://thecubiqo.com/api/code/terminal \
  -H "Authorization: Bearer <token>" \
  -d '{
    "sessionId": "term_001",
    "action": "status"
  }'

# Kill if needed
curl -X POST https://thecubiqo.com/api/code/terminal \
  -H "Authorization: Bearer <token>" \
  -d '{
    "sessionId": "term_001",
    "action": "kill"
  }'
```

---

#### POST /api/code/file-ops

**Description**: File operations within code execution environment.

**Auth**: User required

**Request Body**:
```typescript
{
  action: 'read' | 'write' | 'delete' | 'list' | 'create-dir';
  path: string;
  content?: string;      // For write action
  sessionId: string;
}
```

**Response (read)**:
```json
{
  "success": true,
  "content": "file content here",
  "size": 1234
}
```

**Response (list)**:
```json
{
  "success": true,
  "files": [
    { "name": "file.txt", "type": "file", "size": 1234 },
    { "name": "subdir", "type": "directory" }
  ]
}
```

**Example**:
```bash
# Write file
curl -X POST https://thecubiqo.com/api/code/file-ops \
  -H "Authorization: Bearer <token>" \
  -d '{
    "action": "write",
    "path": "/workspace/output.txt",
    "content": "Result: 42",
    "sessionId": "sess_001"
  }'

# Read file
curl -X POST https://thecubiqo.com/api/code/file-ops \
  -H "Authorization: Bearer <token>" \
  -d '{
    "action": "read",
    "path": "/workspace/output.txt",
    "sessionId": "sess_001"
  }'
```

---

### AI Coder API

#### POST /api/coder

**Description**: AI-powered code generation and modification using MiniMax/OpenClaw.

**Auth**: User required

**Request Body**:
```typescript
{
  prompt: string;                    // Coding task description
  sessionId?: string;                // Session for context
  files?: Array<{                    // Existing files for context
    path: string;
    content: string;
  }>;
  model?: string;                    // Override model (default: minimax)
}
```

**Response**:
```json
{
  "success": true,
  "response": "I've created a new authentication module...",
  "files": [
    {
      "path": "src/lib/auth.ts",
      "content": "export function authenticate(token: string) {...}",
      "action": "create"
    },
    {
      "path": "src/app/api/auth/route.ts",
      "content": "import { authenticate } from '@/lib/auth';...",
      "action": "create"
    }
  ],
  "sessionId": "sess_abc123",
  "tokensUsed": 2345
}
```

**File Markers**:
The AI coder uses special markers to indicate file operations:
```
[FILE:write:src/components/Button.tsx]
export function Button({ children }: { children: React.ReactNode }) {
  return <button>{children}</button>;
}
[/FILE]

[FILE:write:src/app/page.tsx]
import { Button } from '@/components/Button';
...
[/FILE]
```

**Example**:
```bash
curl -X POST https://thecubiqo.com/api/coder \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create a reusable Button component with variants (primary, secondary, danger) using Tailwind CSS",
    "files": [
      {
        "path": "tailwind.config.js",
        "content": "module.exports = { theme: { extend: {} } }"
      }
    ]
  }'
```

**Virtual File System (VFS)**:
- Files created by AI coder are stored in Supabase
- Organized by session ID
- Automatic versioning
- Max 100MB per user

**Errors**:
- `GENERATION_FAILED`: AI failed to generate code
- `INVALID_PROMPT`: Prompt too short/vague
- `QUOTA_EXCEEDED`: Token quota exceeded
- `VFS_ERROR`: File system error

---

### Browser Automation API

#### POST /api/browser

**Description**: Control headless browser with natural language commands.

**Auth**: User required

**Request Body**:
```typescript
{
  action: 'start' | 'close' | 'command' | 'execute' | 'status';
  sessionId?: string;        // Browser session ID
  command?: string;          // Natural language command
  url?: string;              // URL to navigate (for start)
  javascript?: string;       // JavaScript to execute
}
```

**Response (start)**:
```json
{
  "success": true,
  "sessionId": "browser_abc123",
  "url": "about:blank"
}
```

**Response (command)**:
```json
{
  "success": true,
  "result": "Clicked the login button and entered credentials",
  "screenshot": "data:image/png;base64,...",
  "currentUrl": "https://example.com/dashboard"
}
```

**Response (execute)**:
```json
{
  "success": true,
  "result": { "title": "Example Domain", "links": 5 }
}
```

**Example - Natural Language**:
```bash
# Start browser
curl -X POST https://thecubiqo.com/api/browser \
  -H "Authorization: Bearer <token>" \
  -d '{
    "action": "start",
    "url": "https://github.com/login"
  }'

# Execute command
curl -X POST https://thecubiqo.com/api/browser \
  -H "Authorization: Bearer <token>" \
  -d '{
    "action": "command",
    "sessionId": "browser_abc123",
    "command": "Fill in username with testuser, password with pass123, and click Sign in"
  }'

# Execute JavaScript
curl -X POST https://thecubiqo.com/api/browser \
  -H "Authorization: Bearer <token>" \
  -d '{
    "action": "execute",
    "sessionId": "browser_abc123",
    "javascript": "return document.querySelectorAll(\"a\").length"
  }'
```

**Natural Language Commands**:
- "Click the submit button"
- "Fill in email with user@example.com"
- "Scroll to the bottom of the page"
- "Take a screenshot"
- "Wait for the page to load"
- "Extract all links"

**Limits**:
- 3 concurrent browser instances per user
- 5-minute idle timeout
- Screenshots limited to 2MB

---

### Session API

#### GET /api/sessions/[id]/compact

**Description**: Get token usage statistics for a session.

**Auth**: User required

**Response**:
```json
{
  "success": true,
  "sessionId": "sess_abc123",
  "totalTokens": 45000,
  "messageCount": 127,
  "oldestMessage": "2024-01-15T08:00:00Z",
  "newestMessage": "2024-01-15T10:30:00Z",
  "canCompact": true,
  "estimatedSavings": 12000
}
```

---

#### POST /api/sessions/[id]/compact

**Description**: Compact session by summarizing old messages.

**Auth**: User required

**Request Body**:
```typescript
{
  threshold?: number;  // Message age threshold in hours (default: 24)
  aggressive?: boolean; // More aggressive compression (default: false)
}
```

**Response**:
```json
{
  "success": true,
  "originalTokens": 45000,
  "compactedTokens": 18000,
  "savings": 27000,
  "messagesCompacted": 89,
  "summary": "Session focused on implementing user authentication with JWT tokens..."
}
```

**Example**:
```bash
curl -X POST https://thecubiqo.com/api/sessions/sess_abc123/compact \
  -H "Authorization: Bearer <token>" \
  -d '{"threshold": 48, "aggressive": true}'
```

---

### File API

#### GET /api/files/list

**Description**: Get file tree structure.

**Auth**: User required

**Query Parameters**:
```typescript
{
  path?: string;        // Root path (default: workspace root)
  depth?: number;       // Tree depth (default: 3, max: 10)
  includeHidden?: boolean;  // Include hidden files (default: false)
}
```

**Response**:
```json
{
  "success": true,
  "tree": {
    "name": "workspace",
    "type": "directory",
    "children": [
      {
        "name": "src",
        "type": "directory",
        "children": [
          {
            "name": "app",
            "type": "directory",
            "children": [
              { "name": "page.tsx", "type": "file", "size": 1234 }
            ]
          }
        ]
      },
      { "name": "package.json", "type": "file", "size": 567 }
    ]
  }
}
```

**Example**:
```bash
curl 'https://thecubiqo.com/api/files/list?path=src&depth=2' \
  -H "Authorization: Bearer <token>"
```

---

#### GET /api/files/read

**Description**: Read file contents.

**Auth**: User required

**Query Parameters**:
```typescript
{
  path: string;  // File path (required)
}
```

**Response**:
```json
{
  "success": true,
  "content": "import React from 'react';...",
  "size": 1234,
  "encoding": "utf-8",
  "modified": "2024-01-15T10:30:00Z"
}
```

**Example**:
```bash
curl 'https://thecubiqo.com/api/files/read?path=src/app/page.tsx' \
  -H "Authorization: Bearer <token>"
```

**Errors**:
- `FILE_NOT_FOUND`: File doesn't exist
- `FILE_TOO_LARGE`: File exceeds 10MB
- `PERMISSION_DENIED`: No read access

---

### Auth API

#### GET /api/auth/webauthn/register/options

**Description**: Get WebAuthn registration challenge for passkey creation.

**Auth**: Authenticated user

**Response**:
```json
{
  "success": true,
  "options": {
    "challenge": "random-base64-challenge",
    "rp": {
      "name": "CubiQo",
      "id": "thecubiqo.com"
    },
    "user": {
      "id": "user_abc123",
      "name": "user@example.com",
      "displayName": "John Doe"
    },
    "pubKeyCredParams": [
      { "type": "public-key", "alg": -7 },
      { "type": "public-key", "alg": -257 }
    ],
    "timeout": 60000,
    "attestation": "none"
  }
}
```

**Example**:
```javascript
// Get options
const response = await fetch('/api/auth/webauthn/register/options', {
  credentials: 'include'
});
const { options } = await response.json();

// Create credential
const credential = await navigator.credentials.create({
  publicKey: options
});

// Verify (next step)
```

---

#### POST /api/auth/webauthn/register/verify

**Description**: Verify WebAuthn registration and store credential.

**Auth**: Authenticated user

**Request Body**:
```typescript
{
  id: string;
  rawId: string;
  response: {
    clientDataJSON: string;
    attestationObject: string;
  };
  type: string;
}
```

**Response**:
```json
{
  "success": true,
  "credentialId": "cred_abc123",
  "message": "Passkey registered successfully"
}
```

---

#### GET /api/auth/webauthn/login/options

**Description**: Get WebAuthn login challenge.

**Auth**: None (public)

**Query Parameters**:
```typescript
{
  email?: string;  // Optional email hint
}
```

**Response**:
```json
{
  "success": true,
  "options": {
    "challenge": "random-base64-challenge",
    "timeout": 60000,
    "rpId": "thecubiqo.com",
    "allowCredentials": [
      {
        "type": "public-key",
        "id": "credential-id-base64"
      }
    ],
    "userVerification": "preferred"
  }
}
```

---

#### POST /api/auth/webauthn/login/verify

**Description**: Verify WebAuthn login assertion.

**Auth**: None (public)

**Request Body**:
```typescript
{
  id: string;
  rawId: string;
  response: {
    clientDataJSON: string;
    authenticatorData: string;
    signature: string;
    userHandle: string;
  };
  type: string;
}
```

**Response**:
```json
{
  "success": true,
  "user": {
    "id": "user_abc123",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "session": {
    "token": "session_token",
    "expiresAt": "2024-01-16T10:30:00Z"
  }
}
```

---

### Admin API

#### POST /api/admin/audit

**Description**: Log an admin action for audit trail.

**Auth**: Admin required

**Request Body**:
```typescript
{
  action: string;              // Action performed
  resource: string;            // Resource affected
  details?: object;            // Additional details
}
```

**Response**:
```json
{
  "success": true,
  "auditId": "audit_abc123",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Example**:
```bash
curl -X POST https://thecubiqo.com/api/admin/audit \
  -H "Authorization: Bearer <admin-token>" \
  -d '{
    "action": "user_deleted",
    "resource": "user_xyz789",
    "details": { "reason": "Account closure request" }
  }'
```

---

#### GET /api/admin/audit

**Description**: Query audit logs.

**Auth**: Admin required

**Query Parameters**:
```typescript
{
  action?: string;       // Filter by action
  resource?: string;     // Filter by resource
  userId?: string;       // Filter by user
  startDate?: string;    // ISO 8601 date
  endDate?: string;      // ISO 8601 date
  limit?: number;        // Default: 50
  offset?: number;       // Default: 0
}
```

**Response**:
```json
{
  "success": true,
  "logs": [
    {
      "id": "audit_001",
      "action": "user_created",
      "resource": "user_abc123",
      "userId": "admin_001",
      "timestamp": "2024-01-15T10:30:00Z",
      "details": { "email": "newuser@example.com" }
    }
  ],
  "total": 1523,
  "limit": 50,
  "offset": 0
}
```

---

### Other APIs

#### GET /api/health

**Description**: Health check endpoint.

**Auth**: None

**Response**:
```json
{
  "success": true,
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2024-01-15T10:30:00Z",
  "services": {
    "database": "healthy",
    "llm": "healthy",
    "storage": "healthy"
  }
}
```

---

#### POST /api/chat

**Description**: Main chat endpoint for user interaction.

**Auth**: User required

**Request Body**:
```typescript
{
  message: string;           // User message
  sessionId?: string;        // Continue conversation
  stream?: boolean;          // Stream response (default: false)
  model?: string;            // Override model
}
```

**Response**:
```json
{
  "success": true,
  "response": "I understand you want to...",
  "sessionId": "sess_abc123",
  "tokensUsed": 234
}
```

---

#### POST /api/stt

**Description**: Speech-to-text conversion.

**Auth**: User required

**Request**: `multipart/form-data`
```typescript
{
  audio: File;  // Audio file (WAV, MP3, OGG)
}
```

**Response**:
```json
{
  "success": true,
  "text": "This is the transcribed text",
  "confidence": 0.96,
  "duration": 5.2
}
```

---

#### POST /api/tts

**Description**: Text-to-speech conversion.

**Auth**: User required

**Request Body**:
```typescript
{
  text: string;           // Text to convert
  voice?: string;         // Voice ID (default: "default")
  speed?: number;         // Speed multiplier (0.5 - 2.0)
}
```

**Response**:
```json
{
  "success": true,
  "audioUrl": "https://storage.thecubiqo.com/audio/abc123.mp3",
  "duration": 5.2
}
```

---

#### POST /api/founders-pass

**Description**: Validate founders pass.

**Auth**: User required

**Request Body**:
```typescript
{
  pass: string;  // 32-character hex founders pass
}
```

**Response**:
```json
{
  "success": true,
  "valid": true,
  "founder": {
    "id": "founder_001",
    "name": "John Doe",
    "tier": "platinum"
  }
}
```

---

#### GET /api/feature-flags

**Description**: Get feature flags for current user.

**Auth**: User required

**Response**:
```json
{
  "success": true,
  "flags": {
    "new-ui": true,
    "beta-features": false,
    "ai-coder": true
  }
}
```

---

#### POST /api/feature-flags

**Description**: Update feature flags (admin only).

**Auth**: Admin required

**Request Body**:
```typescript
{
  flags: Record<string, boolean>;
  userId?: string;  // Override for specific user
}
```

---

## LLM Router API

The LLM Router (`src/lib/llm/router.ts`) provides a unified interface for multiple AI providers.

### Supported Providers

| Provider | Models | Context Window | Speed | Cost |
|----------|--------|----------------|-------|------|
| **Anthropic** | Claude 3.5 Sonnet | 200K | Fast | $$ |
| | Claude 3 Opus | 200K | Medium | $$$ |
| | Claude 3 Haiku | 200K | Very Fast | $ |
| **OpenAI** | GPT-4 Turbo | 128K | Fast | $$$ |
| | GPT-4 | 8K | Medium | $$$ |
| | GPT-3.5 Turbo | 16K | Very Fast | $ |
| **Google** | Gemini 1.5 Pro | 1M | Medium | $$ |
| | Gemini 1.5 Flash | 1M | Very Fast | $ |
| **Groq** | Llama 3 70B | 8K | Very Fast | $ |
| | Mixtral 8x7B | 32K | Fast | $ |
| **Mistral** | Mistral Large | 32K | Fast | $$ |
| | Mistral Medium | 32K | Fast | $ |
| **OpenRouter** | Various | Varies | Varies | Varies |

### callLLM Interface

```typescript
interface LLMRequest {
  model: ModelConfig;
  messages: Message[];
  tools?: ToolDefinition[];
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  stream?: boolean;
}

interface ModelConfig {
  provider: 'anthropic' | 'openai' | 'google' | 'groq' | 'mistral' | 'openrouter';
  model: string;
  apiKey?: string;  // Override default
  baseUrl?: string; // Custom endpoint
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}
```

### Example Usage

```typescript
import { callLLM } from '@/lib/llm/router';

// Basic completion
const response = await callLLM({
  model: {
    provider: 'anthropic',
    model: 'claude-3-sonnet-20240229'
  },
  messages: [
    { role: 'user', content: 'Explain quantum computing' }
  ],
  maxTokens: 1000,
  temperature: 0.7
});

console.log(response.content);
// "Quantum computing is a revolutionary approach..."
```

### Tool Calling

```typescript
const response = await callLLM({
  model: { provider: 'anthropic', model: 'claude-3-sonnet-20240229' },
  messages: [
    { role: 'user', content: 'What files are in the src directory?' }
  ],
  tools: [
    {
      name: 'file_list',
      description: 'List directory contents',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Directory path' }
        },
        required: ['path']
      }
    }
  ]
});

if (response.toolCalls) {
  for (const call of response.toolCalls) {
    console.log(`Tool: ${call.name}`);
    console.log(`Args: ${JSON.stringify(call.arguments)}`);
  }
}
```

### Streaming

```typescript
const stream = await callLLM({
  model: { provider: 'openai', model: 'gpt-4' },
  messages: [
    { role: 'user', content: 'Write a short story' }
  ],
  stream: true
});

for await (const chunk of stream) {
  process.stdout.write(chunk.content);
}
```

### Error Handling

```typescript
try {
  const response = await callLLM({...});
} catch (error) {
  if (error.code === 'RATE_LIMIT') {
    console.log('Rate limited, retry after:', error.retryAfter);
  } else if (error.code === 'CONTEXT_LENGTH_EXCEEDED') {
    console.log('Context too long, max:', error.maxTokens);
  } else if (error.code === 'API_ERROR') {
    console.log('Provider error:', error.message);
  }
}
```

### Provider-Specific Features

#### Anthropic Claude

```typescript
// Use vision
const response = await callLLM({
  model: { provider: 'anthropic', model: 'claude-3-opus-20240229' },
  messages: [
    {
      role: 'user',
      content: [
        { type: 'text', text: 'What\'s in this image?' },
        { type: 'image', source: { url: 'https://example.com/image.png' } }
      ]
    }
  ]
});
```

#### OpenAI GPT-4

```typescript
// Use function calling
const response = await callLLM({
  model: { provider: 'openai', model: 'gpt-4-turbo' },
  messages: [
    { role: 'user', content: 'What\'s the weather in SF?' }
  ],
  tools: [
    {
      name: 'get_weather',
      description: 'Get current weather',
      parameters: {
        type: 'object',
        properties: {
          location: { type: 'string' }
        }
      }
    }
  ]
});
```

#### Google Gemini

```typescript
// Use large context
const response = await callLLM({
  model: { provider: 'google', model: 'gemini-1.5-pro' },
  messages: [
    { role: 'user', content: veryLongDocument }
  ],
  maxTokens: 8000
});
```

---

## WebSocket APIs

### Agent Activity Stream

**Endpoint**: `wss://thecubiqo.com/api/ws/agents`

**Auth**: Session cookie or token in query param

**Connection**:
```javascript
const ws = new WebSocket('wss://thecubiqo.com/api/ws/agents?token=<token>');

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Agent activity:', message);
};
```

**Message Format**:
```json
{
  "type": "agent_activity",
  "agentId": "agent_001",
  "activity": "tool_call",
  "tool": "file_write",
  "status": "success",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Message Types**:
- `agent_activity`: Agent performed an action
- `session_started`: New session created
- `session_ended`: Session completed
- `error`: Error occurred

---

### Chat Stream

**Endpoint**: `wss://thecubiqo.com/api/ws/chat`

**Auth**: Session cookie or token

**Connection**:
```javascript
const ws = new WebSocket('wss://thecubiqo.com/api/ws/chat');

// Send message
ws.send(JSON.stringify({
  type: 'message',
  content: 'Hello, how can you help?'
}));

// Receive response
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'token') {
    process.stdout.write(data.content);
  } else if (data.type === 'done') {
    console.log('\nTokens used:', data.tokensUsed);
  }
};
```

**Client Messages**:
```json
{
  "type": "message",
  "content": "User message here",
  "sessionId": "sess_abc123"
}
```

**Server Messages**:
```json
// Streaming token
{
  "type": "token",
  "content": "word "
}

// Tool call
{
  "type": "tool_call",
  "tool": "file_read",
  "args": { "path": "src/app/page.tsx" }
}

// Tool result
{
  "type": "tool_result",
  "success": true,
  "result": "file content"
}

// Complete
{
  "type": "done",
  "tokensUsed": 1234
}
```

---

### Code Execution Stream

**Endpoint**: `wss://thecubiqo.com/api/ws/code`

**Auth**: Session cookie or token

**Use Case**: Real-time code execution output

**Connection**:
```javascript
const ws = new WebSocket('wss://thecubiqo.com/api/ws/code');

ws.send(JSON.stringify({
  type: 'execute',
  code: 'for i in range(10):\n    print(i)',
  language: 'python'
}));

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'stdout') {
    console.log(data.content);
  } else if (data.type === 'stderr') {
    console.error(data.content);
  } else if (data.type === 'done') {
    console.log('Exit code:', data.exitCode);
  }
};
```

---

## Security Model

### Access Control Matrix

| Tool/Endpoint | Public | User | Agent | Founder | Admin |
|---------------|--------|------|-------|---------|-------|
| file_read | ❌ | ✅ | ✅ | ✅ | ✅ |
| file_write | ❌ | ❌ | ✅ | ✅ | ✅ |
| file_list | ❌ | ✅ | ✅ | ✅ | ✅ |
| exec | ❌ | ❌ | ✅* | ✅ | ✅ |
| git | ❌ | ❌ | ✅* | ✅ | ✅ |
| web_search | ❌ | ✅ | ✅ | ✅ | ✅ |
| web_fetch | ❌ | ✅ | ✅ | ✅ | ✅ |
| vision_analyze | ❌ | ❌ | ✅* | ✅ | ✅ |
| Communication tools | ❌ | ❌ | ✅* | ✅ | ✅ |
| /api/agents/* | ❌ | ✅ | ✅ | ✅ | ✅ |
| /api/code/* | ❌ | ❌ | ✅ | ✅ | ✅ |
| /api/coder | ❌ | ✅ | ✅ | ✅ | ✅ |
| /api/browser | ❌ | ✅ | ✅ | ✅ | ✅ |
| /api/admin/* | ❌ | ❌ | ❌ | ❌ | ✅ |

*✅** = Restricted to specific agents defined in `allowedAgents` array

### Tool Security Features

#### Sandboxing
- Code execution in isolated containers
- Per-session workspaces
- No network access (configurable)
- Resource limits (CPU, memory, disk)

#### Input Validation
- All inputs validated against JSON schemas
- Path traversal prevention
- Command injection prevention
- SQL injection prevention (Supabase handles this)

#### Output Sanitization
- Output size limits
- PII redaction (optional)
- Error message sanitization

#### Audit Logging
- All tool calls logged
- Admin actions logged
- Failed auth attempts logged
- Retention: 90 days

### Founders Pass

Special 32-character hex key that grants elevated permissions:

```http
X-Founders-Pass: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

**Capabilities**:
- Access all tools
- Bypass rate limits
- Execute code
- Access admin APIs
- Create/modify agents

**Generation** (admin only):
```bash
curl -X POST https://thecubiqo.com/api/admin/founders-pass/generate \
  -H "Authorization: Bearer <admin-token>" \
  -d '{"founderId": "founder_001", "tier": "platinum"}'
```

### API Key Management

**Create API Key**:
```bash
curl -X POST https://thecubiqo.com/api/auth/api-keys \
  -H "Authorization: Bearer <session-token>" \
  -d '{"name": "My CLI Tool", "expiresIn": "90d"}'
```

**Response**:
```json
{
  "success": true,
  "apiKey": "cq_live_abc123...",
  "keyId": "key_abc123",
  "expiresAt": "2024-04-15T10:30:00Z"
}
```

**Revoke API Key**:
```bash
curl -X DELETE https://thecubiqo.com/api/auth/api-keys/key_abc123 \
  -H "Authorization: Bearer <session-token>"
```

---

## Code Examples

### Python SDK Example

```python
import requests

class CubiQoClient:
    def __init__(self, api_key):
        self.api_key = api_key
        self.base_url = "https://thecubiqo.com/api"
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
    
    def chat(self, message, session_id=None):
        response = requests.post(
            f"{self.base_url}/chat",
            headers=self.headers,
            json={"message": message, "sessionId": session_id}
        )
        return response.json()
    
    def execute_code(self, code, language="python"):
        response = requests.post(
            f"{self.base_url}/code/execute",
            headers=self.headers,
            json={"code": code, "language": language}
        )
        return response.json()
    
    def run_agent(self, agent_id, prompt):
        response = requests.post(
            f"{self.base_url}/agents/{agent_id}/run",
            headers=self.headers,
            json={"prompt": prompt}
        )
        return response.json()

# Usage
client = CubiQoClient("cq_live_abc123...")

# Chat
result = client.chat("What's in the src directory?")
print(result['response'])

# Execute code
result = client.execute_code("print('Hello, World!')")
print(result['output'])

# Run agent
result = client.run_agent("agent_001", "Review the authentication code")
print(result['response'])
```

### JavaScript/TypeScript SDK Example

```typescript
class CubiQoClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://thecubiqo.com/api';
  }

  private async request(path: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  async chat(message: string, sessionId?: string) {
    return this.request('/chat', {
      method: 'POST',
      body: JSON.stringify({ message, sessionId }),
    });
  }

  async executeCode(code: string, language: 'python' | 'javascript' | 'typescript' | 'bash') {
    return this.request('/code/execute', {
      method: 'POST',
      body: JSON.stringify({ code, language }),
    });
  }

  async runAgent(agentId: string, prompt: string, stream = false) {
    if (!stream) {
      return this.request(`/agents/${agentId}/run`, {
        method: 'POST',
        body: JSON.stringify({ prompt }),
      });
    }

    // Streaming
    const response = await fetch(`${this.baseUrl}/agents/${agentId}/run`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify({ prompt, stream: true }),
    });

    return this.parseSSE(response);
  }

  private async *parseSSE(response: Response) {
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.slice(6));
          yield data;
        }
      }
    }
  }
}

// Usage
const client = new CubiQoClient('cq_live_abc123...');

// Chat
const result = await client.chat('Explain the code structure');
console.log(result.response);

// Execute code
const output = await client.executeCode('console.log("Hello")', 'javascript');
console.log(output.output);

// Streaming agent
const stream = await client.runAgent('agent_001', 'Refactor this code', true);
for await (const chunk of stream) {
  if (chunk.type === 'token') {
    process.stdout.write(chunk.content);
  }
}
```

### cURL Examples

```bash
# Set your API key
API_KEY="cq_live_abc123..."
BASE_URL="https://thecubiqo.com/api"

# Chat
curl -X POST "$BASE_URL/chat" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"message": "List all files in src/"}'

# Execute Python code
curl -X POST "$BASE_URL/code/execute" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "import math\nprint(math.pi)",
    "language": "python"
  }'

# Run agent (streaming)
curl -X POST "$BASE_URL/agents/agent_001/run" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{"prompt": "Analyze the codebase", "stream": true}' \
  --no-buffer

# Create agent
curl -X POST "$BASE_URL/agents" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Review Bot",
    "model": "claude-3-sonnet",
    "tools": ["file_read", "git"],
    "systemPrompt": "You are a code reviewer"
  }'

# List agents
curl "$BASE_URL/agents" \
  -H "Authorization: Bearer $API_KEY"

# Browser automation
curl -X POST "$BASE_URL/browser" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "start",
    "url": "https://example.com"
  }'

# AI code generation
curl -X POST "$BASE_URL/coder" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create a React form component with validation"
  }'

# Web search
curl -X POST "$BASE_URL/tools/web_search" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Next.js 14 features",
    "count": 5
  }'

# Health check
curl "$BASE_URL/health"
```

### WebSocket Example (Browser)

```javascript
// Connect to agent activity stream
const ws = new WebSocket('wss://thecubiqo.com/api/ws/agents?token=' + apiKey);

ws.onopen = () => {
  console.log('Connected to agent activity stream');
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  switch (message.type) {
    case 'agent_activity':
      console.log(`Agent ${message.agentId}: ${message.activity}`);
      break;
    
    case 'tool_call':
      console.log(`Tool called: ${message.tool}`);
      break;
    
    case 'error':
      console.error('Error:', message.error);
      break;
  }
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('Disconnected from agent activity stream');
};

// Subscribe to specific agent
ws.send(JSON.stringify({
  type: 'subscribe',
  agentId: 'agent_001'
}));
```

### React Hook Example

```typescript
import { useState, useEffect } from 'react';

function useCubiQoAgent(agentId: string, apiKey: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<string>('');

  const run = async (prompt: string) => {
    setLoading(true);
    setError(null);
    setResponse('');

    try {
      const res = await fetch(`https://thecubiqo.com/api/agents/${agentId}/run`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error);
      }

      setResponse(data.response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return { run, loading, error, response };
}

// Usage in component
function CodeReviewer() {
  const { run, loading, error, response } = useCubiQoAgent(
    'agent_001',
    process.env.NEXT_PUBLIC_CUBIQO_API_KEY!
  );

  const handleReview = () => {
    run('Review the authentication module');
  };

  return (
    <div>
      <button onClick={handleReview} disabled={loading}>
        {loading ? 'Reviewing...' : 'Review Code'}
      </button>
      {error && <div className="error">{error}</div>}
      {response && <div className="response">{response}</div>}
    </div>
  );
}
```

---

## Appendix

### Environment Variables

```bash
# API Keys
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GOOGLE_AI_API_KEY=...
GROQ_API_KEY=...
BRAVE_SEARCH_API_KEY=...

# Database
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_KEY=...

# Auth
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://thecubiqo.com

# Communication
TELEGRAM_BOT_TOKEN=...
SLACK_BOT_TOKEN=...
DISCORD_BOT_TOKEN=...
SENDGRID_API_KEY=...

# Features
ENABLE_CODE_EXECUTION=true
ENABLE_BROWSER_AUTOMATION=true
ENABLE_FOUNDERS_PASS=true

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_REQUESTS=60
RATE_LIMIT_WINDOW=60

# Custom LLM
EMERGENT_BASE_URL=https://custom-llm.example.com
```

### Response Time SLAs

| Endpoint | p50 | p95 | p99 |
|----------|-----|-----|-----|
| /api/health | <50ms | <100ms | <200ms |
| /api/chat | <1s | <3s | <5s |
| /api/agents/*/run | <2s | <5s | <10s |
| /api/code/execute | <500ms | <2s | <5s |
| /api/coder | <3s | <10s | <20s |
| /api/browser | <1s | <3s | <5s |

### Support

- **Documentation**: https://docs.thecubiqo.com
- **API Status**: https://status.thecubiqo.com
- **Support Email**: support@thecubiqo.com
- **Discord**: https://discord.gg/cubiqo
- **GitHub**: https://github.com/thecubiqo/thecubiqo

### Changelog

**v1.0.0** (2024-01-15)
- Initial release
- 15 agent tools
- 50+ HTTP endpoints
- LLM router with 6 providers
- WebSocket support
- Full documentation

---

*This specification is maintained by the CubiQo team. Last updated: 2024-01-15.*
