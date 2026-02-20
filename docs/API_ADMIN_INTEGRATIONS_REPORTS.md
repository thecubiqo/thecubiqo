# Admin API Endpoints: Integrations & Reports

This document describes the new admin API endpoints for integration monitoring and report generation.

## Table of Contents

- [Integration Health Monitoring](#integration-health-monitoring)
- [Integration List](#integration-list)
- [Report Generation](#report-generation)
- [Reports List](#reports-list)
- [Authentication](#authentication)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)

---

## Integration Health Monitoring

### GET /api/admin/integrations/health

Retrieves health status for all configured integrations with real-time metrics.

**Authentication:** Admin only

**Query Parameters:**
- `status` (optional): Filter by status (`healthy`, `degraded`, `down`, `maintenance`)
- `integration_type` (optional): Filter by integration type
- `limit` (optional): Results per page (default: 50, max: 100)
- `offset` (optional): Pagination offset (default: 0)

**Response Example:**
```json
{
  "success": true,
  "data": {
    "integrations": [
      {
        "id": "uuid",
        "integration_name": "supabase_auth",
        "integration_type": "oauth",
        "status": "healthy",
        "last_checked_at": "2024-01-15T10:30:00Z",
        "response_time_ms": 150,
        "error_count": 0,
        "success_rate": 0.99,
        "uptime_percentage": 99.0,
        "is_healthy": true,
        "last_checked_ago": "5m ago",
        "health_data": {
          "additional": "metrics"
        }
      }
    ],
    "summary": {
      "healthy": 8,
      "degraded": 1,
      "down": 0,
      "maintenance": 0,
      "total": 9
    }
  },
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 9,
    "hasMore": false
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Status Codes:**
- `200`: Success
- `401`: Unauthorized (not authenticated)
- `403`: Forbidden (not an admin)
- `500`: Internal server error

---

### POST /api/admin/integrations/health

Updates integration health status (manual check or automated monitoring result).

**Authentication:** Admin only

**Request Body:**
```json
{
  "integration_name": "string (required)",
  "integration_type": "string (required)",
  "status": "healthy | degraded | down | maintenance (required)",
  "response_time_ms": 150,
  "error_count": 0,
  "success_rate": 0.99,
  "health_data": {
    "custom": "metadata"
  }
}
```

**Response Example:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "integration_name": "test_integration",
    "integration_type": "api",
    "status": "healthy",
    "last_checked_at": "2024-01-15T10:30:00Z",
    "response_time_ms": 150,
    "error_count": 0,
    "success_rate": 0.99,
    "uptime_percentage": 99.0,
    "is_healthy": true
  },
  "message": "Integration health updated successfully",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Validation Rules:**
- `integration_name`: Required, non-empty string
- `integration_type`: Required, non-empty string
- `status`: Required, must be one of: `healthy`, `degraded`, `down`, `maintenance`
- `response_time_ms`: Optional, non-negative number
- `error_count`: Optional, non-negative number
- `success_rate`: Optional, number between 0 and 1

**Status Codes:**
- `200`: Success
- `400`: Bad request (validation error)
- `401`: Unauthorized
- `403`: Forbidden
- `500`: Internal server error

---

## Integration List

### GET /api/admin/integrations/list

Retrieves all configured integrations with their current status and health metrics.

**Authentication:** Admin only

**Query Parameters:**
- `type` (optional): Filter by integration type (`oauth`, `api`, `webhook`, `database`, `storage`, `analytics`, `email`, `payment`, `other`)
- `enabled` (optional): Filter by enabled status (`true`, `false`)
- `search` (optional): Search by name or provider
- `include_health` (optional): Include health metrics (default: `true`)
- `limit` (optional): Results per page (default: 50, max: 100)
- `offset` (optional): Pagination offset (default: 0)

**Response Example:**
```json
{
  "success": true,
  "data": {
    "integrations": [
      {
        "name": "supabase_auth",
        "type": "oauth",
        "enabled": true,
        "provider": "Supabase",
        "description": "Primary authentication provider",
        "config_details": {
          "supports_email": true,
          "supports_oauth": true,
          "providers": ["google", "github", "azure"]
        },
        "last_sync": "2024-01-15T10:30:00Z",
        "health": {
          "status": "healthy",
          "last_checked_at": "2024-01-15T10:30:00Z",
          "response_time_ms": 150,
          "error_count": 0,
          "success_rate": 0.99,
          "uptime_percentage": "99.00"
        }
      }
    ],
    "summary": {
      "total": 10,
      "enabled": 9,
      "disabled": 1,
      "by_type": {
        "oauth": 3,
        "database": 1,
        "storage": 1,
        "api": 2,
        "webhook": 1,
        "analytics": 2
      },
      "health_summary": {
        "healthy": 8,
        "degraded": 1,
        "down": 0,
        "unknown": 1
      }
    }
  },
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 10,
    "hasMore": false
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Integration Types:**
- `oauth`: OAuth authentication providers
- `api`: External API integrations
- `webhook`: Webhook endpoints
- `database`: Database connections
- `storage`: File storage services
- `analytics`: Analytics services
- `email`: Email service providers
- `payment`: Payment processors
- `other`: Other integration types

**Status Codes:**
- `200`: Success
- `401`: Unauthorized
- `403`: Forbidden
- `500`: Internal server error

---

## Report Generation

### POST /api/admin/reports/generate

Generates a report based on the specified type and date range.

**Authentication:** Admin only

**Request Body:**
```json
{
  "report_type": "user_activity | compliance_gdpr | compliance_ccpa | ai_performance | security_audit",
  "report_format": "json | csv | pdf | html (default: json)",
  "date_range_start": "2024-01-01T00:00:00Z",
  "date_range_end": "2024-01-31T23:59:59Z",
  "filters": {
    "optional": "filters"
  }
}
```

**Report Types:**

1. **user_activity**: User registration, logins, actions, and engagement metrics
2. **compliance_gdpr**: GDPR compliance tracking (data access/deletion requests, consent management)
3. **compliance_ccpa**: CCPA compliance tracking (do-not-sell requests, data disclosures)
4. **ai_performance**: AI model usage, performance metrics, token usage
5. **security_audit**: Security events, failed logins, suspicious activities

**Response Example:**
```json
{
  "success": true,
  "data": {
    "report_id": "uuid",
    "report_type": "user_activity",
    "report_format": "json",
    "report_data": {
      "summary": {
        "date_range": {
          "start": "2024-01-01T00:00:00Z",
          "end": "2024-01-31T23:59:59Z"
        },
        "new_users": 150,
        "active_users": 450,
        "total_actions": 12500
      },
      "actions_by_type": {
        "login": 3500,
        "profile_update": 250,
        "document_upload": 180
      },
      "daily_activity": {
        "2024-01-01": 420,
        "2024-01-02": 385
      }
    },
    "generated_at": "2024-01-15T10:30:00Z",
    "generated_by": "admin-user-id",
    "date_range": {
      "start": "2024-01-01T00:00:00Z",
      "end": "2024-01-31T23:59:59Z"
    }
  },
  "message": "Report generated successfully",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Validation Rules:**
- `report_type`: Required, must be one of the supported types
- `report_format`: Optional, defaults to `json`
- `date_range_start`: Required, ISO8601 format
- `date_range_end`: Required, ISO8601 format, must be after start date

**Status Codes:**
- `201`: Created (report generated successfully)
- `400`: Bad request (validation error)
- `401`: Unauthorized
- `403`: Forbidden
- `500`: Internal server error

---

## Reports List

### GET /api/admin/reports/list

Retrieves all previously generated reports from the compliance_reports table.

**Authentication:** Admin only

**Query Parameters:**
- `report_type` (optional): Filter by report type
- `generated_by` (optional): Filter by user ID who generated the report
- `date_from` (optional): Filter reports generated after this date (ISO8601)
- `date_to` (optional): Filter reports generated before this date (ISO8601)
- `date_range_start` (optional): Filter by report's data date range start
- `date_range_end` (optional): Filter by report's data date range end
- `include_data` (optional): Include full report_data in response (default: `false`)
- `limit` (optional): Results per page (default: 20, max: 100)
- `offset` (optional): Pagination offset (default: 0)
- `sort` (optional): Sort field (`created_at`, `report_type`) (default: `created_at`)
- `order` (optional): Sort order (`asc`, `desc`) (default: `desc`)

**Response Example:**
```json
{
  "success": true,
  "data": {
    "reports": [
      {
        "id": "uuid",
        "report_type": "user_activity",
        "report_format": "json",
        "generated_by": "admin-user-id",
        "generated_by_user": {
          "id": "admin-user-id",
          "email": "admin@example.com",
          "full_name": "Admin User"
        },
        "date_range_start": "2024-01-01T00:00:00Z",
        "date_range_end": "2024-01-31T23:59:59Z",
        "file_path": null,
        "created_at": "2024-01-15T10:30:00Z",
        "data_summary": {
          "has_data": true,
          "summary": {
            "new_users": 150,
            "active_users": 450
          }
        }
      }
    ],
    "summary": {
      "total": 45,
      "by_type": {
        "user_activity": 15,
        "compliance_gdpr": 10,
        "compliance_ccpa": 8,
        "ai_performance": 7,
        "security_audit": 5
      },
      "recent_count": 3,
      "last_generated": "2024-01-15T10:30:00Z"
    }
  },
  "pagination": {
    "limit": 20,
    "offset": 0,
    "total": 45,
    "hasMore": true,
    "page": 1,
    "totalPages": 3
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Status Codes:**
- `200`: Success
- `401`: Unauthorized
- `403`: Forbidden
- `500`: Internal server error

---

## Authentication

All endpoints require admin authentication. Include credentials via:

1. **Cookie-based session** (for browser requests)
2. **Authorization header** (for API clients):
   ```
   Authorization: Bearer <access_token>
   ```

The API will:
1. Verify the user is authenticated
2. Check the user has `is_admin = true` in their profile
3. Reject requests from non-admin users with `403 Forbidden`

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

**Common Error Codes:**
- `400`: Bad Request - Invalid input, validation failed
- `401`: Unauthorized - Not authenticated
- `403`: Forbidden - Not an admin
- `404`: Not Found - Resource doesn't exist
- `500`: Internal Server Error - Server-side error

---

## Rate Limiting

Currently, no rate limiting is enforced at the endpoint level. However, it's recommended to:

1. Implement rate limiting at the infrastructure level (e.g., API gateway)
2. Monitor API usage per admin user
3. Set reasonable `limit` values in paginated requests

**Recommended Limits:**
- Health checks: 100 requests/minute per admin
- Report generation: 10 requests/minute per admin (resource-intensive)
- List endpoints: 60 requests/minute per admin

---

## Audit Logging

All admin actions are automatically logged to the `audit_logs` table:

- `view_integration_health`: Viewing integration health status
- `update_integration_health`: Updating integration health
- `view_integrations`: Viewing integration list
- `generate_report`: Generating a report
- `view_reports`: Viewing reports list

Each log includes:
- User ID and email
- Action type
- Action details (filters, parameters)
- IP address
- User agent
- Timestamp

---

## Database Tables

### integration_health
Stores health metrics for external integrations.

**Columns:**
- `id` (UUID, PK)
- `integration_name` (TEXT, UNIQUE)
- `integration_type` (TEXT)
- `status` (TEXT)
- `last_checked_at` (TIMESTAMPTZ)
- `response_time_ms` (INTEGER)
- `error_count` (INTEGER)
- `success_rate` (NUMERIC)
- `health_data` (JSONB)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

### compliance_reports
Stores generated compliance and activity reports.

**Columns:**
- `id` (UUID, PK)
- `report_type` (TEXT)
- `report_format` (TEXT)
- `report_data` (JSONB)
- `generated_by` (UUID, FK -> profiles.id)
- `date_range_start` (TIMESTAMPTZ)
- `date_range_end` (TIMESTAMPTZ)
- `file_path` (TEXT, nullable)
- `created_at` (TIMESTAMPTZ)

---

## Examples

### Example 1: Check Integration Health

```bash
curl -X GET "https://api.example.com/api/admin/integrations/health?status=healthy" \
  -H "Authorization: Bearer <token>"
```

### Example 2: Update Integration Health

```bash
curl -X POST "https://api.example.com/api/admin/integrations/health" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "integration_name": "stripe_payment",
    "integration_type": "payment",
    "status": "healthy",
    "response_time_ms": 120,
    "success_rate": 0.998
  }'
```

### Example 3: Generate User Activity Report

```bash
curl -X POST "https://api.example.com/api/admin/reports/generate" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "report_type": "user_activity",
    "date_range_start": "2024-01-01T00:00:00Z",
    "date_range_end": "2024-01-31T23:59:59Z"
  }'
```

### Example 4: List Recent Reports

```bash
curl -X GET "https://api.example.com/api/admin/reports/list?limit=10&sort=created_at&order=desc" \
  -H "Authorization: Bearer <token>"
```

---

## Security Considerations

1. **Admin-only access**: All endpoints require `is_admin = true`
2. **Audit logging**: All actions are logged for compliance
3. **Input validation**: All inputs are validated before processing
4. **SQL injection prevention**: Uses parameterized queries
5. **Rate limiting**: Recommended to prevent abuse
6. **HTTPS only**: Never use these endpoints over plain HTTP

---

## Future Enhancements

- [ ] Real-time health monitoring with WebSocket support
- [ ] Scheduled report generation with email delivery
- [ ] Export reports to PDF/CSV formats
- [ ] Custom report templates
- [ ] Alert rules for unhealthy integrations
- [ ] Integration health history and trends
- [ ] Automated health check scheduling
- [ ] Webhook notifications for health status changes
