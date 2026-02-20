# Emergent Platform Testing Guide

**Buttercup's QA Documentation** 🥊  
Comprehensive testing guide for the Emergent platform

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Test Structure](#test-structure)
3. [Running Tests](#running-tests)
4. [Writing Tests](#writing-tests)
5. [CI/CD Pipeline](#cicd-pipeline)
6. [Test Coverage](#test-coverage)
7. [Performance Benchmarks](#performance-benchmarks)
8. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Install Dependencies

```bash
npm install
```

### Run All Tests

```bash
npm test
```

### Run Tests with Coverage

```bash
npm run test:run -- --coverage
```

### Run Tests in Watch Mode

```bash
npm test
```

### Run Specific Test File

```bash
npm test src/lib/emergent/__tests__/orchestrator.test.ts
```

---

## Test Structure

### Directory Layout

```
thecubiqo/
├── src/
│   ├── lib/
│   │   └── emergent/
│   │       └── __tests__/           # Unit tests for Emergent modules
│   │           ├── orchestrator.test.ts
│   │           ├── secrets-manager.test.ts
│   │           ├── rbac.test.ts
│   │           ├── audit-logger.test.ts
│   │           └── playbook-executor.test.ts
│   └── app/
│       └── api/
│           └── emergent/
│               └── __tests__/       # API route tests
│                   ├── orgs.test.ts
│                   ├── projects.test.ts
│                   ├── secrets.test.ts
│                   └── audit.test.ts
├── tests/
│   ├── utils/                       # Test utilities
│   │   ├── test-helpers.ts         # Common helpers
│   │   ├── mock-data.ts            # Mock data
│   │   └── supabase-mock.ts        # Mock Supabase client
│   ├── performance/                 # Performance benchmarks
│   │   ├── ai-response-time.test.ts
│   │   └── api-latency.test.ts
│   ├── integration/                 # Integration tests
│   └── e2e/                         # End-to-end tests
└── vitest.config.ts                 # Vitest configuration
```

### Test Types

1. **Unit Tests** - Test individual functions and modules in isolation
2. **Integration Tests** - Test how modules work together
3. **API Tests** - Test API endpoints
4. **Performance Tests** - Benchmark response times and resource usage
5. **E2E Tests** - Test full user flows (optional, via Playwright)

---

## Running Tests

### Common Commands

```bash
# Run all tests
npm test

# Run tests in CI mode (no watch)
npm run test:run

# Run with coverage report
npm run test:run -- --coverage

# Run specific test file
npm test orchestrator.test.ts

# Run tests matching pattern
npm test -- --grep="RBAC"

# Run with UI
npm run test:ui

# Run only unit tests
npm test src/lib/

# Run only performance tests
npm test tests/performance/
```

### Environment Variables

Tests use mock data and don't require real API keys. However, for secrets-manager tests, you need:

```bash
# Set in CI or locally
export EMERGENT_ENCRYPTION_KEY="your-test-key"
# Or
export SUPABASE_SERVICE_ROLE_KEY="your-key"
```

---

## Writing Tests

### Basic Test Structure

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

describe('MyModule', () => {
  beforeEach(() => {
    // Setup before each test
  })

  afterEach(() => {
    // Cleanup after each test
  })

  it('should do something', () => {
    expect(true).toBe(true)
  })
})
```

### Using Test Helpers

```typescript
import { 
  mockUser, 
  mockOrg, 
  mockProject,
  createMockHeaders,
  assertThrows,
  waitFor 
} from '@/tests/utils/test-helpers'

describe('API Tests', () => {
  it('should handle requests', async () => {
    const headers = createMockHeaders()
    // Use headers in test
  })

  it('should throw errors', async () => {
    await assertThrows(
      () => someFunction(),
      'Expected error message'
    )
  })
})
```

### Mocking Supabase

```typescript
import { vi } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve({
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: mockData, error: null })
        })
      })
    })
  }))
}))
```

### Testing Async Functions

```typescript
it('should handle async operations', async () => {
  const result = await asyncFunction()
  expect(result).toBeDefined()
})
```

### Testing Error Cases

```typescript
it('should handle errors gracefully', async () => {
  const result = await functionThatMayFail()
  
  expect(result.success).toBe(false)
  expect(result.error).toContain('error message')
})
```

### Testing Edge Cases

```typescript
describe('Edge Cases', () => {
  it('should handle null input', () => {
    expect(() => myFunction(null)).toThrow()
  })

  it('should handle empty string', () => {
    const result = myFunction('')
    expect(result).toBe('default')
  })

  it('should handle large inputs', () => {
    const largeInput = 'x'.repeat(10000)
    const result = myFunction(largeInput)
    expect(result).toBeDefined()
  })
})
```

---

## CI/CD Pipeline

### GitHub Actions Workflows

#### `ci.yml` - Run on every PR

- Install dependencies
- Run ESLint
- Run tests with coverage
- Build project
- Upload coverage reports

#### `deploy.yml` - Run on merge to main

- Build and deploy to Vercel
- Run smoke tests
- Notify status

#### `security.yml` - Weekly security audit

- Dependency vulnerability scanning
- CodeQL analysis
- Secret scanning
- License compliance check

### Running CI Locally

```bash
# Run the same commands CI runs
npm ci
npm run lint
npm run test:run -- --coverage
npm run build
```

---

## Test Coverage

### Coverage Goals

- **Unit Tests**: >80% coverage
- **Integration Tests**: >70% coverage
- **Critical Paths**: 100% coverage (auth, payments, secrets)

### Viewing Coverage

```bash
# Generate coverage report
npm run test:run -- --coverage

# Open HTML report
open coverage/index.html
```

### Coverage Configuration

Coverage settings are in `vitest.config.ts`:

```typescript
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html', 'lcov'],
  exclude: [
    'node_modules/',
    'tests/',
    '**/*.d.ts',
    '**/*.config.*',
    'dist/',
    '.next/'
  ],
  lines: 80,
  functions: 80,
  branches: 80,
  statements: 80
}
```

---

## Performance Benchmarks

### AI Response Time

Target: <2s for simple queries

```bash
npm test tests/performance/ai-response-time.test.ts
```

Tests:
- Simple query response time
- Complex query response time
- Batch request efficiency
- Streaming responses
- Cache performance

### API Latency

Target: <200ms for simple reads

```bash
npm test tests/performance/api-latency.test.ts
```

Tests:
- GET request latency
- POST/PUT/DELETE latency
- Bulk operations
- Database query performance
- Concurrent request handling

### Interpreting Results

- **Green**: Within target
- **Yellow**: Close to threshold
- **Red**: Exceeds threshold - investigate

---

## Troubleshooting

### Tests Failing Locally

1. **Clear cache**
   ```bash
   npm run test:run -- --clearCache
   ```

2. **Update dependencies**
   ```bash
   npm ci
   ```

3. **Check environment variables**
   ```bash
   echo $NODE_ENV
   ```

### Tests Passing Locally but Failing in CI

1. **Check Node version** - CI uses Node 20
2. **Check environment variables** - Set secrets in GitHub
3. **Check file paths** - Use absolute imports with `@/`
4. **Check time zones** - Use UTC in tests

### Flaky Tests

Flaky tests are tests that sometimes pass and sometimes fail. Common causes:

1. **Race conditions** - Use `await` properly
2. **Timing issues** - Don't rely on `setTimeout` in tests
3. **External dependencies** - Mock all external APIs
4. **Random data** - Use fixed seed for random data

### Debugging Tests

```bash
# Run in debug mode
node --inspect-brk node_modules/vitest/vitest.mjs run

# Use console.log (will show in output)
console.log('Debug value:', myVariable)

# Use vitest UI
npm run test:ui
```

---

## Best Practices

### ✅ DO

- Write tests for all new code
- Test happy path AND error cases
- Test edge cases (null, empty, large inputs)
- Use descriptive test names
- Keep tests focused (one assertion per test when possible)
- Mock external dependencies
- Use test helpers for common operations
- Run tests before committing

### ❌ DON'T

- Don't test implementation details
- Don't test third-party libraries
- Don't make tests dependent on each other
- Don't use real API keys in tests
- Don't commit commented-out tests
- Don't skip tests without good reason

---

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Playwright (E2E)](https://playwright.dev/)
- [Test Coverage Guide](https://vitest.dev/guide/coverage.html)

---

## Questions?

Contact **Buttercup** (QA Lead) or check the team Slack channel.

---

**Remember: Quality is not an act, it is a habit.** 💪

---

*Last updated: 2024-02-18*  
*Maintained by: Buttercup (QA & Test Automation Engineer)*
