# CubiQo Coding Agent API Documentation

## Overview

CubiQo now has full code execution capabilities! Users can write, execute, and manage code in Python, JavaScript, TypeScript, and Bash, all through natural voice commands or chat interface.

## Features

- ✅ **Code Execution**: Run Python, JavaScript, TypeScript, Bash
- ✅ **File Operations**: Create, read, write, delete files
- ✅ **Terminal Emulation**: Execute shell commands
- ✅ **Workspace Isolation**: Each user gets their own sandboxed workspace
- ✅ **Resource Limits**: Timeouts, memory limits, file size restrictions
- ✅ **Voice Integration**: Natural language to code execution

---

## API Endpoints

### 1. Code Execution: `/api/code/execute`

Execute code in a sandboxed environment.

**Request:**
```json
POST /api/code/execute
{
  "language": "python" | "javascript" | "typescript" | "bash",
  "code": "print('Hello World')",
  "sessionId": "user-123",
  "timeout": 30,
  "env": {
    "VAR_NAME": "value"
  }
}
```

**Response:**
```json
{
  "stdout": "Hello World\n",
  "stderr": "",
  "exitCode": 0,
  "executionTime": 123
}
```

**Example Python:**
```bash
curl -X POST http://localhost:3000/api/code/execute \
  -H "Content-Type: application/json" \
  -d '{
    "language": "python",
    "code": "for i in range(5):\n    print(f\"Count: {i}\")",
    "sessionId": "test-user"
  }'
```

**Example JavaScript:**
```bash
curl -X POST http://localhost:3000/api/code/execute \
  -H "Content-Type: application/json" \
  -d '{
    "language": "javascript",
    "code": "console.log(\"Hello from Node.js\");",
    "sessionId": "test-user"
  }'
```

---

### 2. File Operations: `/api/code/file-ops`

Perform file operations within the user's workspace.

#### Read File
```json
POST /api/code/file-ops
{
  "operation": "read",
  "path": "src/hello.py",
  "sessionId": "user-123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "content": "print('Hello World')",
    "size": 20,
    "modified": "2025-02-08T10:30:00Z"
  }
}
```

#### Write File
```json
POST /api/code/file-ops
{
  "operation": "write",
  "path": "src/hello.py",
  "content": "print('Hello World')",
  "sessionId": "user-123"
}
```

#### Delete File
```json
POST /api/code/file-ops
{
  "operation": "delete",
  "path": "old_file.txt",
  "sessionId": "user-123"
}
```

#### List Files
```json
POST /api/code/file-ops
{
  "operation": "list",
  "path": "src",
  "sessionId": "user-123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "files": [
      {
        "name": "hello.py",
        "path": "src/hello.py",
        "type": "file",
        "size": 20,
        "modified": "2025-02-08T10:30:00Z"
      },
      {
        "name": "utils",
        "path": "src/utils",
        "type": "directory",
        "modified": "2025-02-08T09:15:00Z"
      }
    ],
    "count": 2
  }
}
```

#### Create Directory
```json
POST /api/code/file-ops
{
  "operation": "create-dir",
  "path": "src/components",
  "sessionId": "user-123"
}
```

---

### 3. Terminal Emulation: `/api/code/terminal`

Execute shell commands in the user's workspace.

**Request:**
```json
POST /api/code/terminal
{
  "command": "ls -la",
  "sessionId": "user-123",
  "timeout": 30,
  "background": false,
  "env": {
    "NODE_ENV": "development"
  }
}
```

**Response:**
```json
{
  "stdout": "total 8\ndrwxr-xr-x 2 user user 4096 Feb  8 10:30 .\n",
  "stderr": "",
  "exitCode": 0,
  "executionTime": 45
}
```

#### Background Processes
Run commands in the background:
```json
POST /api/code/terminal
{
  "command": "npm run dev",
  "sessionId": "user-123",
  "background": true
}
```

**Response:**
```json
{
  "stdout": "",
  "stderr": "",
  "exitCode": null,
  "pid": 12345,
  "background": true
}
```

#### Check Process Status
```bash
GET /api/code/terminal?pid=12345
```

**Response:**
```json
{
  "pid": 12345,
  "running": true,
  "uptime": 45000
}
```

#### Kill Background Process
```bash
DELETE /api/code/terminal?pid=12345
```

---

## React Hook: `useCodeExecution`

Frontend hook for easy code execution.

**Example:**
```typescript
import { useCodeExecution } from '@/hooks/useCodeExecution'

function CodeEditor() {
  const { execute, isExecuting, executionResult, write, list } = useCodeExecution('user-123')

  const runCode = async () => {
    // Execute Python code
    const result = await execute('python', 'print("Hello World")')
    console.log(result.stdout)

    // Write a file
    await write('src/app.py', 'print("My app")')

    // List files
    const files = await list('src')
    console.log(files.data.files)
  }

  return (
    <button onClick={runCode} disabled={isExecuting}>
      {isExecuting ? 'Running...' : 'Run Code'}
    </button>
  )
}
```

---

## AI Integration

CubiQo can now understand and execute code commands through natural language!

### Voice Commands

**User:** "Create a Python script that calculates fibonacci numbers"

**CubiQo:** Creates the file and executes it automatically.

**User:** "Run the tests"

**CubiQo:** Executes `npm test` and reports results.

**User:** "Show me the files in the src directory"

**CubiQo:** Lists all files and folders.

### Special Markers in AI Responses

The AI can use special code block markers:

#### Execute Code
```
```[EXEC:python]
print("Hello from CubiQo!")
```
```

#### Write File
```
```[FILE:write:src/hello.py]
def greet():
    print("Hello!")
```
```

#### Read File
```
```[FILE:read:src/hello.py]```
```

#### List Files
```
```[FILE:list:src]```
```

#### Terminal Command
```
```[TERMINAL]
npm install express
```
```

These markers are automatically parsed and executed by the frontend.

---

## Security Features

### Sandboxing
- Code runs in isolated workspaces per user
- No access to system files outside workspace
- Path traversal protection

### Resource Limits
- **Timeout**: 30 seconds default (configurable)
- **File Size**: 10MB maximum per file
- **Memory**: Limited by system configuration

### File Restrictions
- Allowed extensions: `.js`, `.jsx`, `.ts`, `.tsx`, `.py`, `.json`, `.md`, `.txt`, `.css`, `.scss`, `.html`, `.yml`, `.yaml`, `.env`, `.sh`
- Path validation prevents directory traversal attacks

### Environment Isolation
- Each user gets their own workspace directory
- Workspace location: `/tmp/cubiqo-workspaces/{sessionId}`
- Processes cannot access other users' workspaces

---

## Example Workflows

### 1. Create and Run a Python Script

```typescript
const { execute, write } = useCodeExecution('user-123')

// Write the script
await write('fibonacci.py', `
def fib(n):
    if n <= 1:
        return n
    return fib(n-1) + fib(n-2)

for i in range(10):
    print(f"F({i}) = {fib(i)}")
`)

// Execute it
const result = await execute('python', `
with open('fibonacci.py', 'r') as f:
    exec(f.read())
`)

console.log(result.stdout)
```

### 2. Set Up a Node.js Project

```typescript
const { terminal, write } = useCodeExecution('user-123')

// Create package.json
await write('package.json', JSON.stringify({
  name: 'my-app',
  version: '1.0.0',
  dependencies: {
    express: '^4.18.0'
  }
}, null, 2))

// Install dependencies
await terminal('npm install')

// Create app
await write('app.js', `
const express = require('express')
const app = express()

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(3000, () => {
  console.log('Server running on port 3000')
})
`)

// Run in background
const { pid } = await terminal('node app.js', { background: true })
console.log('Server started with PID:', pid)
```

### 3. Data Analysis with Python

```typescript
const { execute, write } = useCodeExecution('user-123')

// Create data file
await write('data.csv', 'name,age,city\nAlice,30,NYC\nBob,25,LA\n')

// Analyze with pandas
await execute('python', `
import pandas as pd

df = pd.read_csv('data.csv')
print(df.describe())
print(f"Average age: {df['age'].mean()}")
`)
```

---

## Error Handling

All API endpoints return proper error responses:

**Timeout:**
```json
{
  "stdout": "...",
  "stderr": "[Process killed: timeout exceeded]",
  "exitCode": 124
}
```

**Invalid Path:**
```json
{
  "success": false,
  "error": "Invalid path: path traversal detected"
}
```

**File Not Found:**
```json
{
  "success": false,
  "error": "File not found"
}
```

**Execution Error:**
```json
{
  "stdout": "",
  "stderr": "Traceback (most recent call last):\n  File \"script.py\", line 1\n    print(\nSyntaxError: unexpected EOF",
  "exitCode": 1
}
```

---

## Environment Variables

Configure the coding agent with these environment variables:

```bash
# Workspace base directory (default: /tmp/cubiqo-workspaces)
CODE_WORKSPACE_BASE=/path/to/workspaces

# Default timeout in seconds (default: 30)
CODE_EXECUTION_TIMEOUT=30
```

---

## Limitations & Roadmap

### Current Limitations
- No network access from sandboxed code (by design)
- File operations limited to workspace
- Background processes cleaned up on server restart

### Future Enhancements (Phase 2B-E)
- [ ] Git integration (commit, push, pull)
- [ ] Package manager integration (npm, pip)
- [ ] Database access
- [ ] Browser automation for testing
- [ ] Docker container isolation
- [ ] Code quality metrics and visualization
- [ ] Collaborative coding sessions

---

## Testing

Test the API endpoints:

```bash
# Test Python execution
curl -X POST http://localhost:3000/api/code/execute \
  -H "Content-Type: application/json" \
  -d '{
    "language": "python",
    "code": "print(\"Hello CubiQo!\")",
    "sessionId": "test"
  }'

# Test file write
curl -X POST http://localhost:3000/api/code/file-ops \
  -H "Content-Type: application/json" \
  -d '{
    "operation": "write",
    "path": "test.txt",
    "content": "Hello World",
    "sessionId": "test"
  }'

# Test file read
curl -X POST http://localhost:3000/api/code/file-ops \
  -H "Content-Type: application/json" \
  -d '{
    "operation": "read",
    "path": "test.txt",
    "sessionId": "test"
  }'

# Test terminal
curl -X POST http://localhost:3000/api/code/terminal \
  -H "Content-Type: application/json" \
  -d '{
    "command": "echo Hello from terminal",
    "sessionId": "test"
  }'
```

---

## Support

For issues or questions:
- Check the [GitHub Issues](https://github.com/yourusername/cubiqo/issues)
- Read the [Phase 2 Brief](../PHASE2_CODING_BRIEF.md)
- Contact the dev team

---

**Status:** ✅ Phase 2A Complete - Core execution features delivered!
