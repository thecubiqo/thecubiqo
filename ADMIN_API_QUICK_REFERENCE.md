# Admin API Quick Reference - Integrations & Reports

## Endpoints Overview

| Method | Endpoint | Description | Admin Only |
|--------|----------|-------------|------------|
| GET | `/api/admin/integrations/health` | List integration health statuses | ✅ |
| POST | `/api/admin/integrations/health` | Update integration health | ✅ |
| GET | `/api/admin/integrations/list` | List all configured integrations | ✅ |
| POST | `/api/admin/reports/generate` | Generate compliance/activity report | ✅ |
| GET | `/api/admin/reports/list` | List generated reports | ✅ |

## Quick Examples

### Check Integration Health
```bash
GET /api/admin/integrations/health?status=healthy&limit=10
```

### Update Integration Health
```bash
POST /api/admin/integrations/health
{
  "integration_name": "stripe_payment",
  "integration_type": "payment",
  "status": "healthy",
  "response_time_ms": 120,
  "success_rate": 0.998
}
```

### List Integrations
```bash
GET /api/admin/integrations/list?type=oauth&include_health=true
```

### Generate User Activity Report
```bash
POST /api/admin/reports/generate
{
  "report_type": "user_activity",
  "date_range_start": "2024-01-01T00:00:00Z",
  "date_range_end": "2024-01-31T23:59:59Z"
}
```

### List Reports
```bash
GET /api/admin/reports/list?report_type=user_activity&limit=20
```

## Report Types

1. **user_activity** - User signups, logins, actions
2. **compliance_gdpr** - GDPR data requests, deletions
3. **compliance_ccpa** - CCPA do-not-sell requests
4. **ai_performance** - AI usage, tokens, performance
5. **security_audit** - Security events, failed logins

## Response Structure

All endpoints return:
```typescript
{
  success: boolean,
  data: object,
  error?: string,
  pagination?: { limit, offset, total, hasMore },
  timestamp: string
}
```

## Status Codes

- **200** - Success
- **201** - Created (report generated)
- **400** - Bad Request (validation error)
- **401** - Unauthorized (not authenticated)
- **403** - Forbidden (not admin)
- **500** - Internal Server Error

## Integration Health Statuses

- **healthy** - Working normally
- **degraded** - Experiencing issues but operational
- **down** - Not functioning
- **maintenance** - Planned downtime

## Files Location

- **API Endpoints**: `src/app/api/admin/integrations/` and `src/app/api/admin/reports/`
- **Tests**: `tests/api/admin-integrations-reports.test.ts`
- **Documentation**: `docs/API_ADMIN_INTEGRATIONS_REPORTS.md`
- **Summary**: `ADMIN_API_INTEGRATIONS_REPORTS_SUMMARY.md`

## Audit Action Types (added)

- `view_integration_health`
- `update_integration_health`
- `view_integrations`
- `generate_report`
- `view_reports`

## Database Tables

- `integration_health` - Health metrics
- `compliance_reports` - Generated reports
- `audit_logs` - Admin action logs

## Next Steps

1. Integrate with admin dashboard UI
2. Add real-time health monitoring
3. Schedule automated report generation
4. Add PDF/CSV export
5. Configure alerts for unhealthy integrations
