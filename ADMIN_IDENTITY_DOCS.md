# Admin Identity & Elevated Controls

This document describes the privileged admin identity system for CubiQo, which provides elevated UI controls and audit logging for admin users.

## Overview

The admin identity system provides:

1. **Durable Admin Flag**: A persistent `is_admin` boolean field in the `profiles` table
2. **Feature Flags**: Configurable feature flags to enable/disable admin controls
3. **Audit Logging**: Complete audit trail of all privileged actions
4. **Elevated UI Controls**:
   - Debug View: Real-time debug information panel
   - Confirmation Bypass: Skip non-destructive confirmations
   - Read-Only Impersonation: View other users' sessions (read-only)

## Database Changes

### Migration: `20260215000001_add_admin_and_audit.sql`

#### 1. Admin Flag in Profiles Table

```sql
ALTER TABLE profiles ADD COLUMN is_admin BOOLEAN DEFAULT false;
CREATE INDEX idx_profiles_is_admin ON profiles(is_admin) WHERE is_admin = true;
```

- **Field**: `is_admin` (boolean, default: false)
- **Purpose**: Durable flag identifying privileged admin users
- **Admin User**: `aditya@cubiqo.ai` is set as admin in migration

#### 2. Audit Logs Table

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  user_email TEXT,
  action_type TEXT NOT NULL,
  action_details JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Fields**:
- `user_id`: Reference to the admin user
- `user_email`: Email of the admin (for audit purposes)
- `action_type`: Type of privileged action performed
- `action_details`: Additional JSON context about the action
- `ip_address`: IP address of the admin
- `user_agent`: Browser user agent string
- `created_at`: Timestamp of the action

**Action Types**:
- `debug_view_accessed`: Admin opened the debug panel
- `confirmation_bypassed`: Admin bypassed a confirmation dialog
- `impersonation_started`: Admin started viewing another user's session
- `impersonation_ended`: Admin stopped impersonation
- `admin_dashboard_accessed`: Admin accessed the admin dashboard
- `sensitive_data_viewed`: Admin viewed sensitive user data

#### 3. RLS Policies

```sql
-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs" ON audit_logs FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

-- Service role can insert audit logs (bypasses RLS)
CREATE POLICY "Service role can insert audit logs" ON audit_logs FOR INSERT
  WITH CHECK (true);
```

#### 4. Helper Function

```sql
CREATE FUNCTION log_admin_action(
  p_user_id UUID,
  p_user_email TEXT,
  p_action_type TEXT,
  p_action_details JSONB DEFAULT '{}',
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
) RETURNS UUID
```

## Feature Flags

### Configuration: `src/config/feature-flags.ts`

```typescript
export interface FeatureFlags {
  ADMIN_ELEVATED_CONTROLS: boolean;  // Enable admin UI controls
  ADMIN_AUDIT_LOGGING: boolean;      // Enable audit logging
}
```

### Environment Variables

Add to `.env.local`:

```env
# Enable admin elevated controls (debug view, bypass confirmations, impersonation)
# Default: true in development, false in production
NEXT_PUBLIC_ENABLE_ADMIN_CONTROLS=true
```

## Memory Layer Integration

### Hook: `useAdmin`

```typescript
const { 
  isAdmin,                    // Is current user an admin?
  elevatedControlsEnabled,    // Are elevated controls enabled?
  auditLoggingEnabled,        // Is audit logging enabled?
  logAction                   // Function to log admin actions
} = useAdmin();
```

**Usage**:
```typescript
// Log an admin action
await logAction('debug_view_accessed', {
  timestamp: new Date().toISOString(),
  sessionId: session?.id,
});
```

## UI Controls

### 1. Debug View

**Component**: `src/components/admin/DebugView.tsx`

**Features**:
- Floating button in bottom-right corner (🐛 Debug)
- Shows real-time debug information:
  - Session ID
  - Timestamp
  - User Agent
  - Screen size
  - Locale
  - Cookies enabled status
  - Online status
- Only visible to admins with elevated controls enabled
- Access is automatically logged to audit trail

**Visibility**: `isAdmin && elevatedControlsEnabled`

### 2. Confirmation Bypass

**Component**: `src/components/admin/ConfirmationBypass.tsx`

**Features**:
- Automatically bypasses non-destructive confirmations
- Shows badge at top-right: "⚡ Confirmations Bypassed"
- Does NOT bypass dangerous/destructive actions
- Every bypassed confirmation is logged

**Hook Usage**:
```typescript
const { confirm, canBypassConfirmations } = useAdminConfirmation();

// Use in place of window.confirm
const confirmed = await confirm({
  title: "Confirm Action",
  message: "Are you sure?",
  actionType: 'default', // or 'danger'
  onConfirm: async () => { /* action */ },
  onCancel: () => { /* cancel */ }
});
```

**Visibility**: `isAdmin && elevatedControlsEnabled`

### 3. Read-Only Impersonation

**Component**: `src/components/admin/ImpersonationView.tsx`

**Features**:
- Floating button at top-right: "👁️ Impersonate"
- Enter user ID or email to start impersonation
- Red banner appears when impersonation is active
- Strictly read-only mode (cannot make changes)
- All impersonation sessions are logged (start and end)

**Visibility**: `isAdmin && elevatedControlsEnabled`

**Usage Flow**:
1. Click "👁️ Impersonate" button
2. Enter user ID or email
3. Click "Start"
4. Red banner appears: "Read-Only Impersonation Active"
5. Click "Exit Impersonation" when done

## API Endpoints

### POST /api/admin/audit

Log a privileged admin action.

**Request**:
```json
{
  "actionType": "debug_view_accessed",
  "actionDetails": {
    "timestamp": "2026-02-15T12:00:00Z",
    "sessionId": "uuid-here"
  }
}
```

**Response**:
```json
{
  "success": true
}
```

**Authorization**: Requires authenticated admin user

### GET /api/admin/audit

Retrieve audit logs (admin only).

**Query Parameters**:
- `limit` (number, default: 50): Number of logs to return
- `offset` (number, default: 0): Offset for pagination
- `actionType` (string, optional): Filter by action type

**Response**:
```json
{
  "logs": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "user_email": "aditya@cubiqo.ai",
      "action_type": "debug_view_accessed",
      "action_details": { ... },
      "ip_address": "1.2.3.4",
      "user_agent": "Mozilla/5.0...",
      "created_at": "2026-02-15T12:00:00Z"
    }
  ]
}
```

**Authorization**: Requires authenticated admin user

## Integration

### Adding AdminControls to Pages

Add the `<AdminControls />` component to any page where you want admin controls to be available:

```typescript
import { AdminControls } from '@/components/admin';

export default function MyPage() {
  return (
    <div>
      <AdminControls />
      {/* Rest of your page content */}
    </div>
  );
}
```

**Integrated Pages**:
- `/` - Main fullscreen app
- `/chat` - Text chat interface
- `/[region]/chat` - Regional chat interface

## Security Considerations

1. **Durable Admin Flag**: The `is_admin` flag is permanent and can only be changed via database migration or manual SQL update
2. **RLS Policies**: Audit logs can only be viewed by admin users
3. **Feature Flags**: Elevated controls can be toggled via environment variables
4. **Read-Only Impersonation**: Strictly read-only, cannot make changes on behalf of other users
5. **Audit Trail**: Every privileged action is logged with timestamp, IP, and user agent

## Testing

### Local Development

1. Set environment variable:
   ```env
   NEXT_PUBLIC_ENABLE_ADMIN_CONTROLS=true
   ```

2. Run database migration:
   ```bash
   # Apply migration to Supabase
   supabase db push
   ```

3. Set admin flag for test user:
   ```sql
   UPDATE profiles SET is_admin = true WHERE email = 'your-email@example.com';
   ```

4. Sign in with the admin user
5. Admin controls should appear automatically

### Verification Checklist

- [ ] Admin user sees 🐛 Debug button in bottom-right
- [ ] Admin user sees ⚡ Confirmations Bypassed badge at top-right
- [ ] Admin user sees 👁️ Impersonate button at top-right
- [ ] Debug view shows correct session information
- [ ] Confirmations are bypassed for non-destructive actions
- [ ] Dangerous confirmations still require confirmation
- [ ] Impersonation shows red banner when active
- [ ] All admin actions create entries in `audit_logs` table

### Query Audit Logs

```sql
-- View all audit logs
SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10;

-- View logs for specific admin
SELECT * FROM audit_logs WHERE user_email = 'aditya@cubiqo.ai' ORDER BY created_at DESC;

-- View logs by action type
SELECT * FROM audit_logs WHERE action_type = 'debug_view_accessed' ORDER BY created_at DESC;
```

## Maintenance

### Adding New Admin Users

```sql
UPDATE profiles SET is_admin = true WHERE email = 'new-admin@example.com';
```

### Revoking Admin Access

```sql
UPDATE profiles SET is_admin = false WHERE email = 'user@example.com';
```

### Viewing Admin Users

```sql
SELECT id, email, handle, is_admin FROM profiles WHERE is_admin = true;
```

## Acceptance Criteria

✅ **Durable Admin Flag**: `is_admin` field added to `profiles` table for `aditya@cubiqo.ai`

✅ **Memory Layer**: Admin status available via `useAdmin()` hook

✅ **Feature Flag**: `ADMIN_ELEVATED_CONTROLS` feature flag controls UI visibility

✅ **Debug View**: Elevated debug panel visible to admins

✅ **Bypass Confirmations**: Non-destructive confirmations are bypassed for admins

✅ **Read-Only Impersonation**: Admins can view other users' sessions (read-only)

✅ **Audit Logging**: Every privileged action creates an entry in `audit_logs` table

✅ **UI Integration**: Admin controls integrated into main pages

✅ **Build Success**: Application builds without errors
