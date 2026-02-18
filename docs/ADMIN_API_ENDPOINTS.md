# Admin Dashboard API Endpoints

This document describes the four new API endpoints created for the admin dashboard.

## 🔒 Authentication

All endpoints require **admin-only access**. Requests must include:
- Valid Supabase authentication token
- User profile with `is_admin = true`

**Error Responses:**
- `401 Unauthorized` - No valid authentication token
- `403 Forbidden` - User is not an admin

---

## 1. Analytics Overview

### `GET /api/admin/analytics/overview`

Comprehensive analytics overview with user metrics, session statistics, and growth trends.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `startDate` | ISO 8601 | No | Start date for filtering (future enhancement) |
| `endDate` | ISO 8601 | No | End date for filtering (future enhancement) |

#### Response Schema

```json
{
  "success": true,
  "data": {
    "users": {
      "total": 1234,
      "active7d": 456,
      "active30d": 789,
      "engagementRate7d": 37.03,
      "engagementRate30d": 63.95
    },
    "sessions": {
      "total": 5678,
      "activeNow": 23,
      "avgDurationMinutes": 12.45
    },
    "content": {
      "totalMessages": 12345,
      "totalConversations": 2345,
      "avgMessagesPerConversation": 5.26
    },
    "engagement": {
      "byType": {
        "message_sent": 12345,
        "voice_interaction": 3456,
        "feature_used": 789
      },
      "byChannel": {
        "voice": 3456,
        "text": 8889
      }
    },
    "growth": {
      "daily": [
        { "date": "2026-02-01", "count": 12 },
        { "date": "2026-02-02", "count": 15 }
      ],
      "weekly": [
        { "week": "2026-02-02", "count": 67 },
        { "week": "2026-02-09", "count": 89 }
      ]
    }
  },
  "timestamp": "2026-02-18T06:56:00.000Z"
}
```

#### Key Metrics

- **Total Users**: Total registered users
- **Active Users**: Users with activity in last 7/30 days
- **Engagement Rate**: Percentage of users active in time period
- **Session Duration**: Average session length in minutes
- **Growth Trends**: Daily and weekly new user registrations

---

## 2. User Engagement Metrics

### `GET /api/admin/analytics/user-engagement`

Detailed user engagement metrics including session frequency, feature usage, and cohort analysis.

#### Response Schema

```json
{
  "success": true,
  "data": {
    "sessionFrequency": {
      "veryActive": 45,
      "active": 123,
      "moderate": 234,
      "light": 345,
      "minimal": 456
    },
    "featureUsage": [
      { "feature": "message_sent", "count": 12345 },
      { "feature": "voice_interaction", "count": 3456 }
    ],
    "channelBreakdown": [
      {
        "channel": "voice",
        "uniqueUsers": 234,
        "totalActivities": 3456
      },
      {
        "channel": "text",
        "uniqueUsers": 567,
        "totalActivities": 8889
      }
    ],
    "retention": {
      "cohorts": [
        {
          "cohort": "30-day",
          "totalUsers": 100,
          "retainedUsers": 45,
          "retentionRate": 45.00
        },
        {
          "cohort": "60-day",
          "totalUsers": 150,
          "retainedUsers": 60,
          "retentionRate": 40.00
        },
        {
          "cohort": "90-day",
          "totalUsers": 200,
          "retainedUsers": 70,
          "retentionRate": 35.00
        }
      ],
      "overallRetentionRate": 40.00
    },
    "engagement": {
      "avgActivitiesPerUser": 12.34,
      "totalUniqueUsers": 567,
      "topEngagedUsers": [
        {
          "userId": "uuid",
          "email": "user@example.com",
          "displayName": "John Doe",
          "handle": "@johndoe",
          "activityCount": 456
        }
      ]
    }
  },
  "timestamp": "2026-02-18T06:56:00.000Z"
}
```

#### Session Frequency Categories

- **Very Active**: 20+ sessions in 30 days
- **Active**: 10-19 sessions
- **Moderate**: 5-9 sessions
- **Light**: 2-4 sessions
- **Minimal**: 1 session

#### Cohort Analysis

Tracks retention of users who signed up:
- 30 days ago
- 60 days ago
- 90 days ago

Retention is measured as users who were active in the last 7 days.

---

## 3. Fraud Transaction Monitoring

### `GET /api/admin/fraud/transactions`

List transactions with fraud scores and filtering options.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | number | No | Page number (default: 1) |
| `limit` | number | No | Results per page (default: 50) |
| `status` | string | No | Filter by status: pending, processing, completed, failed, refunded, disputed |
| `flaggedOnly` | boolean | No | Show only flagged transactions |
| `minFraudScore` | number | No | Minimum fraud score (0-100) |
| `startDate` | ISO 8601 | No | Filter from date |
| `endDate` | ISO 8601 | No | Filter to date |
| `userId` | UUID | No | Filter by user ID |

#### Response Schema

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "transaction_type": "payment",
      "amount": 99.99,
      "currency": "USD",
      "status": "completed",
      "payment_method": "credit_card",
      "fraud_score": 15.5,
      "flagged_for_review": false,
      "created_at": "2026-02-18T06:56:00.000Z",
      "profiles": {
        "email": "user@example.com",
        "display_name": "John Doe",
        "handle": "@johndoe"
      }
    }
  ],
  "statistics": {
    "totalTransactions": 1234,
    "flaggedForReview": 45,
    "highRiskCount": 12,
    "mediumRiskCount": 78,
    "lowRiskCount": 1144,
    "avgFraudScore": 23.45,
    "statusBreakdown": {
      "pending": 23,
      "processing": 12,
      "completed": 1100,
      "failed": 45,
      "refunded": 34,
      "disputed": 20
    }
  },
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1234,
    "totalPages": 25
  },
  "timestamp": "2026-02-18T06:56:00.000Z"
}
```

### `POST /api/admin/fraud/transactions`

Create a new transaction with automatic fraud scoring.

#### Request Body

```json
{
  "user_id": "uuid",
  "transaction_type": "payment",
  "amount": 99.99,
  "currency": "USD",
  "status": "pending",
  "payment_method": "credit_card",
  "transaction_data": {}
}
```

#### Required Fields

- `transaction_type` (string)
- `amount` (number, must be positive)

#### Fraud Scoring Logic

The system automatically calculates fraud scores based on:

1. **Transaction Amount** (0-20 points)
   - > $1000: +20 points
   - > $500: +10 points
   - > $100: +5 points

2. **User History** (0-55 points)
   - Failed transactions > 3: +25 points
   - Failed transactions > 1: +15 points
   - Any disputed transactions: +30 points
   - Average previous fraud score > 70: +20 points
   - Average previous fraud score > 40: +10 points

3. **Payment Method** (0-15 points)
   - Risky methods (crypto, gift_card, wire_transfer): +15 points

**Total Score**: Capped at 100

**Actions Triggered**:
- Score ≥ 50: Flagged for review
- Score ≥ 70: Security alert created (high severity)
- Score ≥ 90: Security alert created (critical severity)

#### Response Schema

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "transaction_type": "payment",
    "amount": 99.99,
    "currency": "USD",
    "status": "pending",
    "fraud_score": 45.5,
    "flagged_for_review": false,
    "created_at": "2026-02-18T06:56:00.000Z"
  },
  "fraudAnalysis": {
    "score": 45.5,
    "flagged": false,
    "riskLevel": "medium"
  },
  "message": "Transaction created successfully",
  "timestamp": "2026-02-18T06:56:00.000Z"
}
```

---

## 4. Fraud Detection Rules

### `GET /api/admin/fraud/rules`

List all fraud detection rules with hit counts.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | number | No | Page number (default: 1) |
| `limit` | number | No | Results per page (default: 50) |
| `enabled` | boolean | No | Filter by enabled status |
| `ruleType` | string | No | Filter by rule type |
| `severity` | string | No | Filter by severity: low, medium, high, critical |

#### Response Schema

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "rule_name": "High Value Transaction",
      "rule_type": "amount_threshold",
      "rule_condition": {
        "operator": "greater_than",
        "value": 1000
      },
      "severity": "high",
      "action": "review",
      "enabled": true,
      "hit_count": 45,
      "last_triggered_at": "2026-02-18T05:30:00.000Z",
      "created_at": "2026-01-01T00:00:00.000Z",
      "updated_at": "2026-02-18T06:56:00.000Z"
    }
  ],
  "statistics": {
    "totalRules": 15,
    "enabledRules": 12,
    "disabledRules": 3,
    "totalHits": 234,
    "bySeverity": {
      "critical": 2,
      "high": 5,
      "medium": 6,
      "low": 2
    },
    "byType": {
      "amount_threshold": 5,
      "velocity_check": 3,
      "pattern_match": 7
    }
  },
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 15,
    "totalPages": 1
  },
  "timestamp": "2026-02-18T06:56:00.000Z"
}
```

### `POST /api/admin/fraud/rules`

Create a new fraud detection rule.

#### Request Body

```json
{
  "rule_name": "High Value Transaction",
  "rule_type": "amount_threshold",
  "rule_condition": {
    "operator": "greater_than",
    "value": 1000
  },
  "severity": "high",
  "action": "review",
  "enabled": true
}
```

#### Required Fields

- `rule_name` (string, unique)
- `rule_type` (string)
- `rule_condition` (JSON object)
- `severity` (string): low, medium, high, critical
- `action` (string): flag, block, notify, review

#### Response Schema

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "rule_name": "High Value Transaction",
    "rule_type": "amount_threshold",
    "rule_condition": { "operator": "greater_than", "value": 1000 },
    "severity": "high",
    "action": "review",
    "enabled": true,
    "hit_count": 0,
    "created_at": "2026-02-18T06:56:00.000Z"
  },
  "message": "Fraud detection rule created successfully",
  "timestamp": "2026-02-18T06:56:00.000Z"
}
```

### `PATCH /api/admin/fraud/rules`

Update an existing fraud detection rule.

#### Request Body

```json
{
  "rule_id": "uuid",
  "enabled": false,
  "severity": "critical",
  "rule_condition": {
    "operator": "greater_than",
    "value": 5000
  }
}
```

#### Required Fields

- `rule_id` (UUID)

#### Optional Fields

- `rule_name` (string)
- `rule_condition` (JSON object)
- `severity` (string)
- `action` (string)
- `enabled` (boolean)

### `DELETE /api/admin/fraud/rules?rule_id=<uuid>`

Delete a fraud detection rule.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `rule_id` | UUID | Yes | ID of the rule to delete |

#### Response Schema

```json
{
  "success": true,
  "message": "Fraud detection rule deleted successfully",
  "timestamp": "2026-02-18T06:56:00.000Z"
}
```

---

## 📊 Database Tables Used

### Analytics Endpoints

- `profiles` - User accounts
- `sessions` - User sessions
- `user_activity_log` - Detailed activity tracking

### Fraud Endpoints

- `transactions` - Financial transactions
- `fraud_detection_rules` - Configurable fraud rules
- `security_alerts` - Security incidents

---

## 🔐 Security Features

1. **Admin-only access** - All endpoints check `is_admin = true`
2. **Input validation** - Required fields, type checking, value ranges
3. **Audit logging** - All admin actions logged via `log_admin_action()`
4. **Error handling** - Proper HTTP status codes and error messages
5. **SQL injection protection** - Parameterized queries via Supabase client
6. **Rate limiting** - Should be configured at API gateway level

---

## 🧪 Testing Examples

### cURL Examples

#### Get Analytics Overview
```bash
curl -X GET "https://your-domain.com/api/admin/analytics/overview" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Get User Engagement
```bash
curl -X GET "https://your-domain.com/api/admin/analytics/user-engagement" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### List Transactions (Flagged Only)
```bash
curl -X GET "https://your-domain.com/api/admin/fraud/transactions?flaggedOnly=true&minFraudScore=50" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Create Transaction
```bash
curl -X POST "https://your-domain.com/api/admin/fraud/transactions" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "uuid",
    "transaction_type": "payment",
    "amount": 1500.00,
    "currency": "USD",
    "payment_method": "credit_card"
  }'
```

#### List Fraud Rules
```bash
curl -X GET "https://your-domain.com/api/admin/fraud/rules?enabled=true" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Create Fraud Rule
```bash
curl -X POST "https://your-domain.com/api/admin/fraud/rules" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rule_name": "Large Transaction Alert",
    "rule_type": "amount_threshold",
    "rule_condition": {
      "operator": "greater_than",
      "value": 1000
    },
    "severity": "high",
    "action": "review",
    "enabled": true
  }'
```

#### Update Fraud Rule
```bash
curl -X PATCH "https://your-domain.com/api/admin/fraud/rules" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rule_id": "uuid",
    "enabled": false
  }'
```

#### Delete Fraud Rule
```bash
curl -X DELETE "https://your-domain.com/api/admin/fraud/rules?rule_id=uuid" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📝 Implementation Notes

### Performance Considerations

1. **Pagination**: All list endpoints support pagination to handle large datasets
2. **Indexing**: Database tables have indexes on frequently queried columns
3. **Caching**: Consider implementing Redis caching for analytics endpoints
4. **Query Optimization**: Limited to 1000 records for complex aggregations

### Future Enhancements

1. **Date Range Filtering**: Full implementation of startDate/endDate params
2. **Export Functionality**: CSV/PDF export for reports
3. **Real-time Updates**: WebSocket support for live dashboards
4. **Advanced Fraud Rules**: ML-based fraud detection integration
5. **Batch Operations**: Bulk transaction processing

### Error Handling

All endpoints follow consistent error response format:

```json
{
  "success": false,
  "error": "Error message",
  "timestamp": "2026-02-18T06:56:00.000Z"
}
```

Common HTTP Status Codes:
- `200` - Success
- `400` - Bad Request (validation error)
- `401` - Unauthorized (not authenticated)
- `403` - Forbidden (not admin)
- `404` - Not Found
- `409` - Conflict (duplicate)
- `500` - Internal Server Error

---

## 👨‍💻 Created By

**Blossom** - Backend Developer (Powerpuff Girls)  
Date: February 18, 2026

For questions or issues, contact the dev team or check the migration file: `supabase/migrations/20260218000001_admin_dashboard_comprehensive.sql`
