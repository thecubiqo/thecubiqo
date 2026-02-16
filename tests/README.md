# Tests

This directory contains the test suite for the CubiQo project.

## Test Structure

```
tests/
├── integration/          # Integration tests for full user flows
│   ├── analytics-events.test.ts
│   ├── auth-magic-link-state.test.ts
│   ├── cube-controls.test.ts
│   └── landing-render.test.ts
├── regression/           # Regression tests for critical UI elements
│   ├── critical-selectors.test.ts
│   └── visual-smoke-tests.test.ts
├── *.test.tsx           # Component unit tests
└── __snapshots__/       # Jest/Vitest snapshots
```

## Running Tests

### All Tests
```bash
npm run test:run
```

### Watch Mode (for development)
```bash
npm test
```

### With UI
```bash
npm run test:ui
```

## Test Categories

### Integration Tests (`tests/integration/`)

Full end-to-end flow tests covering:

#### `auth-magic-link-state.test.ts`
- Magic link generation and validation
- Auth state propagation across components
- Session persistence and token refresh
- Login/logout flows

#### `landing-render.test.ts`
- Landing page structure and components
- Responsive layout at different breakpoints
- Performance considerations
- SEO and accessibility

#### `cube-controls.test.ts`
- Speaker button state transitions
- Wave-to-cube morph animations
- 3D scene interactions
- Audio controls

#### `analytics-events.test.ts`
- Event tracking structure and naming
- Button click events
- Authentication events
- Performance monitoring
- Privacy compliance

### Regression Tests (`tests/regression/`)

Tests to prevent UI regressions:

#### `visual-smoke-tests.test.ts`
- Critical UI elements presence
- WebGL scene rendering
- Animation performance
- Color scheme consistency
- Typography consistency
- Loading states
- Error boundaries
- Accessibility features

#### `critical-selectors.test.ts`
- DOM selector stability
- Data attribute consistency
- Component naming conventions
- CSS class consistency

### Component Tests (root of `tests/`)

Unit tests for specific components:
- `TopRightCTA.test.tsx` - CTA button component
- `PlasmaWaveField.test.tsx` - Wave animation component
- `EnergyCubeScene.test.tsx` - Cube scene component
- `WaveToCubeMorph.integration.test.tsx` - Morph integration
- `founders-pass.test.ts` - Founders Pass feature logic

## Test Framework

- **Runner**: Vitest
- **Environment**: happy-dom (for DOM simulation)
- **React Testing**: @testing-library/react
- **Mocking**: Vitest's built-in vi

## Writing Tests

### Test File Naming
- Integration tests: `<feature>.test.ts`
- Component tests: `<Component>.test.tsx`
- Regression tests: `<category>.test.ts`

### Test Structure
```typescript
import { describe, it, expect } from 'vitest';

describe('Feature Name', () => {
  describe('Sub-feature', () => {
    it('should behave as expected', () => {
      // Arrange
      const input = 'test';
      
      // Act
      const result = transform(input);
      
      // Assert
      expect(result).toBe('expected');
    });
  });
});
```

### Mocking
```typescript
import { vi } from 'vitest';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: null, isAuthenticated: false })
}));
```

## CI Integration

Tests run automatically in GitHub Actions:
- On every pull request
- On pushes to main/develop branches
- Results uploaded as workflow artifacts

See `.github/workflows/ci.yml` for CI configuration.

## Coverage

To generate coverage report:
```bash
npm test -- --coverage
```

## Best Practices

1. **Test Behavior, Not Implementation**
   - Focus on what the component does, not how it does it
   - Test user interactions and outcomes

2. **Descriptive Test Names**
   - Use "should" statements: `it('should validate email format')`
   - Be specific about what's being tested

3. **Arrange-Act-Assert Pattern**
   - Arrange: Set up test data
   - Act: Execute the code under test
   - Assert: Verify the outcome

4. **Avoid Test Interdependence**
   - Each test should run independently
   - Clean up state between tests

5. **Mock External Dependencies**
   - Mock API calls, browser APIs, etc.
   - Focus on unit under test

## Troubleshooting

### "Cannot find module" errors
Install dependencies:
```bash
npm install
```

### "happy-dom" not found
```bash
npm install --save-dev happy-dom
```

### Tests timing out
Increase timeout in test file:
```typescript
it('should complete', { timeout: 10000 }, async () => {
  // test code
});
```

### WebGL warnings
Three.js warnings about multiple instances are normal in test environment.

## Contributing

When adding new tests:
1. Follow existing test structure
2. Use descriptive test names
3. Mock external dependencies
4. Ensure tests run in isolation
5. Update this README if adding new test categories

---

*Last updated: 2026-02-16*
