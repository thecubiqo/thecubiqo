# Emergent Security Architecture
## Security Checklist & Best Practices

**Version:** 1.0.0  
**Author:** MO (CTO/Tech Architect)  
**Date:** February 18, 2025  
**Status:** Architecture Design Phase

---

## Table of Contents

1. [Security Overview](#security-overview)
2. [Security Principles](#security-principles)
3. [Secrets Management](#secrets-management)
4. [Agent Isolation](#agent-isolation)
5. [Frontend Security](#frontend-security)
6. [Backend Security](#backend-security)
7. [Runner Security](#runner-security)
8. [Database Security](#database-security)
9. [API Security](#api-security)
10. [Authentication & Authorization](#authentication--authorization)
11. [Network Security](#network-security)
12. [Compliance & Audit](#compliance--audit)
13. [Incident Response](#incident-response)
14. [Security Checklist](#security-checklist)

---

## Security Overview

The Emergent platform handles sensitive user data, API keys, and executes arbitrary code. Security is not optional—it's the foundation of trust.

### Threat Model

**Assets to Protect:**
- User credentials and authentication tokens
- API keys and secrets (Shopify, Stripe, OpenAI, etc.)
- User source code and intellectual property
- Payment information and billing data
- Deployment credentials
- Database connections

**Threat Actors:**
- Malicious users attempting to access other users' projects
- Attackers trying to exfiltrate secrets or API keys
- Code injection attacks (SQL, XSS, RCE)
- DDoS attacks on API endpoints
- Insider threats (compromised employee accounts)

**Attack Vectors:**
- Exposed secrets in frontend code
- Path traversal attacks in file operations
- Command injection in terminal/shell execution
- Cross-site scripting (XSS) in user-generated content
- SQL injection in database queries
- Unauthorized API access
- Container escape from sandboxed workspaces
- Man-in-the-middle attacks on API communication

---

## Security Principles

### 1. Defense in Depth
Multiple layers of security controls. If one fails, others still protect the system.

### 2. Least Privilege
Grant minimum necessary permissions. Users, services, and processes should only access what they absolutely need.

### 3. Zero Trust
Never trust, always verify. Authenticate and authorize every request, even internal ones.

### 4. Fail Secure
When errors occur, default to secure state (deny access, log out user, etc.).

### 5. Security by Design
Security is not bolted on—it's architected from day one.

### 6. Auditability
Log everything. Every action should be traceable for forensics and compliance.

---

## Secrets Management

### ⚠️ CRITICAL RULE: Secrets Never in Frontend

**Frontend code is visible to anyone.** Secrets exposed in client-side code can be extracted by:
- Viewing page source
- Inspecting network requests
- Decompiling/debugging JavaScript
- Reading browser DevTools

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (Public)                      │
│  ❌ NO SECRETS                                              │
│  ❌ NO API KEYS                                             │
│  ❌ NO DATABASE CREDENTIALS                                 │
│  ❌ NO SIGNING SECRETS                                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ HTTPS Only
                       │ JWT Token (short-lived)
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                   BACKEND API (Server)                      │
│  ✅ Secrets retrieved from env vars                         │
│  ✅ Secrets decrypted server-side                           │
│  ✅ Never returned in API responses                         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Encrypted Connection
                       │
┌──────────────────────▼──────────────────────────────────────┐
│              SECRETS VAULT (Supabase Vault)                 │
│  • AES-256 encryption at rest                               │
│  • Access logged                                            │
│  • Automatic key rotation                                   │
└─────────────────────────────────────────────────────────────┘
```

### Secret Storage

**Database Schema:**
```sql
CREATE TABLE project_secrets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  key_name TEXT NOT NULL,
  encrypted_value TEXT NOT NULL,  -- AES-256-GCM encrypted
  last_rotated TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(project_id, key_name)
);

-- Encrypt using Supabase Vault
-- https://supabase.com/docs/guides/database/vault

-- Enable RLS
ALTER TABLE project_secrets ENABLE ROW LEVEL SECURITY;

-- Only backend can access secrets (service role)
-- Users can only see key names, NOT values
CREATE POLICY "Users can view secret names" ON project_secrets
  FOR SELECT
  USING (
    project_id IN (
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
  );

-- Service role (backend) can do anything
```

### Secret Encryption

```typescript
// src/lib/secrets/encryption.ts

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY = Buffer.from(process.env.SECRETS_ENCRYPTION_KEY!, 'base64');

export function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  // Return iv:authTag:encrypted
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decrypt(ciphertext: string): string {
  const [ivHex, authTagHex, encrypted] = ciphertext.split(':');
  
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
```

### Secret Management API

```typescript
// src/app/api/secrets/route.ts

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { encrypt, decrypt } from '@/lib/secrets/encryption';

// ✅ CORRECT: Server-side API route
export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  
  // Authenticate user
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { projectId, keyName, value } = await req.json();
  
  // Verify user has access to project
  const { data: access } = await supabase
    .from('project_members')
    .select('*')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .single();
  
  if (!access) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  // Encrypt secret
  const encryptedValue = encrypt(value);
  
  // Store in database (using service role to bypass RLS)
  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!  // Service role key
  );
  
  const { error: insertError } = await adminSupabase
    .from('project_secrets')
    .upsert({
      project_id: projectId,
      key_name: keyName,
      encrypted_value: encryptedValue,
      created_by: user.id,
    });
  
  if (insertError) {
    return Response.json({ error: 'Failed to store secret' }, { status: 500 });
  }
  
  // Log access
  await auditLog.create({
    user_id: user.id,
    action: 'secret_created',
    resource_type: 'secret',
    resource_id: projectId,
    metadata: { key_name: keyName },
  });
  
  // ❌ NEVER return the actual value
  return Response.json({ 
    success: true, 
    message: 'Secret stored successfully',
    keyName  // Only return the key name
  });
}

// Get secret (server-side only, for runner injection)
export async function getSecret(projectId: string, keyName: string): Promise<string> {
  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  const { data, error } = await adminSupabase
    .from('project_secrets')
    .select('encrypted_value')
    .eq('project_id', projectId)
    .eq('key_name', keyName)
    .single();
  
  if (error || !data) {
    throw new Error('Secret not found');
  }
  
  // Decrypt
  const decrypted = decrypt(data.encrypted_value);
  
  // Log access
  await auditLog.create({
    action: 'secret_accessed',
    resource_type: 'secret',
    resource_id: projectId,
    metadata: { key_name: keyName },
  });
  
  return decrypted;
}
```

### Frontend: Listing Secrets (Names Only)

```typescript
// src/app/api/secrets/list/route.ts

// ✅ CORRECT: Return key names, NOT values
export async function GET(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('projectId');
  
  // Get secrets (RLS ensures user can only see their projects)
  const { data: secrets } = await supabase
    .from('project_secrets')
    .select('id, key_name, last_rotated, created_at')  // ❌ NOT encrypted_value
    .eq('project_id', projectId);
  
  return Response.json({ secrets });
}
```

### Secret Injection into Runner

```typescript
// src/lib/runner/workspace-manager.ts

async function startWorkspace(projectId: string) {
  // Retrieve secrets from vault
  const secrets = await getProjectSecrets(projectId);
  
  // Create .env file in workspace (server-side only)
  const envContent = Object.entries(secrets)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  
  const workspacePath = getWorkspacePath(projectId);
  await fs.promises.writeFile(
    path.join(workspacePath, '.env'),
    envContent,
    { mode: 0o600 }  // Only owner can read
  );
  
  // ⚠️ IMPORTANT: .env file should be in .dockerignore and .gitignore
  // ⚠️ IMPORTANT: Frontend cannot access workspace file system
}
```

### Key Rotation

```typescript
// src/lib/secrets/rotation.ts

// Automatic key rotation (run daily via cron)
export async function rotateExpiredKeys() {
  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  // Find secrets older than 90 days
  const { data: expiredSecrets } = await adminSupabase
    .from('project_secrets')
    .select('*')
    .lt('last_rotated', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000));
  
  for (const secret of expiredSecrets || []) {
    // Notify user to rotate
    await sendEmail({
      to: secret.created_by,
      subject: 'Action Required: Rotate API Key',
      body: `Your API key "${secret.key_name}" is older than 90 days. Please rotate it.`,
    });
  }
}

// Manual rotation
export async function rotateSecret(projectId: string, keyName: string, newValue: string) {
  const encryptedValue = encrypt(newValue);
  
  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  await adminSupabase
    .from('project_secrets')
    .update({
      encrypted_value: encryptedValue,
      last_rotated: new Date(),
    })
    .eq('project_id', projectId)
    .eq('key_name', keyName);
  
  // Log rotation
  await auditLog.create({
    action: 'secret_rotated',
    resource_type: 'secret',
    resource_id: projectId,
    metadata: { key_name: keyName },
  });
}
```

---

## Agent Isolation

### ⚠️ CRITICAL RULE: Sub-Agents Cannot Call Other Sub-Agents

**All coordination flows through the Main Agent.**

```
❌ WRONG:
Code Sub-Agent ──→ Test Sub-Agent (Direct call)

✅ CORRECT:
Code Sub-Agent ──→ Main Agent ──→ Test Sub-Agent
```

### Why?

1. **Prevents infinite loops** - Sub-agents calling each other recursively
2. **Centralized control** - Main agent tracks all operations
3. **Cost tracking** - Main agent deducts credits for each operation
4. **Audit trail** - All agent interactions logged centrally
5. **Error handling** - Main agent can retry or rollback on failure

### Implementation

```typescript
// src/lib/orchestrator/sub-agents/base-sub-agent.ts

abstract class BaseSubAgent {
  // ⚠️ Sub-agents CANNOT access MainAgent or other SubAgents
  // ⚠️ They can only return results to caller (MainAgent)
  
  abstract async execute(params: any): Promise<any>;
  
  // ❌ NOT ALLOWED:
  // private mainAgent: MainAgent;
  // private codeAgent: CodeSubAgent;
}

// src/lib/orchestrator/main-agent.ts

class MainAgent {
  private codeAgent: CodeSubAgent;
  private testAgent: TestSubAgent;
  private imageAgent: ImageSubAgent;
  
  async execute(request: AgentRequest): Promise<AgentResponse> {
    // 1. Parse intent
    const intent = await this.parseIntent(request.message);
    
    // 2. Plan steps
    const steps = await this.planSteps(intent);
    
    // 3. Execute steps (coordinate sub-agents)
    for (const step of steps) {
      switch (step.type) {
        case 'code_generation':
          // ✅ Main agent calls code agent
          const codeResult = await this.codeAgent.execute(step.params);
          
          // ✅ Main agent decides what to do next
          if (codeResult.success) {
            // ✅ Main agent calls test agent
            await this.testAgent.execute({ files: codeResult.filesCreated });
          }
          break;
          
        // ... other steps
      }
    }
  }
}
```

### Enforcement

```typescript
// src/middleware/agent-isolation.ts

// Middleware to prevent sub-agents from calling each other
export function enforceAgentIsolation(req: Request) {
  const callerAgent = req.headers.get('X-Caller-Agent');
  const targetAgent = req.headers.get('X-Target-Agent');
  
  // If caller is a sub-agent and target is also a sub-agent, deny
  if (isSubAgent(callerAgent) && isSubAgent(targetAgent)) {
    throw new SecurityError('Sub-agents cannot call other sub-agents');
  }
}

function isSubAgent(agentName: string | null): boolean {
  return ['code', 'test', 'image', 'integration', 'human'].includes(agentName || '');
}
```

---

## Frontend Security

### 1. Never Trust User Input

All user input is potentially malicious. Sanitize and validate everything.

```typescript
// ❌ WRONG: Directly rendering user input
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ✅ CORRECT: Sanitize before rendering
import DOMPurify from 'dompurify';

const sanitized = DOMPurify.sanitize(userInput);
<div dangerouslySetInnerHTML={{ __html: sanitized }} />
```

### 2. XSS Protection

```typescript
// Always escape user input
import { escape } from 'html-escaper';

const safeMessage = escape(userMessage);

// Use React's built-in escaping
<div>{userMessage}</div>  // React escapes by default
```

### 3. CSRF Protection

```typescript
// Next.js API routes automatically include CSRF protection
// Ensure all mutations use POST/PUT/DELETE, not GET

// Frontend: Include CSRF token in requests
const response = await fetch('/api/projects/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken,  // Get from meta tag or cookie
  },
  body: JSON.stringify(data),
});
```

### 4. Content Security Policy (CSP)

```typescript
// next.config.ts

const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.vercel-insights.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data: https://*.supabase.co;
  font-src 'self';
  connect-src 'self' https://*.supabase.co wss://*.supabase.co;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
`;

export default {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: cspHeader.replace(/\n/g, ''),
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};
```

### 5. Secure Storage

```typescript
// ❌ WRONG: Storing sensitive data in localStorage
localStorage.setItem('apiKey', userApiKey);

// ✅ CORRECT: Never store sensitive data in frontend
// Store in backend, use short-lived tokens

// For session data, use httpOnly cookies
// Set in backend:
res.setHeader('Set-Cookie', `session=${token}; HttpOnly; Secure; SameSite=Strict`);
```

---

## Backend Security

### 1. Input Validation with Zod

```typescript
// src/app/api/projects/create/route.ts

import { z } from 'zod';

const createProjectSchema = z.object({
  name: z.string().min(1).max(100).regex(/^[a-zA-Z0-9-_]+$/),
  description: z.string().max(500).optional(),
  stack: z.enum(['nextjs', 'vite', 'cra', 'django', 'rails']),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Validate input
    const validatedData = createProjectSchema.parse(body);
    
    // Use validatedData (now type-safe and validated)
    const project = await createProject(validatedData);
    
    return Response.json({ project });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: error.errors }, { status: 400 });
    }
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

### 2. SQL Injection Prevention

```typescript
// ❌ WRONG: String concatenation
const userId = req.query.userId;
const result = await db.query(`SELECT * FROM users WHERE id = '${userId}'`);

// ✅ CORRECT: Parameterized queries
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId);  // Supabase handles escaping

// ✅ CORRECT: With Prisma
const user = await prisma.user.findUnique({
  where: { id: userId }  // Prisma uses parameterized queries
});
```

### 3. Command Injection Prevention

```typescript
// ❌ WRONG: Directly using user input in shell commands
const filename = req.body.filename;
exec(`cat ${filename}`);  // DANGEROUS!

// ✅ CORRECT: Validate and sanitize
const filename = req.body.filename;

// Validate filename (no path traversal, no shell metacharacters)
if (!/^[a-zA-Z0-9_.-]+$/.test(filename)) {
  throw new Error('Invalid filename');
}

// Use spawn instead of exec (no shell interpretation)
const { stdout } = await spawn('cat', [filename], {
  cwd: workspacePath,
});
```

### 4. Rate Limiting

```typescript
// src/middleware/rate-limit.ts

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

// Different limits for different endpoints
const limiters = {
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'),  // 100 requests per minute
  }),
  
  expensive: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 m'),  // 10 requests per minute
  }),
  
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '1 m'),  // 5 attempts per minute
  }),
};

export async function rateLimit(
  identifier: string,
  type: 'api' | 'expensive' | 'auth' = 'api'
) {
  const limiter = limiters[type];
  const { success, remaining } = await limiter.limit(identifier);
  
  if (!success) {
    throw new RateLimitError(`Rate limit exceeded. ${remaining} remaining.`);
  }
}

// Usage in API route
export async function POST(req: Request) {
  const userId = await getUserId(req);
  
  await rateLimit(userId, 'expensive');  // Check rate limit
  
  // ... rest of handler
}
```

### 5. Error Handling

```typescript
// ❌ WRONG: Leaking internal details
catch (error) {
  return Response.json({ error: error.message }, { status: 500 });
}

// ✅ CORRECT: Generic error message, log details
catch (error) {
  console.error('Project creation failed:', error);
  
  // Send to error tracking (Sentry)
  Sentry.captureException(error);
  
  // Return generic message to user
  return Response.json({ 
    error: 'Failed to create project. Please try again.' 
  }, { status: 500 });
}
```

---

## Runner Security

### 1. Sandbox Isolation

```yaml
# docker-compose.workspace.yml

services:
  workspace-${PROJECT_ID}:
    image: node:20-alpine
    container_name: workspace-${PROJECT_ID}
    
    # Security options
    security_opt:
      - no-new-privileges:true  # Prevent privilege escalation
      - seccomp:unconfined  # Allow system calls (for Node.js)
    
    # Read-only root filesystem
    read_only: true
    tmpfs:
      - /tmp
      - /var/tmp
    
    # Drop all capabilities, add only what's needed
    cap_drop:
      - ALL
    cap_add:
      - CHOWN
      - SETUID
      - SETGID
    
    # Resource limits
    mem_limit: 2g
    cpus: 1.0
    
    # Network isolation (no external access by default)
    networks:
      - isolated
    
    # User (non-root)
    user: "1000:1000"
    
networks:
  isolated:
    driver: bridge
    internal: true  # No external access
```

### 2. Path Traversal Prevention

```typescript
// src/lib/runner/file-system.ts

import path from 'path';

export function validatePath(workspacePath: string, userPath: string): string {
  // Resolve to absolute path
  const fullPath = path.resolve(workspacePath, userPath);
  
  // Ensure path is within workspace
  if (!fullPath.startsWith(workspacePath)) {
    throw new PathTraversalError(`Invalid path: ${userPath}`);
  }
  
  // Block access to sensitive files
  const blockedPatterns = [
    '.env',
    '.git',
    'node_modules',
    '../',
    '~/',
  ];
  
  for (const pattern of blockedPatterns) {
    if (userPath.includes(pattern)) {
      throw new PathTraversalError(`Blocked path pattern: ${pattern}`);
    }
  }
  
  return fullPath;
}

// Usage
const safePath = validatePath('/workspaces/project-123', req.body.path);
await fs.promises.readFile(safePath, 'utf8');
```

### 3. Command Execution Safety

```typescript
// src/lib/runner/command-executor.ts

import { spawn } from 'child_process';

const ALLOWED_COMMANDS = [
  'npm',
  'node',
  'git',
  'python',
  'pip',
  'ls',
  'cat',
  'mkdir',
  'rm',
];

export async function executeCommand(
  workspacePath: string,
  command: string,
  args: string[] = [],
  env: Record<string, string> = {}
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  // Validate command
  if (!ALLOWED_COMMANDS.includes(command)) {
    throw new SecurityError(`Command not allowed: ${command}`);
  }
  
  // Validate args (no shell metacharacters)
  for (const arg of args) {
    if (/[;&|$`<>]/.test(arg)) {
      throw new SecurityError(`Invalid argument: ${arg}`);
    }
  }
  
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, {
      cwd: workspacePath,
      env: { ...env, PATH: '/usr/local/bin:/usr/bin:/bin' },
      shell: false,  // ⚠️ IMPORTANT: Never use shell: true
      timeout: 30000,  // 30 second timeout
    });
    
    let stdout = '';
    let stderr = '';
    
    process.stdout.on('data', (data) => { stdout += data; });
    process.stderr.on('data', (data) => { stderr += data; });
    
    process.on('close', (exitCode) => {
      resolve({ stdout, stderr, exitCode: exitCode || 0 });
    });
    
    process.on('error', reject);
  });
}
```

### 4. Resource Monitoring

```typescript
// src/lib/runner/resource-monitor.ts

export class ResourceMonitor {
  async checkResourceUsage(projectId: string) {
    const containerStats = await docker.getContainer(projectId).stats({ stream: false });
    
    const cpuUsage = this.calculateCpuPercentage(containerStats);
    const memoryUsage = containerStats.memory_stats.usage;
    const storageUsage = await this.getStorageUsage(projectId);
    
    // Check limits
    const limits = await this.getResourceLimits(projectId);
    
    if (cpuUsage > limits.cpu * 0.9) {
      await this.alertHighCpuUsage(projectId, cpuUsage);
    }
    
    if (memoryUsage > limits.memory * 0.9) {
      await this.alertHighMemoryUsage(projectId, memoryUsage);
    }
    
    if (storageUsage > limits.storage * 0.9) {
      await this.alertHighStorageUsage(projectId, storageUsage);
    }
    
    return { cpuUsage, memoryUsage, storageUsage };
  }
  
  private async alertHighCpuUsage(projectId: string, usage: number) {
    await notificationService.send({
      projectId,
      type: 'high_cpu_usage',
      message: `CPU usage at ${usage}%. Consider upgrading your plan.`,
    });
  }
}
```

---

## Database Security

### 1. Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own data" ON users
  FOR SELECT
  USING (auth.uid() = id);

-- Users can only update their own data
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE
  USING (auth.uid() = id);

-- Users can only see projects they're members of
CREATE POLICY "Users can view own projects" ON projects
  FOR SELECT
  USING (
    id IN (
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
  );

-- Users can only update projects they own
CREATE POLICY "Owners can update projects" ON projects
  FOR UPDATE
  USING (
    owner_id = auth.uid()
  );
```

### 2. Service Role vs Anon Key

```typescript
// Frontend: Use anon key (respects RLS)
const supabase = createClientComponentClient({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,  // Safe to expose
});

// Backend: Use service role (bypasses RLS)
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!  // ⚠️ NEVER expose to frontend
);

// ⚠️ Always validate permissions manually when using service role
if (!userHasAccess(userId, projectId)) {
  throw new ForbiddenError();
}
```

### 3. Audit Logging

```sql
-- Audit log table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Retention policy (delete logs older than 2 years)
CREATE OR REPLACE FUNCTION delete_old_audit_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '2 years';
END;
$$ LANGUAGE plpgsql;

-- Run daily
SELECT cron.schedule('delete-old-audit-logs', '0 2 * * *', 'SELECT delete_old_audit_logs()');
```

### 4. Prepared Statements

```typescript
// Supabase automatically uses prepared statements
const { data } = await supabase
  .from('projects')
  .select('*')
  .eq('id', projectId);  // Safe from SQL injection

// With raw SQL (use only when necessary)
const { data } = await supabase.rpc('get_project_stats', {
  p_project_id: projectId  // Parameters are safely escaped
});
```

---

## API Security

### 1. Authentication Middleware

```typescript
// src/middleware/auth.ts

export async function authenticate(req: Request): Promise<AuthContext> {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    throw new UnauthorizedError('No authentication token');
  }
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => getCookie(name),
      },
    }
  );
  
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    throw new UnauthorizedError('Invalid token');
  }
  
  return {
    userId: user.id,
    email: user.email!,
    role: user.role,
  };
}

// Usage in API route
export async function POST(req: Request) {
  const auth = await authenticate(req);
  
  // ... rest of handler
}
```

### 2. Authorization

```typescript
// src/middleware/authorize.ts

export async function authorizeProjectAccess(
  userId: string,
  projectId: string,
  requiredRole: 'owner' | 'admin' | 'member' = 'member'
): Promise<void> {
  const { data: membership } = await supabase
    .from('project_members')
    .select('role')
    .eq('user_id', userId)
    .eq('project_id', projectId)
    .single();
  
  if (!membership) {
    throw new ForbiddenError('No access to this project');
  }
  
  const roleHierarchy = { owner: 3, admin: 2, member: 1 };
  
  if (roleHierarchy[membership.role] < roleHierarchy[requiredRole]) {
    throw new ForbiddenError(`Requires ${requiredRole} role`);
  }
}

// Usage
export async function DELETE(req: Request, { params }: { params: { projectId: string } }) {
  const auth = await authenticate(req);
  await authorizeProjectAccess(auth.userId, params.projectId, 'owner');
  
  // Only project owners can delete
  await deleteProject(params.projectId);
}
```

### 3. CORS Configuration

```typescript
// next.config.ts

export default {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NODE_ENV === 'production' 
              ? 'https://cubiqo.com' 
              : 'http://localhost:3000',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
          {
            key: 'Access-Control-Max-Age',
            value: '86400',  // 24 hours
          },
        ],
      },
    ];
  },
};
```

---

## Authentication & Authorization

### 1. JWT Token Lifecycle

```typescript
// Token expiration
const JWT_EXPIRATION = 3600;  // 1 hour
const REFRESH_TOKEN_EXPIRATION = 604800;  // 7 days

// Supabase handles token refresh automatically
// When access token expires, refresh token is used to get new access token
```

### 2. Multi-Factor Authentication (Future)

```typescript
// src/lib/auth/mfa.ts

export async function enableMFA(userId: string) {
  // Generate TOTP secret
  const secret = speakeasy.generateSecret({
    name: 'CubiQo',
    length: 32,
  });
  
  // Store secret in user record (encrypted)
  await db.users.update({
    where: { id: userId },
    data: {
      mfa_secret: encrypt(secret.base32),
      mfa_enabled: false,  // Not enabled until verified
    },
  });
  
  // Return QR code for user to scan
  const qrCode = await QRCode.toDataURL(secret.otpauth_url);
  
  return { qrCode, secret: secret.base32 };
}

export async function verifyMFA(userId: string, token: string): Promise<boolean> {
  const user = await db.users.findUnique({ where: { id: userId } });
  
  if (!user || !user.mfa_secret) {
    return false;
  }
  
  const secret = decrypt(user.mfa_secret);
  
  const verified = speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2,  // Allow 2 time steps (1 minute tolerance)
  });
  
  return verified;
}
```

---

## Network Security

### 1. HTTPS Only

```typescript
// next.config.ts

export default {
  async redirects() {
    if (process.env.NODE_ENV === 'production') {
      return [
        {
          source: '/:path*',
          has: [
            {
              type: 'header',
              key: 'x-forwarded-proto',
              value: 'http',
            },
          ],
          destination: 'https://cubiqo.com/:path*',
          permanent: true,
        },
      ];
    }
    return [];
  },
};
```

### 2. DDoS Protection

```typescript
// Cloudflare provides DDoS protection at CDN level

// Additional application-level protection
import { Ratelimit } from '@upstash/ratelimit';

const ddosProtection = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(1000, '1 m'),  // 1000 requests per minute per IP
});

export async function middleware(req: Request) {
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip');
  
  const { success } = await ddosProtection.limit(ip || 'unknown');
  
  if (!success) {
    return new Response('Too many requests', { status: 429 });
  }
  
  return NextResponse.next();
}
```

---

## Compliance & Audit

### 1. GDPR Compliance

```typescript
// Right to access
export async function exportUserData(userId: string) {
  const user = await db.users.findUnique({ where: { id: userId } });
  const projects = await db.projects.findMany({ where: { owner_id: userId } });
  const auditLogs = await db.auditLogs.findMany({ where: { user_id: userId } });
  
  return {
    user,
    projects,
    auditLogs,
  };
}

// Right to deletion
export async function deleteUserData(userId: string) {
  // Delete in order (respect foreign keys)
  await db.projectMembers.deleteMany({ where: { user_id: userId } });
  await db.projects.deleteMany({ where: { owner_id: userId } });
  await db.auditLogs.deleteMany({ where: { user_id: userId } });
  await db.users.delete({ where: { id: userId } });
}
```

### 2. SOC 2 Compliance (Future)

- Encryption at rest and in transit
- Access controls and audit logging
- Incident response procedures
- Regular security assessments
- Employee background checks

---

## Incident Response

### 1. Security Incident Playbook

**Step 1: Detect**
- Monitor alerts from Sentry, Cloudflare, audit logs
- User reports of suspicious activity

**Step 2: Assess**
- Determine scope and severity
- Identify affected users/data

**Step 3: Contain**
- Revoke compromised credentials
- Block attacker IP addresses
- Disable affected features

**Step 4: Eradicate**
- Patch vulnerabilities
- Remove malicious code/data
- Reset all secrets

**Step 5: Recover**
- Restore services
- Verify integrity
- Monitor for recurrence

**Step 6: Post-Mortem**
- Document incident
- Identify root cause
- Implement preventive measures

### 2. Security Contacts

```
Security Team: security@cubiqo.com
On-Call: +1-XXX-XXX-XXXX
Slack Channel: #security-incidents
```

---

## Security Checklist

### Before Launch

- [ ] Secrets never in frontend code
- [ ] All API routes have authentication
- [ ] RLS enabled on all database tables
- [ ] Input validation with Zod on all endpoints
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (sanitize user input)
- [ ] CSRF protection enabled
- [ ] Rate limiting on all endpoints
- [ ] Content Security Policy configured
- [ ] HTTPS enforced (redirect HTTP to HTTPS)
- [ ] Secure headers configured (X-Frame-Options, etc.)
- [ ] Secrets encrypted at rest (AES-256)
- [ ] Audit logging for all sensitive operations
- [ ] Docker containers run as non-root user
- [ ] File paths validated (prevent traversal)
- [ ] Command execution validated (no shell injection)
- [ ] Resource limits enforced (CPU, memory, storage)
- [ ] Error messages don't leak internal details
- [ ] Dependencies scanned for vulnerabilities
- [ ] Security testing performed (penetration testing)

### Ongoing

- [ ] Regular security audits (quarterly)
- [ ] Dependency updates (automated via Dependabot)
- [ ] Secret rotation (90 days)
- [ ] Access reviews (monthly)
- [ ] Incident response drills (bi-annually)
- [ ] Security training for team (annually)
- [ ] Compliance certifications maintained
- [ ] Bug bounty program (future)

---

## Conclusion

Security is not a feature—it's a fundamental requirement. Every line of code, every API endpoint, every database query must be designed with security in mind.

**Remember:**
1. **Never trust user input** - Validate everything
2. **Never expose secrets** - Keep them server-side
3. **Never skip authentication** - Always verify the user
4. **Never skip authorization** - Always check permissions
5. **Never log sensitive data** - Redact before logging
6. **Never ignore errors** - Log and monitor
7. **Never stop learning** - Security evolves

---

**Document Maintained By:** MO (CTO/Tech Architect)  
**Last Updated:** February 18, 2025  
**Status:** Living Document (Update as threats evolve)
