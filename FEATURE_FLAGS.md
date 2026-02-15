# Founders Pass Feature Flags System

## Overview

The Founders Pass feature flags system is a comprehensive solution for managing feature rollouts with fine-grained control over who sees what features. It includes:

- **CRUD API** for managing feature flags
- **Admin UI** for easy flag management
- **Webhook system** for real-time notifications
- **Preview mode** for testing flags without database changes
- **Audit logging** for compliance and debugging
- **Self-heal page** for health monitoring

## Table of Contents

1. [Architecture](#architecture)
2. [Database Schema](#database-schema)
3. [API Endpoints](#api-endpoints)
4. [Admin UI](#admin-ui)
5. [Integration Guide](#integration-guide)
6. [Preview Mode](#preview-mode)
7. [Webhooks](#webhooks)
8. [Self-Heal Dashboard](#self-heal-dashboard)
9. [Testing](#testing)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       Feature Flags System                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐     ┌──────────────┐    ┌──────────────┐ │
│  │  Admin UI    │────▶│   API Routes │───▶│   Supabase   │ │
│  │              │     │              │    │   Database   │ │
│  │ /admin/      │     │ /api/admin/  │    │              │ │
│  │ feature-flags│     │ feature-flags│    │ - flags      │ │
│  └──────────────┘     └──────────────┘    │ - audit      │ │
│                                            │ - webhooks   │ │
│  ┌──────────────┐     ┌──────────────┐    └──────────────┘ │
│  │  Client SDK  │────▶│  Check API   │           │         │
│  │              │     │              │           │         │
│  │ useFeatureFlag│    │ /api/feature-│          ▼         │
│  │              │     │ flags/check  │    ┌──────────────┐ │
│  └──────────────┘     └──────────────┘    │  Webhook     │ │
│                                            │  Delivery    │ │
│  ┌──────────────┐                         └──────────────┘ │
│  │ Preview Mode │                                │         │
│  │              │                                ▼         │
│  │ Cookie/Query │                         ┌──────────────┐ │
│  │ Param        │                         │ External     │ │
│  └──────────────┘                         │ Sites/Apps   │ │
│                                            └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Database Schema

### feature_flags

Main table storing flag definitions:

```sql
CREATE TABLE feature_flags (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,           -- e.g., "founders_pass_v2"
  description TEXT,                    
  enabled BOOLEAN DEFAULT false,       -- Master enable/disable
  scope TEXT DEFAULT 'global',         -- 'global', 'site', 'user'
  target_id TEXT,                      -- Site ID or User ID
  config JSONB DEFAULT '{}',           -- Rollout rules, percentage, etc.
  created_by UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

**Config Options:**
- `percentage`: 0-100 for gradual rollout
- `user_whitelist`: Array of user IDs to always enable
- `user_blacklist`: Array of user IDs to always disable
- `start_date`: ISO date to start rollout
- `end_date`: ISO date to end rollout
- `environment`: Array of environments (e.g., ['production', 'staging'])

### feature_flag_audit

Audit log for all flag changes:

```sql
CREATE TABLE feature_flag_audit (
  id UUID PRIMARY KEY,
  flag_id UUID,
  flag_name TEXT,
  action TEXT,                         -- 'created', 'updated', 'deleted', 'toggled'
  changed_by UUID,
  changes JSONB,                       -- Before/after values
  metadata JSONB,
  created_at TIMESTAMPTZ
);
```

### feature_flag_webhooks

Webhook configuration:

```sql
CREATE TABLE feature_flag_webhooks (
  id UUID PRIMARY KEY,
  flag_id UUID,
  url TEXT NOT NULL,
  secret TEXT,                         -- HMAC secret for verification
  enabled BOOLEAN DEFAULT true,
  events TEXT[],                       -- ['updated', 'toggled', 'created', 'deleted']
  retry_config JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### feature_flag_webhook_logs

Webhook delivery logs:

```sql
CREATE TABLE feature_flag_webhook_logs (
  id UUID PRIMARY KEY,
  webhook_id UUID,
  flag_id UUID,
  url TEXT,
  event TEXT,
  payload JSONB,
  status_code INT,
  response_body TEXT,
  error TEXT,
  attempt_number INT,
  delivered_at TIMESTAMPTZ
);
```

## API Endpoints

### Admin API (Authenticated)

**GET /api/admin/feature-flags**
- List all feature flags
- Query params:
  - `audit=true` - Include audit logs
  - `flagId=<uuid>` - Filter audit logs by flag

**POST /api/admin/feature-flags**
- Create a new feature flag
- Body: `CreateFeatureFlagRequest`

**PUT /api/admin/feature-flags?id=<flag-id>**
- Update an existing feature flag
- Body: `UpdateFeatureFlagRequest`

**DELETE /api/admin/feature-flags?id=<flag-id>**
- Delete a feature flag

### Public API

**GET /api/feature-flags/check?flag=<name>&user_id=<id>&site_id=<id>**
- Check if a single flag is enabled
- Returns: `{ enabled: boolean, flag?: FeatureFlag, reason?: string }`

**POST /api/feature-flags/check**
- Check multiple flags at once
- Body: `{ flags: string[], user_id?: string, site_id?: string }`
- Returns: `{ flags: { [name]: { enabled: boolean, ... } } }`

## Admin UI

### Feature Flags Page (`/admin/feature-flags`)

Features:
- **Table View** - See all flags at a glance
- **Create/Edit Modal** - Form-based flag management
- **Toggle Switches** - Quick enable/disable
- **Scope Selector** - Choose global/site/user
- **Rollout Rules** - Percentage slider, target ID input
- **Audit Log Viewer** - See all changes with timestamps

### Self-Heal Page (`/admin/self-heal`)

Automated health monitoring:
- **Stale Flags** - Flags not updated in 30+ days
- **Unused Flags** - Disabled flags for 30+ days
- **Misconfigured Flags** - Missing target_id, invalid percentage
- **Recommendations** - Actionable suggestions for cleanup

## Integration Guide

### React/Next.js (Client-Side)

```tsx
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

function MyComponent() {
  const { enabled, loading, isPreview } = useFeatureFlag('founders_pass_v2', {
    user_id: session?.user?.id,
    enablePreview: true,
  });

  if (loading) return <LoadingSpinner />;

  if (!enabled) {
    return <StandardVersion />;
  }

  return (
    <div>
      {isPreview && <PreviewBadge />}
      <FoundersPassVersion />
    </div>
  );
}
```

### React (Multiple Flags)

```tsx
import { useFeatureFlags } from '@/hooks/useFeatureFlag';

function MyComponent() {
  const { flags, loading } = useFeatureFlags(
    ['founders_pass_v2', 'new_ui_beta'],
    { user_id: session?.user?.id }
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      {flags.founders_pass_v2 && <FoundersFeature />}
      {flags.new_ui_beta && <NewUIComponent />}
    </div>
  );
}
```

### Server-Side (API Routes)

```ts
import { checkFeatureFlag } from '@/lib/feature-flags/server';

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  
  const { enabled } = await checkFeatureFlag({
    flag_name: 'founders_pass_v2',
    user_id: userId || undefined,
  });

  if (!enabled) {
    return NextResponse.json({ error: 'Feature not available' }, { status: 403 });
  }

  // Feature-specific logic
  return NextResponse.json({ data: 'Founders content' });
}
```

### Declarative Component

```tsx
import { FeatureFlagDemo } from '@/components/feature-flags/FeatureFlagDemo';

function MyPage() {
  return (
    <FeatureFlagDemo
      flagName="founders_pass_v2"
      fallback={<StandardVersion />}
    >
      <FoundersPassVersion />
    </FeatureFlagDemo>
  );
}
```

## Preview Mode

Preview mode allows testing flags without modifying the database.

### Enabling Preview Mode

**Via Cookie (persists 24 hours):**
```tsx
import { enablePreviewMode } from '@/hooks/useFeatureFlag';

enablePreviewMode(['founders_pass_v2', 'new_ui_beta']);
```

**Via Query Parameter (session-only):**
```
https://yoursite.com/page?preview_flags=founders_pass_v2,new_ui_beta
```

### Preview Mode Indicator

Add to your layout:

```tsx
import { PreviewModeBanner } from '@/components/feature-flags/FeatureFlagDemo';

export default function Layout({ children }) {
  return (
    <div>
      <PreviewModeBanner />
      {children}
    </div>
  );
}
```

### Disabling Preview Mode

```tsx
import { disablePreviewMode } from '@/hooks/useFeatureFlag';

disablePreviewMode();
```

## Webhooks

### Setting Up Webhooks

Webhooks notify external systems when flags change.

**1. Configure Webhook via API:**

```bash
curl -X POST /api/admin/feature-flags/webhooks \
  -H "Content-Type: application/json" \
  -d '{
    "flag_id": "flag-uuid",
    "url": "https://your-site.com/webhook",
    "secret": "your-secret-key",
    "events": ["updated", "toggled"]
  }'
```

**2. Receive Webhook:**

```ts
import { verifyWebhookSignature } from '@/lib/feature-flags/webhooks';

export async function POST(request: NextRequest) {
  const signature = request.headers.get('x-cubiqo-signature');
  const body = await request.text();
  
  // Verify signature
  const isValid = await verifyWebhookSignature(
    body,
    signature,
    process.env.WEBHOOK_SECRET
  );

  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const payload = JSON.parse(body);
  
  // Handle flag change
  console.log('Flag changed:', payload.flag.name, payload.event);
  
  // Reload your application state
  // reloadFeatureFlags();
  
  return NextResponse.json({ success: true });
}
```

**Webhook Payload:**

```json
{
  "event": "toggled",
  "flag": {
    "id": "uuid",
    "name": "founders_pass_v2",
    "enabled": true,
    "scope": "global",
    "config": { "percentage": 50 }
  },
  "timestamp": "2026-02-15T10:00:00Z",
  "changed_by": "user-uuid",
  "changes": {
    "old": { "enabled": false },
    "new": { "enabled": true }
  }
}
```

### Webhook Testing

Use webhook testing services:
- [webhook.site](https://webhook.site)
- [requestbin.com](https://requestbin.com)
- [ngrok](https://ngrok.com) for local testing

## Self-Heal Dashboard

Access at `/admin/self-heal`

### Health Checks

1. **Stale Flags** - Not updated in 30+ days
2. **Unused Flags** - Disabled for 30+ days
3. **Misconfigured** - Missing required fields
4. **Warnings** - Non-critical issues

### Recommendations

The dashboard provides actionable recommendations:
- Review and archive stale flags
- Delete unused flags
- Fix misconfigured flags
- Optimize rollout percentages

### Running Reports

```tsx
// Health check runs automatically on page load
// Or trigger manually:
const generateReport = async () => {
  const response = await fetch('/api/admin/feature-flags');
  // Process flags and generate health report
};
```

## Testing

### Acceptance Criteria

1. ✅ **Toggle a flag** in admin UI → Updates Supabase
2. ✅ **Webhook fires** → External site receives notification within 5s
3. ✅ **Audit log created** → Record appears in database
4. ✅ **Preview mode** → Enable flag locally without database change
5. ✅ **Site updates** → Feature shows/hides within 5s of flag toggle

### Manual Test Checklist

1. **Database Setup**
   ```bash
   # Apply migration
   psql $DATABASE_URL -f supabase/migrations/20260215000001_feature_flags.sql
   ```

2. **Create a Flag**
   - Go to `/admin/feature-flags`
   - Click "Create Flag"
   - Name: `test_feature`, Scope: `global`, Enabled: `false`
   - Click "Create"

3. **Toggle Flag**
   - Click toggle switch to enable
   - Verify webhook fires (check logs)
   - Verify audit entry created

4. **Test in Demo Page**
   - Go to `/demo`
   - See flag status update
   - Test preview mode buttons

5. **Verify Webhook**
   - Configure webhook to webhook.site
   - Toggle flag
   - Check webhook.site for delivery
   - Should arrive within 5 seconds

6. **Test Preview Mode**
   - Enable preview mode for `test_feature`
   - Reload page
   - See preview banner and feature enabled
   - Disable preview mode
   - Feature should follow database state

### API Testing

```bash
# List flags
curl http://localhost:3000/api/admin/feature-flags

# Check flag
curl "http://localhost:3000/api/feature-flags/check?flag=test_feature"

# Create flag
curl -X POST http://localhost:3000/api/admin/feature-flags \
  -H "Content-Type: application/json" \
  -d '{"name":"test_flag","enabled":true}'

# Update flag
curl -X PUT "http://localhost:3000/api/admin/feature-flags?id=<uuid>" \
  -H "Content-Type: application/json" \
  -d '{"enabled":false}'
```

## Best Practices

### Naming Conventions

- Use snake_case: `founders_pass_v2`
- Include version: `new_ui_v3`
- Be descriptive: `advanced_analytics_dashboard`

### Rollout Strategy

1. **Start Small** - 5% rollout
2. **Monitor** - Watch metrics and errors
3. **Gradual Increase** - 10% → 25% → 50% → 100%
4. **Full Rollout** - Remove flag once stable

### Cleanup

- Archive flags after 90 days of 100% rollout
- Delete unused flags after 30 days
- Document flag purpose in description
- Use self-heal dashboard monthly

### Security

- Protect admin routes with authentication
- Use HMAC signatures for webhooks
- Validate all inputs
- Audit all changes
- RLS policies enforce data access

## Troubleshooting

### Flag Not Updating

1. Check database - Flag enabled?
2. Check scope/target_id - Correct user/site?
3. Check percentage - User in rollout bucket?
4. Clear cache - Reload page
5. Check preview mode - Cookie overriding?

### Webhook Not Firing

1. Check webhook enabled in database
2. Check events array includes action
3. Check webhook URL reachable
4. Check webhook logs for errors
5. Verify signature if using secret

### Preview Mode Not Working

1. Check cookie set: `__cubiqo_preview_flags`
2. Check query param: `?preview_flags=...`
3. Reload page after enabling
4. Check browser console for errors
5. Verify `enablePreview: true` in hook

## Support

For issues or questions:
- GitHub Issues: https://github.com/thecubiqo/thecubiqo/issues
- Docs: See `ARCHITECTURE.md` for system overview
- Demo: Visit `/demo` for live examples
