# CubiQo Privacy Policy

**Last Updated**: February 18, 2026

## Introduction

Welcome to CubiQo ("we," "our," or "us"). We respect your privacy and are committed to protecting your personal data. This privacy policy explains how we collect, use, store, and share information when you use our services.

## Information We Collect

### Information You Provide

**Account Information:**
- Email address (required for authentication)
- Full name (optional)
- Profile picture (optional)

**User-Generated Content:**
- Journal entries and reflections
- Voice recordings (temporarily processed, not stored)
- Conversation transcripts
- Preferences and settings

**API Keys (BYO Mode):**
- When you use "Bring Your Own" mode, API keys are stored encrypted in your browser's local storage only
- We never see or store your API keys on our servers in BYO mode

### Information We Collect Automatically

**Usage Data:**
- Pages visited and features used
- Time spent on platform
- Device type and browser information
- IP address and geographic location (city/country level)

**Technical Data:**
- Cookies and similar tracking technologies
- Session information
- Error logs and crash reports

### Information from Third Parties

**OAuth Providers:**
- When you connect third-party services (Gmail, Shopify, etc.), we receive:
  - Access tokens (stored encrypted)
  - Account identifiers
  - Permissions granted

**Analytics Services:**
- We use Vercel Analytics for website performance monitoring
- No personal information is shared with analytics providers

## How We Use Your Information

We use your information to:

### Provide Our Services
- Authenticate your account
- Store and sync your journal entries
- Process voice conversations with AI
- Personalize your experience

### Improve Our Services
- Analyze usage patterns (anonymized)
- Fix bugs and improve performance
- Develop new features
- Conduct research (with consent)

### Communicate With You
- Send magic link authentication emails
- Notify about important account changes
- Respond to your support requests
- Send security alerts (if necessary)

### Ensure Security
- Detect and prevent fraud
- Monitor for suspicious activity
- Enforce our Terms of Service
- Comply with legal obligations

## Legal Basis for Processing (GDPR)

For users in the European Union, we process your data based on:

- **Consent**: When you provide explicit consent (e.g., for analytics)
- **Contract**: To fulfill our service agreement with you
- **Legitimate Interest**: To improve our services and ensure security
- **Legal Obligation**: To comply with applicable laws

## Data Retention

We retain your information for as long as necessary to provide our services:

| Data Type | Retention Period |
|-----------|------------------|
| Account Information | Until account deletion |
| Journal Entries | Until account deletion |
| Audit Logs | 7 years (compliance requirement) |
| OAuth Tokens | Until revoked or account deletion |
| Analytics Data | 2 years |
| Error Logs | 90 days |
| Access Logs | 180 days |

## Data Security

We implement industry-standard security measures:

### Encryption
- **In Transit**: All data encrypted with TLS 1.3
- **At Rest**: Sensitive data encrypted with AES-256-GCM
- **OAuth Tokens**: Encrypted before storage

### Access Controls
- Role-based access control (RBAC)
- Multi-factor authentication available
- Regular security audits
- Principle of least privilege

### Monitoring
- Real-time security monitoring
- Automated threat detection
- Incident response procedures
- Regular vulnerability scanning

## Your Privacy Rights

Depending on your location, you have various rights regarding your personal data:

### All Users

**Access**: Request a copy of your data
```
GET /api/privacy/export-data
Format: JSON, CSV, or XML
```

**Correction**: Update your profile information via Settings

**Deletion**: Request account deletion
```
DELETE /api/privacy/delete-account
30-day grace period available
```

### GDPR Rights (EU Users)

- **Right to Access**: Request all data we hold about you
- **Right to Rectification**: Correct inaccurate data
- **Right to Erasure**: Request data deletion ("right to be forgotten")
- **Right to Data Portability**: Export your data in machine-readable format
- **Right to Restriction**: Limit how we process your data
- **Right to Object**: Object to certain processing activities
- **Right to Withdraw Consent**: Withdraw consent at any time

### CCPA Rights (California Users)

- **Right to Know**: What data we collect and how we use it
- **Right to Delete**: Request deletion of your personal information
- **Right to Opt-Out**: Opt-out of data "sale" (we don't sell data)
- **Right to Non-Discrimination**: Equal service regardless of exercising rights

### How to Exercise Your Rights

**Self-Service:**
- Export data: Settings → Privacy → Export Data
- Delete account: Settings → Privacy → Delete Account
- Update preferences: Settings → Privacy → Consent Management

**Contact Us:**
- Email: privacy@cubiqo.ai
- We will respond within 30 days

## Cookies and Tracking

### Essential Cookies

Required for the service to function:

| Cookie | Purpose | Duration |
|--------|---------|----------|
| `sb-access-token` | Authentication | 1 hour |
| `sb-refresh-token` | Session management | 30 days |
| `user-preferences` | Store UI preferences | 1 year |

### Optional Cookies

Require your consent:

| Cookie | Purpose | Duration |
|--------|---------|----------|
| `_vercel_analytics` | Website analytics | 1 year |

You can manage cookie preferences in Settings → Privacy.

## Third-Party Services

We use the following third-party services:

### Essential Services

**Supabase** (Database & Authentication)
- Location: United States
- Purpose: Store user data securely
- Privacy Policy: https://supabase.com/privacy

**Vercel** (Hosting)
- Location: Global CDN
- Purpose: Website hosting and delivery
- Privacy Policy: https://vercel.com/legal/privacy-policy

### Optional Services (BYO Mode)

When you use BYO mode, you directly connect to:
- OpenAI or Anthropic (AI responses)
- ElevenLabs (Text-to-speech)
- Your chosen providers

We do not have access to data sent to these services in BYO mode.

### OAuth Integrations

When you connect third-party services:
- We only request necessary permissions
- Tokens are stored encrypted
- You can revoke access anytime
- We follow OAuth 2.0 best practices

## Data Transfers

### International Transfers

Your data may be processed in:
- United States (Supabase, Vercel)
- European Union (if using EU regions)

For EU users, we ensure adequate protection through:
- Standard Contractual Clauses (SCCs)
- Data Processing Agreements (DPAs)
- EU-US Data Privacy Framework (where applicable)

## Children's Privacy

CubiQo is not intended for children under 13 (or 16 in the EU).

If you believe a child has provided us with personal information:
- Contact us at privacy@cubiqo.ai
- We will delete the information promptly

## Data Breach Notification

In the event of a data breach:

1. **Assessment**: We assess the breach within 24 hours
2. **Notification**: Affected users notified within 72 hours (GDPR requirement)
3. **Remediation**: Immediate action to secure data
4. **Reporting**: Report to authorities as required by law

You will be informed of:
- What data was affected
- What we're doing about it
- What you should do
- How to get more information

## Your Choices

### Communication Preferences

You can control:
- Magic link authentication emails (required)
- Security notifications (recommended)
- Product updates (optional)
- Marketing emails (optional)

### Data Sharing

We do not:
- Sell your personal information
- Share data with advertisers
- Use your data to train AI models without consent
- Share data with third parties except as described in this policy

### Analytics

You can opt out of:
- Website analytics tracking
- Usage pattern analysis
- Performance monitoring (may affect support quality)

## Updates to This Policy

We may update this privacy policy from time to time.

**How you'll know:**
- Email notification for material changes
- In-app notification
- Updated "Last Updated" date at the top

**Your options:**
- Continue using the service (acceptance)
- Export your data and delete your account

## Contact Us

**Privacy Questions:**
- Email: privacy@cubiqo.ai
- Response time: Within 30 days

**Data Protection Officer:**
- Email: dpo@cubiqo.ai (for GDPR matters)

**Security Issues:**
- Email: security@cubiqo.ai
- For security vulnerabilities: https://cubiqo.ai/security

**General Support:**
- Email: support@cubiqo.ai
- Website: https://cubiqo.ai

## Supervisory Authority

If you're in the EU and have concerns about our data practices, you can contact your local data protection authority.

## Transparency Report

We publish an annual transparency report detailing:
- Government requests for data
- Security incidents
- GDPR/CCPA requests handled
- Platform statistics

Available at: https://cubiqo.ai/transparency

## Additional Information for Specific Regions

### California Residents (CCPA)

**Categories of Personal Information Collected:**
- Identifiers (email, name)
- Internet activity (usage data)
- Audio/visual information (voice recordings - temporary)
- Inferences (AI-generated insights)

**Business Purposes:**
- Providing services
- Security and fraud prevention
- Service improvement
- Legal compliance

**Categories of Third Parties:**
- Service providers (Supabase, Vercel)
- AI providers (when using BYO mode)

**Data Sales:**
We do not sell personal information.

**Requests:**
In the past 12 months, we received:
- [X] requests to know
- [X] requests to delete
- [X] requests to opt-out
- Response time: Average [X] days

### European Union Residents (GDPR)

**Data Controller:**
CubiQo, Inc.

**Legal Basis:**
- Consent for optional features
- Contract for service provision
- Legitimate interest for security

**Data Processing Agreement:**
Available upon request for B2B customers

**Automated Decision-Making:**
We use AI to generate responses, but you can always:
- Override AI suggestions
- Delete AI-generated content
- Request human review

### Other Regions

We comply with applicable data protection laws in all jurisdictions where we operate.

## Open Source and Transparency

CubiQo is open source:
- Code available at: https://github.com/thecubiqo/thecubiqo
- Security practices documented
- Community-audited
- Transparency by design

You can:
- Review our code
- Audit our security practices
- Contribute improvements
- Self-host (with your own data)

---

## Acknowledgments

This privacy policy was created with transparency and user rights in mind. We believe in:
- Privacy by design
- Data minimization
- User control
- Transparency
- Security

If you have questions or suggestions about our privacy practices, please reach out. Your privacy matters to us.

---

**Version**: 1.0.0  
**Effective Date**: February 18, 2026  
**Last Reviewed**: February 18, 2026
