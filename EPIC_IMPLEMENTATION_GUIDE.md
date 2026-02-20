# AI App Factory - Epic Implementation Guide

**Version:** 1.0  
**Date:** 2026-02-18  
**Purpose:** Detailed breakdown of 7 epics with acceptance criteria

---

## Epic 1: Foundations (Tenancy + Projects + Secrets)

**Duration:** 2 weeks  
**Team:** Backend + Platform Engineers

### Objectives

Build the foundational control plane for multi-tenancy, project management, and secure secrets handling.

### User Stories

1. **As a user**, I can create an organization and invite team members
2. **As a user**, I can create projects within my organization
3. **As a user**, I can manage environment variables securely
4. **As a platform**, I never expose secrets to the client
5. **As an admin**, I can audit all security-sensitive actions

### Technical Tasks

#### 1.1 Organization & User Management

**Database Schema:**
```sql
-- Organizations table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  billing_tier TEXT DEFAULT 'free',
  credits_remaining INTEGER DEFAULT 1000,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organization members
CREATE TABLE org_members (
  org_id UUID REFERENCES organizations(id),
  user_id UUID REFERENCES auth.users(id),
  role TEXT NOT NULL, -- 'owner', 'admin', 'member'
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (org_id, user_id)
);

-- Row Level Security
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their orgs"
  ON organizations FOR SELECT
  USING (id IN (
    SELECT org_id FROM org_members WHERE user_id = auth.uid()
  ));
```

**API Routes:**
- `POST /api/orgs` - Create organization
- `GET /api/orgs` - List user's organizations
- `POST /api/orgs/[id]/members` - Invite member
- `DELETE /api/orgs/[id]/members/[userId]` - Remove member

#### 1.2 Project Management

**Database Schema:**
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  name TEXT NOT NULL,
  description TEXT,
  framework TEXT DEFAULT 'nextjs', -- 'nextjs', 'expo', 'fastapi'
  status TEXT DEFAULT 'draft', -- 'draft', 'preview', 'deployed'
  git_repo TEXT,
  preview_url TEXT,
  production_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org's projects"
  ON projects FOR SELECT
  USING (org_id IN (
    SELECT org_id FROM org_members WHERE user_id = auth.uid()
  ));
```

**API Routes:**
- `POST /api/projects` - Create project
- `GET /api/projects` - List projects
- `GET /api/projects/[id]` - Get project details
- `PATCH /api/projects/[id]` - Update project
- `DELETE /api/projects/[id]` - Delete project

#### 1.3 Environment Variables & Secrets Management

**Database Schema:**
```sql
CREATE TABLE environments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  name TEXT NOT NULL, -- 'development', 'preview', 'production'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, name)
);

CREATE TABLE env_variables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  environment_id UUID REFERENCES environments(id),
  key TEXT NOT NULL,
  value TEXT NOT NULL, -- ENCRYPTED using pgcrypto
  is_secret BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(environment_id, key)
);

-- Encryption extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Function to encrypt secrets
CREATE OR REPLACE FUNCTION encrypt_secret(secret TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN encode(
    pgp_sym_encrypt(secret, current_setting('app.encryption_key')),
    'base64'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrypt secrets (server-side only)
CREATE OR REPLACE FUNCTION decrypt_secret(encrypted TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN pgp_sym_decrypt(
    decode(encrypted, 'base64'),
    current_setting('app.encryption_key')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER TABLE env_variables ENABLE ROW LEVEL SECURITY;
```

**Security Requirements:**
- ✅ Secrets encrypted at rest
- ✅ Secrets never returned to client
- ✅ API only accepts secrets via server-side routes
- ✅ Rotation capability for compromised keys
- ✅ Audit log for all secret access

**API Routes:**
- `POST /api/projects/[id]/env` - Add environment variable
- `GET /api/projects/[id]/env` - List env vars (secrets masked)
- `PATCH /api/projects/[id]/env/[key]` - Update variable
- `DELETE /api/projects/[id]/env/[key]` - Delete variable

#### 1.4 Audit Logging

**Database Schema:**
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_org ON audit_logs(org_id, created_at DESC);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id, created_at DESC);
```

**Logged Actions:**
- Organization create/update/delete
- Member invite/remove
- Project create/update/delete
- Environment variable create/update/delete
- Deployment triggers
- Integration installations

#### 1.5 RBAC (Role-Based Access Control)

**Roles:**
- **Owner:** Full control, billing, delete org
- **Admin:** Manage projects, members, deployments
- **Member:** View projects, trigger builds
- **Viewer:** Read-only access

**Implementation:**
```typescript
// /src/lib/auth/rbac.ts
export enum Role {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
  VIEWER = 'viewer'
}

export enum Permission {
  ORG_DELETE = 'org:delete',
  ORG_BILLING = 'org:billing',
  MEMBER_INVITE = 'member:invite',
  MEMBER_REMOVE = 'member:remove',
  PROJECT_CREATE = 'project:create',
  PROJECT_DELETE = 'project:delete',
  DEPLOY_TRIGGER = 'deploy:trigger',
  ENV_VAR_WRITE = 'env:write',
  ENV_VAR_READ = 'env:read'
}

const rolePermissions: Record<Role, Permission[]> = {
  [Role.OWNER]: [/* all permissions */],
  [Role.ADMIN]: [/* most permissions except org delete/billing */],
  [Role.MEMBER]: [/* basic permissions */],
  [Role.VIEWER]: [/* read-only */]
};

export function hasPermission(
  role: Role,
  permission: Permission
): boolean {
  return rolePermissions[role].includes(permission);
}
```

### Acceptance Criteria

✅ **AC1:** User can create organization and see it in dashboard  
✅ **AC2:** User can create project within organization  
✅ **AC3:** User can add environment variables (both public and secret)  
✅ **AC4:** Secret environment variables are NEVER returned to client  
✅ **AC5:** Secrets are encrypted in database  
✅ **AC6:** User can rotate compromised secrets  
✅ **AC7:** All security-sensitive actions are logged in audit log  
✅ **AC8:** RBAC correctly enforces permissions  
✅ **AC9:** Pre-deploy check blocks deployment if secrets detected in code  

### Testing Strategy

```typescript
// /src/__tests__/epic1-foundations.test.ts

describe('Epic 1: Foundations', () => {
  describe('Organization Management', () => {
    it('creates organization with correct owner role');
    it('allows owner to invite members');
    it('enforces RLS - users only see their orgs');
  });
  
  describe('Project Management', () => {
    it('creates project within organization');
    it('sets correct default values');
    it('enforces org membership for access');
  });
  
  describe('Secrets Management', () => {
    it('encrypts secret environment variables');
    it('never returns secrets to client API');
    it('allows secret rotation');
    it('blocks deploy if secrets in code');
  });
  
  describe('Audit Logging', () => {
    it('logs org creation');
    it('logs secret access');
    it('logs deployment triggers');
  });
});
```

### Deliverables

1. ✅ Database migrations
2. ✅ API routes implementation
3. ✅ UI components for org/project management
4. ✅ Env var manager UI
5. ✅ Audit log viewer
6. ✅ RBAC middleware
7. ✅ Documentation

---

## Epic 2: Runner v1 (Terminal + Preview)

**Duration:** 2 weeks  
**Team:** Infrastructure + Backend Engineers

### Objectives

Build isolated workspace execution environment with real terminals and live previews.

### User Stories

1. **As a user**, I can open a terminal in my project
2. **As a user**, I can run commands and see real-time output
3. **As a user**, I can start a dev server and see live preview
4. **As a user**, my workspace is isolated from other users
5. **As a platform**, I enforce resource quotas to prevent abuse

### Technical Architecture

```
┌─────────────────────────────────────────────────────────┐
│              Studio UI (Vercel)                         │
│  ┌──────────────┐        ┌──────────────┐              │
│  │   Terminal   │◄──WS──►│  Preview     │              │
│  │   Component  │        │  Frame       │              │
│  └──────────────┘        └──────────────┘              │
└───────────┬────────────────────┬─────────────────────────┘
            │ WebSocket          │ HTTP
            │                    │
┌───────────▼────────────────────▼─────────────────────────┐
│           Terminal Gateway Service                       │
│  • WebSocket server                                      │
│  • Authentication                                        │
│  • Route to workspaces                                   │
└───────────┬──────────────────────────────────────────────┘
            │
┌───────────▼──────────────────────────────────────────────┐
│         Workspace Runner Service                         │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐        │
│  │ Workspace  │  │ Workspace  │  │ Workspace  │        │
│  │ Container  │  │ Container  │  │ Container  │        │
│  │ (Project A)│  │ (Project B)│  │ (Project C)│        │
│  └────────────┘  └────────────┘  └────────────┘        │
└──────────────────────────────────────────────────────────┘
```

### Technical Tasks

#### 2.1 Workspace Container Design

**Dockerfile:**
```dockerfile
# /services/runner/Dockerfile
FROM node:20-alpine

# Install system dependencies
RUN apk add --no-cache \
    git \
    python3 \
    build-base

# Create non-root user
RUN addgroup -g 1001 runner && \
    adduser -D -u 1001 -G runner runner

# Set up workspace directory
WORKDIR /workspace
RUN chown runner:runner /workspace

USER runner

# Expose ports for dev server
EXPOSE 3000 3001 3002

CMD ["/bin/sh"]
```

**Resource Limits:**
```yaml
# Container resource quotas
resources:
  limits:
    cpu: "2"
    memory: "2Gi"
    ephemeral-storage: "10Gi"
  requests:
    cpu: "0.5"
    memory: "512Mi"
```

#### 2.2 Workspace Manager

**Service: `/services/runner/workspace-manager.ts`**
```typescript
interface WorkspaceConfig {
  projectId: string;
  framework: 'nextjs' | 'expo' | 'fastapi';
  resources: {
    cpu: string;
    memory: string;
    disk: string;
  };
  timeout: number; // seconds
}

class WorkspaceManager {
  async createWorkspace(config: WorkspaceConfig): Promise<Workspace> {
    // 1. Create container
    // 2. Mount volumes
    // 3. Set resource limits
    // 4. Start container
    // 5. Return workspace handle
  }
  
  async startWorkspace(workspaceId: string): Promise<void> {
    // Start stopped container
  }
  
  async stopWorkspace(workspaceId: string): Promise<void> {
    // Stop running container (preserve files)
  }
  
  async destroyWorkspace(workspaceId: string): Promise<void> {
    // Remove container and volumes
  }
  
  async executeCommand(
    workspaceId: string,
    command: string
  ): Promise<CommandResult> {
    // Run command in container, return output
  }
}
```

#### 2.3 Terminal Gateway (WebSocket)

**Service: `/services/gateway/terminal-server.ts`**
```typescript
import { WebSocketServer } from 'ws';
import { verifyToken } from './auth';

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', async (ws, req) => {
  // 1. Verify JWT token
  const token = req.headers.authorization;
  const user = await verifyToken(token);
  
  if (!user) {
    ws.close(4401, 'Unauthorized');
    return;
  }
  
  // 2. Extract project ID from URL
  const projectId = req.url?.split('/').pop();
  
  // 3. Verify user has access to project
  const hasAccess = await checkProjectAccess(user.id, projectId);
  
  if (!hasAccess) {
    ws.close(4403, 'Forbidden');
    return;
  }
  
  // 4. Connect to workspace
  const workspace = await getWorkspace(projectId);
  const shell = await workspace.createShell();
  
  // 5. Pipe data bidirectionally
  ws.on('message', (data) => {
    shell.stdin.write(data);
  });
  
  shell.stdout.on('data', (data) => {
    ws.send(data);
  });
  
  shell.stderr.on('data', (data) => {
    ws.send(data);
  });
  
  ws.on('close', () => {
    shell.kill();
  });
});
```

#### 2.4 Preview Proxy

**Service: `/services/gateway/preview-proxy.ts`**
```typescript
import express from 'express';
import httpProxy from 'http-proxy';

const app = express();
const proxy = httpProxy.createProxyServer();

// Preview URL format: https://preview-{projectId}.app.factory
app.all('*', async (req, res) => {
  // 1. Extract project ID from subdomain
  const hostname = req.hostname;
  const match = hostname.match(/^preview-(.+)\.app\.factory$/);
  
  if (!match) {
    return res.status(404).send('Not found');
  }
  
  const projectId = match[1];
  
  // 2. Find workspace for project
  const workspace = await getWorkspace(projectId);
  
  if (!workspace || !workspace.previewServer) {
    return res.status(503).send('Preview not running');
  }
  
  // 3. Proxy request to workspace
  proxy.web(req, res, {
    target: workspace.previewServer.url,
    changeOrigin: true
  });
});

app.listen(3000);
```

#### 2.5 Log Streaming

**Service: `/services/runner/log-streamer.ts`**
```typescript
class LogStreamer {
  private streams = new Map<string, EventEmitter>();
  
  async streamLogs(
    projectId: string,
    callback: (log: string) => void
  ): Promise<() => void> {
    const workspace = await getWorkspace(projectId);
    const container = await docker.getContainer(workspace.containerId);
    
    const stream = await container.logs({
      follow: true,
      stdout: true,
      stderr: true,
      timestamps: true
    });
    
    stream.on('data', (chunk) => {
      callback(chunk.toString());
    });
    
    // Return cleanup function
    return () => {
      stream.destroy();
    };
  }
}
```

### Acceptance Criteria

✅ **AC1:** User can open terminal and see prompt  
✅ **AC2:** Terminal supports real-time input/output  
✅ **AC3:** User can run `npm install` and see progress  
✅ **AC4:** User can run `npm run dev` and start preview server  
✅ **AC5:** Preview iframe loads dev server correctly  
✅ **AC6:** Hot reload works in preview  
✅ **AC7:** Logs stream in real-time to Studio UI  
✅ **AC8:** Workspaces are isolated (user A cannot access user B's workspace)  
✅ **AC9:** Resource quotas are enforced  
✅ **AC10:** Workspaces auto-stop after timeout  

### Testing Strategy

```typescript
describe('Epic 2: Runner', () => {
  describe('Workspace Management', () => {
    it('creates isolated container');
    it('enforces resource limits');
    it('cleans up after timeout');
  });
  
  describe('Terminal Gateway', () => {
    it('authenticates WebSocket connections');
    it('routes commands to correct workspace');
    it('handles connection drops gracefully');
  });
  
  describe('Preview Proxy', () => {
    it('routes preview requests to workspace');
    it('returns 503 if preview not running');
    it('handles SSL correctly');
  });
});
```

### Deliverables

1. ✅ Workspace container image
2. ✅ Workspace manager service
3. ✅ Terminal gateway service
4. ✅ Preview proxy service
5. ✅ Log streamer
6. ✅ Studio UI terminal component
7. ✅ Studio UI preview frame component
8. ✅ Documentation

---

## Epic 3: Studio UX (HD Frontend-First)

**Duration:** 2 weeks  
**Team:** Frontend Lead + UI/UX Designer

### Objectives

Build the Studio coding panel with HD frontend-first workflow.

### User Stories

1. **As a user**, I enter a prompt and get a polished UI preview in <2 minutes
2. **As a user**, I see animations, responsive design, and loading states
3. **As a user**, I can iterate on the design before adding backend
4. **As a user**, I can browse files and make manual edits
5. **As a user**, I can chat with AI to refine the generated app

### HD Frontend-First Pipeline

```
User Prompt
    │
    ▼
┌─────────────────────────────────────────┐
│  Generate Design Tokens                 │
│  • Colors, typography, spacing          │
│  • Component variants                   │
│  • Animation timing                     │
└─────────────────┬───────────────────────┘
                  ▼
┌─────────────────────────────────────────┐
│  Generate Component Library             │
│  • Button, Input, Card variants         │
│  • Loading skeletons                    │
│  • Empty states                         │
│  • Error boundaries                     │
└─────────────────┬───────────────────────┘
                  ▼
┌─────────────────────────────────────────┐
│  Generate Pages with Mock Data          │
│  • Responsive layouts                   │
│  • Framer Motion animations             │
│  • Typed API contracts (mocks)          │
└─────────────────┬───────────────────────┘
                  ▼
┌─────────────────────────────────────────┐
│  Preview in Studio                      │
│  • Live preview                         │
│  • Responsive testing                   │
│  • Animation preview                    │
└─────────────────────────────────────────┘
```

### Component Architecture

#### 3.1 Design System Generator

**Template: `/templates/design-system.ts`**
```typescript
interface DesignSystemConfig {
  brand: {
    primary: string;
    secondary: string;
    accent: string;
  };
  typography: {
    fontFamily: string;
    scale: number[];
  };
  spacing: number[];
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
  };
  animations: {
    duration: {
      fast: number;
      normal: number;
      slow: number;
    };
    easing: {
      easeIn: string;
      easeOut: string;
      easeInOut: string;
    };
  };
}

function generateDesignSystem(prompt: string): DesignSystemConfig {
  // Use AI to extract design preferences from prompt
  // Return configuration
}

function generateTailwindConfig(design: DesignSystemConfig): string {
  return `
module.exports = {
  theme: {
    extend: {
      colors: ${JSON.stringify(design.brand)},
      fontFamily: {
        sans: ['${design.typography.fontFamily}', 'sans-serif']
      },
      spacing: ${JSON.stringify(design.spacing)},
      borderRadius: ${JSON.stringify(design.borderRadius)}
    }
  }
}`;
}
```

#### 3.2 Component Library Templates

**Template: `/templates/components/Button.tsx`**
```typescript
const buttonTemplate = `
import { motion } from 'framer-motion';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  onClick
}: ButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={\`btn btn-\${variant} btn-\${size}\`}
      disabled={loading}
      onClick={onClick}
    >
      {loading ? (
        <span className="loading loading-spinner" />
      ) : (
        children
      )}
    </motion.button>
  );
}
`;
```

#### 3.3 Studio UI Layout

**Component: `/src/components/studio/StudioLayout.tsx`**
```typescript
export function StudioLayout() {
  return (
    <div className="h-screen flex">
      {/* Sidebar */}
      <div className="w-64 border-r">
        <FileExplorer projectId={projectId} />
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Editor tabs */}
        <EditorTabs />
        
        {/* Split view: Editor + Preview */}
        <div className="flex-1 flex">
          <div className="flex-1">
            <CodeEditor />
          </div>
          <div className="flex-1">
            <PreviewFrame />
          </div>
        </div>
        
        {/* Bottom panel: Terminal + Logs */}
        <div className="h-64 border-t">
          <Terminal />
        </div>
      </div>
      
      {/* Right sidebar: AI Chat */}
      <div className="w-96 border-l">
        <AIChat />
      </div>
    </div>
  );
}
```

#### 3.4 File Explorer Component

**Component: `/src/components/studio/FileExplorer.tsx`**
```typescript
export function FileExplorer({ projectId }: { projectId: string }) {
  const [files, setFiles] = useState<FileNode[]>([]);
  
  useEffect(() => {
    // Load project files
    loadFiles(projectId).then(setFiles);
  }, [projectId]);
  
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Files</h3>
        <button className="btn btn-sm">New File</button>
      </div>
      
      <FileTree nodes={files} onSelect={handleFileSelect} />
    </div>
  );
}
```

### Acceptance Criteria

✅ **AC1:** User prompt generates design system in <10 seconds  
✅ **AC2:** Generated UI includes animations (Framer Motion)  
✅ **AC3:** Generated UI is responsive (mobile, tablet, desktop)  
✅ **AC4:** Generated UI includes loading states, empty states, error states  
✅ **AC5:** Generated components use typed mock API contracts  
✅ **AC6:** User can browse files in file explorer  
✅ **AC7:** User can edit files in Monaco editor  
✅ **AC8:** Changes trigger hot reload in preview  
✅ **AC9:** User can chat with AI to refine generated code  
✅ **AC10:** First preview appears in <2 minutes  

### Deliverables

1. ✅ Design system generator
2. ✅ Component library templates
3. ✅ Studio UI layout
4. ✅ File explorer component
5. ✅ Monaco editor integration
6. ✅ Preview frame component
7. ✅ AI chat panel
8. ✅ Documentation

---

## Epic 4-7: [Continued in next document]

**Note:** Due to length, remaining epics (Orchestrator, Deployments, Integrations, Post-Launch) will be documented in separate implementation guides.

---

**Document Owner:** Engineering Team  
**Last Updated:** 2026-02-18  
**Next Steps:** Review Epic 1-3, begin implementation
