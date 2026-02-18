# Admin Security & User Management API Endpoints

**Created:** 2024
**Author:** Blossom (Backend Developer)

This document describes the new admin API endpoints for security management and user management.

---

## Table of Contents

1. [Security Alerts API](#security-alerts-api)
2. [Failed Logins API](#failed-logins-api)
3. [User Management API](#user-management-api)
4. [User Sessions API](#user-sessions-api)
5. [Authentication](#authentication)
6. [Response Format](#response-format)
7. [Error Handling](#error-handling)

---

## Security Alerts API

### GET /api/admin/security/alerts

List security alerts with filtering, sorting, and pagination.

**Authorization:** Admin only (requires `is_admin = true`)

**Query Parameters:**
- `page` (number, default: 1) - Page number for pagination
- `limit` (number, default: 50) - Results per page
- `severity` (string, optional) - Filter by severity: `low`, `medium`, `high`, `critical`
- `status` (string, optional) - Filter by status: `open`, `investigating`, `resolved`, `false_positive`
- `type` (string, optional) - Filter by alert type (e.g., `failed_login`, `brute_force`, `suspicious_activity`)
- `startDate` (ISO 8601 string, optional) - Filter alerts created after this date
- `endDate` (ISO 8601 string, optional) - Filter alerts created before this date
- `sortBy` (string, default: `created_at`) - Field to sort by
- `sortOrder` (string, default: `desc`) - Sort order: `asc` or `desc`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "alert_type": "failed_login",
      "severity": "high",
      "user_id": "uuid",
      "user_email": "user@example.com",
      "ip_address": "192.168.1.1",
      "user_agent": "Mozilla/5.0...",
      "alert_data": {},
      "status": "open",
      "resolved_by": null,
      "resolved_at": null,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "stats": {
    "bySeverity": {
      "low": 10,
      "medium": 5,
      "high": 3,
      "critical": 1
    },
    "byStatus": {
      "open": 15,
      "investigating": 2,
      "resolved": 20,
      "false_positive": 1
    }
  },
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "totalPages": 2
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

**Example:**
```bash
curl -X GET "https://app.cubiqo.ai/api/admin/security/alerts?severity=high&status=open&page=1&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### POST /api/admin/security/alerts

Create a new security alert.

**Authorization:** Admin only (requires `is_admin = true`)

**Request Body:**
```json
{
  "alert_type": "suspicious_activity",
  "severity": "medium",
  "user_id": "uuid",
  "user_email": "user@example.com",
  "ip_address": "192.168.1.1",
  "user_agent": "Mozilla/5.0...",
  "alert_data": {
    "description": "Multiple failed payment attempts",
    "attempt_count": 5
  }
}
```

**Required Fields:**
- `alert_type` (string) - Type of alert
- `severity` (string) - One of: `low`, `medium`, `high`, `critical`

**Optional Fields:**
- `user_id` (uuid) - Associated user ID
- `user_email` (string) - Associated user email
- `ip_address` (string) - IP address
- `user_agent` (string) - User agent string
- `alert_data` (object) - Additional alert metadata

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "alert_type": "suspicious_activity",
    "severity": "medium",
    "status": "open",
    "created_at": "2024-01-01T00:00:00Z"
  },
  "message": "Security alert created successfully",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

**Example:**
```bash
curl -X POST "https://app.cubiqo.ai/api/admin/security/alerts" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "alert_type": "suspicious_activity",
    "severity": "medium",
    "user_email": "user@example.com"
  }'
```

---

## Failed Logins API

### GET /api/admin/security/failed-logins

List recent failed login attempts.

**Authorization:** Admin only (requires `is_admin = true`)

**Query Parameters:**
- `page` (number, default: 1) - Page number for pagination
- `limit` (number, default: 50) - Results per page
- `email` (string, optional) - Filter by user email (partial match)
- `ip` (string, optional) - Filter by IP address (exact match)
- `startDate` (ISO 8601 string, optional) - Filter attempts after this date
- `endDate` (ISO 8601 string, optional) - Filter attempts before this date

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "alert_type": "failed_login",
      "severity": "low",
      "user_email": "user@example.com",
      "ip_address": "192.168.1.1",
      "user_agent": "Mozilla/5.0...",
      "alert_data": {
        "attempt_number": 1,
        "window_minutes": 10
      },
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "topOffenders": {
    "byEmail": [
      { "email": "attacker@example.com", "count": 25 },
      { "email": "user@example.com", "count": 5 }
    ],
    "byIP": [
      { "ip": "192.168.1.1", "count": 30 },
      { "ip": "10.0.0.1", "count": 10 }
    ]
  },
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "totalPages": 2
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

**Example:**
```bash
curl -X GET "https://app.cubiqo.ai/api/admin/security/failed-logins?email=user@example.com" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### POST /api/admin/security/failed-logins

Log a failed login attempt. Automatically creates a brute force alert if threshold is exceeded.

**Authorization:** Public endpoint (can be called by auth middleware)

**Threshold Configuration:**
- `FAILED_LOGIN_THRESHOLD`: 5 attempts
- `THRESHOLD_WINDOW_MINUTES`: 10 minutes

**Request Body:**
```json
{
  "email": "user@example.com",
  "ip_address": "192.168.1.1",
  "user_agent": "Mozilla/5.0..."
}
```

**Required Fields:**
- At least one of: `email` or `ip_address`

**Optional Fields:**
- `user_agent` (string) - User agent string

**Response:**
```json
{
  "success": true,
  "data": {
    "alert_id": "uuid",
    "severity": "low",
    "recent_attempts": 1,
    "threshold_exceeded": false
  },
  "message": "Failed login attempt logged",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

**Brute Force Detection:**
When the threshold is exceeded (5+ failed attempts in 10 minutes), an additional `brute_force` alert with `critical` severity is automatically created.

**Example:**
```bash
curl -X POST "https://app.cubiqo.ai/api/admin/security/failed-logins" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "ip_address": "192.168.1.1"
  }'
```

---

## User Management API

### GET /api/admin/users/[id]

Get detailed information about a specific user, including sessions, activity, and security alerts.

**Authorization:** Admin only (requires `is_admin = true`)

**URL Parameters:**
- `id` (uuid) - User ID

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "display_name": "John Doe",
      "handle": "CQ#123",
      "is_admin": false,
      "preferences": {},
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    },
    "sessions": [
      {
        "id": "uuid",
        "user_id": "uuid",
        "is_guest": false,
        "device_info": {},
        "geo_location": "US",
        "expires_at": "2024-02-01T00:00:00Z",
        "created_at": "2024-01-01T00:00:00Z"
      }
    ],
    "recentActivity": [
      {
        "id": "uuid",
        "user_id": "uuid",
        "activity_type": "page_view",
        "activity_data": {},
        "created_at": "2024-01-01T00:00:00Z"
      }
    ],
    "securityAlerts": [
      {
        "id": "uuid",
        "alert_type": "failed_login",
        "severity": "low",
        "created_at": "2024-01-01T00:00:00Z"
      }
    ],
    "auditLogs": [
      {
        "id": "uuid",
        "action_type": "user_updated",
        "action_details": {},
        "created_at": "2024-01-01T00:00:00Z"
      }
    ],
    "stats": {
      "totalSessions": 5,
      "activeSessions": 2,
      "totalActivities": 50,
      "securityAlerts": 1,
      "lastActivity": "2024-01-01T00:00:00Z",
      "lastLogin": "2024-01-01T00:00:00Z"
    }
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

**Example:**
```bash
curl -X GET "https://app.cubiqo.ai/api/admin/users/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### PATCH /api/admin/users/[id]

Update user information.

**Authorization:** Admin only (requires `is_admin = true`)

**URL Parameters:**
- `id` (uuid) - User ID

**Request Body:**
```json
{
  "display_name": "John Smith",
  "is_admin": true,
  "preferences": {
    "theme": "dark",
    "notifications": true
  }
}
```

**Optional Fields:**
- `display_name` (string) - User's display name
- `is_admin` (boolean) - Admin flag
- `preferences` (object) - User preferences

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "display_name": "John Smith",
    "is_admin": true,
    "preferences": {
      "theme": "dark",
      "notifications": true
    },
    "updated_at": "2024-01-01T00:00:00Z"
  },
  "message": "User updated successfully",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

**Audit Logging:**
All user updates are logged to `audit_logs` with details of what changed.

**Example:**
```bash
curl -X PATCH "https://app.cubiqo.ai/api/admin/users/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "display_name": "John Smith",
    "is_admin": true
  }'
```

---

### DELETE /api/admin/users/[id]

Soft delete (archive) a user account.

**Authorization:** Admin only (requires `is_admin = true`)

**URL Parameters:**
- `id` (uuid) - User ID

**Behavior:**
- Adds `deleted_at` and `deleted_by` to user's preferences
- Expires all active sessions
- Does NOT delete the user record (soft delete)
- Prevents self-deletion

**Response:**
```json
{
  "success": true,
  "message": "User archived successfully",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

**Audit Logging:**
Deletion is logged to `audit_logs` with target user details.

**Example:**
```bash
curl -X DELETE "https://app.cubiqo.ai/api/admin/users/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## User Sessions API

### GET /api/admin/users/[id]/sessions

List all sessions for a specific user.

**Authorization:** Admin only (requires `is_admin = true`)

**URL Parameters:**
- `id` (uuid) - User ID

**Query Parameters:**
- `active` (boolean, default: false) - Filter for active sessions only
- `page` (number, default: 1) - Page number for pagination
- `limit` (number, default: 50) - Results per page

**Response:**
```json
{
  "success": true,
  "data": {
    "sessions": [
      {
        "id": "uuid",
        "user_id": "uuid",
        "is_guest": false,
        "device_info": {
          "browser": "Chrome",
          "os": "Windows"
        },
        "geo_location": "US",
        "expires_at": "2024-02-01T00:00:00Z",
        "created_at": "2024-01-01T00:00:00Z"
      }
    ],
    "stats": {
      "total": 10,
      "active": 2,
      "expired": 8
    }
  },
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 10,
    "totalPages": 1
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

**Example:**
```bash
curl -X GET "https://app.cubiqo.ai/api/admin/users/550e8400-e29b-41d4-a716-446655440000/sessions?active=true" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### DELETE /api/admin/users/[id]/sessions

Terminate specific session or all sessions for a user.

**Authorization:** Admin only (requires `is_admin = true`)

**URL Parameters:**
- `id` (uuid) - User ID

**Query Parameters:**
- `session_id` (uuid, optional) - Specific session to terminate. If omitted, terminates ALL active sessions.

**Response (single session):**
```json
{
  "success": true,
  "data": {
    "terminatedCount": 1
  },
  "message": "Session terminated successfully",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

**Response (all sessions):**
```json
{
  "success": true,
  "data": {
    "terminatedCount": 5
  },
  "message": "All 5 active session(s) terminated successfully",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

**Audit Logging:**
Session termination is logged to `audit_logs` with session details.

**Example (terminate specific session):**
```bash
curl -X DELETE "https://app.cubiqo.ai/api/admin/users/550e8400-e29b-41d4-a716-446655440000/sessions?session_id=abc123" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Example (terminate all sessions):**
```bash
curl -X DELETE "https://app.cubiqo.ai/api/admin/users/550e8400-e29b-41d4-a716-446655440000/sessions" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Authentication

All admin endpoints (except `POST /api/admin/security/failed-logins`) require admin authentication:

1. **User Authentication:** Request must include a valid Supabase auth token
2. **Admin Check:** User's profile must have `is_admin = true`

**Headers:**
```
Authorization: Bearer YOUR_SUPABASE_TOKEN
```

**Error Responses:**

**401 Unauthorized** - No valid auth token:
```json
{
  "error": "Unauthorized"
}
```

**403 Forbidden** - User is authenticated but not an admin:
```json
{
  "error": "Forbidden: Admin access required"
}
```

---

## Response Format

### Success Response

All successful responses follow this format:

```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Operation successful",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### Paginated Response

Endpoints that return lists include pagination:

```json
{
  "success": true,
  "data": [ /* array of items */ ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "totalPages": 2
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

---

## Error Handling

### Error Response Format

```json
{
  "success": false,
  "error": "Error message",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### HTTP Status Codes

- `200 OK` - Successful operation
- `400 Bad Request` - Invalid input (missing required fields, invalid format)
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Authenticated but not authorized (not admin)
- `404 Not Found` - Resource not found (user, session, etc.)
- `500 Internal Server Error` - Server error

### Common Errors

**Invalid UUID Format:**
```json
{
  "success": false,
  "error": "Invalid user ID format"
}
```

**Missing Required Field:**
```json
{
  "success": false,
  "error": "alert_type is required"
}
```

**Invalid Field Value:**
```json
{
  "success": false,
  "error": "severity must be one of: low, medium, high, critical"
}
```

**Self-Deletion Attempt:**
```json
{
  "success": false,
  "error": "Cannot delete your own account"
}
```

---

## Database Schema

### security_alerts

```sql
CREATE TABLE security_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  user_email TEXT,
  ip_address TEXT,
  user_agent TEXT,
  alert_data JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'false_positive')),
  resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### user_activity_log

```sql
CREATE TABLE user_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  activity_data JSONB DEFAULT '{}'::jsonb,
  channel TEXT,
  ip_address TEXT,
  user_agent TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### audit_logs

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  user_email TEXT,
  action_type TEXT NOT NULL,
  action_details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Testing

### Test Admin User

To test these endpoints, you need a user with `is_admin = true`.

**Set admin flag in database:**
```sql
UPDATE profiles
SET is_admin = true
WHERE email = 'admin@example.com';
```

### Example Test Flow

1. **Authenticate as admin**
2. **List security alerts:** `GET /api/admin/security/alerts`
3. **Create a security alert:** `POST /api/admin/security/alerts`
4. **Log failed login:** `POST /api/admin/security/failed-logins`
5. **Get user details:** `GET /api/admin/users/[id]`
6. **Update user:** `PATCH /api/admin/users/[id]`
7. **List user sessions:** `GET /api/admin/users/[id]/sessions`
8. **Terminate sessions:** `DELETE /api/admin/users/[id]/sessions`

---

## Security Considerations

1. **Admin-Only Access:** All endpoints check `is_admin = true` before allowing access
2. **Audit Logging:** All admin actions are logged to `audit_logs` for accountability
3. **Input Validation:** All inputs are validated before database operations
4. **UUID Validation:** UUIDs are validated with regex before queries
5. **Soft Delete:** Users are archived, not permanently deleted
6. **Session Security:** Sessions are expired, not deleted
7. **Brute Force Detection:** Automatic alerts when login attempts exceed threshold
8. **Self-Protection:** Admins cannot delete their own accounts

---

## Future Enhancements

- [ ] Add email notifications for critical security alerts
- [ ] Implement IP blocking for repeated brute force attempts
- [ ] Add webhook support for security events
- [ ] Export audit logs to external systems (SIEM)
- [ ] Add 2FA/MFA enforcement for admin accounts
- [ ] Implement rate limiting per user/IP
- [ ] Add geo-fencing rules
- [ ] Create admin dashboard UI
- [ ] Add bulk user operations
- [ ] Implement user impersonation (with audit logging)

---

## Support

For questions or issues:
- **Backend Lead:** Blossom (Backend Developer)
- **CTO:** MO (Technical Architecture)
- **GitHub:** Create an issue in the repository

---

**End of Documentation**
