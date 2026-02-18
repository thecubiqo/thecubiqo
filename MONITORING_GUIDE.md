# Monitoring & Incident Response Guide

## Overview

This document provides comprehensive guidelines for monitoring the CubiQo platform, detecting security incidents, and responding to threats in real-time.

## Table of Contents

1. [Monitoring Strategy](#monitoring-strategy)
2. [Key Metrics](#key-metrics)
3. [Alerting Configuration](#alerting-configuration)
4. [Real-Time Monitoring](#real-time-monitoring)
5. [Incident Detection](#incident-detection)
6. [Incident Response](#incident-response)
7. [Security Operations](#security-operations)
8. [Tools & Integration](#tools--integration)
9. [Runbooks](#runbooks)
10. [Post-Incident Review](#post-incident-review)

## Monitoring Strategy

### Three-Tier Monitoring Approach

1. **Application Layer**: Application health, API performance, user behavior
2. **Infrastructure Layer**: Server resources, database performance, network
3. **Security Layer**: Threat detection, authentication failures, suspicious activity

### Monitoring Philosophy

- **Proactive**: Detect issues before users report them
- **Comprehensive**: Cover all critical system components
- **Actionable**: Alerts should have clear remediation steps
- **Noise Reduction**: Minimize false positives
- **Context-Rich**: Provide enough context for quick diagnosis

## Key Metrics

### Application Health Metrics

#### System Health

```typescript
// Available at: GET /api/founders-pass/health

{
  "status": "ok",
  "timestamp": "2026-02-18T07:00:00.000Z",
  "version": "2.0.0",
  "uptime": 3600,
  "memory": {
    "heapUsed": 150,    // MB
    "heapTotal": 200,   // MB
    "rss": 250          // MB
  },
  "services": {
    "supabase": true,
    "oauth_encryption": true
  },
  "security": {
    "rateLimit": "active",
    "encryption": "aes-256-gcm",
    "headers": { ... },
    "authentication": { ... },
    "compliance": { ... }
  }
}
```

**Key Indicators:**
- **Uptime**: Should be > 99.9% (< 43 minutes downtime/month)
- **Memory Usage**: Should stay below 80% of available memory
- **Response Time**: Average < 500ms, P95 < 1000ms

#### API Performance Metrics

Monitor these metrics for all API endpoints:

```javascript
{
  endpoint: '/api/messages',
  metrics: {
    requestCount: 1250,
    avgResponseTime: 245,      // ms
    p50ResponseTime: 180,      // ms
    p95ResponseTime: 650,      // ms
    p99ResponseTime: 980,      // ms
    errorRate: 0.02,           // 2%
    requestsPerMinute: 25,
  }
}
```

**Alert Thresholds:**
- Error rate > 5% → **Critical**
- P95 response time > 2000ms → **Warning**
- P99 response time > 5000ms → **Warning**
- Error rate > 1% for 5 minutes → **Warning**

### Security Metrics

#### Authentication Events

```javascript
{
  metric: 'auth_events',
  values: {
    successfulLogins: 450,
    failedLogins: 12,
    magicLinksSent: 78,
    webauthnAttempts: 34,
    mfaChallenges: 89,
  },
  failureRate: 0.026  // 2.6%
}
```

**Alert Thresholds:**
- Failed login rate > 10% → **Warning**
- Failed login rate > 25% → **Critical**
- > 5 failed attempts from same IP in 5 minutes → **Warning**
- > 10 failed attempts from same IP in 5 minutes → **Block IP**

#### Rate Limiting Events

```javascript
{
  metric: 'rate_limiting',
  values: {
    globalBlocks: 3,
    authBlocks: 15,
    apiBlocks: 7,
    exportBlocks: 2,
  },
  blockRate: 0.015  // 1.5%
}
```

**Alert Thresholds:**
- Block rate > 5% → **Warning** (possible attack)
- > 100 blocks from same IP → **Critical** (DDoS attempt)

#### Fraud Detection Events

```javascript
{
  metric: 'fraud_detection',
  values: {
    totalTransactions: 1000,
    flaggedTransactions: 25,
    blockedTransactions: 3,
    averageRiskScore: 15,
  },
  flagRate: 0.025  // 2.5%
}
```

**Alert Thresholds:**
- Risk score > 80 for any transaction → **Immediate Review**
- Flag rate > 10% → **Warning**
- Blocked transaction count > 10/hour → **Critical**

#### Phishing Detection Events

```javascript
{
  metric: 'phishing_detection',
  values: {
    urlsScanned: 234,
    suspiciousUrls: 12,
    maliciousUrls: 2,
    blockedClicks: 2,
  },
  threatRate: 0.06  // 6%
}
```

**Alert Thresholds:**
- Malicious URL detected → **Immediate Alert**
- Threat rate > 15% → **Warning**

### Database Metrics

```javascript
{
  metric: 'database_performance',
  values: {
    activeConnections: 45,
    queryLatency: 12,        // ms avg
    slowQueries: 3,          // > 1s
    connectionPoolSize: 100,
    cacheHitRate: 0.85,      // 85%
  }
}
```

**Alert Thresholds:**
- Active connections > 90% pool size → **Warning**
- Slow query count > 10/minute → **Warning**
- Cache hit rate < 70% → **Warning**
- Query latency > 100ms → **Warning**

## Alerting Configuration

### Alert Severity Levels

| Severity | Description | Response Time | Notification |
|----------|-------------|---------------|--------------|
| **Critical** | Service down, data breach, active attack | Immediate | Page on-call, Email, Slack |
| **High** | Major degradation, security threat | < 15 minutes | Email, Slack |
| **Medium** | Performance issues, unusual patterns | < 1 hour | Slack |
| **Low** | Minor issues, informational | Next business day | Email |

### Alert Configuration Examples

#### Vercel/Datadog Configuration

```yaml
# alerts/security-alerts.yml
alerts:
  - name: "High Error Rate"
    query: "avg(last_5m):error_rate > 0.05"
    severity: critical
    message: "Error rate above 5% - immediate investigation required"
    notify:
      - "@oncall"
      - "#security-alerts"
    
  - name: "Failed Authentication Spike"
    query: "sum(last_5m):auth_failures > 50"
    severity: high
    message: "Unusual number of failed login attempts detected"
    notify:
      - "#security-alerts"
    
  - name: "Rate Limit Exceeded"
    query: "sum(last_1m):rate_limit_blocks > 100"
    severity: critical
    message: "Possible DDoS attack - many rate limit blocks"
    notify:
      - "@oncall"
      - "#security-alerts"
    
  - name: "High Risk Transaction"
    query: "max(last_5m):fraud_risk_score > 80"
    severity: high
    message: "High-risk transaction detected"
    notify:
      - "#fraud-alerts"
    
  - name: "Malicious URL Detected"
    query: "count(last_5m):malicious_urls > 0"
    severity: critical
    message: "Malicious URL detected in user content"
    notify:
      - "@oncall"
      - "#security-alerts"
    
  - name: "Memory Usage High"
    query: "avg(last_10m):memory_usage > 0.90"
    severity: high
    message: "Memory usage above 90% - possible memory leak"
    notify:
      - "#ops-alerts"
    
  - name: "Database Slow Queries"
    query: "count(last_5m):slow_queries > 20"
    severity: medium
    message: "High number of slow database queries"
    notify:
      - "#ops-alerts"
    
  - name: "API Latency High"
    query: "p95(last_5m):api_response_time > 2000"
    severity: medium
    message: "API response time degraded"
    notify:
      - "#ops-alerts"
```

### Slack Integration

```typescript
// lib/monitoring/slack-alerts.ts
export async function sendSlackAlert(alert: {
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  message: string;
  details?: Record<string, unknown>;
}) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  
  const color = {
    critical: '#FF0000',
    high: '#FF8C00',
    medium: '#FFD700',
    low: '#00FF00',
  }[alert.severity];
  
  await fetch(webhookUrl!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      attachments: [{
        color,
        title: alert.title,
        text: alert.message,
        fields: Object.entries(alert.details || {}).map(([key, value]) => ({
          title: key,
          value: String(value),
          short: true,
        })),
        footer: 'CubiQo Monitoring',
        ts: Math.floor(Date.now() / 1000),
      }],
    }),
  });
}
```

## Real-Time Monitoring

### Dashboard Setup

#### Monitoring Dashboard (Recommended: Grafana, Datadog, or Vercel Analytics)

**Dashboard 1: System Overview**
- Uptime percentage (99.9% target)
- Request volume (requests/minute)
- Error rate (< 1% target)
- Response times (P50, P95, P99)
- Active users

**Dashboard 2: Security Monitoring**
- Authentication events
- Failed login attempts
- Rate limit blocks
- Fraud detection flags
- Malicious URL detections
- Security incidents

**Dashboard 3: Performance**
- API endpoint latencies
- Database query times
- Memory/CPU usage
- Cache hit rates
- CDN performance

**Dashboard 4: Business Metrics**
- New user signups
- Daily active users
- Journal entries created
- Voice conversations
- Feature flag usage

### Health Check Monitoring

```bash
# Set up health check monitoring (example with UptimeRobot)

# Endpoint: https://cubiqo.ai/api/founders-pass/health
# Interval: 5 minutes
# Timeout: 30 seconds
# Expected Response: 200 OK
# Expected Content: "status": "ok"

# Alert if:
# - Response code != 200
# - Response time > 5 seconds
# - Content doesn't match
# - 2 consecutive failures
```

### Log Aggregation

```javascript
// Recommended: Logtail, Datadog Logs, or ELK Stack

// Log structure
{
  timestamp: '2026-02-18T07:00:00.000Z',
  level: 'info',
  service: 'api',
  endpoint: '/api/messages',
  userId: 'user-123',
  requestId: 'req-456',
  duration: 245,
  statusCode: 200,
  message: 'Request completed',
  metadata: {
    userAgent: 'Mozilla/5.0...',
    ipAddress: '192.168.1.1',
  }
}

// Security event logs
{
  timestamp: '2026-02-18T07:05:00.000Z',
  level: 'warn',
  service: 'security',
  event: 'rate_limit_exceeded',
  userId: null,
  ipAddress: '10.0.0.1',
  details: {
    limitType: 'global',
    requests: 101,
    window: 60,
  }
}
```

## Incident Detection

### Automated Incident Detection

#### Pattern Recognition

```typescript
// lib/monitoring/incident-detection.ts

export interface IncidentPattern {
  name: string;
  description: string;
  conditions: Array<{
    metric: string;
    operator: '>' | '<' | '==' | '!=';
    threshold: number;
    timeWindow: number; // seconds
  }>;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export const INCIDENT_PATTERNS: IncidentPattern[] = [
  {
    name: 'DDoS Attack',
    description: 'High volume of requests from multiple IPs',
    conditions: [
      { metric: 'requests_per_minute', operator: '>', threshold: 10000, timeWindow: 300 },
      { metric: 'unique_ips', operator: '>', threshold: 100, timeWindow: 300 },
      { metric: 'rate_limit_blocks', operator: '>', threshold: 1000, timeWindow: 300 },
    ],
    severity: 'critical',
  },
  {
    name: 'Brute Force Attack',
    description: 'Many failed login attempts',
    conditions: [
      { metric: 'failed_logins', operator: '>', threshold: 100, timeWindow: 300 },
      { metric: 'unique_ips_failed_auth', operator: '<', threshold: 10, timeWindow: 300 },
    ],
    severity: 'high',
  },
  {
    name: 'Data Breach Attempt',
    description: 'Unusual data access patterns',
    conditions: [
      { metric: 'data_exports', operator: '>', threshold: 50, timeWindow: 3600 },
      { metric: 'failed_auth_then_success', operator: '>', threshold: 5, timeWindow: 600 },
    ],
    severity: 'critical',
  },
  {
    name: 'API Abuse',
    description: 'Excessive API usage from single source',
    conditions: [
      { metric: 'api_calls_per_ip', operator: '>', threshold: 1000, timeWindow: 300 },
      { metric: 'unique_endpoints', operator: '<', threshold: 3, timeWindow: 300 },
    ],
    severity: 'high',
  },
];
```

### Manual Incident Reporting

```bash
# Security team can manually create incident

POST /api/security/incidents
{
  "title": "Suspicious activity detected",
  "description": "Multiple users reporting phishing attempts",
  "severity": "high",
  "affected_systems": ["email", "ui"],
  "reporter": "security-team"
}
```

## Incident Response

### Incident Response Process

```
Detection → Classification → Containment → Eradication → Recovery → Review
```

### 1. Detection Phase

**Actions:**
- Alert triggered by monitoring system
- Security team notified
- Incident ticket created automatically

**Timeline:** 0-5 minutes

### 2. Classification Phase

**Actions:**
- Assess severity and impact
- Identify affected systems/users
- Determine incident type
- Assign incident commander

**Timeline:** 5-15 minutes

**Classification Criteria:**

| Type | Description | Examples |
|------|-------------|----------|
| Security Breach | Unauthorized access to data/systems | Data leak, account takeover |
| Service Outage | System unavailable | Database down, API errors |
| Performance Degradation | System slow but functional | High latency, memory issues |
| Security Threat | Active attack attempt | DDoS, brute force |
| Data Integrity | Data corruption/loss | Database corruption |

### 3. Containment Phase

**Short-term Containment (0-30 minutes):**

```bash
# For DDoS Attack
- Enable additional rate limiting
- Block malicious IP ranges
- Scale up infrastructure
- Enable CDN DDoS protection

# For Brute Force Attack
- Temporarily lock affected accounts
- Block attacking IPs
- Require MFA for all logins
- Increase auth rate limits

# For Data Breach
- Revoke compromised tokens
- Force password resets
- Lock affected accounts
- Disable data export temporarily
```

**Long-term Containment (1-24 hours):**

```bash
# Patch vulnerabilities
# Update security rules
# Enhance monitoring
# Implement additional controls
```

### 4. Eradication Phase

**Actions:**
- Remove root cause of incident
- Patch vulnerabilities
- Update configurations
- Deploy security fixes

**Timeline:** Hours to days depending on severity

### 5. Recovery Phase

**Actions:**
- Restore normal operations
- Verify system integrity
- Monitor for re-occurrence
- Communicate with users

**Validation Checklist:**
- [ ] All systems operational
- [ ] No anomalous activity detected
- [ ] Monitoring shows normal metrics
- [ ] Users can access services
- [ ] Security measures verified

### 6. Post-Incident Review

**Within 48 hours of resolution:**
- Conduct post-mortem meeting
- Document timeline and actions taken
- Identify root cause
- Create prevention measures
- Update runbooks
- Train team on lessons learned

## Security Operations

### Daily Security Operations

#### Morning Security Check (9:00 AM)

```bash
# Review overnight alerts
# Check security dashboard
# Review failed authentication attempts
# Check rate limiting blocks
# Review fraud detection flags
# Check for security updates
```

#### Continuous Monitoring

```bash
# Monitor real-time dashboards
# Respond to alerts within SLA
# Investigate anomalies
# Update incident tickets
# Communicate with team
```

#### Evening Security Review (5:00 PM)

```bash
# Review day's security events
# Check open incidents
# Verify backups completed
# Review access logs
# Update security documentation
```

### Weekly Security Tasks

- [ ] Review and analyze security logs
- [ ] Test backup restoration
- [ ] Update threat intelligence
- [ ] Review and update firewall rules
- [ ] Audit user access permissions
- [ ] Review security metrics and trends
- [ ] Update security documentation

### Monthly Security Tasks

- [ ] Conduct security audit
- [ ] Review and update security policies
- [ ] Perform vulnerability assessment
- [ ] Review incident response procedures
- [ ] Conduct security training
- [ ] Update disaster recovery plan
- [ ] Review third-party security

## Tools & Integration

### Recommended Monitoring Tools

1. **Vercel Analytics** (Built-in)
   - Real-time performance monitoring
   - Error tracking
   - Web vitals

2. **Datadog** (Recommended)
   - Comprehensive monitoring
   - APM and infrastructure
   - Security monitoring
   - Log aggregation

3. **Sentry** (Error Tracking)
   - Error and exception tracking
   - Performance monitoring
   - Release tracking

4. **Supabase Monitoring** (Built-in)
   - Database performance
   - Authentication metrics
   - Real-time subscriptions

### Integration Setup

#### Datadog Integration

```typescript
// lib/monitoring/datadog.ts
import { StatsD } from 'node-dogstatsd';

const statsd = new StatsD({
  host: 'datadog-agent',
  port: 8125,
  prefix: 'cubiqo.',
});

export function trackMetric(name: string, value: number, tags?: string[]) {
  statsd.histogram(name, value, tags);
}

export function incrementCounter(name: string, tags?: string[]) {
  statsd.increment(name, tags);
}

// Usage in API routes
trackMetric('api.response_time', duration, ['endpoint:/api/messages', 'status:200']);
incrementCounter('api.requests', ['endpoint:/api/messages']);
```

#### Sentry Integration

```typescript
// lib/monitoring/sentry.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  beforeSend(event) {
    // Filter out sensitive data
    if (event.request) {
      delete event.request.cookies;
      delete event.request.headers?.Authorization;
    }
    return event;
  },
});

// Usage
try {
  // Code that might throw
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      endpoint: '/api/messages',
      userId: user.id,
    },
  });
}
```

## Runbooks

### Runbook: DDoS Attack

**Symptoms:**
- Extremely high request volume
- High rate limit blocks
- Service degradation
- Users reporting slow performance

**Diagnosis:**
```bash
# Check request volume
curl https://cubiqo.ai/api/founders-pass/health

# Review rate limiting metrics
# Check unique IP count
# Analyze request patterns
```

**Response:**
1. **Immediate** (0-5 min):
   - Enable Cloudflare DDoS protection
   - Increase rate limits temporarily
   - Scale infrastructure

2. **Short-term** (5-30 min):
   - Block malicious IP ranges
   - Enable challenge pages
   - Contact Cloudflare support

3. **Recovery**:
   - Monitor for attack cessation
   - Gradually restore normal operations
   - Document attack patterns

### Runbook: Data Breach

**Symptoms:**
- Unauthorized data access
- Account compromise reports
- Unusual data export activity
- Failed authentication followed by success

**Diagnosis:**
```bash
# Check audit logs
# Review authentication events
# Check data export logs
# Analyze access patterns
```

**Response:**
1. **Immediate** (0-5 min):
   - Isolate affected systems
   - Revoke all sessions
   - Block suspicious IPs

2. **Short-term** (5-60 min):
   - Force password resets
   - Enable MFA requirement
   - Disable data export
   - Notify security team
   - Begin forensic analysis

3. **Long-term** (Hours-Days):
   - Identify breach scope
   - Notify affected users
   - Report to authorities (if required)
   - Implement additional security
   - Conduct security audit

### Runbook: Service Outage

**Symptoms:**
- Health check failures
- 5xx errors
- Database connectivity issues
- Users reporting service unavailable

**Response:**
1. **Immediate** (0-5 min):
   - Check Vercel deployment status
   - Check Supabase status
   - Review error logs

2. **Diagnosis**:
   - Identify failed component
   - Check recent deployments
   - Review infrastructure changes

3. **Recovery**:
   - Rollback if deployment issue
   - Restart services if needed
   - Scale resources if capacity issue
   - Restore from backup if data corruption

## Post-Incident Review

### Post-Mortem Template

```markdown
# Incident Post-Mortem: [Incident Title]

## Incident Overview
- **Date**: [Date]
- **Duration**: [Start - End]
- **Severity**: [Critical/High/Medium/Low]
- **Incident Commander**: [Name]
- **Impacted Systems**: [List systems]
- **User Impact**: [Description]

## Timeline
- **[Time]**: Initial detection
- **[Time]**: Team notified
- **[Time]**: Issue diagnosed
- **[Time]**: Containment measures applied
- **[Time]**: Issue resolved
- **[Time]**: Normal operations restored

## Root Cause
[Detailed explanation of what caused the incident]

## What Went Well
- [Things that worked well during response]

## What Could Be Improved
- [Areas for improvement]

## Action Items
- [ ] [Action item 1] - Assigned to [Name] - Due [Date]
- [ ] [Action item 2] - Assigned to [Name] - Due [Date]

## Lessons Learned
[Key takeaways from this incident]

## Prevention Measures
[Steps taken to prevent recurrence]
```

---

**Last Updated**: 2026-02-18  
**Maintained By**: CubiQo Security Operations Team
