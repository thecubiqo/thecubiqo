# Admin API Quick Reference

**For:** Frontend developers, DevOps, QA testers  
**Created:** February 18, 2026 by Blossom

---

## 🔑 Authentication

All endpoints require:
```bash
Authorization: Bearer <ADMIN_USER_TOKEN>
```

User must have `is_admin = true` in their profile.

---

## 📊 Analytics Endpoints

### Get Overview
```bash
GET /api/admin/analytics/overview
```
Returns: Total users, active users, sessions, engagement, growth trends

### Get User Engagement
```bash
GET /api/admin/analytics/user-engagement
```
Returns: Session frequency, feature usage, cohort retention, top users

---

## 🛡️ Fraud Endpoints

### List Transactions
```bash
GET /api/admin/fraud/transactions?flaggedOnly=true&minFraudScore=50&page=1&limit=50
```
Query params: `status`, `flaggedOnly`, `minFraudScore`, `startDate`, `endDate`, `userId`, `page`, `limit`

### Create Transaction
```bash
POST /api/admin/fraud/transactions
Content-Type: application/json

{
  "user_id": "uuid",
  "transaction_type": "payment",
  "amount": 1500.00,
  "currency": "USD",
  "payment_method": "credit_card"
}
```
Auto-calculates fraud score (0-100) and flags if needed.

### List Fraud Rules
```bash
GET /api/admin/fraud/rules?enabled=true&page=1&limit=50
```
Query params: `enabled`, `ruleType`, `severity`, `page`, `limit`

### Create Fraud Rule
```bash
POST /api/admin/fraud/rules
Content-Type: application/json

{
  "rule_name": "High Value Alert",
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

### Update Fraud Rule
```bash
PATCH /api/admin/fraud/rules
Content-Type: application/json

{
  "rule_id": "uuid",
  "enabled": false,
  "severity": "critical"
}
```

### Delete Fraud Rule
```bash
DELETE /api/admin/fraud/rules?rule_id=<uuid>
```

---

## 📝 Response Format

### Success
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2026-02-18T06:56:00.000Z"
}
```

### Error
```json
{
  "success": false,
  "error": "Error message",
  "timestamp": "2026-02-18T06:56:00.000Z"
}
```

---

## ⚠️ Status Codes

- `200` - Success
- `400` - Bad Request (validation error)
- `401` - Unauthorized (not authenticated)
- `403` - Forbidden (not admin)
- `404` - Not Found
- `409` - Conflict (duplicate)
- `500` - Internal Server Error

---

## 🎯 Fraud Score Ranges

- `0-39` - Low risk
- `40-69` - Medium risk
- `70-89` - High risk (security alert)
- `90-100` - Critical risk (security alert)

**Auto-flagged for review:** Score ≥ 50

---

## 📖 Full Documentation

See `docs/ADMIN_API_ENDPOINTS.md` for complete details.
