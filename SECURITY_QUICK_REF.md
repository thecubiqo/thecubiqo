# Security & Testing Quick Reference

## 🚀 Quick Start

### Run All Tests
```bash
npm test -- tests/security --run
```

### View Security Documentation
- **Security Policy**: [SECURITY.md](./SECURITY.md)
- **Testing Guide**: [TESTING_GUIDE.md](./TESTING_GUIDE.md)
- **Monitoring Guide**: [MONITORING_GUIDE.md](./MONITORING_GUIDE.md)
- **Privacy Policy**: [PRIVACY_POLICY.md](./PRIVACY_POLICY.md)

## 🔒 Security Features

### Rate Limiting
```typescript
import { checkRateLimit } from '@/lib/security/rate-limit';

const result = await checkRateLimit(identifier, 'api');
if (!result.allowed) {
  return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
}
```

### Link Scanning
```typescript
import { scanUrl } from '@/lib/security/link-scanner';

const result = await scanUrl(userProvidedUrl);
if (!result.safe) {
  // Warn user or block URL
}
```

### Fraud Detection
```typescript
import { analyzeTransaction } from '@/lib/security/fraud-detection';

const analysis = await analyzeTransaction({
  userId,
  action: 'purchase',
  amount: 500,
  metadata: {},
});

if (analysis.recommendation === 'block') {
  // Block transaction
}
```

## 🔐 Privacy API

### Export User Data
```bash
GET /api/privacy/export-data?format=json
Authorization: Bearer <token>
```

### Delete Account
```bash
DELETE /api/privacy/delete-account
Content-Type: application/json

{
  "confirm": true,
  "immediate": false
}
```

### Manage Consent
```bash
PUT /api/privacy/consent
Content-Type: application/json

{
  "analytics": true,
  "marketing": false
}
```

## 📊 Monitoring

### Health Check
```bash
curl https://cubiqo.ai/api/founders-pass/health
```

### Key Metrics
- Error Rate: < 5%
- Response Time: P95 < 2000ms
- Failed Auth Rate: < 10%
- Rate Limit Blocks: Monitor

## 🚨 Incident Response

### Severity Levels
- **Critical**: Page on-call immediately
- **High**: Email + Slack within 15 min
- **Medium**: Slack within 1 hour
- **Low**: Next business day

### Quick Actions

**DDoS Attack:**
1. Enable Cloudflare DDoS protection
2. Increase rate limits
3. Block malicious IPs

**Brute Force:**
1. Lock affected accounts
2. Block attacking IPs
3. Require MFA

**Data Breach:**
1. Revoke all tokens
2. Force password resets
3. Notify security team

## 📝 Testing

### Security Tests
```bash
# Run security tests
npm test -- tests/security --run

# Run with coverage
npm test -- tests/security --coverage

# Watch mode
npm test -- tests/security
```

### Test Stats
- Total: 66 tests
- Pass Rate: 100%
- Execution: ~1.8s

## 📞 Contacts

- **Security**: security@cubiqo.ai
- **Privacy**: privacy@cubiqo.ai
- **Support**: support@cubiqo.ai
- **On-Call**: Check admin dashboard

## 🔗 Links

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [GDPR Guide](https://gdpr.eu/)
- [CCPA Guide](https://oag.ca.gov/privacy/ccpa)
- [GitHub Security](https://github.com/thecubiqo/thecubiqo/security)

## ✅ Production Checklist

Before deploying to production:

- [ ] Environment variables configured
- [ ] Monitoring tools set up (Datadog/Sentry)
- [ ] Alerting configured (Slack/Email)
- [ ] WAF enabled (Cloudflare)
- [ ] All tests passing
- [ ] Security audit completed
- [ ] Privacy policy reviewed
- [ ] Team trained on incident response
- [ ] Backups configured
- [ ] SSL certificates valid

---

**Last Updated**: February 18, 2026  
**Version**: 1.0.0
