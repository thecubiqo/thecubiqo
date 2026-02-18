# AI App Factory - Security & Compliance Requirements

**Version:** 1.0  
**Date:** 2026-02-18  
**Status:** Mandatory Requirements

---

## 1. Critical Security Principles

### Principle 1: Never Expose Secrets in Frontend

**Rule:** Frontend code is visible. API keys, tokens, and secrets MUST NEVER appear in client-side code.

**Implementation:**
```typescript
// ❌ NEVER DO THIS
const OPENAI_API_KEY = 'sk-...'; // Exposed in bundle

// ✅ CORRECT: Use environment variables server-side only
// /src/app/api/generate/route.ts
export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY; // Server-side only
  // ...
}
```

**Enforcement:**
- Pre-commit hooks to scan for secrets
- CI/CD blocks deployment if secrets detected
- Automated secret scanning (GitHub Secret Scanning, GitGuardian)

### Principle 2: Encrypt Secrets at Rest

**Rule:** All secrets in database MUST be encrypted using strong encryption.

**Implementation:**
```sql
-- Use PostgreSQL pgcrypto extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Encrypt before storing
INSERT INTO env_variables (key, value, is_secret)
VALUES (
  'STRIPE_SECRET_KEY',
  encode(pgp_sym_encrypt('sk_test_...', current_setting('app.encryption_key')), 'base64'),
  true
);

-- Decrypt only on server
SELECT 
  key,
  CASE 
    WHEN is_secret THEN '[REDACTED]'
    ELSE value
  END as value
FROM env_variables;
```

### Principle 3: Workspace Isolation

**Rule:** Each user's workspace MUST be isolated from other users.

**Implementation:**
- Separate Docker containers per project
- Network isolation
- Resource quotas (CPU, memory, disk)
- Filesystem isolation
- No shared volumes

### Principle 4: Audit Everything Sensitive

**Rule:** All security-sensitive actions MUST be logged.

**Logged Actions:**
- Secret access/creation/deletion
- Deployment triggers
- Workspace creation/access
- Organization/member changes
- Integration installations
- Billing changes

---

## 2. Authentication & Authorization

### 2.1 Authentication

**Primary Method:** Supabase Auth
- Magic link (passwordless)
- OAuth providers (GitHub, Google)
- Multi-factor authentication (optional)

**Session Management:**
```typescript
// Server-side session validation
import { createClient } from '@/lib/supabase/server';

export async function requireAuth() {
  const supabase = createClient();
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error || !session) {
    throw new Error('Unauthorized');
  }
  
  return session.user;
}
```

### 2.2 Authorization (RBAC)

**Roles:**
- Owner: Full control
- Admin: Manage projects and members
- Member: Create/edit projects
- Viewer: Read-only access

**Permission Checks:**
```typescript
export async function requirePermission(
  userId: string,
  orgId: string,
  permission: Permission
): Promise<void> {
  const role = await getUserRole(userId, orgId);
  
  if (!hasPermission(role, permission)) {
    throw new Error('Forbidden');
  }
}
```

### 2.3 Row-Level Security (RLS)

**Enable RLS on all tables:**
```sql
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE env_variables ENABLE ROW LEVEL SECURITY;

-- Example policy
CREATE POLICY "Users can only access their org's projects"
  ON projects FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
    )
  );
```

---

## 3. API Security

### 3.1 Rate Limiting

**Implementation:**
```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
});

export async function rateLimit(identifier: string) {
  const { success, limit, remaining } = await ratelimit.limit(identifier);
  
  if (!success) {
    throw new Error('Rate limit exceeded');
  }
  
  return { limit, remaining };
}
```

**Limits:**
- API calls: 100/minute per user
- Deployments: 10/hour per project
- Terminal commands: 1000/hour per workspace
- File operations: 500/hour per project

### 3.2 Input Validation

**Validate all inputs:**
```typescript
import { z } from 'zod';

const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  framework: z.enum(['nextjs', 'expo', 'fastapi']),
  description: z.string().max(500).optional(),
});

export async function POST(req: Request) {
  const body = await req.json();
  const validated = createProjectSchema.parse(body); // Throws if invalid
  // ...
}
```

### 3.3 CORS Configuration

**Strict CORS policy:**
```typescript
// next.config.ts
export default {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: process.env.ALLOWED_ORIGIN },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
        ],
      },
    ];
  },
};
```

---

## 4. Workspace Security

### 4.1 Container Isolation

**Docker Security:**
```dockerfile
# Run as non-root user
USER runner

# Read-only filesystem where possible
--read-only

# No privileged mode
--privileged=false

# Drop all capabilities except necessary ones
--cap-drop=ALL
--cap-add=NET_BIND_SERVICE
```

**Resource Limits:**
```yaml
resources:
  limits:
    cpu: "2"
    memory: "2Gi"
    ephemeral-storage: "10Gi"
  requests:
    cpu: "0.5"
    memory: "512Mi"
```

### 4.2 Network Isolation

**Default deny, allowlist specific:**
- Outbound: Allow package registries (npm, pypi)
- Outbound: Allow API calls to approved services
- Inbound: Only from preview proxy
- No inter-workspace communication

### 4.3 Filesystem Isolation

**No shared volumes:**
- Each workspace has dedicated volume
- Volumes destroyed on workspace deletion
- No access to host filesystem
- Quotas enforced

### 4.4 Command Execution

**Sanitize and validate:**
```typescript
const DANGEROUS_COMMANDS = [
  'rm -rf /',
  'dd if=/dev/zero',
  'fork bomb',
  ':(){:|:&};:',
];

export function sanitizeCommand(cmd: string): string {
  // Check against blacklist
  for (const dangerous of DANGEROUS_COMMANDS) {
    if (cmd.includes(dangerous)) {
      throw new Error('Dangerous command blocked');
    }
  }
  
  // Additional validation
  return cmd;
}
```

---

## 5. Integration Security

### 5.1 Webhook Verification

**Shopify Example:**
```typescript
import crypto from 'crypto';

export function verifyShopifyWebhook(
  body: string,
  hmacHeader: string,
  secret: string
): boolean {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(body, 'utf8')
    .digest('base64');
  
  return crypto.timingSafeEqual(
    Buffer.from(hash),
    Buffer.from(hmacHeader)
  );
}

// In webhook handler
export async function POST(req: Request) {
  const body = await req.text();
  const hmac = req.headers.get('X-Shopify-Hmac-SHA256');
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  
  if (!verifyShopifyWebhook(body, hmac, secret)) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // Process webhook
}
```

### 5.2 Idempotency

**Handle duplicate webhooks:**
```typescript
const processedWebhooks = new Set<string>();

export async function POST(req: Request) {
  const webhookId = req.headers.get('X-Webhook-Id');
  
  // Check if already processed
  const exists = await redis.get(`webhook:${webhookId}`);
  if (exists) {
    return new Response('Already processed', { status: 200 });
  }
  
  // Process webhook
  await processWebhook(req);
  
  // Mark as processed (TTL 24 hours)
  await redis.setex(`webhook:${webhookId}`, 86400, 'processed');
  
  return new Response('OK', { status: 200 });
}
```

### 5.3 OAuth Token Storage

**Never store in frontend:**
```typescript
// ❌ NEVER
localStorage.setItem('shopify_token', token);

// ✅ CORRECT: Store in database, encrypted
await supabase
  .from('integrations')
  .insert({
    project_id: projectId,
    provider: 'shopify',
    access_token: encrypt(token), // Encrypted
    refresh_token: encrypt(refreshToken),
  });
```

---

## 6. Deployment Security

### 6.1 Pre-Deployment Checks

**Automated security scans:**
```typescript
export async function preDeploy(projectId: string): Promise<void> {
  // 1. Scan for secrets in code
  const secrets = await scanForSecrets(projectId);
  if (secrets.length > 0) {
    throw new Error(`Found ${secrets.length} potential secrets in code`);
  }
  
  // 2. Verify all env vars are set
  const missing = await checkRequiredEnvVars(projectId);
  if (missing.length > 0) {
    throw new Error(`Missing env vars: ${missing.join(', ')}`);
  }
  
  // 3. Run security linter
  const vulnerabilities = await runSecurityLinter(projectId);
  if (vulnerabilities.some(v => v.severity === 'high')) {
    throw new Error('High severity vulnerabilities found');
  }
}
```

### 6.2 Dependency Scanning

**Scan for known vulnerabilities:**
```bash
# In CI/CD pipeline
npm audit --audit-level=high
```

**Auto-update dependencies:**
- Dependabot enabled
- Auto-merge patch versions
- Review minor/major versions

### 6.3 Environment Separation

**Strict env separation:**
- Development: Local only
- Preview: Isolated per PR
- Production: Protected, requires approval

**No cross-env access:**
```typescript
// Production secrets NEVER accessible from preview
const isDevelopment = process.env.NODE_ENV === 'development';
const isPreview = process.env.VERCEL_ENV === 'preview';

if (isPreview) {
  // Use preview-specific secrets
  apiKey = process.env.PREVIEW_API_KEY;
} else {
  // Use production secrets
  apiKey = process.env.PRODUCTION_API_KEY;
}
```

---

## 7. Data Protection

### 7.1 Encryption in Transit

**Always HTTPS:**
- Enforce HTTPS redirect
- HSTS headers
- TLS 1.3 minimum

```typescript
// next.config.ts
export default {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
        ],
      },
    ];
  },
};
```

### 7.2 Encryption at Rest

**Database encryption:**
- PostgreSQL encryption enabled
- Backups encrypted
- Secrets use pgcrypto

**File storage:**
- Supabase Storage with encryption
- Signed URLs with expiration
- Access control per file

### 7.3 Data Retention

**Clear retention policies:**
- Audit logs: 1 year
- Deployment logs: 90 days
- Workspace files: Until project deleted
- User data: Until account deleted

**Data deletion:**
```typescript
export async function deleteUser(userId: string): Promise<void> {
  // 1. Delete user projects
  await deleteUserProjects(userId);
  
  // 2. Delete workspaces
  await deleteUserWorkspaces(userId);
  
  // 3. Delete audit logs (anonymize)
  await anonymizeAuditLogs(userId);
  
  // 4. Delete user account
  await supabase.auth.admin.deleteUser(userId);
}
```

---

## 8. Incident Response

### 8.1 Secret Rotation

**If secret compromised:**
1. Immediately revoke old secret
2. Generate new secret
3. Update in all environments
4. Audit for unauthorized access
5. Notify affected users

**Automated rotation:**
```typescript
export async function rotateSecret(
  projectId: string,
  envVar: string
): Promise<void> {
  // 1. Generate new secret
  const newSecret = generateSecret();
  
  // 2. Update in database
  await updateEnvVar(projectId, envVar, newSecret);
  
  // 3. Trigger redeploy with new secret
  await triggerRedeploy(projectId);
  
  // 4. Log rotation
  await logAudit({
    action: 'secret_rotated',
    resource: envVar,
    project_id: projectId,
  });
}
```

### 8.2 Breach Response

**Steps:**
1. Isolate affected systems
2. Assess scope of breach
3. Notify affected users
4. Rotate all potentially compromised secrets
5. Conduct forensic analysis
6. Implement additional controls
7. Document lessons learned

### 8.3 Monitoring & Alerts

**Alert on:**
- Failed authentication attempts (>5 in 5 min)
- Unusual API usage patterns
- Deployment failures
- Secret access spikes
- Container resource exhaustion

---

## 9. Compliance

### 9.1 GDPR Compliance

**User rights:**
- Right to access: API endpoint to export data
- Right to deletion: Full account deletion
- Right to rectification: User can update data
- Right to portability: Export in JSON format

**Implementation:**
```typescript
// /src/app/api/user/export/route.ts
export async function GET(req: Request) {
  const user = await requireAuth();
  
  // Gather all user data
  const userData = {
    profile: await getUserProfile(user.id),
    projects: await getUserProjects(user.id),
    deployments: await getUserDeployments(user.id),
    auditLogs: await getUserAuditLogs(user.id),
  };
  
  return new Response(JSON.stringify(userData), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="user-data.json"',
    },
  });
}
```

### 9.2 SOC 2 Type II (Future)

**Controls to implement:**
- Access control policies
- Change management procedures
- Incident response plan
- Business continuity plan
- Vendor risk management

### 9.3 Payment Card Industry (PCI DSS)

**If handling payments:**
- Never store card data directly
- Use Stripe/Razorpay checkout
- Tokenization only
- Webhook signature verification

---

## 10. Security Checklist

### Before Launch

- [ ] All secrets encrypted at rest
- [ ] Secrets never in frontend code
- [ ] RLS enabled on all tables
- [ ] Rate limiting implemented
- [ ] Input validation on all endpoints
- [ ] Workspace isolation tested
- [ ] Webhook signature verification
- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] Dependency scanning enabled
- [ ] Pre-deploy security checks
- [ ] Audit logging complete
- [ ] Incident response plan documented
- [ ] GDPR compliance verified
- [ ] Penetration testing completed

### Ongoing

- [ ] Monthly security audits
- [ ] Quarterly dependency updates
- [ ] Annual penetration testing
- [ ] Review audit logs weekly
- [ ] Test backup restoration monthly
- [ ] Update incident response plan quarterly
- [ ] Security training for team quarterly

---

## 11. Responsible Disclosure

**If you find a security vulnerability:**

1. **DO NOT** disclose publicly
2. Email: security@app-factory.com
3. Include:
   - Description of vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (optional)

**Response timeline:**
- Acknowledgment: 24 hours
- Initial assessment: 72 hours
- Fix deployment: 7 days (critical), 30 days (non-critical)
- Public disclosure: After fix deployed

---

**Document Owner:** Security Team  
**Last Updated:** 2026-02-18  
**Next Review:** 2026-03-18
