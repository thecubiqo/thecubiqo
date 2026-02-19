# CubiQo Emergent — Testing Strategy

## 1. Overview

CubiQo uses **Vitest** as its primary test runner (v4.0.18) with jsdom for browser simulation. A legacy Jest config exists but is unused. Total: **35 test files** across unit, integration, regression, snapshot, and E2E categories.

This document provides a comprehensive overview of the testing infrastructure, patterns, and coverage for the CubiQo Emergent system.

## 2. Configuration

### vitest.config.ts

```typescript
{
  plugins: [@vitejs/plugin-react],
  environment: 'jsdom',
  globals: true,
  setupFiles: './vitest.setup.ts',
  alias: {
    '@': './src'
  }
}
```

### vitest.setup.ts

- Imports `@testing-library/jest-dom/vitest`
- Sets up global test utilities and matchers

### Package Scripts

| Command | Description |
|---------|-------------|
| `npm test` | Vitest interactive watch mode |
| `npm run test:run` | Single run (CI) |
| `npm run test:ui` | Vitest visual UI |
| `npm run test:self-heal` | Self-heal tests |
| `npm run test:visual-smoke` | Visual smoke tests |
| `npm run storybook` | Storybook dev server |
| `npm run chromatic` | Visual regression testing |

## 3. Test Organization

### Directory Structure

```
tests/                          # Main test suite (27 files)
├── auth/                       # Auth flow tests
│   ├── sign-in-sign-out.test.ts
│   └── magic-link-redirect.test.ts
├── e2e/                        # End-to-end tests
│   └── landing.spec.ts
├── integration/                # Integration tests
│   ├── analytics-events.test.ts
│   ├── auth-magic-link-state.test.ts
│   ├── cube-controls.test.ts
│   ├── landing-render.test.ts
│   └── landingRouter.test.tsx
├── lib/ai/                     # AI provider tests
│   └── providers.test.ts
├── regression/                 # Regression tests
│   ├── critical-selectors.test.ts
│   └── visual-smoke-tests.test.ts
├── DesignSelector.test.tsx
├── EnergyCubeScene.test.tsx
├── FeatureToggleList.test.tsx
├── HealthIndicator.test.tsx
├── PlasmaWaveField.test.tsx
├── TopRightCTA.snapshot.test.tsx
├── TopRightCTA.test.tsx
├── WaveToCubeMorph.integration.test.tsx
├── ai-providers.test.ts
├── analytics.test.ts
├── auth-context.test.ts
├── feature-flags.test.ts
├── founders-pass.test.ts
├── layout-analytics.test.tsx
└── self-heal-integration.test.js

src/__tests__/                  # Co-located tests (8 files)
├── integration/
│   ├── auth-flow.test.ts
│   ├── build-verification.test.ts
│   ├── messaging-flow.test.ts
│   ├── onboarding-flow.test.ts
│   └── sandbox.test.ts
└── auth-ui.test.tsx

src/lib/ai/providers/__tests__/index.test.ts
src/lib/email/templates/__tests__/magic-link.test.ts
```

### Test File Naming Conventions

- **Unit tests**: `ComponentName.test.tsx` or `module-name.test.ts`
- **Integration tests**: `feature-name.integration.test.tsx`
- **Snapshot tests**: `ComponentName.snapshot.test.tsx`
- **E2E tests**: `feature-name.spec.ts`

## 4. Test Categories

### Unit Tests (14 files)

**Component Tests:**
- DesignSelector
- EnergyCubeScene
- FeatureToggleList
- HealthIndicator
- PlasmaWaveField
- TopRightCTA

**Logic Tests:**
- analytics
- feature-flags
- founders-pass
- ai-providers
- auth-context

**Template Tests:**
- magic-link email

### Integration Tests (10 files)

- Auth flows (sign-in/out, magic link)
- Messaging flow
- Onboarding flow
- Sandbox execution
- Analytics events
- Magic link state management
- Cube controls
- Landing page render/router
- Wave-to-cube morph animation

### Regression Tests (2 files)

- `critical-selectors.test.ts` — Ensures critical DOM elements remain accessible
- `visual-smoke-tests.test.ts` — Validates key UI components render without errors

### Snapshot Tests (1 file)

- `TopRightCTA.snapshot.test.tsx` — Component structure regression

### E2E Tests (1 file)

- `landing.spec.ts` — Full landing page user journey

### Visual Testing

- **Storybook** — Component isolation and manual visual testing
- **Chromatic** — Automated visual regression testing on every deploy

## 5. Test Patterns

### Standard Unit Test Pattern

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('ComponentName', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('should render correctly', () => {
    render(<Component />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
  
  it('should handle user interaction', async () => {
    const { user } = render(<Component />);
    await user.click(screen.getByRole('button'));
    expect(mockCallback).toHaveBeenCalled();
  });
});
```

### Integration Test Pattern

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Feature Integration', () => {
  beforeEach(async () => {
    // Setup test environment
    await setupTestDatabase();
  });
  
  afterEach(async () => {
    // Cleanup
    await cleanupTestDatabase();
  });
  
  it('should complete end-to-end flow', async () => {
    // Arrange
    const user = await createTestUser();
    
    // Act
    const result = await performAction(user);
    
    // Assert
    expect(result.status).toBe('success');
  });
});
```

### Mocking Strategies

#### Module Mocking

```typescript
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: {
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
    },
  })),
}));
```

#### Next.js Router Mocking

```typescript
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    refresh: vi.fn(),
  })),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));
```

#### Function Stubs

```typescript
const mockAnalytics = vi.fn();
vi.spyOn(analytics, 'track').mockImplementation(mockAnalytics);
```

### Snapshot Testing

```typescript
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';

describe('Component Snapshot', () => {
  it('should match snapshot', () => {
    const { container } = render(<Component />);
    expect(container).toMatchSnapshot();
  });
});
```

## 6. Coverage Matrix

### ✅ Covered Areas

| Area | Test Type | Files | Status |
|------|-----------|-------|--------|
| UI Components | Unit | 6 | ✅ Complete |
| 3D Scenes | Unit | 3 | ✅ Complete |
| Authentication | Integration | 4 | ✅ Complete |
| Feature Flags | Unit | 1 | ✅ Complete |
| AI Providers | Unit + Integration | 2 | ✅ Complete |
| Analytics | Unit + Integration | 2 | ✅ Complete |
| Integration Flows | Integration | 5 | ✅ Complete |
| Visual Regression | Snapshot + Chromatic | 1 | ✅ Complete |
| Self-Healing | Integration | 1 | ✅ Complete |
| Founders Pass | Unit | 1 | ✅ Complete |

**Detailed Coverage:**

- **UI Components**: DesignSelector, FeatureToggleList, HealthIndicator, TopRightCTA, PlasmaWaveField
- **3D Scenes**: EnergyCubeScene, WaveToCubeMorph
- **Authentication**: Magic link, WebAuthn, sign-in/out flows, auth context, redirect handling
- **Feature Flags**: Toggle functionality, catalog management, feature checks
- **AI Providers**: Provider routing, fallback handling, error recovery
- **Analytics**: Event tracking, layout analytics
- **Integration Flows**: Auth flow, messaging, onboarding, sandbox, build verification
- **Visual Regression**: Snapshot tests + Chromatic automated checks
- **Self-Healing**: Automated diagnostics and recovery system

### ❌ Coverage Gaps (Pending Implementation)

| Area | Priority | Reason |
|------|----------|--------|
| Agent Engine (src/lib/engine/) | 🔴 High | Core system, no tests |
| Tool Registry execution | 🔴 High | 14+ tools, no tests |
| API Routes (/api/agents, /api/code, /api/coder) | 🔴 High | Backend endpoints, no tests |
| Database migrations | 🟡 Medium | Schema changes, no validation |
| CQ Messaging system | 🟡 Medium | Core feature, no tests |
| Social Army | 🟢 Low | Peripheral feature |
| Monetization/Subscriptions | 🔴 High | Revenue-critical |
| Browser Automation | 🟡 Medium | Extension feature |
| Performance/Load testing | 🟡 Medium | No benchmarks |

## 7. CI/CD Integration

### GitHub Actions Workflow

```yaml
name: Test Suite
on: [pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Tests
        run: npm run test:run
      - name: Build Verification
        run: npm run build
```

### Automated Testing Pipeline

1. **PR Trigger** → GitHub Actions runs `npm run test:run`
2. **Build Verification** → `build-verification.test.ts` validates Next.js build succeeds
3. **Visual Regression** → Chromatic runs on every deploy
4. **Self-Heal Validation** → `test:self-heal` ensures diagnostic system is operational

### Quality Gates

- ✅ All unit tests must pass
- ✅ Integration tests must pass
- ✅ Build must succeed
- ✅ No critical visual regressions (Chromatic)

### Test Execution Time

- **Unit tests**: ~5-10 seconds
- **Integration tests**: ~15-30 seconds
- **E2E tests**: ~1-2 minutes
- **Full suite**: ~2-3 minutes

## 8. Recommended Test Additions for Pending Areas

### Priority 1: Critical Backend Coverage

#### 1. Agent Engine Testing

**Location**: `src/lib/engine/__tests__/`

```typescript
// agent-creation.test.ts
describe('Agent Creation', () => {
  it('should create agent with valid config');
  it('should reject invalid agent types');
  it('should initialize with default tools');
});

// task-spawning.test.ts
describe('Task Spawning', () => {
  it('should spawn task with correct context');
  it('should handle task failure gracefully');
  it('should cleanup on task completion');
});

// session-management.test.ts
describe('Session Management', () => {
  it('should create isolated sessions');
  it('should cleanup sessions on timeout');
  it('should persist session state');
});
```

#### 2. API Route Testing

**Location**: `tests/api/`

```typescript
// api/agents.test.ts
describe('POST /api/agents', () => {
  it('should create new agent');
  it('should validate agent payload');
  it('should return 400 on invalid input');
  it('should require authentication');
});

// api/code.test.ts
describe('POST /api/code', () => {
  it('should execute code in sandbox');
  it('should timeout long-running code');
  it('should sanitize output');
});

// api/coder.test.ts
describe('POST /api/coder', () => {
  it('should generate code from prompt');
  it('should handle AI provider failures');
  it('should validate generated code');
});
```

#### 3. Tool Registry Testing

**Location**: `src/lib/tools/__tests__/`

```typescript
// tool-execution.test.ts
describe('Tool Execution', () => {
  it('should execute read_file tool');
  it('should execute write_file tool');
  it('should execute bash_command tool');
  it('should handle tool errors');
  it('should validate tool parameters');
});

// tool-chaining.test.ts
describe('Tool Chaining', () => {
  it('should chain multiple tools');
  it('should pass output to next tool');
  it('should rollback on failure');
});
```

### Priority 2: Feature Coverage

#### 4. CQ Messaging System

**Location**: `tests/integration/cq-messaging.test.ts`

```typescript
describe('CQ Messaging', () => {
  it('should send message with CQ number');
  it('should rotate CQ numbers');
  it('should handle rate limiting');
  it('should queue failed messages');
});
```

#### 5. Monetization & Subscriptions

**Location**: `tests/integration/monetization.test.ts`

```typescript
describe('Subscription Management', () => {
  it('should validate free tier limits');
  it('should upgrade to founder tier');
  it('should handle Stripe webhooks');
  it('should sync subscription status');
});
```

### Priority 3: Performance & Scale

#### 6. Database Migrations

**Location**: `tests/db/migrations.test.ts`

```typescript
describe('Database Migrations', () => {
  it('should apply migrations in order');
  it('should rollback failed migrations');
  it('should preserve data integrity');
});
```

#### 7. Performance Testing

**Location**: `tests/performance/`

```typescript
// load-testing.test.ts
describe('API Load Tests', () => {
  it('should handle 100 concurrent requests');
  it('should maintain <200ms response time');
  it('should not leak memory');
});
```

#### 8. Browser Automation

**Location**: `tests/e2e/browser-automation.spec.ts`

```typescript
describe('Chrome Extension', () => {
  it('should inject content script');
  it('should capture page events');
  it('should communicate with background service');
});
```

### Test Implementation Roadmap

**Phase 1** (Week 1-2):
- [ ] Agent Engine core tests
- [ ] API route tests (auth, agents, code)
- [ ] Tool Registry execution tests

**Phase 2** (Week 3-4):
- [ ] CQ Messaging integration tests
- [ ] Monetization/Subscription tests
- [ ] Database migration tests

**Phase 3** (Week 5-6):
- [ ] Performance/Load tests
- [ ] Browser automation E2E tests
- [ ] Social Army feature tests

## 9. Best Practices

### Writing Effective Tests

1. **Test Behavior, Not Implementation**
   ```typescript
   // ❌ Bad: Testing implementation details
   expect(component.state.counter).toBe(5);
   
   // ✅ Good: Testing user-facing behavior
   expect(screen.getByText('Count: 5')).toBeInTheDocument();
   ```

2. **Use Descriptive Test Names**
   ```typescript
   // ❌ Bad
   it('works');
   
   // ✅ Good
   it('should display error message when email is invalid');
   ```

3. **Follow AAA Pattern** (Arrange, Act, Assert)
   ```typescript
   it('should increment counter on button click', async () => {
     // Arrange
     render(<Counter />);
     const button = screen.getByRole('button', { name: /increment/i });
     
     // Act
     await userEvent.click(button);
     
     // Assert
     expect(screen.getByText('Count: 1')).toBeInTheDocument();
   });
   ```

4. **Keep Tests Independent**
   - Each test should run in isolation
   - Use `beforeEach` for setup, `afterEach` for cleanup
   - Don't rely on test execution order

5. **Mock External Dependencies**
   - Mock API calls, database queries, third-party services
   - Use deterministic mocks for consistent results
   - Mock timers for time-dependent code

### Test Maintenance

- **Update tests when refactoring** — Don't let tests become stale
- **Delete obsolete tests** — Remove tests for removed features
- **Review flaky tests** — Fix or remove unreliable tests
- **Keep mocks in sync** — Update mocks when APIs change

## 10. Resources

### Documentation
- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Chromatic](https://www.chromatic.com/docs/)

### Internal Guides
- `BEGINNERS_GUIDE.md` — Getting started with CubiQo
- `API_DOCUMENTATION.md` — API endpoint reference
- `ARCHITECTURE.md` — System architecture overview

### Key Files
- `vitest.config.ts` — Test configuration
- `vitest.setup.ts` — Global test setup
- `package.json` — Test scripts

---

**Last Updated**: 2025-01-XX  
**Maintained By**: Buttercup (QA Lead), Blossom (Backend), Bubbles (Frontend)  
**Review Frequency**: Monthly or after major feature releases
