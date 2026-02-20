# Emergent Platform: Extracted Requirements for Incomplete Components

**Document Version:** 1.0  
**Date:** February 19, 2026  
**Status:** Requirements Extraction Complete  
**Source:** `emergent-architecture.md`, `emergent-tool-api.md`, `emergent-security.md`

---

## Overview

This document consolidates detailed requirements for the 4 incomplete components of the Emergent-Level AI App Builder platform, extracted from existing architecture documentation.

### Component Status

| Component | Current Status | Priority | Estimated Effort |
|-----------|---------------|----------|------------------|
| Frontend Studio UI | ❌ Not Started (0%) | **High** | 4-6 weeks |
| Runner System | ❌ Not Started (0%) | **High** | 6-8 weeks |
| Deployment Flow | ❌ Not Started (0%) | **High** | 4-5 weeks |
| Post-Launch OS | ❌ Not Started (0%) | Medium | 8-12 weeks |

---

## 1. FRONTEND STUDIO UI

### 1.1 Functional Requirements

#### Core Features
- **Multi-View Interface:**
  - Builder view with conversational AI interface
  - Project Manager for workspace navigation
  - Live Preview Panel synchronized with dev server
  - Dashboard showing deployment status
  - Logs viewer with real-time streaming

- **Conversational Builder:**
  - Chat interface for natural language app building
  - Voice input support (speech-to-text)
  - Context-aware suggestions
  - Command palette for quick actions
  - History and undo/redo support

- **Code Editor Integration:**
  - Monaco Editor (VS Code in browser)
  - Syntax highlighting for 10+ languages
  - IntelliSense and autocomplete
  - Multi-file editing with tabs
  - Search and replace across files
  - Git diff visualization

- **Terminal Emulator:**
  - Interactive bash/shell access
  - Multiple terminal tabs support
  - Command history
  - Copy/paste support
  - Color output rendering

- **File Explorer:**
  - Tree view of project structure
  - File/folder creation, rename, delete
  - Drag-and-drop file upload
  - Context menu actions
  - Search files by name

- **Project Settings:**
  - Environment variable management UI (names only, no values)
  - Build configuration editor
  - Deployment settings
  - Team member management
  - Integration toggles

#### User Workflows

**Workflow 1: Create New App**
```
1. User enters prompt: "Create an e-commerce site for selling plants"
2. Studio shows conversation view with AI response
3. AI asks clarifying questions (payment provider, styling preference)
4. User answers via voice or text
5. AI generates frontend preview with mock data
6. Preview panel shows live app with responsive states
7. User iterates: "Make the header green and add plant icons"
8. AI updates code, preview auto-refreshes
9. User approves, clicks "Add Backend"
10. Studio transitions to backend generation flow
```

**Workflow 2: Edit Existing Project**
```
1. User opens project from dashboard
2. Studio loads file explorer, code editor, preview
3. User opens terminal, runs `npm install lodash`
4. Terminal streams output in real-time
5. User edits code in Monaco editor
6. Preview hot-reloads on save
7. User opens secrets manager, adds `STRIPE_SECRET_KEY`
8. User clicks "Deploy Now"
9. Deployment flow starts (see Deployment Flow section)
```

### 1.2 Technical Requirements

#### Technology Stack
- **Framework:** Next.js 16 (App Router, Server Components)
- **UI Library:** React 19
- **Styling:** Tailwind CSS 4
- **State Management:** 
  - Zustand for global state
  - React Context for feature-specific state
  - React Query for server state
- **Component Libraries:** 
  - shadcn/ui (base components)
  - Radix UI (primitives)
  - Lucide icons
- **Forms:** React Hook Form + Zod validation
- **Code Editor:** Monaco Editor (`@monaco-editor/react`)
- **Terminal:** Xterm.js + xterm-addon-fit
- **Real-time Communication:** WebSocket (Socket.io or native)
- **Graphics:** Three.js + React Three Fiber (3D visualizations)
- **Voice:** ElevenLabs TTS + Web Speech API

#### API Integration
```typescript
// Studio Frontend APIs
interface StudioAPI {
  // Workspace Operations
  createProject(prompt: string): Promise<Project>;
  loadProject(projectId: string): Promise<ProjectData>;
  saveFile(projectId: string, path: string, content: string): Promise<void>;
  deleteFile(projectId: string, path: string): Promise<void>;
  
  // Terminal Operations
  openTerminal(workspaceId: string): Promise<WebSocket>;
  executeCommand(workspaceId: string, command: string): Promise<void>;
  killProcess(workspaceId: string, pid: number): Promise<void>;
  
  // Preview Operations
  getPreviewURL(workspaceId: string): Promise<string>;
  restartDevServer(workspaceId: string): Promise<void>;
  
  // Deployment Operations
  triggerDeployment(projectId: string, config: DeployConfig): Promise<Deployment>;
  getDeploymentStatus(deploymentId: string): Promise<DeploymentStatus>;
  
  // Secrets Management (UI only shows names, no values)
  listSecrets(projectId: string): Promise<SecretMetadata[]>;
  addSecret(projectId: string, name: string, value: string): Promise<void>;
  rotateSecret(projectId: string, secretId: string): Promise<void>;
}
```

#### File Structure
```
src/app/
  studio/
    page.tsx                  # Main Studio page
    [projectId]/
      page.tsx                # Project-specific Studio view
    
src/components/studio/
  StudioLayout.tsx            # Main layout with panels
  ConversationPanel.tsx       # Chat interface with AI
  CodeEditor.tsx              # Monaco editor wrapper
  FileExplorer.tsx            # File tree navigation
  TerminalPanel.tsx           # Xterm.js terminal
  PreviewPanel.tsx            # Live preview iframe
  SecretsManager.tsx          # Secret management UI
  DeploymentHistory.tsx       # Deployment list
  
src/hooks/studio/
  useStudioProject.ts         # Project state management
  useTerminal.ts              # Terminal WebSocket hook
  usePreview.ts               # Preview state hook
  useFileOperations.ts        # File CRUD operations
  
src/lib/studio/
  monaco-config.ts            # Monaco editor configuration
  terminal-commands.ts        # Terminal command handlers
  websocket-client.ts         # WebSocket connection manager
```

### 1.3 UI/UX Requirements

#### Design System
- **Color Palette:**
  - Primary: Teal/Cyan (CubiQo brand)
  - Success: Green
  - Warning: Yellow
  - Error: Red
  - Neutral: Gray scale
  
- **Typography:**
  - Headings: Inter or Geist (system font)
  - Code: Fira Code or JetBrains Mono (monospace)
  - Body: Inter or system-ui
  
- **Layout:**
  - Responsive grid system (desktop-first)
  - Minimum width: 1280px (desktop), 768px (tablet)
  - Panel resizing with drag handles
  - Collapsible sidebars

#### Interactions
- **Real-time Updates:**
  - File changes trigger preview hot-reload < 500ms
  - Terminal output streams with < 100ms latency
  - Deployment status updates every 2 seconds
  
- **Keyboard Shortcuts:**
  - `Cmd/Ctrl + S`: Save current file
  - `Cmd/Ctrl + P`: Command palette
  - `Cmd/Ctrl + K`: Open file search
  - `Cmd/Ctrl + \``: Toggle terminal
  - `Cmd/Ctrl + B`: Toggle file explorer
  
- **Visual Feedback:**
  - Loading states for all async operations
  - Success/error toasts for user actions
  - Progress bars for deployments
  - 3D cube animations for AI thinking states

#### Accessibility
- WCAG 2.1 Level AA compliance
- Keyboard navigation for all features
- Screen reader support (ARIA labels)
- High contrast mode support
- Focus indicators on interactive elements

### 1.4 Security Requirements

#### Client-Side Security
- ❌ **NO secrets/API keys visible in frontend code**
- All API requests use HTTPS
- JWT authentication with short-lived tokens (15 min)
- XSS protection:
  - Sanitize user input with DOMPurify
  - Escape HTML in chat messages
  - Use dangerouslySetInnerHTML sparingly
- CSRF protection:
  - CSRF tokens on all state-changing operations
  - SameSite cookies
  - Origin validation
- Content Security Policy (CSP) headers:
  ```
  default-src 'self';
  script-src 'self' 'unsafe-eval';  # Monaco needs eval
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' wss://terminal.cubiqo.dev;
  ```

#### Data Security
- Sensitive data encrypted in transit (HTTPS/WSS)
- Local storage encryption for temp data
- Session timeout after 30 minutes of inactivity
- Automatic logout on token expiration
- Secure cookie handling (HttpOnly, Secure, SameSite)

### 1.5 Performance Requirements

#### Load Performance
- **Initial Load:**
  - First Contentful Paint (FCP) < 1.5s
  - Largest Contentful Paint (LCP) < 3s
  - Time to Interactive (TTI) < 4s
  
- **Code Editor:**
  - File open < 300ms (files up to 10K lines)
  - Syntax highlighting responsive with 50K+ line files
  - Autocomplete suggestions < 100ms
  
- **Terminal:**
  - Command execution latency < 100ms
  - Output rendering 60 FPS
  - Handle 10K lines of output without freezing
  
- **Preview:**
  - Iframe load < 2s
  - Hot reload updates < 500ms
  - Responsive to viewport changes < 200ms

#### Resource Utilization
- Memory usage < 200MB for typical session
- Memory usage < 500MB with large files (100K+ lines)
- CPU usage < 30% on modern hardware
- Network bandwidth < 1Mbps for WebSocket connections

### 1.6 Integration Points with CubiQo Infrastructure

#### Authentication
- Use existing Supabase Auth system
- Support magic link and WebAuthn
- Session management via `useAuth()` hook
- Profile data from `profiles` table

#### AI Integration
- Use existing multi-provider AI routing (MiniMax → Mixtral → Llama → Claude)
- Conversational interface powered by existing chat API
- Voice input/output via existing TTS/STT pipeline

#### Analytics
- Track user interactions via existing Vercel Analytics
- Custom events via PostHog integration
- Error tracking via Sentry

#### Feature Flags
- Control Studio feature rollout via existing feature flags system
- Per-user and per-org feature toggles

---

## 2. RUNNER SYSTEM (Workspace Execution Environment)

### 2.1 Functional Requirements

#### Workspace Management

**Core Operations:**
- **Create Workspace:**
  - Spin up isolated Docker container
  - Initialize project directory structure
  - Install default dependencies
  - Start file watcher for hot reload
  
- **Start Workspace:**
  - Resume stopped container
  - Restore terminal sessions
  - Reconnect preview server
  - Load cached dependencies
  
- **Stop Workspace:**
  - Gracefully shutdown dev servers
  - Save terminal state
  - Persist file changes
  - Release resources
  
- **Destroy Workspace:**
  - Stop all processes
  - Delete container and volumes
  - Clean up temporary files
  - Archive logs

**Lifecycle:**
```
[Created] → [Starting] → [Running] → [Stopping] → [Stopped]
                ↓                        ↓
             [Error]                  [Destroyed]
```

**Resource Management:**
- Default allocation: 2 CPU cores, 4GB RAM, 10GB storage
- Pro tier: 4 CPU cores, 8GB RAM, 50GB storage
- Enterprise tier: 8 CPU cores, 16GB RAM, 200GB storage
- Automatic cleanup after 30 minutes of inactivity
- Quota enforcement per organization

#### Terminal Emulator

**Features:**
- Interactive bash/shell access via PTY (pseudo-terminal)
- Multiple terminal sessions per workspace
- Command execution with real-time output
- Process management:
  - List running processes
  - Kill processes by PID
  - Background job control
- Command history (last 1000 commands)
- Environment variable support
- Tab completion

**Technical Implementation:**
- Use `node-pty` for PTY creation
- WebSocket connection for real-time I/O
- Terminal state persistence across reconnections
- Output buffering to handle high-throughput commands

**Security:**
- Rate limiting: 100 commands/minute per user
- Audit log all commands executed
- Timeout protection: kill processes running > 15 minutes
- Restrict dangerous commands (e.g., `rm -rf /`)
- No access to host system files

#### Dev Server Management

**Auto-Detection:**
- Detect project type from files:
  - `package.json` → Node.js (Next.js, Vite, CRA, etc.)
  - `requirements.txt` → Python (Flask, Django, FastAPI)
  - `composer.json` → PHP (Laravel, Symfony)
  - `Gemfile` → Ruby (Rails, Sinatra)
  - `go.mod` → Go
  
- Determine start command:
  - Next.js: `npm run dev` or `next dev`
  - Vite: `npm run dev` or `vite`
  - CRA: `npm start`
  - Flask: `flask run`
  - Rails: `rails server`

**Operations:**
- Start dev server on port 3000 (or auto-allocated port)
- Monitor health with HTTP polling (every 10s)
- Auto-restart on crash (max 3 retries)
- Kill dev server on workspace stop
- Handle WebSocket upgrades for hot reload

**Port Management:**
- Dynamic port allocation from pool (3000-4000)
- Port mapping from container to host
- Proxy all traffic through Nginx
- Support multiple services per workspace (frontend + backend)

#### Preview Server

**Architecture:**
```
User Browser → Nginx Reverse Proxy → Docker Container (Dev Server)
  https://{project-id}.preview.cubiqo.dev
           ↓
  Nginx routes by subdomain to correct container port
```

**URL Generation:**
- Format: `https://{project-id}.preview.cubiqo.dev`
- SSL/TLS termination at Nginx
- WebSocket upgrade support for hot reload
- Custom headers for debugging (X-Project-ID, X-Workspace-ID)

**Routing:**
- Nginx dynamic routing configuration
- Subdomain → container port mapping in Redis
- Health check endpoint: `/_health`
- Fallback to 503 if dev server down

**Features:**
- Live preview updates with hot reload
- Mobile device testing (responsive preview)
- Share preview URL with team members
- Optional authentication for private projects

### 2.2 Technical Requirements

#### Infrastructure

**Containerization:**
- **Platform:** Docker 24+
- **Base Images:**
  - Node.js: `node:20-alpine`
  - Python: `python:3.11-slim`
  - PHP: `php:8.2-fpm-alpine`
  - Ruby: `ruby:3.2-alpine`
  - Go: `golang:1.21-alpine`
  
- **Container Configuration:**
  ```dockerfile
  FROM node:20-alpine
  
  # Set working directory
  WORKDIR /workspace
  
  # Install system dependencies
  RUN apk add --no-cache git curl bash
  
  # Set resource limits
  ENV NODE_OPTIONS="--max-old-space-size=4096"
  
  # Expose ports
  EXPOSE 3000
  
  # Start command
  CMD ["/bin/bash"]
  ```

- **Resource Limits:**
  ```yaml
  services:
    workspace:
      cpus: '2'
      mem_limit: 4g
      storage_opt:
        size: 10g
  ```

**Networking:**
- Isolated Docker network per project
- No external network access by default (security)
- Allow access to approved APIs via whitelist:
  - npm registry (registry.npmjs.org)
  - GitHub (github.com, api.github.com)
  - CDNs (cdn.jsdelivr.net, unpkg.com)
  - AI providers (api.openai.com, api.anthropic.com)

**Storage:**
- Docker volumes for persistent project files
- Shared volume for temporary files
- Backup snapshots every 6 hours
- Retention policy: 7 days of snapshots

**Process Management:**
- Supervisor or systemd for container processes
- Auto-restart on crash
- Graceful shutdown on stop
- Resource monitoring (CPU, memory, disk I/O)

#### APIs

**Workspace API:**
```typescript
// POST /api/runner/workspaces
interface CreateWorkspaceRequest {
  projectId: string;
  runtime: 'nodejs' | 'python' | 'php' | 'ruby' | 'go';
  template?: string; // Optional starter template
}

interface CreateWorkspaceResponse {
  workspaceId: string;
  containerId: string;
  status: 'created';
  previewURL: string;
  terminalURL: string; // WebSocket URL
}

// GET /api/runner/workspaces/:id
interface GetWorkspaceResponse {
  workspaceId: string;
  projectId: string;
  status: 'running' | 'stopped' | 'error';
  resources: {
    cpu: number; // percentage
    memory: number; // MB
    storage: number; // MB
  };
  processes: {
    pid: number;
    name: string;
    cpu: number;
    memory: number;
  }[];
  uptime: number; // seconds
}

// POST /api/runner/workspaces/:id/start
// POST /api/runner/workspaces/:id/stop
// DELETE /api/runner/workspaces/:id

// WS /api/runner/terminal/:workspaceId
interface TerminalMessage {
  type: 'input' | 'output' | 'resize';
  data: string | { cols: number; rows: number };
}
```

**Dev Server API:**
```typescript
// POST /api/runner/dev-server/:workspaceId/start
interface StartDevServerRequest {
  command?: string; // Optional custom command
  port?: number; // Optional custom port
  env?: Record<string, string>; // Environment variables
}

// POST /api/runner/dev-server/:workspaceId/stop
// GET /api/runner/dev-server/:workspaceId/status
interface DevServerStatus {
  running: boolean;
  port: number;
  previewURL: string;
  uptime: number; // seconds
  health: 'healthy' | 'unhealthy' | 'unknown';
}
```

#### Deployment Architecture

**Infrastructure Setup:**
- **Runner Nodes:** AWS EC2 instances (t3.xlarge or higher)
- **Load Balancer:** AWS ALB or Nginx for routing
- **Container Orchestration:** Docker Swarm or Kubernetes (future)
- **Monitoring:** Prometheus + Grafana
- **Logging:** Loki or CloudWatch Logs

**Scalability:**
- Horizontal scaling: add more EC2 instances
- Auto-scaling based on workspace count
- Target: 20-30 workspaces per instance
- Load balancing: round-robin across instances

**High Availability:**
- Multi-AZ deployment
- Health checks on runner nodes
- Automatic failover
- Backup runner nodes for redundancy

### 2.3 Security Requirements

#### Container Isolation

**Network Security:**
- Each project in separate Docker network
- No external network access by default
- Whitelist approved domains (npm, GitHub, CDNs)
- Block access to internal networks (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16)
- Firewall rules enforced at container level

**File System Security:**
- Path traversal prevention:
  ```typescript
  function sanitizePath(userPath: string, workspaceRoot: string): string {
    const resolved = path.resolve(workspaceRoot, userPath);
    if (!resolved.startsWith(workspaceRoot)) {
      throw new Error('Path traversal detected');
    }
    return resolved;
  }
  ```
- Storage quota enforcement (10GB default)
- No access outside `/workspace` directory
- Read-only mounts for system files
- Secure file permissions (0755 for directories, 0644 for files)

**Process Security:**
- Resource limits prevent DoS attacks:
  - CPU: 2 cores default
  - Memory: 4GB default
  - Processes: max 100 per container
  - Open files: max 1024 per container
- Process namespace isolation (PID 1 in container)
- No privileged containers
- Drop unnecessary capabilities (CAP_SYS_ADMIN, etc.)

#### Terminal Security

**Command Filtering:**
- Rate limiting: 100 commands/minute per user
- Audit log all terminal commands
- Block dangerous commands:
  - `rm -rf /` and variants
  - `dd` (disk operations)
  - `mkfs` (format filesystem)
  - `:(){ :|:& };:` (fork bomb)
- Timeout protection: kill processes running > 15 minutes

**Authentication:**
- WebSocket connections require valid JWT token
- Workspace ownership verification
- Session timeout after 30 minutes of inactivity

**Data Security:**
- Terminal output encrypted in transit (WSS)
- Command history encrypted at rest
- No sensitive data logged (secrets masked)

#### Preview URL Security

**Access Control:**
- HTTPS required (TLS 1.3)
- Project ID verification in Nginx
- Optional authentication for private projects
- Rate limiting: 100 requests/minute per IP

**Headers:**
```nginx
add_header X-Frame-Options "SAMEORIGIN";
add_header X-Content-Type-Options "nosniff";
add_header X-XSS-Protection "1; mode=block";
add_header Referrer-Policy "strict-origin-when-cross-origin";
```

### 2.4 Performance Requirements

#### Response Times
- Container startup: < 5 seconds (cold start)
- Container resume: < 2 seconds (warm start)
- Terminal command execution: < 100ms latency
- Dev server start: < 30 seconds
- Preview URL routing: < 50ms
- Hot reload propagation: < 500ms

#### Scalability
- Support 50-100 concurrent workspaces per EC2 instance
- Handle 500+ workspaces across cluster
- WebSocket connections: 1000+ concurrent
- Terminal output: handle 10MB/s throughput

#### Resource Efficiency
- Container base memory: 512MB
- Container idle memory: < 100MB overhead
- Docker image size: < 500MB per runtime
- Storage efficiency: < 2GB per project on average

### 2.5 Integration Points with CubiQo Infrastructure

#### Supabase
- Store workspace metadata in `emergent_workspaces` table
- Store environment variables in `emergent_env_vars` table (encrypted)
- Log workspace events in `emergent_audit_log`

#### Control Plane API
- Send workspace status updates
- Report resource utilization
- Handle workspace lifecycle events

#### Orchestrator
- Receive file write/edit operations from main agent
- Execute test commands via testing subagent
- Run build commands for deployments

#### Redis
- Cache workspace → container port mappings
- Store terminal session state
- Rate limiting counters

---

## 3. DEPLOYMENT FLOW (Preview to Production)

### 3.1 Functional Requirements

#### Deployment Pipeline

**Phase 1: Build**
1. Trigger deployment from Studio UI
2. Validate project configuration
3. Inject environment variables from secrets manager
4. Run build command:
   - Next.js: `npm run build`
   - Vite: `npm run build`
   - Custom: user-defined command
5. Run post-build scripts (if configured)
6. Generate optimized build artifact (.tar.gz)
7. Calculate artifact size and checksum

**Phase 2: Upload**
1. Upload artifact to storage:
   - Supabase Storage (primary)
   - AWS S3 (enterprise)
2. Generate signed URL for deployment target
3. Log upload completion

**Phase 3: Deploy**
1. Send artifact to deployment target:
   - Vercel (primary)
   - Netlify (secondary)
   - Custom hosting (AWS, DigitalOcean, etc.)
2. Configure deployment settings:
   - Environment variables (injected from secrets)
   - Build command
   - Output directory
   - Node.js version
3. Wait for deployment to complete
4. Capture deployment URL

**Phase 4: Verification**
1. Run health checks on deployment URL:
   - HTTP 200 status check
   - Check for specific content (e.g., `<title>`)
   - Response time < 2s
2. Run smoke tests (optional):
   - Critical user flows
   - API endpoint checks
3. Update DNS records (if custom domain)
4. Verify SSL certificate
5. Log deployment record in database

**Phase 5: Monitoring**
1. Start uptime monitoring (ping every 5 min)
2. Enable error tracking (Sentry)
3. Collect Web Vitals (Vercel Analytics)
4. Send deployment notification to user

**Rollback Process:**
1. User triggers rollback from deployment history
2. Retrieve previous deployment artifact
3. Redeploy previous version
4. Run verification checks
5. Update deployment record with rollback status

#### Deployment Targets

**Vercel (Primary):**
- Use Vercel API for deployments
- Automatic SSL certificates
- Edge network distribution
- Git integration (optional)
- Environment variables via API

**Netlify (Secondary):**
- Use Netlify API for deployments
- Automatic SSL certificates
- CDN distribution
- Build hooks
- Split testing support (A/B testing)

**Custom Hosting (Enterprise):**
- AWS EC2 + Nginx
- DigitalOcean Droplets
- Google Cloud Run
- Kubernetes clusters
- Docker Compose setups

#### Domain Management

**Add Custom Domain:**
1. User enters domain name (e.g., `myapp.com`)
2. System generates DNS records:
   - A record: `myapp.com → 76.76.21.21` (Vercel IP)
   - CNAME: `www.myapp.com → cname.vercel-dns.com`
3. User adds DNS records to their provider
4. System verifies DNS propagation
5. Request SSL certificate from Let's Encrypt
6. Configure deployment to use custom domain
7. Update deployment record

**SSL/TLS Automation:**
- Automatic certificate issuance via Let's Encrypt
- Certificate auto-renewal (90 days before expiration)
- Support for wildcard certificates
- TLS 1.3 enforcement
- HTTPS redirect from HTTP

**DNS Verification:**
```typescript
async function verifyDNS(domain: string, expectedIP: string): Promise<boolean> {
  const records = await dns.resolve4(domain);
  return records.includes(expectedIP);
}
```

### 3.2 Technical Requirements

#### Deployment API

**Endpoints:**
```typescript
// POST /api/control-plane/deployments/trigger
interface TriggerDeploymentRequest {
  projectId: string;
  environment: 'preview' | 'production';
  target: 'vercel' | 'netlify' | 'custom';
  config: {
    buildCommand?: string;
    outputDirectory?: string;
    envVars?: string[]; // Secret IDs to inject
    customDomain?: string;
  };
}

interface TriggerDeploymentResponse {
  deploymentId: string;
  status: 'queued' | 'building' | 'deploying' | 'success' | 'failed';
  estimatedTime: number; // seconds
}

// GET /api/control-plane/deployments/:id/status
interface DeploymentStatus {
  deploymentId: string;
  projectId: string;
  status: 'queued' | 'building' | 'deploying' | 'success' | 'failed';
  progress: number; // 0-100
  logs: string[];
  deploymentURL?: string;
  customDomain?: string;
  startedAt: string;
  completedAt?: string;
  error?: string;
}

// POST /api/control-plane/deployments/:id/rollback
interface RollbackDeploymentRequest {
  targetDeploymentId: string; // Deployment to rollback to
}

// DELETE /api/control-plane/deployments/:id
// Deletes deployment and removes from hosting platform

// GET /api/control-plane/deployments
// List all deployments for a project (paginated)
interface ListDeploymentsResponse {
  deployments: DeploymentSummary[];
  total: number;
  page: number;
  perPage: number;
}
```

**Domain API:**
```typescript
// POST /api/control-plane/domains/add
interface AddDomainRequest {
  projectId: string;
  domain: string; // e.g., "myapp.com"
}

interface AddDomainResponse {
  domainId: string;
  domain: string;
  dnsRecords: {
    type: 'A' | 'CNAME';
    name: string;
    value: string;
  }[];
  verificationStatus: 'pending' | 'verified' | 'failed';
  sslStatus: 'pending' | 'active' | 'failed';
}

// GET /api/control-plane/domains/:id/verify-dns
// Checks if DNS records are correctly configured
interface VerifyDNSResponse {
  verified: boolean;
  records: {
    type: string;
    configured: boolean;
    expected: string;
    actual?: string;
  }[];
}

// DELETE /api/control-plane/domains/:id
// Removes custom domain from project

// GET /api/control-plane/domains
// List all domains for a project
```

#### External Integrations

**Vercel API:**
```typescript
// Vercel deployment creation
async function deployToVercel(
  artifact: Buffer,
  config: VercelConfig
): Promise<VercelDeployment> {
  const response = await fetch('https://api.vercel.com/v13/deployments', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.VERCEL_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: config.projectName,
      files: config.files,
      projectSettings: {
        buildCommand: config.buildCommand,
        outputDirectory: config.outputDirectory,
        framework: config.framework, // 'nextjs', 'vite', etc.
      },
      env: config.envVars,
      target: config.environment, // 'preview' or 'production'
    }),
  });
  
  return response.json();
}
```

**Cloudflare API (for DNS):**
```typescript
// Add DNS record
async function addDNSRecord(
  domain: string,
  type: 'A' | 'CNAME',
  name: string,
  value: string
): Promise<void> {
  const zoneId = await getCloudflareZoneId(domain);
  
  await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.CLOUDFLARE_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type,
      name,
      content: value,
      ttl: 3600,
      proxied: true, // Enable Cloudflare proxy
    }),
  });
}
```

**Let's Encrypt (via ACME client):**
```typescript
// Request SSL certificate
async function requestSSLCertificate(domain: string): Promise<Certificate> {
  const acme = new ACME.Client({
    directoryUrl: ACME.directory.letsencrypt.production,
    accountKey: await loadAccountKey(),
  });
  
  const [key, csr] = await ACME.crypto.createCsr({
    commonName: domain,
    altNames: [`www.${domain}`],
  });
  
  const cert = await acme.auto({
    csr,
    email: process.env.ACME_EMAIL,
    termsOfServiceAgreed: true,
    challengeCreateFn: async (authz, challenge, keyAuthorization) => {
      // DNS-01 challenge: add TXT record
      await addDNSRecord(
        domain,
        'TXT',
        `_acme-challenge.${domain}`,
        keyAuthorization
      );
    },
    challengeRemoveFn: async (authz, challenge, keyAuthorization) => {
      // Remove TXT record after verification
      await removeDNSRecord(domain, `_acme-challenge.${domain}`);
    },
  });
  
  return { privateKey: key, certificate: cert };
}
```

#### CI/CD Pipeline

**GitHub Actions Workflow:**
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm test
        
      - name: Build project
        run: npm run build
        env:
          # Inject secrets from GitHub Secrets
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          API_KEY: ${{ secrets.API_KEY }}
          
      - name: Deploy to Vercel
        run: |
          npm i -g vercel
          vercel deploy --prod --token=${{ secrets.VERCEL_TOKEN }}
          
      - name: Run smoke tests
        run: npm run test:smoke
        
      - name: Notify deployment
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### 3.3 UI/UX Requirements

#### Deployment Dashboard

**Layout:**
- Deployment history table with columns:
  - Status (icon + text)
  - Environment (preview/production)
  - Deployment URL
  - Deployed by (user)
  - Deployed at (timestamp)
  - Duration
  - Actions (rollback, delete)
  
- Filters:
  - Environment (all, preview, production)
  - Status (all, success, failed)
  - Date range

**Deployment Detail View:**
- Deployment metadata (ID, environment, target)
- Build logs (collapsible sections)
- Deployment URL with copy button
- Custom domain configuration (if applicable)
- SSL certificate status
- Environment variables used (names only, no values)
- Rollback button with confirmation modal
- Delete button with confirmation modal

**Deploy Now Flow:**
1. User clicks "Deploy Now" in Studio
2. Modal opens with deployment configuration:
   - Environment: Preview or Production (radio buttons)
   - Target: Vercel, Netlify, or Custom (dropdown)
   - Build command (auto-detected, editable)
   - Output directory (auto-detected, editable)
   - Environment variables (checkboxes to select secrets)
   - Custom domain (optional, text input)
3. User clicks "Deploy"
4. Modal transitions to progress view:
   - Step-by-step progress (building, uploading, deploying)
   - Real-time logs streaming
   - Cancel button (if before deploying)
5. On success:
   - Show deployment URL with "Open" button
   - Show custom domain status (if configured)
   - "View Deployment" button to detail view
6. On failure:
   - Show error message
   - Show logs at point of failure
   - "Retry" button
   - "Get Help" button (link to docs/support)

**Domain Management UI:**
- Add domain button
- Domain list with status indicators:
  - DNS verification: pending (yellow), verified (green), failed (red)
  - SSL status: pending (yellow), active (green), failed (red)
- Instructions panel:
  - DNS records to add
  - Copy buttons for each record
  - "Verify DNS" button to check configuration
- Remove domain button with confirmation

**Real-time Updates:**
- Deployment status updates every 2 seconds (polling or WebSocket)
- Progress bar animation
- Log streaming (append new lines without flickering)
- Toast notifications on completion

### 3.4 Security Requirements

#### Secrets Management
- ❌ Secrets injected server-side only
- Environment variables encrypted at rest (AES-256-GCM)
- Secrets never included in build artifact source code
- Deployment credentials secured in Secrets Manager
- API tokens rotated every 90 days

#### Audit Logging
- Log all deployment actions:
  - User who triggered deployment
  - Timestamp
  - Project ID
  - Environment (preview/production)
  - Target platform
  - Success/failure status
  - Duration
  - Artifact checksum
  
**Example audit log entry:**
```json
{
  "eventType": "deployment.triggered",
  "userId": "user_123",
  "projectId": "proj_456",
  "deploymentId": "deploy_789",
  "environment": "production",
  "target": "vercel",
  "timestamp": "2026-02-19T10:30:00Z",
  "metadata": {
    "buildCommand": "npm run build",
    "artifactSize": 15728640,
    "artifactChecksum": "sha256:abc123..."
  }
}
```

#### Deployment Security
- Signed deployment artifacts (prevent tampering)
- HTTPS-only for deployment URLs
- SSL/TLS mandatory for production
- Domain ownership verification (DNS challenge)
- Rate limiting on deployment triggers (10/hour per project)
- Malware scanning of uploaded files (ClamAV)

#### Access Control
- Only project owners and admins can trigger production deployments
- Team members can trigger preview deployments
- Viewers can only view deployment history
- API endpoints protected by JWT authentication
- RBAC enforced at database level (Row-Level Security)

### 3.5 Performance Requirements

#### Build Performance
- Build process: < 5 minutes for typical app
- Build process: < 10 minutes for large app (1000+ files)
- Build artifact generation: < 1 minute
- Build artifact compression: < 30 seconds

#### Upload Performance
- Upload to Supabase Storage: < 2 minutes for 50MB artifact
- Upload to AWS S3: < 1 minute for 50MB artifact
- Parallel upload chunks for large files (> 10MB)

#### Deployment Performance
- Vercel deployment: < 3 minutes from upload to live
- Netlify deployment: < 5 minutes from upload to live
- Health check: < 30 seconds after deployment complete
- DNS update propagation: < 5 minutes (depends on TTL)

#### Rollback Performance
- Rollback execution: < 1 minute
- Verification: < 30 seconds

#### Scalability
- Support 100+ simultaneous deployments across platform
- Handle 1000+ deployments per day per project
- Store 10,000+ deployment records per project (paginated API)

### 3.6 Integration Points with CubiQo Infrastructure

#### Supabase
- Store deployment records in `emergent_deployments` table
- Store domain records in `emergent_domains` table
- Store build artifacts in Supabase Storage
- Log deployment events in `emergent_audit_log`

#### Runner System
- Trigger builds in workspace containers
- Execute build commands via terminal
- Retrieve build artifacts from workspace filesystem

#### Control Plane
- Orchestrate deployment pipeline
- Manage deployment lifecycle
- Send deployment notifications to users

#### Orchestrator
- Use Code Agent for build script generation
- Use Testing Agent for smoke tests
- Use Integration Agent for deployment platform APIs

#### Existing Infrastructure
- Use existing Vercel account for primary deployments
- Integrate with existing Supabase project
- Use existing Redis for rate limiting and caching
- Use existing PostHog for deployment analytics

---

## 4. POST-LAUNCH OS (Analytics, SEO, Commerce Ops)

### 4.1 Functional Requirements

#### 4.1.1 Analytics System

**Event Tracking:**

**Core Events:**
- Page views: track every page load
- User sessions: identify unique users and sessions
- Button clicks: track all CTA interactions
- Form submissions: track conversions
- API calls: track backend interactions
- Errors: track client-side errors

**Custom Events:**
```typescript
// Example: Track product purchase
trackEvent('product.purchased', {
  productId: 'prod_123',
  productName: 'Succulent Plant',
  price: 29.99,
  currency: 'USD',
  quantity: 2,
});

// Example: Track user signup
trackEvent('user.signup', {
  method: 'email',
  plan: 'pro',
});
```

**User Identification:**
- Anonymous tracking (via session ID)
- Authenticated user tracking (via user ID)
- User properties (email, name, plan, etc.)
- Device fingerprinting for cross-session tracking

**Session Tracking:**
- Session duration
- Pages per session
- Bounce rate
- Exit pages
- Traffic sources (referrer, UTM parameters)

**Conversion Funnels:**
- Define multi-step funnels (e.g., Home → Product → Checkout → Success)
- Track drop-off rates at each step
- Calculate conversion rates
- A/B test optimization

**Dashboards:**

**Real-time Dashboard:**
- Live visitor count
- Active pages (currently viewed)
- Top events (last 5 minutes)
- Geographic distribution (world map)
- Device breakdown (mobile, desktop, tablet)

**Analytics Dashboard:**
- Time range selector (24h, 7d, 30d, custom)
- Key metrics cards:
  - Total visitors
  - Page views
  - Bounce rate
  - Average session duration
  - Conversion rate
- Traffic trends chart (line graph)
- Top pages table (path, views, unique visitors, avg time)
- Traffic sources pie chart (direct, referral, social, search)
- User cohorts table (week, active users, retention rate)

**Custom Reports:**
- Query builder for custom metrics
- Export to CSV, PDF
- Schedule email reports (daily, weekly, monthly)
- Share reports with team members

**Data Retention:**
- Raw events: 90 days
- Aggregated data: 2 years
- GDPR-compliant deletion on user request

#### 4.1.2 Performance Monitoring

**Uptime Monitoring:**
- HTTP ping every 5 minutes
- Check for 200 status code
- Alert on downtime (email, Slack, SMS)
- Uptime percentage (30-day, 90-day)
- Incident history log

**Response Time Tracking:**
- Measure full page load time
- Track API endpoint latency
- Database query performance
- Third-party API response times
- Historical trends chart

**Web Vitals:**
- **Largest Contentful Paint (LCP):** < 2.5s (good)
- **First Input Delay (FID):** < 100ms (good)
- **Cumulative Layout Shift (CLS):** < 0.1 (good)
- Track per page
- Monitor trends over time
- Alert on regressions

**Error Monitoring:**
- JavaScript errors (uncaught exceptions)
- API errors (4xx, 5xx responses)
- Network errors (timeouts, connection refused)
- Error rate per page
- Error grouping (same error across users)
- Stack traces for debugging

**Performance Score:**
- Aggregate score (0-100) based on metrics
- Lighthouse score integration
- PageSpeed Insights integration
- Recommendations for improvement

#### 4.1.3 SEO Tooling

**Metadata Management:**

**Per-Page Settings:**
- Title (max 60 characters)
- Meta description (max 160 characters)
- Open Graph tags (og:title, og:description, og:image)
- Twitter Card tags (twitter:title, twitter:description, twitter:image)
- Canonical URL
- Robots meta tag (index/noindex, follow/nofollow)

**UI:**
- Page list with SEO status indicators (complete, incomplete, issues)
- Inline editor for each metadata field
- Character count indicators
- Preview cards (Google SERP, Facebook, Twitter)
- Bulk edit mode

**Sitemap Generation:**
- Automatic sitemap.xml generation
- Crawl site to discover pages
- Priority and change frequency per page
- Submit to Google Search Console
- Update on content changes

**Robots.txt Management:**
- Editor for robots.txt file
- Syntax validation
- Common presets (allow all, disallow all, etc.)
- Test tool (check if URL is allowed)

**Schema.org Markup:**
- Generate JSON-LD structured data
- Support common schemas:
  - WebPage
  - Article
  - Product
  - Organization
  - LocalBusiness
  - FAQ
  - Review
- Validate schema with Google's Rich Results Test

**SEO Audit:**

**Technical SEO Checks:**
- [x] HTTPS enabled
- [x] XML sitemap present
- [x] Robots.txt present
- [x] Canonical tags set
- [x] Meta tags complete
- [x] Images have alt text
- [x] Headings hierarchy (H1, H2, H3)
- [x] Mobile-friendly (responsive design)
- [x] Page speed score > 80
- [x] No broken links (404 errors)

**On-Page SEO:**
- Title tag optimization (keyword in title)
- Meta description optimization (keyword in description)
- URL structure (short, descriptive URLs)
- Internal linking (link to related pages)
- Content length (> 300 words per page)
- Keyword density (2-3% target keyword)

**Audit Report:**
- Score (0-100)
- Issues grouped by severity (critical, warning, info)
- Recommendations with actionable steps
- Comparison over time (track improvements)

**Keyword Tracking:**
- Track target keywords per page
- Monitor search rankings (via Google Search Console API)
- Track organic traffic per keyword
- Competitor analysis (future feature)

#### 4.1.4 Commerce Operations

**Order Management:**

**Order Lifecycle:**
```
[Created] → [Paid] → [Processing] → [Fulfilled] → [Delivered]
              ↓            ↓              ↓
          [Refunded]  [Cancelled]   [Returned]
```

**Order Details:**
- Order number (unique)
- Customer information (name, email, shipping address)
- Line items (product, quantity, price)
- Subtotal, tax, shipping, total
- Payment method and status
- Fulfillment status
- Tracking number
- Order notes (internal)

**Order Operations:**
- Create order (manual or API)
- Update order status
- Add/remove line items
- Apply discount codes
- Process refund (full or partial)
- Cancel order
- Send order confirmation email
- Send shipping notification email

**Customer Management:**
- Customer list with filters (total orders, lifetime value)
- Customer detail view (order history, contact info)
- Customer notes (internal)
- Customer tags (VIP, wholesale, etc.)
- Email marketing opt-in status

**Inventory Management:**

**Product Catalog:**
- Product list with stock levels
- Product variants (size, color, etc.)
- SKU (stock keeping unit)
- Price and cost (for profit calculation)
- Images (multiple per product)
- Product tags and categories

**Stock Tracking:**
- Current stock level
- Low stock threshold (alert when below)
- Out of stock indicator
- Stock adjustment log (manual add/remove)
- Automatic stock decrease on order

**Inventory Sync:**
- Sync from Shopify via API
- Sync from Printify via API
- Scheduled sync (every hour)
- Manual sync trigger

**Reporting:**

**Sales Dashboard:**
- Date range selector
- Key metrics cards:
  - Total revenue
  - Total orders
  - Average order value
  - Top products (by revenue)
  - Top customers (by lifetime value)
- Revenue trends chart (line graph, bar chart)
- Orders by status pie chart

**Product Performance:**
- Products ranked by revenue
- Products ranked by units sold
- Products ranked by profit margin
- Conversion rate per product
- Abandoned cart rate

**Customer Insights:**
- New vs returning customers
- Customer lifetime value distribution
- Customer acquisition cost
- Customer churn rate
- Cohort analysis

**Fulfillment Operations:**

**Order Fulfillment:**
- Mark order as fulfilled
- Add tracking number
- Generate packing slip
- Send shipping notification email

**Shipping Integrations:**
- USPS, UPS, FedEx rate calculation
- Print shipping labels
- Track shipments
- Bulk fulfillment (process multiple orders)

**Returns/Refunds:**
- Create return request
- Process refund (full or partial)
- Restock returned items
- Track return reasons

**Printify Integration (Print-on-Demand):**
- Sync products from Printify catalog
- Automatic order forwarding to Printify
- Fulfillment status updates via webhooks
- Tracking number updates

**Shopify Integration (E-commerce Platform):**
- Sync products, orders, inventory from Shopify
- Two-way sync (CubiQo ↔ Shopify)
- Webhook listeners for real-time updates
- OAuth authentication

### 4.2 Technical Requirements

#### 4.2.1 Database Schema

**Analytics Tables:**
```sql
-- Analytics Events
CREATE TABLE emergent_analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES emergent_projects(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB,
  user_id TEXT, -- Anonymous or authenticated user ID
  session_id TEXT NOT NULL,
  page_path TEXT,
  referrer TEXT,
  user_agent TEXT,
  ip_address INET,
  country TEXT,
  city TEXT,
  device_type TEXT, -- 'mobile', 'tablet', 'desktop'
  browser TEXT,
  os TEXT,
  event_time TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  INDEX idx_project_event_time (project_id, event_time),
  INDEX idx_session (session_id),
  INDEX idx_event_type (event_type)
);

-- Aggregated Analytics (hourly rollups for performance)
CREATE TABLE emergent_analytics_hourly (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES emergent_projects(id) ON DELETE CASCADE,
  hour TIMESTAMP NOT NULL, -- Truncated to hour
  page_views INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  bounce_rate NUMERIC(5,2),
  avg_session_duration INTEGER, -- seconds
  total_events INTEGER DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, hour)
);

-- User Sessions
CREATE TABLE emergent_analytics_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES emergent_projects(id) ON DELETE CASCADE,
  session_id TEXT UNIQUE NOT NULL,
  user_id TEXT,
  started_at TIMESTAMP NOT NULL,
  ended_at TIMESTAMP,
  duration INTEGER, -- seconds
  page_views INTEGER DEFAULT 0,
  events INTEGER DEFAULT 0,
  traffic_source TEXT, -- 'direct', 'referral', 'social', 'search'
  referrer TEXT,
  landing_page TEXT,
  exit_page TEXT,
  device_type TEXT,
  country TEXT,
  INDEX idx_project_session (project_id, started_at)
);
```

**Performance Monitoring Tables:**
```sql
-- Uptime Checks
CREATE TABLE emergent_uptime_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES emergent_projects(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  status_code INTEGER,
  response_time INTEGER, -- milliseconds
  success BOOLEAN NOT NULL,
  error_message TEXT,
  checked_at TIMESTAMP NOT NULL DEFAULT NOW(),
  INDEX idx_project_checked (project_id, checked_at)
);

-- Error Logs
CREATE TABLE emergent_error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES emergent_projects(id) ON DELETE CASCADE,
  error_type TEXT NOT NULL, -- 'javascript', 'api', 'network'
  error_message TEXT NOT NULL,
  stack_trace TEXT,
  page_path TEXT,
  user_id TEXT,
  session_id TEXT,
  user_agent TEXT,
  count INTEGER DEFAULT 1, -- Number of occurrences
  first_seen TIMESTAMP NOT NULL DEFAULT NOW(),
  last_seen TIMESTAMP NOT NULL DEFAULT NOW(),
  INDEX idx_project_error (project_id, first_seen)
);

-- Web Vitals
CREATE TABLE emergent_web_vitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES emergent_projects(id) ON DELETE CASCADE,
  page_path TEXT NOT NULL,
  lcp NUMERIC(10,2), -- Largest Contentful Paint (ms)
  fid NUMERIC(10,2), -- First Input Delay (ms)
  cls NUMERIC(10,4), -- Cumulative Layout Shift
  ttfb NUMERIC(10,2), -- Time to First Byte (ms)
  measured_at TIMESTAMP NOT NULL DEFAULT NOW(),
  INDEX idx_project_page_vitals (project_id, page_path, measured_at)
);
```

**SEO Tables:**
```sql
-- SEO Metadata (already exists in emergent_seo_metadata from previous migration)

-- SEO Audit Results
CREATE TABLE emergent_seo_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES emergent_projects(id) ON DELETE CASCADE,
  score INTEGER NOT NULL, -- 0-100
  issues JSONB NOT NULL, -- Array of {severity, category, message, recommendation}
  pages_checked INTEGER,
  audited_at TIMESTAMP NOT NULL DEFAULT NOW(),
  INDEX idx_project_audited (project_id, audited_at)
);

-- Keyword Rankings (future)
CREATE TABLE emergent_keyword_rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES emergent_projects(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  page_path TEXT NOT NULL,
  ranking INTEGER, -- Position in search results (1-100)
  search_volume INTEGER, -- Monthly search volume
  checked_at TIMESTAMP NOT NULL DEFAULT NOW(),
  INDEX idx_project_keyword (project_id, keyword, checked_at)
);
```

**Commerce Tables:**
```sql
-- Orders (already exists in emergent_commerce_orders from previous migration)

-- Customers
CREATE TABLE emergent_commerce_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES emergent_projects(id) ON DELETE CASCADE,
  external_id TEXT, -- ID from external system (Shopify, Stripe)
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  total_orders INTEGER DEFAULT 0,
  lifetime_value NUMERIC(10,2) DEFAULT 0,
  tags TEXT[], -- ['VIP', 'wholesale', etc.]
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, email),
  INDEX idx_project_customer (project_id, email)
);

-- Products
CREATE TABLE emergent_commerce_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES emergent_projects(id) ON DELETE CASCADE,
  external_id TEXT, -- ID from external system (Shopify, Printify)
  name TEXT NOT NULL,
  description TEXT,
  sku TEXT,
  price NUMERIC(10,2) NOT NULL,
  cost NUMERIC(10,2), -- For profit calculation
  stock_level INTEGER DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 10,
  images TEXT[], -- Array of image URLs
  tags TEXT[],
  category TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  INDEX idx_project_product (project_id, name)
);

-- Inventory Adjustments Log
CREATE TABLE emergent_inventory_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES emergent_commerce_products(id) ON DELETE CASCADE,
  adjustment INTEGER NOT NULL, -- Positive or negative
  reason TEXT NOT NULL, -- 'sale', 'restock', 'return', 'correction'
  reference_id TEXT, -- Order ID, return ID, etc.
  adjusted_by UUID REFERENCES auth.users(id),
  adjusted_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

#### 4.2.2 External Integrations

**PostHog (Analytics):**
```typescript
// Initialize PostHog SDK
import posthog from 'posthog-js';

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  api_host: 'https://app.posthog.com',
  capture_pageview: true,
  capture_pageleave: true,
});

// Track custom event
posthog.capture('product_purchased', {
  productId: 'prod_123',
  price: 29.99,
});

// Identify user
posthog.identify('user_123', {
  email: 'user@example.com',
  plan: 'pro',
});
```

**Sentry (Error Tracking):**
```typescript
// Initialize Sentry SDK
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});

// Capture error
Sentry.captureException(error, {
  tags: { page: '/product/123' },
  user: { id: 'user_123' },
});
```

**Vercel Analytics (Web Vitals):**
```typescript
// pages/_app.tsx
import { Analytics } from '@vercel/analytics/react';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <Analytics />
    </>
  );
}
```

**UptimeRobot (Uptime Monitoring):**
```typescript
// Create monitor via API
async function createUptimeMonitor(url: string): Promise<string> {
  const response = await fetch('https://api.uptimerobot.com/v2/newMonitor', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: process.env.UPTIMEROBOT_API_KEY,
      format: 'json',
      type: 1, // HTTP(s)
      url: url,
      friendly_name: `Project ${projectId}`,
      interval: 300, // 5 minutes
    }),
  });
  
  const data = await response.json();
  return data.monitor.id;
}
```

**Shopify API:**
```typescript
// Sync orders from Shopify
async function syncShopifyOrders(projectId: string): Promise<void> {
  const config = await getIntegrationConfig(projectId, 'shopify');
  
  const response = await fetch(
    `https://${config.shopUrl}/admin/api/2024-01/orders.json`,
    {
      headers: {
        'X-Shopify-Access-Token': config.accessToken,
      },
    }
  );
  
  const data = await response.json();
  
  for (const order of data.orders) {
    await upsertOrder({
      projectId,
      externalId: order.id,
      customerEmail: order.customer.email,
      totalPrice: order.total_price,
      status: order.fulfillment_status || 'unfulfilled',
      lineItems: order.line_items.map(item => ({
        productName: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
    });
  }
}
```

**Printify API:**
```typescript
// Sync products from Printify
async function syncPrintifyProducts(projectId: string): Promise<void> {
  const config = await getIntegrationConfig(projectId, 'printify');
  
  const response = await fetch(
    `https://api.printify.com/v1/shops/${config.shopId}/products.json`,
    {
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
      },
    }
  );
  
  const data = await response.json();
  
  for (const product of data.data) {
    await upsertProduct({
      projectId,
      externalId: product.id,
      name: product.title,
      description: product.description,
      price: product.variants[0].price / 100, // Convert cents to dollars
      images: product.images.map(img => img.src),
    });
  }
}

// Forward order to Printify
async function createPrintifyOrder(orderId: string): Promise<void> {
  const order = await getOrder(orderId);
  const config = await getIntegrationConfig(order.projectId, 'printify');
  
  await fetch(
    `https://api.printify.com/v1/shops/${config.shopId}/orders.json`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        external_id: order.id,
        line_items: order.lineItems.map(item => ({
          product_id: item.externalProductId,
          variant_id: item.externalVariantId,
          quantity: item.quantity,
        })),
        shipping_method: 1, // Standard
        address_to: order.shippingAddress,
      }),
    }
  );
}
```

#### 4.2.3 APIs

**Analytics API:**
```typescript
// GET /api/control-plane/analytics/:projectId/overview
interface AnalyticsOverviewResponse {
  dateRange: { start: string; end: string };
  metrics: {
    totalVisitors: number;
    pageViews: number;
    bounceRate: number; // percentage
    avgSessionDuration: number; // seconds
    conversionRate: number; // percentage
  };
  trends: {
    date: string;
    visitors: number;
    pageViews: number;
  }[];
  topPages: {
    path: string;
    views: number;
    uniqueVisitors: number;
    avgTime: number; // seconds
  }[];
  trafficSources: {
    source: string; // 'direct', 'referral', 'social', 'search'
    visitors: number;
    percentage: number;
  }[];
}

// GET /api/control-plane/analytics/:projectId/realtime
interface RealtimeAnalyticsResponse {
  activeVisitors: number;
  activePages: {
    path: string;
    visitors: number;
  }[];
  recentEvents: {
    eventType: string;
    timestamp: string;
    page: string;
  }[];
  geoDistribution: {
    country: string;
    visitors: number;
  }[];
}

// POST /api/control-plane/analytics/:projectId/track
interface TrackEventRequest {
  eventType: string;
  eventData?: Record<string, any>;
  userId?: string;
  sessionId: string;
  pagePath: string;
  referrer?: string;
}

// GET /api/control-plane/analytics/:projectId/export
// Export analytics data to CSV
```

**Performance Monitoring API:**
```typescript
// GET /api/control-plane/monitoring/:projectId/uptime
interface UptimeResponse {
  uptime: number; // percentage (0-100)
  checks: {
    timestamp: string;
    success: boolean;
    responseTime: number; // ms
  }[];
  incidents: {
    startedAt: string;
    endedAt?: string;
    duration: number; // minutes
  }[];
}

// GET /api/control-plane/monitoring/:projectId/errors
interface ErrorsResponse {
  totalErrors: number;
  errorRate: number; // errors per 1000 requests
  groupedErrors: {
    message: string;
    count: number;
    firstSeen: string;
    lastSeen: string;
    stackTrace: string;
  }[];
}

// GET /api/control-plane/monitoring/:projectId/performance
interface PerformanceResponse {
  avgResponseTime: number; // ms
  p50ResponseTime: number; // ms
  p95ResponseTime: number; // ms
  p99ResponseTime: number; // ms
  webVitals: {
    lcp: { avg: number; p75: number }; // ms
    fid: { avg: number; p75: number }; // ms
    cls: { avg: number; p75: number };
  };
}
```

**SEO API:**
```typescript
// GET /api/control-plane/seo/:projectId/metadata
interface SEOMetadataListResponse {
  pages: {
    id: string;
    pagePath: string;
    title: string;
    description: string;
    ogImage?: string;
    status: 'complete' | 'incomplete' | 'issues';
    issues: string[];
  }[];
}

// PUT /api/control-plane/seo/:projectId/metadata/:pageId
interface UpdateSEOMetadataRequest {
  title: string;
  description: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  canonicalUrl?: string;
  robotsMeta?: string; // 'index,follow' or 'noindex,nofollow'
}

// POST /api/control-plane/seo/:projectId/sitemap/generate
// Generates sitemap.xml

// POST /api/control-plane/seo/:projectId/audit
interface SEOAuditResponse {
  score: number; // 0-100
  issues: {
    severity: 'critical' | 'warning' | 'info';
    category: string;
    message: string;
    recommendation: string;
    pages: string[];
  }[];
  pagesChecked: number;
}
```

**Commerce API:**
```typescript
// GET /api/control-plane/commerce/:projectId/orders
interface ListOrdersResponse {
  orders: {
    id: string;
    orderNumber: string;
    customerEmail: string;
    totalPrice: number;
    status: string;
    createdAt: string;
  }[];
  total: number;
  page: number;
  perPage: number;
}

// POST /api/control-plane/commerce/:projectId/orders
interface CreateOrderRequest {
  customerEmail: string;
  lineItems: {
    productId: string;
    quantity: number;
    price: number;
  }[];
  shippingAddress: {
    name: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  paymentMethod: string;
}

// PUT /api/control-plane/commerce/:projectId/orders/:orderId/fulfill
interface FulfillOrderRequest {
  trackingNumber: string;
  trackingUrl?: string;
  carrier?: string;
}

// POST /api/control-plane/commerce/:projectId/orders/:orderId/refund
interface RefundOrderRequest {
  amount: number; // Partial or full refund
  reason: string;
}

// GET /api/control-plane/commerce/:projectId/dashboard
interface CommerceDashboardResponse {
  dateRange: { start: string; end: string };
  metrics: {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    conversionRate: number;
  };
  trends: {
    date: string;
    revenue: number;
    orders: number;
  }[];
  topProducts: {
    id: string;
    name: string;
    revenue: number;
    unitsSold: number;
  }[];
  topCustomers: {
    id: string;
    email: string;
    lifetimeValue: number;
    totalOrders: number;
  }[];
}

// POST /api/control-plane/commerce/:projectId/sync/shopify
// Sync orders and products from Shopify

// POST /api/control-plane/commerce/:projectId/sync/printify
// Sync products from Printify
```

### 4.3 UI/UX Requirements

#### Analytics Dashboard

**Layout:**
- Top navigation: Analytics, Performance, SEO, Commerce tabs
- Date range picker (top right)
- Key metrics cards (4 across):
  - Total Visitors (with trend indicator)
  - Page Views (with trend indicator)
  - Bounce Rate (with trend indicator)
  - Avg Session Duration (with trend indicator)
- Traffic trends chart (line graph, weekly/daily toggle)
- Two-column layout below:
  - Left: Top Pages table
  - Right: Traffic Sources pie chart
- User cohorts table (bottom)

**Interactions:**
- Hover on charts shows tooltips with exact values
- Click on metric cards opens detailed view
- Click on page in table opens page-specific analytics
- Export button (CSV, PDF) in top right

#### Performance Monitoring Dashboard

**Layout:**
- Uptime status (large percentage, green/yellow/red)
- Uptime chart (last 30 days, green=up, red=down)
- Response time chart (p50, p95, p99 lines)
- Web Vitals cards (LCP, FID, CLS with score indicators)
- Error list table (grouped by error type)

**Interactions:**
- Click on uptime incident shows details (start time, duration, error message)
- Click on error row expands to show stack trace
- Real-time updates (poll every 30 seconds)

#### SEO Dashboard

**Layout:**
- SEO score (large number, 0-100, color-coded)
- Issues list (grouped by severity: critical, warning, info)
- Pages table with SEO status column
- Sitemap and robots.txt status indicators

**Interactions:**
- Click "Fix" button on issue opens help modal with instructions
- Click page row opens metadata editor
- Preview button shows SERP preview (Google, Facebook, Twitter)
- Run audit button triggers SEO audit
- Download sitemap button

#### Commerce Dashboard

**Layout:**
- Revenue, orders, AOV, conversion rate cards
- Revenue trends chart (bar chart, daily/weekly/monthly toggle)
- Orders by status pie chart
- Top products table (product, revenue, units sold, profit margin)
- Recent orders list (customer, total, status, date)

**Interactions:**
- Click order row opens order detail view
- Click product row opens product detail view
- "Fulfill Order" button opens fulfillment modal
- "Refund" button opens refund modal with amount input
- "Sync Shopify" button triggers sync
- "Sync Printify" button triggers sync

### 4.4 Security Requirements

#### Data Security
- Sensitive order data encrypted at rest (credit card data never stored)
- Customer PII encrypted (email, phone, address)
- Analytics data anonymized (IP addresses hashed)
- GDPR-compliant data retention policies:
  - Raw analytics events: 90 days
  - Aggregated analytics: 2 years
  - Delete user data on request within 30 days

#### API Security
- JWT authentication on all endpoints
- Rate limiting:
  - Analytics tracking: 1000 events/minute per project
  - Dashboard queries: 100 requests/minute per user
  - Data export: 10 requests/hour per user
- API keys for external integrations rotated every 90 days

#### Webhook Security
- Verify webhook signatures from external services:
  - Shopify: `X-Shopify-Hmac-SHA256` header
  - Printify: `X-Printify-Signature` header
- Use HTTPS for all webhook endpoints
- Implement idempotency (handle duplicate webhooks)

#### Access Control
- RBAC enforced at database level (Row-Level Security)
- Project owners can view all analytics
- Team members can view limited analytics (no customer PII)
- Viewers can view aggregate data only

### 4.5 Performance Requirements

#### Analytics Ingestion
- Event ingestion: < 100ms per event
- Batch event ingestion: 10,000 events/second
- Dashboard query response: < 500ms
- Real-time dashboard updates: < 1s latency

#### Database Performance
- Support 10M+ analytics events per project
- Aggregation queries on 1-year history: < 2s
- Hourly rollup generation: < 5 minutes
- Uptime check insertion: < 50ms

#### Dashboard Load Times
- Initial dashboard load: < 2 seconds
- Chart rendering: < 500ms
- Data export (CSV): < 10 seconds for 1M rows

#### Scalability
- Support 1000+ projects
- Handle 1B+ analytics events across platform
- 10,000+ concurrent dashboard users

### 4.6 Integration Points with CubiQo Infrastructure

#### Supabase
- Store all analytics, performance, SEO, commerce data
- Use existing RLS policies for access control
- Use Supabase Realtime for live dashboard updates

#### PostHog
- Use PostHog SDK in deployed apps for event tracking
- Sync PostHog data to CubiQo database for unified view

#### Sentry
- Aggregate error data from Sentry API
- Display in CubiQo dashboard

#### Vercel Analytics
- Fetch Web Vitals from Vercel API
- Display in Performance Monitoring dashboard

#### Shopify & Printify
- Sync orders, products, inventory via APIs
- Handle webhooks for real-time updates

#### Control Plane
- Use existing project and user authentication
- Share secrets manager for API keys

#### Orchestrator
- Use SEO Agent for schema.org markup generation
- Use Analytics Agent for custom report generation

---

## 5. IMPLEMENTATION ROADMAP

### Phase 1: MVP (Months 1-3)

**Priority: High**

**Frontend Studio UI:**
- [ ] Basic conversation interface
- [ ] Monaco code editor integration
- [ ] File explorer (read-only)
- [ ] Terminal emulator (Xterm.js)
- [ ] Live preview panel
- [ ] Deployment trigger button

**Runner System:**
- [ ] Docker container creation
- [ ] Basic terminal PTY support
- [ ] Dev server auto-start (Node.js only)
- [ ] Preview URL generation (Nginx routing)
- [ ] Resource limits enforcement

**Deployment Flow:**
- [ ] Vercel deployment integration
- [ ] Build artifact generation
- [ ] Environment variable injection
- [ ] Basic deployment history
- [ ] Rollback support

**Post-Launch OS:**
- [ ] Basic analytics (page views, visitors)
- [ ] Uptime monitoring
- [ ] Error logging
- [ ] Simple analytics dashboard

**Estimated Effort:** 12 weeks, 3-4 developers

---

### Phase 2: Enhancement (Months 4-6)

**Priority: Medium**

**Frontend Studio UI:**
- [ ] Voice input/output integration
- [ ] File create/edit/delete operations
- [ ] Multi-file editing with tabs
- [ ] Secrets management UI
- [ ] Team collaboration features (cursors)
- [ ] Keyboard shortcuts

**Runner System:**
- [ ] Multi-language support (Python, PHP, Ruby, Go)
- [ ] Multiple terminal sessions
- [ ] Process management (kill, restart)
- [ ] Storage snapshots and backups
- [ ] Resource monitoring dashboard

**Deployment Flow:**
- [ ] Netlify integration
- [ ] Custom hosting targets
- [ ] Custom domain management
- [ ] SSL/TLS automation
- [ ] CD pipeline (GitHub Actions)
- [ ] Smoke tests post-deployment

**Post-Launch OS:**
- [ ] Custom event tracking
- [ ] Conversion funnels
- [ ] User cohort analysis
- [ ] SEO metadata management
- [ ] Sitemap generation
- [ ] Basic commerce (order list, fulfillment)

**Estimated Effort:** 12 weeks, 4-5 developers

---

### Phase 3: Scale (Months 7-9)

**Priority: Medium**

**Frontend Studio UI:**
- [ ] 3D visual feedback (Three.js)
- [ ] Real-time collaboration (multiplayer)
- [ ] AI code suggestions
- [ ] Template marketplace
- [ ] Plugin system

**Runner System:**
- [ ] Kubernetes orchestration
- [ ] Auto-scaling based on demand
- [ ] Multi-region deployment
- [ ] High availability setup
- [ ] Advanced networking (VPC, subnets)

**Deployment Flow:**
- [ ] Multi-environment support (dev, staging, prod)
- [ ] Blue-green deployments
- [ ] Canary deployments
- [ ] A/B testing infrastructure
- [ ] Deployment rollback automation

**Post-Launch OS:**
- [ ] Advanced analytics (cohorts, retention)
- [ ] Custom report builder
- [ ] SEO audit automation
- [ ] Keyword tracking
- [ ] Full commerce ops (inventory, refunds, shipping)
- [ ] Shopify/Printify sync

**Estimated Effort:** 12 weeks, 5-6 developers

---

### Phase 4: Enterprise (Months 10-12)

**Priority: Low**

**Frontend Studio UI:**
- [ ] White-label customization
- [ ] SAML/SSO authentication
- [ ] Audit log viewer
- [ ] Advanced permissions

**Runner System:**
- [ ] Self-hosted option
- [ ] Air-gapped deployments
- [ ] Custom runtime support
- [ ] GPU support for ML workloads

**Deployment Flow:**
- [ ] Enterprise deployment targets (on-prem)
- [ ] Compliance certifications (SOC 2, HIPAA)
- [ ] SLA guarantees
- [ ] Dedicated support

**Post-Launch OS:**
- [ ] Advanced BI (data warehouse, SQL queries)
- [ ] Machine learning insights
- [ ] Predictive analytics
- [ ] White-label analytics dashboards
- [ ] API for third-party integrations

**Estimated Effort:** 12 weeks, 6-8 developers

---

## 6. SUCCESS CRITERIA

### Functional Requirements Met
- [x] Architecture and security specifications documented
- [x] Database schema designed and migrated
- [x] Backend APIs implemented for Control Plane
- [x] CI/CD and automated testing in place
- [ ] Frontend Studio UI functional with all core features
- [ ] Runner System operational with Docker containers
- [ ] Deployment Flow working end-to-end
- [ ] Post-Launch OS providing analytics, SEO, commerce dashboards

### Performance Benchmarks Achieved
- [ ] Studio UI initial load < 3s
- [ ] Terminal latency < 100ms
- [ ] Live preview updates < 500ms
- [ ] Container startup < 5s
- [ ] Deployment completion < 5 minutes
- [ ] Analytics query response < 500ms
- [ ] Dashboard load < 2s

### Security Requirements Met
- [x] No secrets exposed in frontend
- [x] All API endpoints authenticated
- [x] Audit logging implemented
- [ ] Container isolation enforced
- [ ] Data encrypted at rest and in transit
- [ ] GDPR compliance achieved
- [ ] Security audit passed

### User Acceptance
- [ ] Can create app from prompt in < 5 minutes
- [ ] Can deploy to production in < 10 minutes
- [ ] Can manage post-launch operations from dashboard
- [ ] User satisfaction score > 4/5
- [ ] Net Promoter Score (NPS) > 50

---

## 7. CONCLUSION

This requirements document consolidates all functional, technical, security, and performance requirements for the 4 incomplete components of the Emergent-Level AI App Builder platform:

1. **Frontend Studio UI** - Conversational interface for building apps with voice input, code editor, terminal, and live preview
2. **Runner System** - Docker-based workspace execution environment with terminal access and preview URLs
3. **Deployment Flow** - One-click deployment to Vercel/Netlify with custom domains and SSL automation
4. **Post-Launch OS** - Comprehensive analytics, performance monitoring, SEO tooling, and commerce operations dashboard

All requirements have been extracted from existing architecture documentation and aligned with the overall system design. The implementation roadmap provides a phased approach over 12 months with clear priorities.

**Next Steps:**
1. Review and approve requirements
2. Create detailed wireframes and mockups
3. Break down into GitHub issues and user stories
4. Assign to team members based on expertise
5. Begin Phase 1 implementation

**Document Status:** ✅ Complete and ready for team review
