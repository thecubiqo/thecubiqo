# Testing Requirements

## Status: ~40% Implemented

## Overview

The CubiQo project uses Vitest as its primary test runner with Testing Library for React component testing. Jest serves as a secondary runner for Node.js-specific tests. The Emergent Engine requires comprehensive test coverage across agent lifecycle, tool execution, API routes, and integration flows.

## Test Infrastructure

### Current Setup

| Tool | Config | Purpose |
|------|--------|---------|
| Vitest | `vitest.config.ts` | Primary test runner (React/jsdom) |
| Jest | `jest.config.js` | Secondary runner (Node.js) |
| Testing Library | `@testing-library/jest-dom/vitest` | React component testing |
| Chromatic | `chromatic.yml` | Visual regression testing |

### Test Scripts
```json
{
  "test": "vitest",              // Watch mode
  "test:ui": "vitest --ui",     // UI dashboard
  "test:run": "vitest run",     // Single run
  "test:self-heal": "tsx test-self-heal.ts",
  "test:visual-smoke": "tsx scripts/visual-smoke-test.ts"
}
```

### Vitest Configuration
```typescript
// vitest.config.ts
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
})
```

## Existing Test Coverage (31 files)

### Unit Tests
- `tests/analytics.test.ts`
- `tests/auth-context.test.ts`
- `tests/feature-flags.test.ts`
- `tests/founders-pass.test.ts`
- `tests/ai-providers.test.ts`
- `tests/lib/ai/providers.test.ts`
- `src/lib/ai/providers/__tests__/index.test.ts`
- `src/lib/email/templates/__tests__/magic-link.test.ts`

### Component Tests
- `tests/DesignSelector.test.tsx`
- `tests/EnergyCubeScene.test.tsx`
- `tests/FeatureToggleList.test.tsx`
- `tests/HealthIndicator.test.tsx`
- `tests/PlasmaWaveField.test.tsx`
- `tests/TopRightCTA.test.tsx`
- `tests/TopRightCTA.snapshot.test.tsx`
- `tests/layout-analytics.test.tsx`
- `src/__tests__/auth-ui.test.tsx`

### Integration Tests
- `tests/integration/analytics-events.test.ts`
- `tests/integration/auth-magic-link-state.test.ts`
- `tests/integration/cube-controls.test.ts`
- `tests/integration/landing-render.test.ts`
- `tests/integration/landingRouter.test.tsx`
- `tests/auth/magic-link-redirect.test.ts`
- `tests/auth/sign-in-sign-out.test.ts`
- `src/__tests__/integration/auth-flow.test.ts`
- `src/__tests__/integration/build-verification.test.ts`
- `src/__tests__/integration/messaging-flow.test.ts`
- `src/__tests__/integration/onboarding-flow.test.ts`
- `src/__tests__/integration/sandbox.test.ts`

### Regression Tests
- `tests/regression/critical-selectors.test.ts`
- `tests/regression/visual-smoke-tests.test.ts`

### E2E Tests
- `tests/e2e/landing.spec.ts`

### Self-Healing Tests
- `tests/self-heal-integration.test.js`

## Required Emergent Engine Tests (Not Implemented ❌)

### Agent Engine Tests
```
tests/engine/
├── agent.test.ts            # Agent lifecycle (create, run, spawn, stop)
├── session.test.ts          # Session management
├── tools.test.ts            # Tool registry and execution
├── memory.test.ts           # Vector memory operations
├── bootstrap.test.ts        # Agent bootstrap (7 agents)
├── context.test.ts          # Context assembly
├── queue.test.ts            # Concurrency queue
└── router.test.ts           # Message routing
```

#### Key Test Cases for Agent Engine
- Agent creation with valid/invalid config
- Agent run with tool calling
- Subagent spawn and result collection
- Agent stop during execution
- Session history retrieval and compaction
- Tool execution with proper sandboxing
- Memory search with vector similarity
- Context assembly with SOUL.md + tools + history

### API Route Tests
```
tests/api/
├── agents.test.ts           # Agent CRUD + run/spawn
├── sessions.test.ts         # Session management
├── tools.test.ts            # Tool execution API
├── memory.test.ts           # Memory operations
├── channels.test.ts         # Channel configuration
├── browser.test.ts          # Browser control
└── admin.test.ts            # Admin endpoints
```

### LLM Provider Tests
```
tests/providers/
├── llm-router.test.ts       # Provider routing
├── anthropic.test.ts        # Anthropic/Emergent provider
├── openai.test.ts           # OpenAI provider
├── groq.test.ts             # Groq provider
├── google.test.ts           # Google Gemini provider
└── failover.test.ts         # Auto-failover between providers
```

### Integration Tests
```
tests/integration/
├── agent-to-agent.test.ts   # Agent-to-agent communication
├── self-coding.test.ts      # Self-coding loop (requirement → code → test → deploy)
├── channel-routing.test.ts  # Multi-channel message routing
└── cost-tracking.test.ts    # Token usage and cost tracking
```

## CI/CD Workflows

### Existing Workflows
- `.github/workflows/ci.yml` — Main CI pipeline
- `.github/workflows/chromatic.yml` — Visual regression testing
- `.github/workflows/self-heal-cron.yml` — Scheduled self-healing

### Required CI Updates
- Add engine test suite to CI pipeline
- Add API route test coverage
- Add provider integration tests (with mocked API responses)
- Add database migration validation

## Coverage Goals

| Category | Current | Target |
|----------|---------|--------|
| Agent Engine | 0% | 80% |
| API Routes | ~20% | 70% |
| LLM Providers | ~10% | 60% |
| Integration | ~15% | 50% |
| Components | ~30% | 60% |
| Overall | ~15% | 60% |

## References
- Source: `vitest.config.ts`
- Source: `jest.config.js`
- Source: `package.json` scripts section
- Source: `tests/` directory
- Source: `src/__tests__/` directory
- Source: `.github/workflows/`
