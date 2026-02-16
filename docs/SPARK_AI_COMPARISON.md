# SPARK AI Provider Comparison

## Overview

CubiQo uses a flexible AI provider system that supports multiple LLM backends. This document compares the available providers and explains how to configure each one safely.

## Provider Architecture

### Primary Providers (Production)

The following providers are used in the main application for conversation and emotional AI interactions:

1. **MiniMax** (Primary)
   - Model: MiniMax-M2
   - Purpose: Primary conversational AI
   - Configuration: `MINIMAX_API_KEY`

2. **Mistral/Mixtral** (First Fallback)
   - Model: mistral-medium-latest
   - Purpose: Fallback when MiniMax is unavailable
   - Configuration: `MISTRAL_API_KEY`

3. **Together AI (Llama)** (Second Fallback)
   - Model: Meta-Llama-3.1-70B-Instruct-Turbo
   - Purpose: Second-tier fallback
   - Configuration: `TOGETHER_API_KEY`

4. **Claude Haiku** (Final Fallback)
   - Model: claude-haiku-4-5-20251001
   - Purpose: Final fallback option
   - Configuration: `ANTHROPIC_API_KEY`

### Advanced Providers (Experimental)

#### OpenClaw (via Clawdbot)

**Status:** Experimental - Disabled by default

OpenClaw is an experimental provider that routes AI calls through [Clawdbot](https://github.com/emergentmethods/clawdbot), a local AI assistant framework with advanced tool use and memory capabilities.

**Key Differences:**
- **Tool Use**: Enhanced function calling and tool orchestration
- **Memory**: Built-in conversation memory and context management
- **Local Control**: Runs locally or on a private server
- **Model Routing**: Can route to any OpenAI-compatible endpoint

**Use Cases:**
- Development and testing with enhanced AI capabilities
- Scenarios requiring advanced tool/function calling
- Use cases needing persistent memory across sessions
- Privacy-sensitive deployments (local hosting)

## Configuration Guide

### Enabling OpenClaw

⚠️ **IMPORTANT SAFETY NOTES:**

1. **Disabled by Default**: OpenClaw is NOT enabled unless you explicitly configure it
2. **Development Only**: Recommended for development/testing, not production
3. **Network Requirements**: Requires running Clawdbot instance (default: `http://localhost:18789`)
4. **API Key Required**: Must provide valid authentication

**Step-by-Step Configuration:**

1. **Install and Run Clawdbot** (if not already running):
   ```bash
   # Follow Clawdbot installation instructions
   # https://github.com/emergentmethods/clawdbot
   ```

2. **Set Environment Variables** in `.env.local`:
   ```bash
   # OpenClaw API Key (required)
   OPENCLAW_API_KEY=your_key_here
   # OR use the alternative name:
   OPENROUTER_KEY_CUBIKEY=your_key_here
   
   # Optional: Custom Clawdbot endpoint
   OPENCLAW_BASE_URL=http://localhost:18789
   ```

3. **Verify Configuration**:
   ```bash
   npm run validate-env
   ```

### Feature Flag Checks

The provider system uses feature flags to ensure safe enablement:

```typescript
import { isOpenClawEnabled, getProvider } from '@/lib/ai/providers'

// Check if OpenClaw is enabled
if (isOpenClawEnabled()) {
  const provider = getProvider('openclaw')
  // Use OpenClaw provider
}
```

### Validation

All providers include validation logic:

```typescript
import { validateProvider } from '@/lib/ai/providers'

const result = validateProvider('openclaw')
if (!result.valid) {
  console.warn('OpenClaw validation failed:', result.message)
}
```

## Provider Comparison Matrix

| Feature | Primary Providers | OpenClaw |
|---------|------------------|----------|
| **Availability** | Cloud-hosted | Self-hosted / Local |
| **Tool Use** | Standard | Enhanced |
| **Memory** | Stateless | Persistent |
| **Privacy** | Provider-dependent | Full control |
| **Setup Complexity** | Low (API key only) | Medium (requires Clawdbot) |
| **Production Ready** | ✅ Yes | ⚠️ Experimental |
| **Cost** | Per-token pricing | Infrastructure cost |

## Switching Between Providers

The application automatically selects providers based on:
1. Feature flag status (must be enabled)
2. Environment variable presence
3. Fallback chain for primary providers

**Default Behavior:**
- OpenClaw: **Disabled** (no behavior change unless configured)
- Primary providers: Active based on API key availability
- Fallback: Automatic chain (MiniMax → Mixtral → Llama → Claude)

## Security Considerations

### OpenClaw Specific

⚠️ **Security Warnings:**

1. **Local Network Exposure**: Default configuration uses `localhost:18789`
   - Only accessible from the same machine
   - Change `OPENCLAW_BASE_URL` for remote access

2. **API Key Storage**: Store keys securely
   - Use `.env.local` (never commit to git)
   - Use secure environment variable management in production

3. **Endpoint Validation**: The system validates:
   - API key presence
   - Base URL format (must be http:// or https://)
   - Provider enablement before use

4. **Production Deployment**:
   - Not recommended for production unless you understand the implications
   - Requires proper security configuration
   - Consider network segmentation and access controls

## Testing OpenClaw Integration

### Verification Steps

1. **Environment Check**:
   ```bash
   npm run validate-env
   ```

2. **Provider Status**:
   ```typescript
   import { getEnabledProviders } from '@/lib/ai/providers'
   console.log('Enabled providers:', getEnabledProviders())
   ```

3. **Build Test**:
   ```bash
   npm run build
   ```

### Expected Behavior

- **Without Configuration**: OpenClaw should not appear in enabled providers
- **With Configuration**: OpenClaw appears in enabled providers list
- **Build**: Should always succeed regardless of OpenClaw status

## Troubleshooting

### OpenClaw Not Enabled

**Problem**: OpenClaw not appearing in enabled providers

**Solutions**:
1. Check environment variables are set: `OPENCLAW_API_KEY` or `OPENROUTER_KEY_CUBIKEY`
2. Verify `.env.local` is loaded
3. Restart development server after changing environment

### Connection Failed

**Problem**: Cannot connect to Clawdbot

**Solutions**:
1. Verify Clawdbot is running: `curl http://localhost:18789/health`
2. Check `OPENCLAW_BASE_URL` is correct
3. Verify network access and firewall rules

### Validation Errors

**Problem**: `validateProvider('openclaw')` returns invalid

**Check**:
1. API key is set and valid
2. Base URL format is correct (http:// or https://)
3. Clawdbot is accessible at the configured URL

## Additional Resources

- [CubiQo Architecture](../ARCHITECTURE.md)
- [Environment Configuration](../README.md#environment-setup)
- [Clawdbot Documentation](https://github.com/emergentmethods/clawdbot)
- [Feature Flags Documentation](../FEATURE_FLAGS.md)

## Support

For issues related to:
- **Primary Providers**: Check standard troubleshooting in main README
- **OpenClaw Integration**: File an issue with "openclaw" label
- **Clawdbot Issues**: Refer to [Clawdbot repository](https://github.com/emergentmethods/clawdbot)
