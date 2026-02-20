# Comprehensive Testing Guide

## Overview

This document provides comprehensive testing guidelines for the CubiQo platform, covering integration, regression, API, end-to-end, functional, and security testing from the user's perspective.

## Table of Contents

1. [Test Environment Setup](#test-environment-setup)
2. [Integration Testing](#integration-testing)
3. [Regression Testing](#regression-testing)
4. [API Testing](#api-testing)
5. [End-to-End Testing](#end-to-end-testing)
6. [Functional Testing](#functional-testing)
7. [Security Testing](#security-testing)
8. [Performance Testing](#performance-testing)
9. [User Acceptance Testing](#user-acceptance-testing)
10. [Test Automation](#test-automation)
11. [CI/CD Integration](#cicd-integration)

## Test Environment Setup

### Prerequisites

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Configure Supabase
# Add your NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY

# Run database migrations
supabase db push
```

### Test Data Setup

```bash
# Create test users
# Run seed script (if available)
npm run db:seed

# Or manually create test data via Supabase dashboard
```

## Integration Testing

### Overview

Integration tests verify that different components of the application work together correctly.

### Running Integration Tests

```bash
# Run all integration tests
npm test -- tests/integration --run

# Run specific integration test
npm test -- tests/integration/auth-magic-link-state.test.ts --run

# Run with coverage
npm test -- tests/integration --coverage
```

### Key Integration Tests

#### 1. Authentication Flow Integration

**Test**: Magic link authentication flow
- **File**: `tests/integration/auth-magic-link-state.test.ts`
- **Coverage**: Email sending, link generation, session creation, cookie management

```typescript
describe('Magic Link Authentication', () => {
  it('should send magic link and authenticate user', async () => {
    // 1. Request magic link
    const response = await fetch('/api/auth/magic-link', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com' }),
    });
    
    // 2. Verify email sent
    expect(response.status).toBe(200);
    
    // 3. Simulate clicking magic link
    // 4. Verify user authenticated
    // 5. Check session cookies set
  });
});
```

#### 2. API Integration

**Test**: API endpoints integration with database
- **File**: `tests/integration/api-integration.test.ts`
- **Coverage**: CRUD operations, data validation, error handling

#### 3. Feature Flags Integration

**Test**: Feature flags affect UI and functionality
- **File**: `tests/feature-flags.test.ts`
- **Coverage**: Flag evaluation, user/site overrides, caching

#### 4. OAuth Integration

**Test**: OAuth flow with third-party providers
- **Coverage**: Authorization, token exchange, token storage (encrypted)

### Integration Test Checklist

- [ ] Authentication flows (magic link, WebAuthn)
- [ ] Database operations (CRUD)
- [ ] API endpoint chains
- [ ] Feature flag evaluation
- [ ] OAuth provider integration
- [ ] Email service integration
- [ ] File upload/storage
- [ ] Real-time subscriptions (WebSocket)
- [ ] Analytics event tracking
- [ ] Audit logging

## Regression Testing

### Overview

Regression tests ensure that new changes don't break existing functionality.

### Automated Regression Suite

```bash
# Run full regression test suite
npm test -- tests/regression --run

# Run on specific branch
git checkout feature-branch
npm test -- tests/regression --run
```

### Critical User Flows (Regression)

#### 1. User Registration and Login
```bash
# Test user can register and login
- Visit landing page
- Click "Sign Up"
- Enter email
- Receive magic link
- Click link
- Verify authenticated
```

#### 2. Journal Entry Creation
```bash
# Test journal functionality
- Login as user
- Navigate to journal
- Create new entry
- Add content
- Select color (RGY)
- Save entry
- Verify entry appears
```

#### 3. Voice Interaction
```bash
# Test voice features
- Grant microphone permission
- Record voice message
- Verify transcription
- Receive AI response
- Verify TTS playback
```

#### 4. Settings Changes
```bash
# Test settings persistence
- Open settings
- Change preferences
- Update API keys (BYO mode)
- Save changes
- Refresh page
- Verify changes persisted
```

### Regression Test Checklist

- [ ] Core user authentication
- [ ] Journal CRUD operations
- [ ] Voice recording and transcription
- [ ] AI conversation flows
- [ ] 3D cube visualization
- [ ] Settings management
- [ ] Profile updates
- [ ] OAuth connections
- [ ] Feature flag evaluation
- [ ] Admin dashboard access (for admins)
- [ ] Mobile responsiveness
- [ ] Browser compatibility

## API Testing

### Overview

API tests verify that all API endpoints work correctly and handle edge cases.

### API Test Suite

```bash
# Run API tests
npm test -- tests/api --run

# Test specific endpoint
npm test -- tests/api/privacy --run
```

### API Endpoints to Test

#### 1. Authentication API

```typescript
// POST /api/auth/magic-link
describe('Auth API', () => {
  it('should send magic link', async () => {
    const response = await fetch('/api/auth/magic-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com' }),
    });
    
    expect(response.status).toBe(200);
  });
  
  it('should reject invalid email', async () => {
    const response = await fetch('/api/auth/magic-link', {
      method: 'POST',
      body: JSON.stringify({ email: 'invalid-email' }),
    });
    
    expect(response.status).toBe(400);
  });
});
```

#### 2. Privacy API

```typescript
// GET /api/privacy/export-data
describe('Privacy API', () => {
  it('should export user data', async () => {
    const response = await authenticatedFetch('/api/privacy/export-data');
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('user');
    expect(data).toHaveProperty('journal_entries');
  });
  
  it('should respect rate limits', async () => {
    // Make 6 requests (exceeds export limit of 5/hour)
    for (let i = 0; i < 6; i++) {
      await authenticatedFetch('/api/privacy/export-data');
    }
    
    const response = await authenticatedFetch('/api/privacy/export-data');
    expect(response.status).toBe(429); // Too Many Requests
  });
});
```

#### 3. Founders Pass API

```typescript
// GET /api/founders-pass/flags
describe('Founders Pass API', () => {
  it('should list feature flags', async () => {
    const response = await authenticatedFetch('/api/founders-pass/flags');
    expect(response.status).toBe(200);
    
    const flags = await response.json();
    expect(Array.isArray(flags)).toBe(true);
  });
});
```

### API Testing Checklist

- [ ] All endpoints return correct status codes
- [ ] Response bodies match expected schema
- [ ] Error handling for invalid inputs
- [ ] Rate limiting enforced
- [ ] Authentication required for protected routes
- [ ] Authorization checks for admin routes
- [ ] CORS headers set correctly
- [ ] Security headers present
- [ ] Request validation working
- [ ] Database transactions handled correctly

### API Testing Tools

**Recommended tools:**
- Vitest (current setup)
- Postman/Insomnia for manual testing
- Artillery for load testing
- Supertest for Express-style testing

## End-to-End Testing

### Overview

E2E tests simulate real user interactions with the full application stack.

### E2E Test Setup

```bash
# Install Playwright (if not already installed)
npm install -D @playwright/test

# Run E2E tests
npx playwright test tests/e2e

# Run with UI
npx playwright test --ui
```

### Critical E2E User Journeys

#### Journey 1: New User Onboarding

```typescript
// tests/e2e/user-onboarding.spec.ts
import { test, expect } from '@playwright/test';

test('new user can sign up and complete onboarding', async ({ page }) => {
  // 1. Visit landing page
  await page.goto('/');
  
  // 2. Click "Get Started"
  await page.click('text=Get Started');
  
  // 3. Enter email
  await page.fill('input[type="email"]', 'newuser@example.com');
  await page.click('button:has-text("Send Magic Link")');
  
  // 4. Verify confirmation message
  await expect(page.locator('text=Check your email')).toBeVisible();
  
  // 5. Simulate clicking magic link (requires email access)
  // In real scenario, fetch email and extract link
  
  // 6. Complete profile
  await page.fill('input[name="full_name"]', 'Test User');
  await page.click('button:has-text("Complete Profile")');
  
  // 7. Verify dashboard loaded
  await expect(page).toHaveURL('/dashboard');
  await expect(page.locator('text=Welcome')).toBeVisible();
});
```

#### Journey 2: Creating Journal Entry

```typescript
test('user can create and view journal entry', async ({ page }) => {
  // Assume user already logged in (setup in beforeEach)
  
  // 1. Navigate to journal
  await page.click('a[href="/journal"]');
  
  // 2. Click new entry
  await page.click('button:has-text("New Entry")');
  
  // 3. Fill entry
  await page.fill('textarea[name="content"]', 'My first journal entry');
  
  // 4. Select color
  await page.click('button[data-color="green"]');
  
  // 5. Save
  await page.click('button:has-text("Save")');
  
  // 6. Verify entry appears
  await expect(page.locator('text=My first journal entry')).toBeVisible();
});
```

#### Journey 3: Voice Conversation

```typescript
test('user can have voice conversation', async ({ page, context }) => {
  // Grant microphone permission
  await context.grantPermissions(['microphone']);
  
  // 1. Navigate to chat
  await page.goto('/chat');
  
  // 2. Click microphone button
  await page.click('button[aria-label="Start recording"]');
  
  // 3. Wait for recording indicator
  await expect(page.locator('.recording-indicator')).toBeVisible();
  
  // 4. Stop recording
  await page.click('button[aria-label="Stop recording"]');
  
  // 5. Verify transcription appears
  await expect(page.locator('.transcript')).toBeVisible();
  
  // 6. Verify AI response
  await expect(page.locator('.ai-response')).toBeVisible({ timeout: 30000 });
  
  // 7. Verify TTS playback
  await expect(page.locator('.audio-player')).toBeVisible();
});
```

### E2E Test Checklist

- [ ] User signup/login flow
- [ ] Dashboard navigation
- [ ] Journal entry creation
- [ ] Voice interaction
- [ ] Settings update
- [ ] Profile management
- [ ] OAuth connections
- [ ] Admin dashboard access
- [ ] Mobile responsive layouts
- [ ] Dark/light mode toggle
- [ ] Error handling and recovery
- [ ] Session persistence

## Functional Testing

### Overview

Functional tests verify that each feature works according to specifications.

### Feature Test Matrix

#### 1. Authentication Features

| Feature | Test Case | Expected Result |
|---------|-----------|-----------------|
| Magic Link | User requests magic link | Email sent, link valid for 1 hour |
| Magic Link | User clicks expired link | Error message shown |
| WebAuthn | User registers biometric | Credential saved, can login |
| Session | User stays logged in | Session persists for 30 days |
| Logout | User logs out | Session cleared, redirected |

#### 2. Journal Features

| Feature | Test Case | Expected Result |
|---------|-----------|-----------------|
| Create | User creates entry | Entry saved with timestamp |
| Edit | User edits entry | Changes saved, updated_at changed |
| Delete | User deletes entry | Entry soft-deleted |
| Filter | User filters by color | Only matching entries shown |
| Search | User searches content | Relevant entries shown |

#### 3. Voice Features

| Feature | Test Case | Expected Result |
|---------|-----------|-----------------|
| Record | User records audio | Audio captured, waveform shown |
| Transcribe | Audio submitted | Text transcription returned |
| AI Response | Transcript sent | AI response generated |
| TTS | Response received | Audio playback available |
| Interrupt | User stops playback | Audio stops immediately |

### Functional Test Execution

```bash
# Run all functional tests
npm test -- tests/functional --run

# Test specific feature
npm test -- tests/functional/journal.test.ts --run
```

## Security Testing

### Overview

Security tests verify protection against common vulnerabilities and attacks.

### Security Test Suite

```bash
# Run security tests
npm test -- tests/security --run

# Generate security report
npm test -- tests/security --coverage --reporter=html
```

### Security Tests Implemented

#### 1. Rate Limiting Tests

```typescript
describe('Rate Limiting', () => {
  it('should block excessive requests', async () => {
    // Make 101 requests (exceeds limit)
    for (let i = 0; i < 101; i++) {
      await fetch('/api/messages');
    }
    
    const response = await fetch('/api/messages');
    expect(response.status).toBe(429);
    expect(response.headers.get('X-RateLimit-Limit')).toBe('100');
  });
});
```

#### 2. Input Validation Tests

```typescript
describe('Input Validation', () => {
  it('should sanitize XSS attempts', () => {
    const malicious = '<script>alert("XSS")</script>';
    const sanitized = sanitizeInput(malicious);
    
    expect(sanitized).not.toContain('<script>');
    expect(sanitized).toContain('&lt;script&gt;');
  });
  
  it('should reject SQL injection', async () => {
    const response = await fetch('/api/search', {
      method: 'POST',
      body: JSON.stringify({ query: "'; DROP TABLE users;--" }),
    });
    
    // Should be handled safely by parameterized queries
    expect(response.status).toBe(200);
    // Verify database still intact
  });
});
```

#### 3. Authentication Security Tests

```typescript
describe('Authentication Security', () => {
  it('should reject invalid JWT tokens', async () => {
    const response = await fetch('/api/protected', {
      headers: { 'Authorization': 'Bearer invalid-token' },
    });
    
    expect(response.status).toBe(401);
  });
  
  it('should enforce MFA for sensitive operations', async () => {
    const response = await authenticatedFetch('/api/privacy/delete-account', {
      method: 'DELETE',
      body: JSON.stringify({ confirm: true }),
    });
    
    // Should require MFA challenge
    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.mfa_required).toBe(true);
  });
});
```

#### 4. Phishing Detection Tests

```typescript
describe('Phishing Detection', () => {
  it('should detect suspicious URLs', async () => {
    const result = await scanUrl('https://paypal-verify.com');
    
    expect(result.safe).toBe(false);
    expect(result.category).toBe('suspicious');
  });
  
  it('should detect typosquatting', () => {
    const result = checkTyposquatting('g00gle.com');
    
    expect(result.suspicious).toBe(true);
    expect(result.possibleTarget).toBe('google');
  });
});
```

### Security Testing Checklist

- [ ] Rate limiting enforced
- [ ] XSS protection working
- [ ] CSRF protection enabled
- [ ] SQL injection prevented
- [ ] Authentication required
- [ ] Authorization checked
- [ ] Session management secure
- [ ] Password requirements met
- [ ] Sensitive data encrypted
- [ ] HTTPS enforced
- [ ] Security headers present
- [ ] File upload restrictions
- [ ] API input validation
- [ ] Error messages don't leak info
- [ ] Logging doesn't expose secrets

### Manual Security Testing

**OWASP ZAP Scan:**
```bash
# Download and run OWASP ZAP
# Configure proxy to localhost:3000
# Run automated scan
# Review and address findings
```

**Burp Suite:**
```bash
# Configure Burp Suite proxy
# Manually test authentication flows
# Test for session vulnerabilities
# Test API endpoints for injection
```

## Performance Testing

### Load Testing

```bash
# Install Artillery
npm install -D artillery

# Run load test
artillery run tests/load/api-load-test.yml

# Generate report
artillery run tests/load/api-load-test.yml --output report.json
artillery report report.json
```

### Performance Test Configuration

```yaml
# tests/load/api-load-test.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 300
      arrivalRate: 50
      name: "Sustained load"
    - duration: 60
      arrivalRate: 100
      name: "Peak load"

scenarios:
  - name: "API Endpoints"
    flow:
      - get:
          url: "/api/founders-pass/health"
      - post:
          url: "/api/messages"
          json:
            content: "Test message"
      - get:
          url: "/api/founders-pass/flags"
```

### Performance Benchmarks

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Page Load | < 3s | TBD | ⏳ |
| API Response | < 500ms | TBD | ⏳ |
| Voice Latency | < 1s | TBD | ⏳ |
| Cube Rendering | 60fps | TBD | ⏳ |
| Time to Interactive | < 5s | TBD | ⏳ |

## User Acceptance Testing

### UAT Test Plan

#### Test Group 1: Core Functionality
- [ ] User can sign up and login
- [ ] User can create journal entries
- [ ] User can have voice conversations
- [ ] User can update settings
- [ ] User can manage profile

#### Test Group 2: Advanced Features
- [ ] User can connect OAuth providers
- [ ] User can export their data
- [ ] User can delete their account
- [ ] User can preview feature flags
- [ ] Admin can manage feature flags

#### Test Group 3: User Experience
- [ ] UI is intuitive and easy to navigate
- [ ] Error messages are clear and helpful
- [ ] Loading states are visible
- [ ] Responsive on mobile devices
- [ ] Accessible with screen readers

### UAT Feedback Form

```markdown
## Feature: [Feature Name]

### Tester Information
- Name:
- Date:
- Browser:
- Device:

### Test Results
- [ ] Feature works as expected
- [ ] Feature has issues (describe below)
- [ ] Feature fails completely

### Issues Found
1. [Describe issue]
   - Severity: High/Medium/Low
   - Steps to reproduce:
   - Expected vs. Actual:

### Suggestions
[Any suggestions for improvement]

### Overall Rating
⭐⭐⭐⭐⭐ (1-5 stars)
```

## Test Automation

### Automated Test Suite

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:ui": "vitest --ui",
    "test:security": "vitest run tests/security",
    "test:integration": "vitest run tests/integration",
    "test:e2e": "playwright test",
    "test:all": "npm run test:run && npm run test:e2e",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest watch"
  }
}
```

### CI/CD Integration

Tests run automatically on every pull request and merge:

```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run lint
      - run: npm run test:run
      - run: npm run test:security
```

### Test Coverage Goals

| Component | Coverage Goal | Current | Status |
|-----------|---------------|---------|--------|
| Security | 90% | TBD | ⏳ |
| API Routes | 80% | TBD | ⏳ |
| Components | 70% | TBD | ⏳ |
| Utilities | 85% | TBD | ⏳ |
| Overall | 75% | TBD | ⏳ |

## Test Reporting

### Generate Test Reports

```bash
# HTML coverage report
npm run test:coverage

# View report
open coverage/index.html

# JSON report for CI
npm run test:run -- --reporter=json --outputFile=test-results.json
```

### Test Metrics to Track

- Total tests: 66+ (security tests alone)
- Pass rate: 100%
- Coverage: TBD
- Average execution time: < 2 seconds
- Flaky tests: 0 (goal)

## Best Practices

### Test Writing Guidelines

1. **Descriptive Names**: Use clear, descriptive test names
2. **Arrange-Act-Assert**: Follow AAA pattern
3. **Isolation**: Tests should not depend on each other
4. **Cleanup**: Clean up test data after each test
5. **Mocking**: Mock external dependencies
6. **Fast**: Keep tests fast (< 1s per test ideal)
7. **Reliable**: Tests should not be flaky

### Code Example

```typescript
describe('Feature Name', () => {
  // Setup
  beforeEach(() => {
    // Arrange: Set up test data
  });
  
  // Cleanup
  afterEach(() => {
    // Clean up test data
  });
  
  it('should do something specific', async () => {
    // Arrange: Prepare test conditions
    const input = 'test data';
    
    // Act: Perform the action
    const result = await performAction(input);
    
    // Assert: Verify the result
    expect(result).toBe('expected output');
  });
});
```

## Troubleshooting

### Common Issues

**Tests timing out:**
```bash
# Increase timeout in vitest.config.ts
export default defineConfig({
  test: {
    testTimeout: 30000, // 30 seconds
  },
});
```

**Database connection issues:**
```bash
# Check environment variables
# Verify Supabase is running
# Check database migrations applied
```

**Flaky tests:**
```bash
# Add proper waits
# Check for race conditions
# Ensure proper cleanup
# Use deterministic test data
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)

---

**Last Updated**: 2026-02-18  
**Maintained By**: CubiQo Quality Assurance Team
