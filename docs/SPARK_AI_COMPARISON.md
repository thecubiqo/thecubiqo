# SPARK AI Provider Comparison

This document provides a comprehensive comparison of AI providers available in CubiQo, with a focus on the OpenClaw integration and how it differs from other providers.

## Overview

CubiQo supports multiple AI providers through a flexible provider abstraction layer. Each provider has different characteristics, capabilities, and use cases.

## Provider Comparison Table

| Provider | Model | Max Tokens | Primary Use Case | Status |
|----------|-------|------------|------------------|--------|
| **MiniMax** | MiniMax-M2 | 200 | Fast, concise responses | ✅ Active (Primary) |
| **Mixtral** | mistral-medium-latest | 200 | Fallback #1 | ✅ Active |
| **Llama** | Meta-Llama-3.1-70B | 200 | Fallback #2 | ✅ Active |
| **Claude** | claude-haiku-4-5 | 200 | Final Fallback | ✅ Active |
| **OpenClaw** | emergent-claude/claude-sonnet-4-5 | 4000 | Advanced features | ⚠️ Optional (Disabled by default) |

## OpenClaw Provider

### What is OpenClaw?

OpenClaw is an advanced AI integration that routes requests through **Clawdbot**, an AI orchestration layer that provides:

- **Enhanced Tool Use**: Advanced function calling and tool integration
- **Memory Management**: Persistent context and conversation history
- **Multi-Provider Routing**: Intelligent routing across multiple AI backends
- **Extended Context**: Support for much larger context windows (4000+ tokens)

### Key Differences from Standard Providers

#### 1. **Architecture**

**Standard Providers (MiniMax, Mixtral, etc.)**:
```
CubiQo → AI Provider API → Response
```

**OpenClaw**:
```
CubiQo → Clawdbot (localhost/remote) → Multiple AI Backends → Enhanced Response
```

#### 2. **Token Limits**

- **Standard Providers**: 200 tokens (fast, concise responses)
- **OpenClaw**: 4000 tokens (detailed, context-rich responses)

#### 3. **Capabilities**

| Feature | Standard Providers | OpenClaw |
|---------|-------------------|----------|
| Basic chat | ✅ | ✅ |
| Tool calling | ❌ | ✅ |
| Memory persistence | ❌ | ✅ |
| Multi-model routing | ❌ | ✅ |
| Extended context | ❌ | ✅ |

### When to Use OpenClaw

✅ **Use OpenClaw when**:
- You need extended context windows for complex conversations
- Tool calling and function execution are required
- You want persistent memory across sessions
- You're building advanced AI features

❌ **Don't use OpenClaw when**:
- You need fast, simple responses (use standard providers)
- You're in a resource-constrained environment
- You don't have a Clawdbot instance available

## Configuration Guide

### Standard Providers

Standard providers are configured with simple API keys:

```env
# .env.local
MINIMAX_API_KEY=your_minimax_key
MISTRAL_API_KEY=your_mistral_key
TOGETHER_API_KEY=your_together_key
ANTHROPIC_API_KEY=your_anthropic_key
```

### OpenClaw Configuration

OpenClaw requires additional setup:

#### Step 1: Set API Key

```env
# .env.local

# Option A: Use dedicated OpenClaw key
OPENCLAW_API_KEY=your_openclaw_key

# Option B: Use existing OpenRouter key (fallback)
OPENROUTER_KEY_CUBIKEY=your_openrouter_key
```

#### Step 2: Configure Clawdbot Endpoint

```env
# Development (local Clawdbot instance)
OPENCLAW_BASE_URL=http://localhost:18789

# Production (remote Clawdbot instance)
OPENCLAW_BASE_URL=https://clawdbot.yourdomain.com
```

#### Step 3: Optional Advanced Configuration

```env
# Model override (default: emergent-claude/claude-sonnet-4-5)
OPENCLAW_MODEL=your-preferred-model

# Max tokens override (default: 4000)
OPENCLAW_MAX_TOKENS=8000

# Feature toggles
OPENCLAW_ENABLE_TOOLS=true
OPENCLAW_ENABLE_MEMORY=true

# Timeout (default: 30000ms)
OPENCLAW_TIMEOUT=60000
```

#### Step 4: Verify Configuration

```bash
npm run validate-env
```

Look for the "OpenClaw Integration" section in the output.

## Feature Flags & Safety

### Default Behavior

**OpenClaw is DISABLED by default** to prevent runtime errors. It is only enabled when:

1. ✅ An API key is present (`OPENCLAW_API_KEY` or `OPENROUTER_KEY_CUBIKEY`)
2. ✅ Either `OPENCLAW_BASE_URL` is set OR you're in development mode
3. ✅ In production, `OPENCLAW_BASE_URL` MUST be explicitly set

### Checking if OpenClaw is Enabled

```typescript
import { isOpenClawEnabled, getOpenClawConfig } from '@/lib/ai/providers'

// Check if enabled
if (isOpenClawEnabled()) {
  const config = getOpenClawConfig()
  // Use OpenClaw...
} else {
  // Fall back to standard providers
}
```

### Runtime Safety

The provider abstraction layer includes built-in safety checks:

```typescript
import { providerRegistry, validateOpenClawConfig } from '@/lib/ai/providers'

// Get only enabled providers
const enabledProviders = providerRegistry.getEnabled()

// Validate OpenClaw configuration
const validation = validateOpenClawConfig()
if (!validation.valid) {
  console.error('OpenClaw config errors:', validation.errors)
  // Handle gracefully...
}
```

## Caveats & Limitations

### OpenClaw Caveats

⚠️ **Performance**:
- Higher latency due to additional orchestration layer
- Not suitable for real-time applications requiring <100ms responses

⚠️ **Dependencies**:
- Requires a running Clawdbot instance
- Additional infrastructure complexity

⚠️ **Cost**:
- Higher token usage (4000 vs 200 tokens)
- Multiple backend calls may increase API costs

⚠️ **Availability**:
- Depends on Clawdbot uptime
- Network connectivity required to Clawdbot instance

### Production Considerations

When deploying OpenClaw in production:

1. **Security**:
   - Use HTTPS for `OPENCLAW_BASE_URL`
   - Rotate API keys regularly
   - Implement rate limiting

2. **Reliability**:
   - Set up Clawdbot redundancy
   - Configure appropriate timeouts
   - Implement fallback to standard providers

3. **Monitoring**:
   - Track OpenClaw response times
   - Monitor token usage
   - Alert on configuration errors

## Provider Abstraction API

### Basic Usage

```typescript
import { providerRegistry, openClawProvider } from '@/lib/ai/providers'

// Check if a provider is registered
const provider = providerRegistry.get('openclaw')

// Check if provider is enabled
if (providerRegistry.isEnabled('openclaw')) {
  console.log('OpenClaw is ready to use')
}

// Get all enabled providers
const enabled = providerRegistry.getEnabled()
console.log(`${enabled.length} providers available`)
```

### Type Safety

```typescript
import type { 
  AIProviderInterface, 
  OpenClawProvider 
} from '@/lib/ai/providers'

function useProvider(provider: AIProviderInterface) {
  if (!provider.isEnabled()) {
    throw new Error(`Provider ${provider.name} is not enabled`)
  }
  
  // Use provider...
}
```

## Migration Guide

### Integrating OpenClaw into Existing Code

If you're migrating from direct provider calls to the provider abstraction:

**Before**:
```typescript
import { callOpenClaw } from '@/lib/ai/openclaw'

// Direct call (no safety checks)
const response = await callOpenClaw(systemPrompt, messages)
```

**After**:
```typescript
import { getOpenClawConfig } from '@/lib/ai/providers'
import { callOpenClaw } from '@/lib/ai/openclaw'

// Safe call with feature flag check
const config = getOpenClawConfig()
if (config) {
  const response = await callOpenClaw(systemPrompt, messages)
} else {
  // Fall back to standard providers
  console.warn('OpenClaw not available, using fallback')
}
```

## Testing

### Unit Testing Provider Configuration

```typescript
import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { isOpenClawEnabled, validateOpenClawConfig } from '@/lib/ai/providers'

describe('OpenClaw Provider', () => {
  const originalEnv = process.env
  
  beforeEach(() => {
    process.env = { ...originalEnv }
  })
  
  afterEach(() => {
    process.env = originalEnv
  })
  
  test('disabled by default without API key', () => {
    delete process.env.OPENCLAW_API_KEY
    delete process.env.OPENROUTER_KEY_CUBIKEY
    
    expect(isOpenClawEnabled()).toBe(false)
  })
  
  test('enabled with API key in development', () => {
    process.env.OPENCLAW_API_KEY = 'test-key'
    process.env.NODE_ENV = 'development'
    
    expect(isOpenClawEnabled()).toBe(true)
  })
  
  test('requires base URL in production', () => {
    process.env.OPENCLAW_API_KEY = 'test-key'
    process.env.NODE_ENV = 'production'
    delete process.env.OPENCLAW_BASE_URL
    
    const validation = validateOpenClawConfig()
    expect(validation.valid).toBe(false)
    expect(validation.errors).toContain(
      expect.stringContaining('production')
    )
  })
})
```

## Support

### Getting Help

- **Documentation**: See this file and `docs/CODING_AGENT_API.md`
- **Configuration Issues**: Run `npm run validate-env` for diagnostics
- **Provider Issues**: Check provider registry: `providerRegistry.getEnabled()`

### Common Issues

**Issue**: "OpenClaw API key not configured"
- **Solution**: Set `OPENCLAW_API_KEY` or `OPENROUTER_KEY_CUBIKEY` in `.env.local`

**Issue**: "OpenClaw not enabled in production"
- **Solution**: Set `OPENCLAW_BASE_URL` explicitly (localhost default not allowed)

**Issue**: "Invalid OPENCLAW_BASE_URL"
- **Solution**: Ensure URL starts with `http://` or `https://`

## Future Enhancements

Planned improvements to the provider abstraction layer:

- [ ] Automatic provider health checks
- [ ] Dynamic provider switching based on performance
- [ ] Provider-specific error handling and retries
- [ ] Usage analytics and cost tracking
- [ ] Provider capability negotiation

---

**Last Updated**: 2026-02-16
**Version**: 1.0.0
**Status**: Production Ready
